#!/usr/bin/env python3
"""CLI: scrape Instagram-comments (+ replies) van één of meer posts naar Excel.

Gebruik:
    python scrape.py https://www.instagram.com/p/DZSz1VDNeID/
    python scrape.py DZSz1VDNeID DAbc123XyZ --pause 4
    python scrape.py <url> --out-dir output

Vereist een geldige instaloader-sessie (zie README). Login via sessiebestand,
NOOIT wachtwoorden in code.
"""

import argparse
import os
import sys
from datetime import datetime

import pandas as pd
from dotenv import load_dotenv

from engine import InstagramEngine, SessionError

# Vaste kolomvolgorde van de platte tabel (sheet 1).
COLUMNS = [
    "post_url",
    "post_shortcode",
    "type",
    "comment_id",
    "parent_comment_id",
    "username",
    "text",
    "timestamp",
    "like_count",
    "reply_count",
]

META_COLUMNS = [
    "post_url",
    "post_shortcode",
    "owner_username",
    "caption",
    "comment_count",
    "post_timestamp",
    "likes_count",
]


def parse_args(argv=None):
    p = argparse.ArgumentParser(
        description="Scrape Instagram-comments + replies naar Excel.",
        formatter_class=argparse.ArgumentDefaultsHelpFormatter,
    )
    p.add_argument(
        "targets",
        nargs="+",
        help="Post-URL(s) of shortcode(s), bv. https://www.instagram.com/p/DZSz1VDNeID/",
    )
    p.add_argument(
        "--pause",
        type=float,
        default=float(os.getenv("IG_PAUSE", "3")),
        help="Pauze in seconden tussen requests (rustig = veiliger).",
    )
    p.add_argument(
        "--max-retries",
        type=int,
        default=5,
        help="Max. pogingen met exponential backoff bij 429.",
    )
    p.add_argument(
        "--backoff-base",
        type=float,
        default=5.0,
        help="Basis (sec) voor exponential backoff: base * 2^(poging-1).",
    )
    p.add_argument(
        "--out-dir",
        default=os.getenv("IG_OUTPUT_DIR", "output"),
        help="Map voor het Excel-bestand.",
    )
    p.add_argument(
        "--session-file",
        default=None,
        help="Pad naar instaloader-sessiebestand (anders uit .env IG_SESSION_FILE).",
    )
    p.add_argument(
        "--username",
        default=None,
        help="Instagram-username van de sessie (anders uit .env IG_USERNAME).",
    )
    return p.parse_args(argv)


def export_excel(out_dir: str, all_rows: list, all_meta: list) -> str:
    os.makedirs(out_dir, exist_ok=True)
    ts = datetime.now().strftime("%Y%m%d_%H%M%S")
    path = os.path.join(out_dir, f"ig_comments_{ts}.xlsx")

    df_rows = pd.DataFrame(all_rows, columns=COLUMNS)
    df_meta = pd.DataFrame(all_meta, columns=META_COLUMNS)

    # Comment-ID's zijn 17+ cijferige getallen: forceer tekst zodat Excel ze niet
    # naar floats coerced (precisieverlies / "1.23E+16"). None blijft leeg.
    for col in ("comment_id", "parent_comment_id"):
        df_rows[col] = df_rows[col].map(lambda v: "" if v is None else str(v))

    with pd.ExcelWriter(path, engine="openpyxl") as xl:
        df_rows.to_excel(xl, sheet_name="comments", index=False)
        df_meta.to_excel(xl, sheet_name="post_metadata", index=False)

    return path


def main(argv=None) -> int:
    load_dotenv()
    args = parse_args(argv)

    engine = InstagramEngine(
        session_file=args.session_file,
        username=args.username,
        pause=args.pause,
        max_retries=args.max_retries,
        backoff_base=args.backoff_base,
    )

    try:
        engine.login()
    except SessionError as e:
        print(f"\nLogin mislukt:\n{e}\n", file=sys.stderr)
        return 2

    print(f"Ingelogd als @{engine.username}. {len(args.targets)} post(s) te scrapen.\n")

    all_rows, all_meta = [], []
    failed = []
    for i, target in enumerate(args.targets, 1):
        print(f"[{i}/{len(args.targets)}] {target}")
        try:
            res = engine.scrape_post(target)
        except SessionError as e:
            print(f"\nSessieprobleem:\n{e}\n", file=sys.stderr)
            return 2
        except Exception as e:  # noqa: BLE001 — één slechte post stopt de rest niet
            print(f"  Overgeslagen ({type(e).__name__}): {e}", file=sys.stderr)
            failed.append(target)
            continue
        all_rows.extend(res.rows)
        all_meta.append(res.meta.__dict__)

    if not all_rows and not all_meta:
        print("\nGeen data verzameld — niets om te exporteren.", file=sys.stderr)
        return 1

    path = export_excel(args.out_dir, all_rows, all_meta)
    print(f"\nGeëxporteerd: {path}")
    print(f"  {len(all_rows)} rijen, {len(all_meta)} post(s).")
    if failed:
        print(f"  Mislukt: {', '.join(failed)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
