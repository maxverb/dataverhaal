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
import threading
import webbrowser

from dotenv import load_dotenv
from flask import Flask, Response, jsonify, render_template, request, send_from_directory

from engine import (
    InstagramEngine,
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

    if not url:
        return jsonify(error="Geen URL opgegeven"), 400

    def stream():
        q: queue.Queue = queue.Queue()

        def worker():
            try:
                eng = InstagramEngine(pause=pause)
                eng.login()
                q.put(("login", {"username": eng.username}))
                res = eng.scrape_post(url, progress=lambda ev: q.put(("progress", ev)))
                path = export_excel(OUT_DIR, res.rows, [res.meta.__dict__])
                q.put((
                    "done",
                    {
                        "file": os.path.basename(path),
                        "meta": res.meta.__dict__,
                        "rows": res.rows,
                    },
                ))
            except SessionError as e:
                q.put(("error", {"message": str(e), "kind": "session"}))
            except Exception as e:  # noqa: BLE001
                q.put(("error", {"message": f"{type(e).__name__}: {e}"}))
            finally:
                q.put(("end", None))

        threading.Thread(target=worker, daemon=True).start()
        while True:
            event, data = q.get()
            if event == "end":
                break
            yield _sse(event, data)

    return Response(stream(), mimetype="text/event-stream")


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
