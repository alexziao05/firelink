#!/usr/bin/env python3
"""
SMS simulator CLI.

Interactive mode (default):
    python3 test/sms_cli.py
    python3 test/sms_cli.py --phone +16195550001

    Reads messages from stdin one line at a time, POSTs to /sms/inbound,
    prints the reply. Ctrl-D / Ctrl-C to exit.

Batch mode:
    python3 test/sms_cli.py --batch [--cases path/to/cases.json]

    Replays every entry in app/data/sms_test_cases.json (or the supplied
    file) against /sms/inbound and prints phone | message | reply.

Override base URL via the FIRELINK_URL env var.
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import urllib.error
import urllib.request
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_CASES = REPO_ROOT / "app" / "data" / "sms_test_cases.json"
BASE_URL = os.environ.get("FIRELINK_URL", "http://localhost:8000")


def post_sms(phone: str, message: str, timeout: int = 60) -> str:
    body = json.dumps({"phone": phone, "message": message}).encode()
    req = urllib.request.Request(
        f"{BASE_URL}/sms/inbound",
        data=body,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            payload = json.loads(r.read().decode())
            return payload.get("reply", "")
    except urllib.error.HTTPError as e:
        return f"<HTTP {e.code}: {e.read().decode(errors='ignore')[:200]}>"
    except urllib.error.URLError as e:
        return f"<connection error: {e.reason}>"


def run_interactive(phone: str | None) -> int:
    if phone is None:
        try:
            phone = input("Phone (E.164, e.g. +16195550001): ").strip()
        except (EOFError, KeyboardInterrupt):
            return 0
    if not phone:
        print("No phone provided. Exiting.", file=sys.stderr)
        return 1

    print(f"FireLink SMS simulator → {BASE_URL}/sms/inbound")
    print(f"From: {phone}")
    print("Type a message and hit Enter. Ctrl-D / Ctrl-C to exit.")
    print("-" * 60)

    while True:
        try:
            message = input("you> ").strip()
        except (EOFError, KeyboardInterrupt):
            print()
            return 0
        if not message:
            continue
        reply = post_sms(phone, message)
        print(f"sms> {reply}")
        print()


def run_batch(cases_path: Path) -> int:
    if not cases_path.is_file():
        print(f"cases file not found: {cases_path}", file=sys.stderr)
        return 1
    cases = json.loads(cases_path.read_text())
    failures = 0
    for i, case in enumerate(cases, 1):
        phone = case["phone"]
        message = case["message"]
        print(f"[{i}/{len(cases)}] {phone}")
        print(f"  msg: {message}")
        reply = post_sms(phone, message)
        if reply.startswith("<"):
            failures += 1
        print(f"  rep: {reply}")
        print()
    print(f"{len(cases) - failures}/{len(cases)} succeeded")
    return 1 if failures else 0


def main() -> int:
    p = argparse.ArgumentParser(description="FireLink SMS simulator")
    p.add_argument("--phone", help="Skip the phone prompt")
    p.add_argument("--batch", action="store_true", help="Replay sms_test_cases.json")
    p.add_argument("--cases", type=Path, default=DEFAULT_CASES, help="Custom cases JSON")
    args = p.parse_args()

    if args.batch:
        return run_batch(args.cases)
    return run_interactive(args.phone)


if __name__ == "__main__":
    sys.exit(main())
