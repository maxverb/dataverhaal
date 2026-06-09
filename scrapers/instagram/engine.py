"""Dunne wrapper om instaloader voor het scrapen van Instagram-comments.

Login gebeurt via een instaloader-sessiebestand (pad uit .env: IG_SESSION_FILE).
Er staan GEEN wachtwoorden in code: de sessie maak je eenmalig aan met
`instaloader -l USERNAME` (zie README).
"""

import getpass
import glob
import os
import platform
import re
import tempfile
import time
from dataclasses import dataclass, field
from datetime import timezone

import instaloader
from instaloader.exceptions import (
    ConnectionException,
    LoginRequiredException,
    QueryReturnedBadRequestException,
    TooManyRequestsException,
)


# --- Shortcode-resolutie -----------------------------------------------------

# Matcht /p/<code>/, /reel/<code>/, /reels/<code>/, /tv/<code>/ in een URL.
_URL_RE = re.compile(r"/(?:p|reel|reels|tv)/([A-Za-z0-9_-]+)")
# Een kale shortcode (geen slashes, geen punten).
_SHORTCODE_RE = re.compile(r"^[A-Za-z0-9_-]+$")


def resolve_shortcode(url_or_code: str) -> str:
    """Haal de shortcode uit een post-URL, of geef een kale shortcode terug.

    >>> resolve_shortcode("https://www.instagram.com/p/DZSz1VDNeID/")
    'DZSz1VDNeID'
    >>> resolve_shortcode("DZSz1VDNeID")
    'DZSz1VDNeID'
    """
    s = (url_or_code or "").strip()
    m = _URL_RE.search(s)
    if m:
        return m.group(1)
    if _SHORTCODE_RE.match(s):
        return s
    raise ValueError(
        f"Kan geen geldige shortcode afleiden uit: {url_or_code!r}. "
        "Geef een post-URL (bv. https://www.instagram.com/p/DZSz1VDNeID/) "
        "of een kale shortcode (bv. DZSz1VDNeID)."
    )


# --- Sessie-detectie ("ben ik al ingelogd?") ---------------------------------

def default_session_dir() -> str:
    """Map waar instaloader sessiebestanden bewaart (zelfde logica als de CLI)."""
    if platform.system() == "Windows":
        localappdata = os.getenv("LOCALAPPDATA")
        if localappdata:
            return os.path.join(localappdata, "Instaloader")
        return os.path.join(tempfile.gettempdir(), ".instaloader-" + getpass.getuser())
    return os.path.join(
        os.getenv("XDG_CONFIG_HOME", os.path.expanduser("~/.config")), "instaloader"
    )


def discover_session_files() -> list:
    """Vind bestaande instaloader-sessies (session-<username>) op de standaardplek."""
    return sorted(glob.glob(os.path.join(default_session_dir(), "session-*")))


def default_session_filename(username: str) -> str:
    """Standaardpad voor de sessie van een username (zelfde plek als de CLI)."""
    return os.path.join(default_session_dir(), f"session-{username}")


def active_sessionid(loader) -> str | None:
    """Geef de niet-lege `sessionid`-cookie van een loader terug, of None.

    We itereren bewust over de cookiejar i.p.v. `cookies.get("sessionid")`:
    instaloader seedt bij het inloggen een lege `sessionid`-cookie, waardoor
    `.get()` óf die lege waarde teruggeeft óf een CookieConflictError gooit als
    Instagram daarna de echte cookie zet. Itereren + filteren op een niet-lege
    waarde geeft betrouwbaar de echte sessie.
    """
    try:
        sess = loader.context._session
    except Exception:
        return None
    if not sess:
        return None
    try:
        for c in sess.cookies:
            if c.name == "sessionid" and c.value:
                return c.value
    except Exception:
        return None
    return None


# --- Inloggen met wachtwoord (voor de web-app) -------------------------------

class LoginError(RuntimeError):
    """Inloggen mislukte — met een nette, leesbare boodschap voor de UI."""


def password_login(username: str, password: str, pause: float = 3.0):
    """Log in met username + wachtwoord.

    Returns:
        ("ok", loader)   – ingelogd, sessie kan opgeslagen worden
        ("2fa", loader)  – 2FA vereist; bewaar de loader en roep
                           complete_two_factor(loader, code) aan

    Raises LoginError bij verkeerde credentials of een blokkade.
    """
    from instaloader.exceptions import (
        BadCredentialsException,
        InvalidArgumentException,
        LoginException,
        TwoFactorAuthRequiredException,
    )

    loader = build_loader(pause)
    try:
        loader.login(username, password)
    except TwoFactorAuthRequiredException:
        return ("2fa", loader)
    except BadCredentialsException:
        raise LoginError("Gebruikersnaam of wachtwoord onjuist.")
    except InvalidArgumentException as e:
        raise LoginError(str(e) or "Onbekende gebruikersnaam.")
    except LoginException as e:
        # Checkpoint/challenge of onverwacht antwoord (bv. geblokkeerd IP).
        raise LoginError(
            "Instagram weigerde de login — vaak een beveiligingscheck. Open "
            "Instagram als dit account, bevestig een eventuele melding 'was jij "
            f"dit?', en probeer opnieuw.\n(detail: {e})"
        )
    except ConnectionException as e:
        raise LoginError(
            "Verbindingsfout bij het inloggen — probeer het zo opnieuw.\n"
            f"(detail: {e})"
        )

    # login() garandeert authenticated:true, maar check de cookie voor de zekerheid.
    if not active_sessionid(loader):
        raise LoginError(
            "Instagram bevestigde de login wél, maar gaf geen sessie (sessionid) "
            "terug — een bekende anti-bot-blokkade, vaak na rate-limiting. "
            "Gebruik in plaats daarvan de optie 'sessionid plakken' (je cookie "
            "uit een browser waar je al ingelogd bent). Zie de README."
        )
    return ("ok", loader)


def complete_two_factor(loader, code: str):
    """Maak een 2FA-login af met de code uit de authenticator/sms."""
    from instaloader.exceptions import (
        BadCredentialsException,
        InvalidArgumentException,
    )

    try:
        loader.two_factor_login(code)
    except (BadCredentialsException, InvalidArgumentException) as e:
        raise LoginError(f"2FA-code afgewezen: {e}")
    except ConnectionException as e:
        raise LoginError(f"2FA mislukte door een verbindingsfout: {e}")


def session_from_sessionid(username: str, sessionid: str, pause: float = 3.0):
    """Bouw een sessie uit een handmatig geplakte `sessionid`-cookie.

    Dit is de betrouwbaarste gratis route: instaloader's wachtwoord-login wordt
    door Instagram vaak geblokt (authenticated maar géén sessionid), terwijl een
    `sessionid` uit een browser waar je al ingelogd bent gewoon werkt.
    """
    import urllib.parse

    sessionid = (sessionid or "").strip().strip('"').strip("'")
    if not sessionid:
        raise LoginError("Plak je sessionid-cookie.")

    loader = build_loader(pause)
    jar = loader.context._session.cookies
    jar.set("sessionid", sessionid, domain=".instagram.com", path="/")
    # ds_user_id = het getal vóór de eerste ':' in de (url-gedecodeerde) sessionid.
    decoded = urllib.parse.unquote(sessionid)
    user_id = decoded.split(":", 1)[0] if ":" in decoded else ""
    if user_id.isdigit():
        jar.set("ds_user_id", user_id, domain=".instagram.com", path="/")
        loader.context.user_id = int(user_id)
    loader.context.username = username or None

    if not active_sessionid(loader):
        raise LoginError("Kon de sessionid niet instellen — controleer de waarde.")
    return loader


def save_session(loader, username: str) -> str:
    """Sla de sessie op waar de scraper 'm automatisch terugvindt."""
    target = os.getenv("IG_SESSION_FILE") or default_session_filename(username)
    os.makedirs(os.path.dirname(target), exist_ok=True)
    loader.save_session_to_file(target)
    return target


# --- Beleefde rate-controller ------------------------------------------------

class PoliteRateController(instaloader.RateController):
    """Houdt minimaal `min_interval` seconden tussen requests aan.

    Bovenop instaloader's eigen backoff op 429. Liever traag dan geband.
    """

    def __init__(self, context, min_interval: float = 3.0):
        super().__init__(context)
        self.min_interval = max(0.0, float(min_interval))

    def query_waittime(self, query_type, current_time, untracked_queries=False):
        base = super().query_waittime(query_type, current_time, untracked_queries)
        return max(base, self.min_interval)


def build_loader(pause: float = 3.0) -> "instaloader.Instaloader":
    """Maak een instaloader-instance met onze (zuinige, beleefde) instellingen."""
    return instaloader.Instaloader(
        quiet=True,
        download_pictures=False,
        download_videos=False,
        download_video_thumbnails=False,
        download_geotags=False,
        download_comments=False,
        save_metadata=False,
        compress_json=False,
        rate_controller=lambda ctx: PoliteRateController(ctx, pause),
    )


# --- Datamodel ---------------------------------------------------------------

@dataclass
class PostMeta:
    post_url: str
    post_shortcode: str
    owner_username: str = ""
    caption: str = ""
    comment_count: int = 0
    post_timestamp: str = ""
    likes_count: int = 0


@dataclass
class ScrapeResult:
    meta: PostMeta
    rows: list = field(default_factory=list)
    incomplete: bool = False
    warning: str = ""


# --- Engine ------------------------------------------------------------------

class InstagramEngine:
    """Logt in via sessiebestand en scrapet comments + replies van posts."""

    def __init__(
        self,
        session_file: str | None = None,
        username: str | None = None,
        pause: float = 3.0,
        max_retries: int = 5,
        backoff_base: float = 5.0,
    ):
        self.session_file = session_file or os.getenv("IG_SESSION_FILE")
        self.username = username or os.getenv("IG_USERNAME")
        self.pause = max(0.0, float(pause))
        self.max_retries = int(max_retries)
        self.backoff_base = float(backoff_base)

        self.loader = build_loader(self.pause)
        self._logged_in = False

    # --- login ---------------------------------------------------------------

    def _resolve_session_file(self) -> str | None:
        """Vind automatisch een bestaande sessie als er geen pad is opgegeven.

        Zo hoeft de gebruiker niets in te stellen: één keer `instaloader -l`
        gedraaid = wij vinden en gebruiken die sessie vanzelf.
        """
        if self.session_file:
            return self.session_file
        found = discover_session_files()
        if self.username:
            cand = os.path.join(default_session_dir(), f"session-{self.username}")
            if os.path.exists(cand):
                return cand
        if len(found) == 1:
            # Eén ingelogd account → leid de username eruit af voor nette output.
            if not self.username:
                self.username = os.path.basename(found[0])[len("session-"):] or None
            return found[0]
        self._found_sessions = found
        return None

    def login(self) -> None:
        """Laad de instaloader-sessie. Geef een duidelijke instructie als die
        ontbreekt of ongeldig is, in plaats van te crashen met een stacktrace."""
        self.session_file = self._resolve_session_file()
        if not self.session_file:
            found = getattr(self, "_found_sessions", [])
            if len(found) > 1:
                names = "\n".join("    - " + os.path.basename(f) for f in found)
                raise SessionError(
                    "Meerdere ingelogde accounts gevonden in "
                    f"{default_session_dir()}:\n{names}\n"
                    "Kies er één via IG_USERNAME in je .env (of --username)."
                )
            raise SessionError(
                "Geen ingelogde Instagram-sessie gevonden.\n" + self._login_hint()
            )
        if not os.path.exists(self.session_file):
            raise SessionError(
                f"Sessiebestand niet gevonden: {self.session_file}\n"
                + self._login_hint()
            )
        try:
            # username is optioneel; instaloader leidt 'm uit het bestand af
            # als we 'm niet meegeven.
            self.loader.load_session_from_file(self.username, self.session_file)
        except FileNotFoundError:
            raise SessionError(
                f"Sessiebestand niet gevonden: {self.session_file}\n"
                + self._login_hint()
            )
        except Exception as e:  # corrupt / verlopen sessie
            raise SessionError(
                f"Kon sessie niet laden uit {self.session_file} ({e}).\n"
                "Mogelijk is de sessie verlopen of beschadigd.\n"
                + self._login_hint()
            )

        # Ingelogd? Dat bepalen we op de sessionid-cookie, NIET op
        # instaloader.test_login(): die query wordt door Instagram geblokt/
        # gerate-limit (401 "please wait a few minutes"), geeft daardoor een
        # vals-negatief én hamert bij retries op een geblokkeerde endpoint — wat
        # je burner juist verder in de problemen brengt. Een dode sessie blijkt
        # vanzelf bij de eerste scrape-request, met een nette foutmelding.
        if not self._has_session_cookie():
            raise SessionError(
                "De sessie bevat geen login (geen sessionid-cookie) — "
                "waarschijnlijk verlopen of niet goed aangemaakt.\n"
                + self._login_hint()
            )
        if not self.username and self.session_file:
            self.username = os.path.basename(self.session_file)[len("session-"):] or None
        self._logged_in = True

    def _has_session_cookie(self) -> bool:
        """True als de geladen sessie een (niet-lege) Instagram login-cookie heeft."""
        return bool(active_sessionid(self.loader))

    def _login_hint(self) -> str:
        user = self.username or "JOUW_BURNER_USERNAME"
        target = self.session_file or "~/.config/instaloader/session-<username>"
        return (
            "\nMaak eenmalig een sessie aan met een BURNER-account:\n"
            f"    instaloader -l {user}\n"
            "Instaloader schrijft dan een sessiebestand. Wijs IG_SESSION_FILE in "
            f"je .env naar dat bestand (bv. {target}).\n"
            "Let op: gebruik nooit je hoofdaccount — Instagram kan het bannen."
        )

    # --- scrapen -------------------------------------------------------------

    def _with_backoff(self, fn, what: str):
        """Voer `fn` uit met exponential backoff op 429 / connectiefouten."""
        attempt = 0
        while True:
            try:
                return fn()
            except (TooManyRequestsException, ConnectionException) as e:
                attempt += 1
                if attempt > self.max_retries:
                    raise
                wait = self.backoff_base * (2 ** (attempt - 1))
                print(
                    f"  [429/connectie] {what}: {e}. Wacht {wait:.0f}s "
                    f"(poging {attempt}/{self.max_retries})…"
                )
                time.sleep(wait)

    @staticmethod
    def _iso(dt) -> str:
        if dt is None:
            return ""
        # created_at_utc is naïef UTC; markeer expliciet als UTC.
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt.isoformat()

    @staticmethod
    def _username_of(owner) -> str:
        try:
            return owner.username
        except Exception:
            return ""

    def scrape_post(self, url_or_code: str, progress=None) -> ScrapeResult:
        """Scrape comments + replies van één post.

        `progress` is een optionele callback die per stap een dict-event krijgt,
        zodat een UI een voortgangsbalk kan tonen. Events:
          {"phase":"meta", "total":<post.comments>, "caption":..., "likes":...}
          {"phase":"comments", "done":<n>, "total":<n>, "rows":<n>}
        """
        def emit(ev):
            if progress:
                try:
                    progress(ev)
                except Exception:
                    pass

        if not self._logged_in:
            self.login()

        shortcode = resolve_shortcode(url_or_code)
        post_url = f"https://www.instagram.com/p/{shortcode}/"

        try:
            post = self._with_backoff(
                lambda: instaloader.Post.from_shortcode(
                    self.loader.context, shortcode
                ),
                what=f"post {shortcode}",
            )
        except LoginRequiredException:
            raise SessionError(
                "Instagram eist login voor deze data (429 voor anonieme "
                "requests). Je sessie lijkt niet actief.\n" + self._login_hint()
            )

        meta = PostMeta(
            post_url=post_url,
            post_shortcode=shortcode,
            owner_username=getattr(post, "owner_username", "") or "",
            caption=post.caption or "",
            comment_count=post.comments,
            post_timestamp=self._iso(getattr(post, "date_utc", None)),
            likes_count=post.likes,
        )
        emit({
            "phase": "meta",
            "total": meta.comment_count,
            "caption": meta.caption,
            "likes": meta.likes_count,
            "owner": meta.owner_username,
        })

        rows = []
        comments_iter = self._with_backoff(
            lambda: post.get_comments(), what=f"comments {shortcode}"
        )
        comments_it = iter(comments_iter)
        total = meta.comment_count or 0
        n = 0
        start = time.monotonic()
        incomplete = False
        warning = ""
        err_streak = 0

        def add_comment_rows(c):
            comment_id = str(c.id)
            answers = list(getattr(c, "answers", []) or [])
            rows.append({
                "post_url": post_url, "post_shortcode": shortcode,
                "type": "comment", "comment_id": comment_id,
                "parent_comment_id": None, "username": self._username_of(c.owner),
                "text": c.text or "", "timestamp": self._iso(c.created_at_utc),
                "like_count": getattr(c, "likes_count", 0) or 0,
                "reply_count": len(answers),
            })
            for a in answers:
                rows.append({
                    "post_url": post_url, "post_shortcode": shortcode,
                    "type": "reply", "comment_id": str(a.id),
                    "parent_comment_id": comment_id, "username": self._username_of(a.owner),
                    "text": a.text or "", "timestamp": self._iso(a.created_at_utc),
                    "like_count": getattr(a, "likes_count", 0) or 0,
                    "reply_count": 0,
                })

        last_error = ""
        while True:
            try:
                c = next(comments_it)
                err_streak = 0
            except StopIteration:
                # Een generator die een fout gooide is daarna 'op': als we net een
                # connectiefout zagen, is dit GEEN natuurlijk einde maar een
                # afgebroken stream → markeer als onvolledig.
                if err_streak > 0:
                    incomplete = True
                    warning = (
                        f"Gestopt na {n} comments doordat Instagram de comments-data "
                        f"tijdelijk blokte ({last_error}). De rest is niet opgehaald "
                        "— probeer later opnieuw en zet de pauze hoger."
                    )
                    print("  " + warning)
                break
            except (TooManyRequestsException, ConnectionException) as e:
                # Instagram knijpt de comments-endpoint af. Even wachten en nog
                # eens proberen; lukt het niet meer, dan stoppen we netjes met wat
                # we al hebben (geen verloren werk).
                err_streak += 1
                last_error = str(e)
                if err_streak > self.max_retries:
                    incomplete = True
                    warning = (
                        f"Gestopt na {n} comments doordat Instagram de comments-data "
                        f"tijdelijk blokte ({e}). De rest is niet opgehaald — probeer "
                        "later opnieuw en zet de pauze hoger."
                    )
                    print("  " + warning)
                    break
                wait = self.backoff_base * (2 ** (err_streak - 1))
                emit({"phase": "retry", "done": n, "total": total,
                      "rows": len(rows), "wait": round(wait),
                      "message": f"Instagram-fout, even wachten ({wait:.0f}s)…"})
                print(f"  [comments] {e}. Wacht {wait:.0f}s (poging {err_streak}/{self.max_retries})…")
                time.sleep(wait)
                continue

            add_comment_rows(c)
            n += 1
            elapsed = time.monotonic() - start
            eta = None
            if total and n and elapsed > 0:
                eta = max(0, (elapsed / n) * (total - n))
            emit({
                "phase": "comments", "done": n, "total": total,
                "rows": len(rows), "elapsed": round(elapsed),
                "eta": round(eta) if eta is not None else None,
            })
            if n % 25 == 0:
                print(f"  …{n} top-level comments verwerkt ({len(rows)} rijen)")
            # Beleefde pauze tussen comments (bovenop de rate-controller).
            if self.pause:
                time.sleep(self.pause)

        status = "onvolledig" if incomplete else "klaar"
        print(f"  {status.capitalize()}: {n} comments, {len(rows)} rijen voor {shortcode}")
        return ScrapeResult(meta=meta, rows=rows, incomplete=incomplete, warning=warning)


class SessionError(RuntimeError):
    """Geen geldige/ingelogde sessie — met een actie-gerichte boodschap."""
