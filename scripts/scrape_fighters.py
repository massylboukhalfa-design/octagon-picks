#!/usr/bin/env python3
"""
Scraper UFC Fighters — produit un JSON compatible avec l'import Octagon Picks.
Source : ufcstats.com (données publiques, pas de login requis)

Usage :
  pip install requests beautifulsoup4
  python scrape_fighters.py                              # tous les fighters
  python scrape_fighters.py --limit 50 --no-enrich       # rapide, sans détails
  python scrape_fighters.py --output top_fighters.json   # fichier custom

Sortie : fighters.json (dans le même dossier)
"""

import requests
from bs4 import BeautifulSoup
import json
import time
import argparse
import sys
import re

BASE_URL = "http://ufcstats.com/statistics/fighters"

FLAG_MAP = {
    "USA": "🇺🇸", "United States": "🇺🇸",
    "Brazil": "🇧🇷",
    "Russia": "🇷🇺",
    "England": "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
    "Australia": "🇦🇺",
    "Canada": "🇨🇦",
    "Ireland": "🇮🇪",
    "Mexico": "🇲🇽",
    "Georgia": "🇬🇪",
    "Sweden": "🇸🇪",
    "Poland": "🇵🇱",
    "France": "🇫🇷",
    "New Zealand": "🇳🇿",
    "Netherlands": "🇳🇱",
    "Kazakhstan": "🇰🇿",
    "Ukraine": "🇺🇦",
    "South Africa": "🇿🇦",
    "Nigeria": "🇳🇬",
    "Jamaica": "🇯🇲",
    "Ecuador": "🇪🇨",
    "China": "🇨🇳",
    "Japan": "🇯🇵",
    "South Korea": "🇰🇷",
    "Dominican Republic": "🇩🇴",
    "Moldova": "🇲🇩",
    "Croatia": "🇭🇷",
    "Czech Republic": "🇨🇿",
    "Austria": "🇦🇹",
    "Switzerland": "🇨🇭",
    "Armenia": "🇦🇲",
    "Morocco": "🇲🇦",
    "Scotland": "🏴󠁧󠁢󠁳󠁣󠁴󠁿",
    "Argentina": "🇦🇷",
    "Angola": "🇦🇴",
    "Kyrgyzstan": "🇰🇬",
    "Panama": "🇵🇦",
    "Spain": "🇪🇸",
    "Italy": "🇮🇹",
    "Germany": "🇩🇪",
    "Belgium": "🇧🇪",
    "Serbia": "🇷🇸",
    "Turkey": "🇹🇷",
    "Philippines": "🇵🇭",
    "Uzbekistan": "🇺🇿",
    "Colombia": "🇨🇴",
    "Portugal": "🇵🇹",
    "Thailand": "🇹🇭",
}

def cm_from_height(h):
    if not h or h.strip() in ('--', ''):
        return None
    m = re.match(r"(\d+)'\s*(\d+)?", h.strip())
    if not m:
        return None
    return round((int(m.group(1)) * 12 + int(m.group(2) or 0)) * 2.54)

def cm_from_reach(r):
    if not r or r.strip() in ('--', ''):
        return None
    m = re.match(r"([\d.]+)", r.strip())
    return round(float(m.group(1)) * 2.54) if m else None

def kg_from_lbs(w):
    if not w or w.strip() in ('--', ''):
        return None
    m = re.match(r"([\d.]+)", w.strip())
    return round(float(m.group(1)) * 0.453592) if m else None

def parse_int(s):
    try:
        return int(str(s).strip())
    except:
        return 0

def get_fighters_for_letter(letter, session):
    url = f"{BASE_URL}?char={letter}&page=all"
    try:
        resp = session.get(url, timeout=15)
        resp.raise_for_status()
    except Exception as e:
        print(f"  Erreur {letter}: {e}", file=sys.stderr)
        return []

    soup = BeautifulSoup(resp.text, 'html.parser')
    rows = soup.select('table.b-statistics__table tbody tr')
    fighters = []

    for row in rows:
        cols = row.find_all('td')
        if len(cols) < 10:
            continue

        first = cols[0].get_text(strip=True)
        last  = cols[1].get_text(strip=True)
        if not first and not last:
            continue

        link = cols[0].find('a')
        fighters.append({
            "name":        f"{first} {last}".strip(),
            "nickname":    cols[2].get_text(strip=True) or None,
            "country":     None,
            "country_flag": None,
            "wins":        parse_int(cols[7].get_text(strip=True)),
            "losses":      parse_int(cols[8].get_text(strip=True)),
            "draws":       parse_int(cols[9].get_text(strip=True)),
            "no_contests": 0,
            "wins_ko":     0,
            "wins_sub":    0,
            "wins_dec":    0,
            "height_cm":   cm_from_height(cols[3].get_text(strip=True)),
            "weight_kg":   kg_from_lbs(cols[4].get_text(strip=True)),
            "reach_cm":    cm_from_reach(cols[5].get_text(strip=True)),
            "stance":      cols[6].get_text(strip=True) or None,
            "weight_class": None,
            "ranking":     None,
            "is_champion": False,
            "photo_url":   None,
            "_url":        link['href'] if link else None,
        })

    return fighters

def enrich_fighter(fighter, session):
    """Récupère méthodes de victoire + photo depuis la fiche ufcstats"""
    url = fighter.pop('_url', None)
    if not url:
        return

    try:
        resp = session.get(url, timeout=15)
        resp.raise_for_status()
    except:
        return

    soup = BeautifulSoup(resp.text, 'html.parser')

    # Photo (hébergée sur ufc.com)
    img = soup.select_one('img.b-fighter-page__image')
    if img and img.get('src') and img['src'].startswith('http'):
        fighter['photo_url'] = img['src']

    # Méthodes de victoire / NC
    for item in soup.select('li.b-list__box-list-item_type_block'):
        title_el = item.find('i', class_='b-list__box-item-title')
        if not title_el:
            continue
        title = title_el.get_text(strip=True).lower()
        val   = item.get_text(strip=True).replace(title_el.get_text(strip=True), '').strip()
        if 'ko' in title or 'tko' in title:
            fighter['wins_ko']  = parse_int(val)
        elif 'sub' in title:
            fighter['wins_sub'] = parse_int(val)
        elif 'dec' in title:
            fighter['wins_dec'] = parse_int(val)
        elif 'nc' in title or 'contest' in title:
            fighter['no_contests'] = parse_int(val)

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--limit',     type=int, help='Nombre max de fighters')
    parser.add_argument('--no-enrich', action='store_true', help='Sans détails profil (rapide)')
    parser.add_argument('--output',    default='fighters.json')
    args = parser.parse_args()

    session = requests.Session()
    session.headers['User-Agent'] = (
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 '
        '(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    )

    all_fighters = []
    print("Scraping ufcstats.com...")

    for letter in 'abcdefghijklmnopqrstuvwxyz':
        print(f"  {letter.upper()}...", end=' ', flush=True)
        batch = get_fighters_for_letter(letter, session)
        print(f"{len(batch)}")
        all_fighters.extend(batch)
        time.sleep(0.4)

        if args.limit and len(all_fighters) >= args.limit:
            all_fighters = all_fighters[:args.limit]
            break

    print(f"\n{len(all_fighters)} fighters récupérés")

    if not args.no_enrich:
        print("Enrichissement des profils (KO/Sub/Dec + photos)...")
        for i, f in enumerate(all_fighters):
            if i % 20 == 0:
                print(f"  {i}/{len(all_fighters)}", flush=True)
            enrich_fighter(f, session)
            time.sleep(0.25)
    else:
        for f in all_fighters:
            f.pop('_url', None)

    # Ajouter les drapeaux
    for f in all_fighters:
        if f.get('country'):
            f['country_flag'] = FLAG_MAP.get(f['country'])

    with open(args.output, 'w', encoding='utf-8') as fp:
        json.dump(all_fighters, fp, ensure_ascii=False, indent=2)

    print(f"\n✓ {args.output} — {len(all_fighters)} fighters")
    print("\nImporte dans Octagon Picks :")
    print("  Fighters > Import JSON > colle le contenu du fichier")

if __name__ == '__main__':
    main()
