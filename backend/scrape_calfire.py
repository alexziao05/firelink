"""
Scrape real CAL FIRE Eaton Fire update pages and pair with real Open-Meteo
weather data (Jan 7 – Jan 31, 2025).

Outputs:
  app/data/fire_incidents.json   — one entry per CAL FIRE update report
  app/data/weather_alerts.json   — hourly weather events keyed to update times
"""
import asyncio
import json
import re
import urllib.request
from datetime import datetime, timezone, timedelta
from playwright.async_api import async_playwright

BASE_URL   = "https://www.fire.ca.gov"
LIST_URL   = f"{BASE_URL}/incidents/2025/1/7/eaton-fire/updates"
LAT, LON   = 34.187, -118.072
PST        = timezone(timedelta(hours=-8))

# ── helpers ──────────────────────────────────────────────────────────────────

def pst_to_utc(date_str: str, time_str: str) -> str:
    """'01/27/2025', '10:04 AM'  →  '2025-01-27T18:04:00Z'"""
    dt = datetime.strptime(f"{date_str} {time_str}", "%m/%d/%Y %I:%M %p")
    return dt.replace(tzinfo=PST).astimezone(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

def parse_int(s: str) -> int:
    s = re.sub(r"[^\d]", "", s)
    return int(s) if s else 0

def parse_float(s: str) -> float:
    s = re.sub(r"[^\d.]", "", s)
    return float(s) if s else 0.0

# ── scrape index page ─────────────────────────────────────────────────────────

async def get_update_links(page):
    """Return list of (label, full_url) from the updates index."""
    await page.goto(LIST_URL, wait_until="domcontentloaded", timeout=30000)
    await page.wait_for_timeout(2000)
    links = await page.query_selector_all("main li a")
    results = []
    for link in links:
        href  = await link.get_attribute("href")
        label = (await link.inner_text()).strip()
        if href:
            results.append((label, BASE_URL + href if href.startswith("/") else href))
    return results

# ── scrape a single detail page ───────────────────────────────────────────────

async def scrape_update(page, url: str, idx: int):
    try:
        await page.goto(url, wait_until="domcontentloaded", timeout=25000)
        await page.wait_for_timeout(800)
    except Exception as e:
        print(f"  [!] timeout {url}: {e}")
        return None

    text = await page.inner_text("main, body")

    # Date / Time from the header dl
    date_m = re.search(r"Date:\s*([\d/]+)", text)
    time_m = re.search(r"Time:\s*(\d+:\d+\s*[AP]M)", text)
    if not date_m or not time_m:
        return None

    date_s = date_m.group(1).strip()
    time_s = time_m.group(1).strip()
    timestamp = pst_to_utc(date_s, time_s)

    # Incident facts — each field is a label on one line, value on the next
    # Pattern: look for field name then its value
    def fact(label: str, default="0") -> str:
        m = re.search(rf"{re.escape(label)}\s*\n\s*([^\n]+)", text)
        return m.group(1).strip() if m else default

    acres       = parse_int(fact("Size", "0"))
    containment = parse_float(fact("Containment", "0%"))

    # Situation Summary — text between "Situation Summary" and next heading
    summary_m = re.search(
        r"Situation Summary\s*\n\s*(.*?)(?:\n\s*(?:Initial Protective|Additional|Federal|$))",
        text, re.DOTALL
    )
    status = summary_m.group(1).strip() if summary_m else f"Eaton Fire update — {acres:,} acres, {containment}% contained"
    status = re.sub(r"\s+", " ", status)

    uuid = url.rstrip("/").split("/")[-1]
    return {
        "id":          f"CAL-2025-EATON-{uuid[:8]}",
        "name":        "Eaton Fire",
        "latitude":    LAT,
        "longitude":   LON,
        "acres":       acres,
        "containment": containment,
        "status":      status,
        "timestamp":   timestamp,
    }

# ── fetch real weather from Open-Meteo ───────────────────────────────────────

def fetch_weather_hourly() -> dict:
    url = (
        "https://archive-api.open-meteo.com/v1/archive"
        "?latitude=34.05&longitude=-118.25"
        "&start_date=2025-01-07&end_date=2025-01-31"
        "&hourly=wind_speed_10m,wind_gusts_10m,relative_humidity_2m"
        "&wind_speed_unit=mph&timezone=America%2FLos_Angeles"
    )
    with urllib.request.urlopen(url, timeout=20) as r:
        return json.loads(r.read())

def build_weather_alerts(hourly: dict, update_timestamps: list) -> list:
    """
    For every fire-incident timestamp, emit one weather record using the
    real observed conditions from the nearest hourly Open-Meteo snapshot.
    """
    times = hourly["hourly"]["time"]          # "2025-01-07T00:00" (local PST)
    ws    = hourly["hourly"]["wind_speed_10m"]
    wg    = hourly["hourly"]["wind_gusts_10m"]
    rh    = hourly["hourly"]["relative_humidity_2m"]

    # Build index: hour-truncated UTC string → array position
    idx_map = {}
    for i, t in enumerate(times):
        dt_local = datetime.strptime(t, "%Y-%m-%dT%H:%M").replace(tzinfo=PST)
        key = dt_local.astimezone(timezone.utc).strftime("%Y-%m-%dT%H:00Z")
        idx_map[key] = i

    def classify(wind_mph: float, gust_mph: float, hum_pct: float):
        if gust_mph >= 60 or (gust_mph >= 40 and hum_pct <= 10):
            return "Red Flag Warning", "Extreme"
        if gust_mph >= 40 or (gust_mph >= 25 and hum_pct <= 15):
            return "Red Flag Warning", "Severe"
        if gust_mph >= 25 or hum_pct <= 20:
            return "Fire Weather Watch", "Moderate"
        if hum_pct <= 30:
            return "Fire Weather Advisory", "Minor"
        return "Weather Advisory", "Minor"

    alerts = []

    for ts_utc in sorted(update_timestamps):   # one entry per incident timestamp
        hour_key = ts_utc[:14] + "00Z"

        i = idx_map.get(hour_key)
        if i is None:
            continue

        w  = ws[i]  or 0.0
        g  = wg[i]  or 0.0
        h  = rh[i]  or 50.0
        event, severity = classify(w, g, h)

        expires = datetime.strptime(ts_utc, "%Y-%m-%dT%H:%M:%SZ").replace(tzinfo=timezone.utc)
        expires += timedelta(hours=6)

        alerts.append({
            "id":           f"urn:oid:2.49.0.1.840.0.eaton-obs-{len(alerts):04d}",
            "event":        event,
            "severity":     severity,
            "area":         "Los Angeles County — Altadena/Pasadena Foothills",
            "description":  (
                f"Observed conditions at update time: wind {w:.1f} mph, "
                f"gusts {g:.1f} mph, relative humidity {h:.0f}%."
            ),
            "wind_mph":      round(g, 1),
            "humidity_pct":  round(h, 0),
            "onset":         ts_utc,
            "expires":       expires.strftime("%Y-%m-%dT%H:%M:%SZ"),
            "timestamp":     ts_utc,
        })

    return sorted(alerts, key=lambda x: x["timestamp"])

# ── main ─────────────────────────────────────────────────────────────────────

async def main():
    print("Fetching real Open-Meteo weather data (Jan 7–31 2025)…")
    hourly = fetch_weather_hourly()
    print(f"  Got {len(hourly['hourly']['time'])} hourly observations")

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=False)
        ctx     = await browser.new_context(
            user_agent=(
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/120.0.0.0 Safari/537.36"
            )
        )
        page = await ctx.new_page()

        print("Loading update index…")
        links = await get_update_links(page)
        print(f"  Found {len(links)} update links")

        incidents = []
        for idx, (label, url) in enumerate(reversed(links)):   # oldest first
            print(f"  [{idx+1}/{len(links)}] {label}")
            record = await scrape_update(page, url, idx)
            if record:
                incidents.append(record)
            await asyncio.sleep(0.6)   # polite delay

        await browser.close()

    print(f"\nScraped {len(incidents)} incident records")

    # Build weather alerts aligned to incident timestamps
    ts_list = [r["timestamp"] for r in incidents]
    alerts  = build_weather_alerts(hourly, ts_list)
    print(f"Built {len(alerts)} weather alert records")

    # Write outputs
    out_fire    = "app/data/fire_incidents.json"
    out_weather = "app/data/weather_alerts.json"

    with open(out_fire, "w") as f:
        json.dump(incidents, f, indent=2)
    print(f"Wrote {out_fire}")

    with open(out_weather, "w") as f:
        json.dump(alerts, f, indent=2)
    print(f"Wrote {out_weather}")

asyncio.run(main())
