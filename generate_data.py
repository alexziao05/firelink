"""
Generates correlated mock data for the Eaton Fire (Jan 7 - Feb 14, 2025).
Outputs three JSON files to app/data/.
Run: python generate_data.py
"""
import json
from datetime import datetime, timedelta, timezone

BASE = datetime(2025, 1, 7, 22, 0, 0, tzinfo=timezone.utc)  # fire ignites


# ─────────────────────────── FIRE INCIDENTS ────────────────────────────

def ts(dt): return dt.strftime("%Y-%m-%dT%H:%M:%SZ")

def gen_fire():
    entries = []
    # (hours_offset, acres, containment, status_note)
    milestones = [
        (0,    50,     0,  "Fire reported near Eaton Canyon, wind-driven spread beginning"),
        (2,    200,    0,  "Rapid spread northeast toward Altadena, evacuations ordered"),
        (4,    800,    0,  "Fire crowning in chaparral, structures threatened in Altadena"),
        (6,    2000,   0,  "Multiple structures destroyed, Highway 2 closed"),
        (8,    4500,   0,  "Wind gusts 80mph driving fire into residential areas"),
        (10,   7000,   0,  "Fire reaches Pasadena foothills, 10000 residents evacuated"),
        (12,   9500,   0,  "Air tankers grounded due to extreme wind"),
        (14,   11000,  0,  "Fire crosses into Sierra Madre, containment impossible in current conditions"),
        (16,   12500,  0,  "Winds beginning to ease slightly, ground crews repositioning"),
        (20,   13500,  0,  "Dawn assessment: full perimeter active, no containment"),
        (24,   14000,  0,  "Winds down to 40mph, first aerial attack sorties launched"),
        (30,   14050,  3,  "Hand crews establishing containment lines on southern edge"),
        (36,   14080,  5,  "Southern flank showing progress, northern edge still active"),
        (42,   14100,  8,  "Moderate humidity recovery overnight helping crews"),
        (48,   14110,  12, "Two containment lines holding, structure protection continues"),
        (60,   14113,  20, "Weather improving, additional resources arriving"),
        (72,   14115,  30, "Eastern perimeter largely contained"),
        (84,   14115,  40, "Western flank crews making steady progress"),
        (96,   14116,  50, "Fire at half containment, evacuation orders downgraded to warnings"),
        (120,  14116,  60, "Mop-up operations expanding through contained areas"),
        (144,  14117,  70, "Evacuation warnings lifted for parts of Altadena"),
        (168,  14117,  78, "Remaining hot spots being addressed"),
        (192,  14117,  85, "Most residents allowed to return to unaffected areas"),
        (240,  14117,  90, "Final perimeter walk-through underway"),
        (288,  14117,  95, "Mop-up nearly complete, minimal residual heat"),
        (336,  14117,  97, "Demobilization of resources beginning"),
        (888,  14117, 100, "Fire declared fully contained and controlled"),  # ~Feb 14
    ]
    # interpolate ~4 entries between each milestone
    for i in range(len(milestones) - 1):
        h0, a0, c0, n0 = milestones[i]
        h1, a1, c1, _  = milestones[i + 1]
        steps = 4
        for s in range(steps):
            frac = s / steps
            h = h0 + (h1 - h0) * frac
            a = int(a0 + (a1 - a0) * frac)
            c = round(c0 + (c1 - c0) * frac, 1)
            note = n0 if s == 0 else f"Eaton Fire update — {a:,} acres, {c}% contained"
            entries.append({
                "id": f"CAL-2025-EATON-{len(entries):04d}",
                "name": "Eaton Fire",
                "latitude": 34.187,
                "longitude": -118.072,
                "acres": a,
                "containment": c,
                "status": note,
                "timestamp": ts(BASE + timedelta(hours=h)),
            })
    # add final milestone
    h, a, c, n = milestones[-1]
    entries.append({
        "id": f"CAL-2025-EATON-{len(entries):04d}",
        "name": "Eaton Fire",
        "latitude": 34.187,
        "longitude": -118.072,
        "acres": a,
        "containment": c,
        "status": n,
        "timestamp": ts(BASE + timedelta(hours=h)),
    })
    return entries


# ─────────────────────────── WEATHER ALERTS ────────────────────────────

def gen_weather():
    entries = []
    # (hours_before_or_after_ignition, event, severity, area, description, wind_mph, humidity_pct)
    alerts = [
        (-24, "Fire Weather Watch",
         "Moderate",
         "Los Angeles County Mountains and Foothills",
         "Offshore flow developing Sunday night. Critical fire weather possible Monday-Tuesday. "
         "Humidity 8-15%, winds 30-50mph with gusts to 70mph in passes.",
         50, 12),
        (-12, "Red Flag Warning",
         "Severe",
         "Los Angeles County Mountains including Altadena and Pasadena Foothills",
         "Santa Ana winds arriving overnight. Sustained 45-65mph, gusts to 80mph. "
         "Relative humidity 5-10%. Any ignition will spread rapidly.",
         65, 8),
        (-6, "Extreme Wind Warning",
         "Extreme",
         "Los Angeles County Foothills — Altadena, La Canada, Pasadena, Sierra Madre",
         "Life-threatening Santa Ana winds. Sustained 60-75mph, gusts 90-100mph possible "
         "in canyon mouths. Flying debris will be dangerous. Power outages imminent.",
         90, 6),
        (0, "Red Flag Warning — ELEVATED",
         "Extreme",
         "Los Angeles County Foothills and San Gabriel Valley",
         "Eaton Fire now burning under extreme fire weather. Winds 70-100mph recorded at "
         "Altadena ridge stations. RH 4-6%. Extreme fire behavior expected to continue through Tuesday.",
         100, 5),
        (4, "Air Quality Alert — Unhealthy",
         "Moderate",
         "San Gabriel Valley including Pasadena, Arcadia, Monrovia, El Monte",
         "Smoke from Eaton Fire producing unhealthy air quality. AQI 150-200 in downwind communities. "
         "Sensitive groups should remain indoors.",
         80, 5),
        (8, "Air Quality Alert — Very Unhealthy",
         "Severe",
         "Greater Los Angeles Basin — Eastern Sectors",
         "Dense smoke from Eaton Fire. AQI 200-300 across San Gabriel Valley. "
         "Everyone should avoid outdoor activity. N95 required if outdoors.",
         70, 6),
        (12, "Air Quality Alert — Hazardous",
         "Extreme",
         "Altadena, Pasadena, San Marino, Arcadia, Monrovia",
         "Hazardous smoke levels. AQI exceeding 300 in Altadena and adjacent communities. "
         "All residents should shelter in place. Schools closed.",
         55, 7),
        (16, "Extreme Wind Warning — Continuing",
         "Extreme",
         "Los Angeles County Mountain Passes and Adjacent Foothills",
         "Wind event continuing. Gusts still 70-85mph at upper elevations. "
         "No end to Red Flag conditions expected until Tuesday evening.",
         85, 6),
        (20, "Red Flag Warning — Extended",
         "Severe",
         "Los Angeles and Ventura County Mountains",
         "Red Flag Warning extended through Wednesday morning. Winds gradually decreasing "
         "but humidity remains critically low at 5-8%.",
         60, 7),
        (26, "Fire Weather Advisory — Elevated Wind",
         "Moderate",
         "Los Angeles County — All Zones",
         "Winds decreasing but fire weather advisory continues. Gusts 35-50mph. "
         "Eaton Fire perimeter not yet secured — spot fire potential remains elevated.",
         50, 10),
        (30, "Wildfire Smoke Advisory — Unhealthy",
         "Moderate",
         "Los Angeles Basin",
         "Eaton Fire smoke AQI 150-200 across San Gabriel Valley. "
         "Sensitive groups remain indoors. Visibility reduced near active fire perimeter.",
         35, 12),
        (36, "Red Flag Warning — Ended",
         "Minor",
         "Los Angeles County",
         "Red Flag Warning cancelled. Humidity recovering to 15-25%. "
         "Winds 20-30mph. Fire behavior on Eaton Fire moderating — containment operations resuming.",
         30, 18),
        (48, "Wildfire Smoke Advisory — Improving",
         "Minor",
         "San Gabriel Valley",
         "Eaton Fire smoke dispersing. AQI 100-150. Aerial operations resumed over fire. "
         "Residents near burn perimeter should still limit outdoor exposure.",
         20, 22),
        (72, "Wildfire Smoke Advisory — Clearing",
         "Minor",
         "Greater Los Angeles",
         "Eaton Fire smoke largely cleared. AQI below 100. "
         "Smoke-free air allows full aerial attack and mop-up operations to continue.",
         15, 28),
        (96, "Fire Weather Watch — Secondary Event",
         "Moderate",
         "Los Angeles County Mountains",
         "Another offshore flow possible next week. Monitoring for return of "
         "elevated fire weather conditions while Eaton Fire mop-up is ongoing.",
         25, 20),
        (120, "Fire Weather Watch",
         "Moderate",
         "Los Angeles County Mountains and Foothills",
         "Secondary offshore flow event possible Thursday-Friday. Humidity 10-18%, "
         "winds 30-50mph. Eaton Fire recovery teams should monitor conditions.",
         45, 14),
        (132, "Red Flag Warning",
         "Severe",
         "Los Angeles County Mountains",
         "Secondary wind event arriving. Gusts to 65mph in passes. RH 8-12%. "
         "Mop-up operations on Eaton Fire paused, crews on standby.",
         65, 10),
        (144, "Red Flag Warning — Ended",
         "Minor",
         "Los Angeles County",
         "Secondary wind event weaker than forecast. Red Flag Warning cancelled early. "
         "Eaton Fire mop-up operations resumed.",
         25, 20),
        (192, "Post-Wildfire Debris Flow Advisory",
         "Moderate",
         "Altadena and Pasadena — Eaton Fire Burn Scar",
         "Rainfall 0.3-0.6 inch forecast over Eaton Fire burn scar. "
         "Unstabilized slopes at elevated risk for debris flows and mudslides. "
         "Residents below burn scar should review evacuation routes.",
         10, 45),
        (240, "Flash Flood Watch — Burn Scar",
         "Moderate",
         "Eaton Fire Burn Scar — Altadena and Foothills",
         "Rainfall of 0.5-1.0 inch possible over Eaton Fire burn scar. "
         "Debris flows and mudslides possible in recently burned areas. "
         "Residents below burn scar should be prepared to evacuate.",
         15, 70),
    ]
    for h, event, severity, area, desc, wind, humidity in alerts:
        entries.append({
            "id": f"urn:oid:2.49.0.1.840.0.eaton-{len(entries):04d}",
            "event": event,
            "severity": severity,
            "area": area,
            "description": desc,
            "wind_mph": wind,
            "humidity_pct": humidity,
            "onset": ts(BASE + timedelta(hours=h)),
            "expires": ts(BASE + timedelta(hours=h + 12)),
            "timestamp": ts(BASE + timedelta(hours=h)),
        })
    return entries


# ─────────────────────────── WRITE FILES ────────────────────────────────

if __name__ == "__main__":
    fire = gen_fire()
    weather = gen_weather()

    with open("app/data/fire_incidents.json", "w") as f:
        json.dump(fire, f, indent=2)

    with open("app/data/weather_alerts.json", "w") as f:
        json.dump(weather, f, indent=2)

    print(f"Generated:")
    print(f"  fire_incidents.json   — {len(fire)} entries")
    print(f"  weather_alerts.json   — {len(weather)} entries")
    print(f"  Total: {len(fire)+len(weather)} entries")
