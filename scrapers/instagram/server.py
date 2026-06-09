#!/usr/bin/env python3
"""Lokale web-app: plak een Instagram-URL, zie een voortgangsbalk, krijg de
comments + replies en een Excel-download.

Start:
    python server.py

Er opent vanzelf een pagina in je browser (http://127.0.0.1:5000). De app
detecteert automatisch of je al ingelogd bent (instaloader-sessie) en gebruikt
die — geen handmatige config nodig zodra je één keer `instaloader -l` hebt
gedraaid. Zie README.md.
"""

import json
import os
import queue
import secrets
import threading
import webbrowser

from dotenv import load_dotenv
from flask import Flask, Response, jsonify, render_template, request, send_from_directory

import engine
from engine import (
    InstagramEngine,
    LoginError,
    ScrapeBlockedError,
    SessionError,
    default_session_dir,
    discover_session_files,
)
from scrape import export_excel

load_dotenv()

app = Flask(__name__)
OUT_DIR = os.getenv("IG_OUTPUT_DIR", "output")
DEFAULT_PAUSE = float(os.getenv("IG_PAUSE", "3"))


@app.route("/")
def index():
    return render_template("app.html", default_pause=DEFAULT_PAUSE)


@app.route("/api/status")
def status():
    """Ben ik al ingelogd? Zo ja: welk account. Zo nee: hoe los ik het op."""
    eng = InstagramEngine()
    try:
        eng.login()
        return jsonify(logged_in=True, username=eng.username)
    except SessionError as e:
        return jsonify(
            logged_in=False,
            message=str(e),
            session_dir=default_session_dir(),
            sessions=[os.path.basename(s) for s in discover_session_files()],
        )


# Tijdelijke opslag van loaders die op een 2FA-code wachten (alleen lokaal,
# in-memory, kort levend). Wachtwoorden worden hier NOOIT bewaard.
_pending_2fa: dict = {}


@app.route("/api/login", methods=["POST"])
def api_login():
    """Log in met username + wachtwoord en sla de sessie op. Lokaal only."""
    data = request.get_json(silent=True) or {}
    user = (data.get("username") or "").strip()
    pw = data.get("password") or ""
    if not user or not pw:
        return jsonify(ok=False, error="Vul gebruikersnaam én wachtwoord in."), 400
    try:
        state, loader = engine.password_login(user, pw, pause=DEFAULT_PAUSE)
    except LoginError as e:
        return jsonify(ok=False, error=str(e))
    except Exception as e:  # noqa: BLE001
        return jsonify(ok=False, error=f"{type(e).__name__}: {e}")

    if state == "2fa":
        token = secrets.token_urlsafe(16)
        _pending_2fa[token] = (loader, user)
        return jsonify(ok=False, two_factor_required=True, token=token, username=user)

    path = engine.save_session(loader, user)
    return jsonify(ok=True, username=user, session_file=path)


@app.route("/api/login/2fa", methods=["POST"])
def api_login_2fa():
    """Maak een 2FA-login af met de code en sla de sessie op."""
    data = request.get_json(silent=True) or {}
    token = data.get("token") or ""
    code = (data.get("code") or "").strip()
    item = _pending_2fa.get(token)
    if not item:
        return jsonify(ok=False, error="Login-sessie verlopen — begin opnieuw."), 400
    if not code:
        return jsonify(ok=False, error="Vul de 2FA-code in."), 400
    loader, user = item
    try:
        engine.complete_two_factor(loader, code)
    except LoginError as e:
        return jsonify(ok=False, error=str(e))
    except Exception as e:  # noqa: BLE001
        return jsonify(ok=False, error=f"{type(e).__name__}: {e}")
    path = engine.save_session(loader, user)
    _pending_2fa.pop(token, None)
    return jsonify(ok=True, username=user, session_file=path)


@app.route("/api/login/cookie", methods=["POST"])
def api_login_cookie():
    """Log in met een handmatig geplakte sessionid-cookie (betrouwbaarste route)."""
    data = request.get_json(silent=True) or {}
    user = (data.get("username") or "").strip()
    sid = (data.get("sessionid") or "").strip()
    if not user or not sid:
        return jsonify(ok=False, error="Vul gebruikersnaam én sessionid in."), 400
    try:
        loader = engine.session_from_sessionid(user, sid, pause=DEFAULT_PAUSE)
    except LoginError as e:
        return jsonify(ok=False, error=str(e))
    except Exception as e:  # noqa: BLE001
        return jsonify(ok=False, error=f"{type(e).__name__}: {e}")
    path = engine.save_session(loader, user)
    return jsonify(ok=True, username=user, session_file=path)


def _sse(event: str, data) -> str:
    return f"event: {event}\ndata: {json.dumps(data)}\n\n"


@app.route("/api/scrape")
def scrape():
    """Stream voortgang + resultaat via Server-Sent Events."""
    url = (request.args.get("url") or "").strip()
    try:
        pause = float(request.args.get("pause", DEFAULT_PAUSE))
    except ValueError:
        pause = DEFAULT_PAUSE
    include_replies = (request.args.get("replies", "1") != "0")

    if not url:
        return jsonify(error="Geen URL opgegeven"), 400

    def stream():
        q: queue.Queue = queue.Queue()

        def worker():
            try:
                eng = InstagramEngine(pause=pause)
                eng.login()
                q.put(("login", {"username": eng.username}))
                res = eng.scrape_post(
                    url, progress=lambda ev: q.put(("progress", ev)),
                    include_replies=include_replies,
                )
                path = export_excel(OUT_DIR, res.rows, [res.meta.__dict__])
                q.put((
                    "done",
                    {
                        "file": os.path.basename(path),
                        "meta": res.meta.__dict__,
                        "rows": res.rows,
                        "incomplete": res.incomplete,
                        "warning": res.warning,
                    },
                ))
            except SessionError as e:
                q.put(("error", {"message": str(e), "kind": "session"}))
            except ScrapeBlockedError as e:
                q.put(("error", {"message": str(e), "kind": "blocked"}))
            except Exception as e:  # noqa: BLE001
                q.put(("error", {"message": f"{type(e).__name__}: {e}"}))
            finally:
                q.put(("end", None))

        # Primer: ~2KB commentaar dwingt browsers/proxies de stream meteen te
        # flushen i.p.v. eerst te bufferen (anders zie je geen live voortgang).
        yield ": " + (" " * 2048) + "\n\n"
        threading.Thread(target=worker, daemon=True).start()
        while True:
            event, data = q.get()
            if event == "end":
                break
            yield _sse(event, data)

    return Response(
        stream(),
        mimetype="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive",
        },
    )


@app.route("/api/download/<path:name>")
def download(name):
    return send_from_directory(OUT_DIR, name, as_attachment=True)


def main():
    port = int(os.getenv("PORT", "5000"))
    url = f"http://127.0.0.1:{port}"
    os.makedirs(OUT_DIR, exist_ok=True)
    threading.Timer(1.0, lambda: webbrowser.open(url)).start()
    print(f"\n  MetaMax · Instagram comment-scraper draait op {url}")
    print("  (Ctrl+C om te stoppen)\n")
    # threaded=True zodat de SSE-stream en /api/status naast elkaar kunnen.
    app.run(host="127.0.0.1", port=port, threaded=True)


if __name__ == "__main__":
    main()
