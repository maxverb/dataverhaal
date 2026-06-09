# Instagram comment-scraper (gratis, via instaloader)

Scrapet **comments + replies** van Instagram-posts naar Excel, voor
sentimentanalyse. Geen betaalde services (geen Apify), puur
[instaloader](https://instaloader.github.io/).

Per comment/reply krijg je één rij; replies verwijzen via `parent_comment_id`
naar hun bovenliggende comment. De Excel heeft twee tabbladen: de platte
comment-tabel en de post-metadata.

Er zijn twee manieren om 'm te draaien:

- **Lokale web-app** (`server.py`) — plak een URL, zie een voortgangsbalk,
  krijg de comments + download. Aanbevolen.
- **CLI** (`scrape.py`) — handig voor scripts of meerdere posts in één run.

Beide detecteren **automatisch of je al ingelogd bent**: zodra je één keer
`instaloader -l` hebt gedraaid, vinden ze die sessie vanzelf — geen `.env`
of paden instellen nodig.

---

## Snelste manier: de lokale app

```bash
cd scrapers/instagram
pip install -r requirements.txt
instaloader -l JOUW_BURNER_USERNAME    # eenmalig inloggen (zie hieronder)
python server.py
```

`server.py` opent vanzelf <http://127.0.0.1:5000> in je browser. Daar:

1. Bovenaan zie je een groene badge **"Ingelogd als @…"** als je sessie
   gevonden is (rood + instructie als dat niet zo is).
2. Plak een post-URL (`https://www.instagram.com/p/DZSz1VDNeID/`) en klik
   **Scrapen**.
3. Een **voortgangsbalk** loopt mee terwijl de comments binnenkomen.
4. Je krijgt een tabel te zien én een **Download Excel**-knop. Hetzelfde
   bestand staat ook in `output/`.

> De app draait alleen lokaal (127.0.0.1) — je sessie en data verlaten je
> machine niet.

---

## Setup

```bash
cd scrapers/instagram
python -m venv .venv && source .venv/bin/activate   # optioneel maar aangeraden
pip install -r requirements.txt
```

`.env` is **optioneel**: de tool vindt je instaloader-sessie automatisch. Kopieer
`cp .env.example .env` alleen als je iets wilt overrulen (bv. een specifiek
sessiepad, of welk account als je er meerdere hebt via `IG_USERNAME`).

## Eenmalig inloggen (sessiebestand aanmaken)

Instagram **blokkeert comment-data voor niet-ingelogde requests** (HTTP 429).
Een ingelogde sessie is dus verplicht. We gebruiken een **sessiebestand**, geen
wachtwoord in code of `.env`.

> ⚠️ **Gebruik een BURNER-account**, niet je hoofdaccount. Scrapen kan tot een
> ban leiden (zie *Known limitations*).

```bash
instaloader -l JOUW_BURNER_USERNAME
```

Instaloader vraagt om je wachtwoord (en eventueel 2FA) en schrijft een
sessiebestand, standaard naar:

- Linux/macOS: `~/.config/instaloader/session-JOUW_BURNER_USERNAME`
- Windows: `%LOCALAPPDATA%\Instaloader\session-JOUW_BURNER_USERNAME`

Dat is alles: zowel de app als de CLI vinden dit sessiebestand **automatisch**
op de standaardplek. Je hoeft niets in te stellen.

Alleen overrulen nodig? Zet het dan in `.env`:

```ini
IG_SESSION_FILE=/home/jij/.config/instaloader/session-jouw_burner
IG_USERNAME=jouw_burner      # nodig als je meerdere sessies hebt
```

Heb je geen geldige sessie, dan crasht er niets: app én CLI tonen precies
welk commando je moet draaien.

## Gebruik

```bash
# één post
python scrape.py https://www.instagram.com/p/DZSz1VDNeID/

# meerdere posts (URL's en/of kale shortcodes door elkaar)
python scrape.py https://www.instagram.com/p/DZSz1VDNeID/ DAbc123XyZ

# rustiger scrapen (veiliger): 6 sec pauze tussen requests
python scrape.py DZSz1VDNeID --pause 6

# expliciet sessiebestand/uitvoermap meegeven
python scrape.py DZSz1VDNeID --session-file /pad/naar/session-burner --out-dir output
```

De scraper resolvet automatisch de shortcode uit een URL
(`/p/DZSz1VDNeID/` → `DZSz1VDNeID`), werkt ook met `/reel/` en `/tv/`.

### Opties

| Optie | Default | Betekenis |
|-------|---------|-----------|
| `--pause` | `3` (of `IG_PAUSE`) | Seconden tussen requests. Rustiger = veiliger. |
| `--max-retries` | `5` | Max. pogingen met exponential backoff bij 429. |
| `--backoff-base` | `5` | Basis (sec) voor backoff: `base * 2^(poging-1)`. |
| `--out-dir` | `output` (of `IG_OUTPUT_DIR`) | Map voor het Excel-bestand. |
| `--session-file` | uit `IG_SESSION_FILE` | Pad naar het sessiebestand. |
| `--username` | uit `IG_USERNAME` | Username van de sessie. |

## Output

`output/ig_comments_<timestamp>.xlsx` met twee tabbladen:

**Sheet `comments`** — platte comment/reply-tabel:

| kolom | uitleg |
|-------|--------|
| `post_url` | volledige post-URL |
| `post_shortcode` | shortcode van de post |
| `type` | `comment` of `reply` |
| `comment_id` | id van de comment/reply |
| `parent_comment_id` | bij een reply: id van de bovenliggende comment; bij een top-level comment leeg |
| `username` | auteur |
| `text` | comment-tekst |
| `timestamp` | ISO-8601 UTC (uit `created_at_utc`) |
| `like_count` | aantal likes op de comment/reply |
| `reply_count` | aantal replies (alleen bij top-level comments) |

**Sheet `post_metadata`** — één rij per post: `post_url`, `post_shortcode`,
`owner_username`, `caption`, `comment_count`, `post_timestamp`, `likes_count`.

## Rate limiting

- Standaard een pauze van een paar seconden tussen requests (`--pause`).
- Bovenop instaloader's eigen rate-controller dwingt de scraper dat minimum-
  interval af (`PoliteRateController`).
- Bij een 429 of connectiefout: **exponential backoff** met meerdere pogingen.
- Devies: liever traag dan geband. Verhoog `--pause` als je twijfelt.

---

## Known limitations

1. **Login verplicht.** Instagram geeft anonieme requests 429 voor comment-data.
   Een ingelogde sessie is geen optie maar een vereiste.
2. **Gebruik een BURNER-account.** Scrapen is tegen Instagram's ToS; het account
   kan worden geband. Gebruik nooit een account dat je niet kwijt wilt.
3. **"Wie heeft geliket" is niet beschikbaar.** Instagram levert de lijst van
   likers per comment niet uit. Het *aantal* likes (`like_count`) per comment
   krijg je wél.

### Wat hier NIET werkt (en waarom we het niet bouwen)

- **Cloudflare bot-bypass / browser-rendering helpt niet.** Instagram zit niet
  achter Cloudflare. Zulke lagen draaien bovendien vanaf datacenter-IP's, die
  Instagram juist hard blokt. Een echte, ingelogde sessie is de enige route.

---

## Zelf testen

Live testen vereist jouw eigen sessie, dus dat is hier bewust **niet**
automatisch gedraaid. Test 'm zo zelf:

```bash
cd scrapers/instagram
pip install -r requirements.txt

# 1) eenmalig inloggen met je burner (sessie wordt automatisch gevonden)
instaloader -l JOUW_BURNER_USERNAME

# 2a) via de app: open de browser, plak de URL, klik Scrapen
python server.py

# 2b) of via de CLI:
python scrape.py https://www.instagram.com/p/DZSz1VDNeID/
```

Resultaat: `output/ig_comments_<timestamp>.xlsx`. Open sheet `comments` voor de
platte tabel en `post_metadata` voor de post-info. Lukt het inloggen niet, dan
tonen app én CLI exact welk `instaloader -l` commando je moet draaien.
