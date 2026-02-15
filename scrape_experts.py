import requests
from bs4 import BeautifulSoup
import pandas as pd
import json
import concurrent.futures
import time
import re
import sys
import logging
from urllib.parse import urlparse, parse_qs, urlencode, urlunparse

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

BASE_URL = "https://annuaire.experts-comptables.org"
# The initial search URL provided by the user
INITIAL_SEARCH_URL = "https://annuaire.experts-comptables.org/recherche?localite=Paris&adresse=&insee=75056&type_localite=municipality&localityLat=48.859&localityLon=2.347&comptable=&type_cabinet=SEC,%20SUCCURSALE&langue=&departmentCode=&radius=&seed=74349"

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
}

def get_page_url(page_num):
    if page_num == 1:
        return INITIAL_SEARCH_URL

    # Construct URL for page > 1
    # Pattern: /recherche/{page_num}?query_params
    parsed = urlparse(INITIAL_SEARCH_URL)
    path = parsed.path # /recherche
    if path.endswith('/'):
        path = path[:-1]

    new_path = f"{path}/{page_num}"

    # Reconstruct
    return urlunparse((parsed.scheme, parsed.netloc, new_path, parsed.params, parsed.query, parsed.fragment))

def get_soup(url, session):
    try:
        response = session.get(url, headers=HEADERS, timeout=10)
        response.raise_for_status()
        return BeautifulSoup(response.text, 'html.parser')
    except Exception as e:
        logging.error(f"Error fetching {url}: {e}")
        return None

def parse_detail_page(url, session):
    # logging.info(f"Parsing {url}")
    soup = get_soup(url, session)
    if not soup:
        return None

    data = {
        "Appelé": "[ ]",
        "Mail envoyé": "[ ]",
        "Nom du cabinet": "",
        "Adresse": "",
        "CP": "",
        "Ville": "",
        "Madame/Monsieur": "",
        "Nom du métier": "Expert-comptable",
        "Nom de la personne en maj": "",
        "Prenom": "",
        "Numéro de téléphone": "",
        "Mail": "",
        "Site internet": ""
    }

    # JSON-LD extraction
    scripts = soup.find_all('script', type='application/ld+json')
    json_data = {}
    for script in scripts:
        if not script.string: continue
        try:
            temp_data = json.loads(script.string)
            # Check for correct type
            # Note: Sometimes it's a list or nested
            if isinstance(temp_data, list):
                for item in temp_data:
                    if item.get('@type') in ['Cabinet d’expertise-comptable', 'AccountingService']:
                        json_data = item
                        break
            elif isinstance(temp_data, dict):
                 if temp_data.get('@type') in ['Cabinet d’expertise-comptable', 'AccountingService']:
                        json_data = temp_data

            if json_data: break
        except:
            continue

    if json_data:
        data["Nom du cabinet"] = json_data.get("name", "")
        address = json_data.get("address", {})
        if isinstance(address, dict):
            data["Adresse"] = address.get("streetAddress", "")
            data["CP"] = address.get("postalCode", "")
            data["Ville"] = address.get("addressLocality", "")
        data["Numéro de téléphone"] = json_data.get("telephone", "")
        if "email" in json_data:
            data["Mail"] = json_data["email"]
        # data["Site internet"] = json_data.get("url", "") # Often points to directory page

    # Fallback to HTML if needed
    if not data["Nom du cabinet"]:
        h1 = soup.find('h1')
        if h1:
            data["Nom du cabinet"] = h1.get_text(strip=True)

    if not data["Adresse"]:
         # Try to find address in HTML
         # Look for .panel-addr or specific icon
         addr_div = soup.find('div', class_='panel-addr')
         if addr_div:
             text = addr_div.get_text(separator="\n", strip=True)
             lines = text.split('\n')
             # Usually lines are: Street, CP City
             if len(lines) >= 2:
                 data["Adresse"] = lines[0]
                 # Parse last line for CP City
                 match = re.search(r'(\d{5})\s+(.*)', lines[-1])
                 if match:
                     data["CP"] = match.group(1)
                     data["Ville"] = match.group(2)
                 else:
                     data["Ville"] = lines[-1]

    # Phone fallback
    if not data["Numéro de téléphone"]:
        # Try to find .firm-phone data-id? No, usually not helpful without JS.
        # Check text?
        pass

    # Extract Person
    people_div = soup.find(class_='people-list')
    if people_div:
        # Loop through people? User said: "s'il en a plusieurs prend que la personne associés/présidente"
        # Since we can't distinguish roles easily (unless text says so), we take the first one.
        # Or check if any have a specific title.

        person_items = people_div.find_all(class_='d-flex')
        selected_person = None

        for p in person_items:
            # Check text for "Associé" or "Président"
            text = p.get_text(strip=True).lower()
            if 'associé' in text or 'président' in text or 'gérant' in text:
                selected_person = p
                break

        if not selected_person and person_items:
            selected_person = person_items[0]

        if selected_person:
            info = selected_person.find(class_='info')
            if info:
                # Name is usually in spans: UPPERCASE LASTNAME, Titlecase Firstname
                spans = info.find_all('span')
                names = [s.get_text(strip=True) for s in spans]
                # Filter out empty strings
                names = [n for n in names if n]

                if len(names) >= 2:
                    # Heuristic: Uppercase is usually Last Name
                    if names[0].isupper():
                        data["Nom de la personne en maj"] = names[0]
                        data["Prenom"] = names[1].title()
                    else:
                        data["Nom de la personne en maj"] = names[0].upper()
                        data["Prenom"] = names[1].title()
                elif len(names) == 1:
                    data["Nom de la personne en maj"] = names[0].upper()

    # Determine Madame/Monsieur
    if data["Prenom"]:
        # Very basic check
        first_name_lower = data["Prenom"].lower()
        # Common French female names endings (heuristic, not perfect)
        if first_name_lower in ['julie', 'marie', 'sophie', 'isabelle', 'nathalie', 'sandrine', 'valérie', 'céline', 'aurélie', 'christine']:
             data["Madame/Monsieur"] = "Mme"
        elif first_name_lower in ['jean', 'pierre', 'michel', 'philippe', 'alain', 'patrick', 'nicolas', 'christophe', 'laurent', 'olivier']:
             data["Madame/Monsieur"] = "M."
        else:
             # Default or leave blank? User asked for column.
             # Maybe leave blank for manual fill.
             pass

    # Site Internet
    # Look for External Link
    # Sometimes it's in a button "Site internet"
    website_link = soup.find('a', string=re.compile('Site internet', re.I))
    if website_link:
        data["Site internet"] = website_link.get('href', '')

    if not data["Site internet"]:
        # Look for other links in the contact/aside area
        aside = soup.find(class_='-aside')
        if aside:
            links = aside.find_all('a', href=True)
            for link in links:
                href = link['href']
                if href.startswith('http') and 'annuaire.experts-comptables.org' not in href and 'experts-comptables.fr' not in href and 'google.com/maps' not in href:
                     if 'facebook' not in href and 'linkedin' not in href and 'twitter' not in href:
                         data["Site internet"] = href
                         break

    return data

def scrape_search_page_links(page_num, session):
    url = get_page_url(page_num)
    soup = get_soup(url, session)
    if not soup:
        return []

    links = []
    # Items
    items = soup.find_all('h3', class_='name')
    for item in items:
        a = item.find('a', href=True)
        if a:
            links.append(BASE_URL + a['href'])
    return links

def main():
    max_pages = 406
    start_page = 1
    # Allow override via args
    if len(sys.argv) > 1:
        max_pages = int(sys.argv[1])
    if len(sys.argv) > 2:
        start_page = int(sys.argv[2])

    logging.info(f"Starting scrape for {max_pages} pages starting from {start_page}...")

    all_rows = []
    seen_phones = set()

    session = requests.Session()

    with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
        for page in range(start_page, max_pages + 1):
            logging.info(f"Processing page {page}/{max_pages}")
            links = scrape_search_page_links(page, session)
            if not links:
                logging.warning(f"No links found on page {page}. Ending.")
                break

            # Submit detail parsing tasks
            future_to_url = {executor.submit(parse_detail_page, url, session): url for url in links}

            for future in concurrent.futures.as_completed(future_to_url):
                url = future_to_url[future]
                try:
                    data = future.result()
                    if data:
                        phone = data.get("Numéro de téléphone")
                        if phone:
                            # Normalize phone?
                            # Just check exact match for now
                            if phone in seen_phones:
                                continue
                            seen_phones.add(phone)

                        all_rows.append(data)
                except Exception as e:
                    logging.error(f"Failed to process {url}: {e}")

            # Save partial every 5 pages
            if page % 5 == 0:
                logging.info(f"Saving partial results... ({len(all_rows)} rows)")
                save_excel(all_rows, "experts_comptables_paris_partial.xlsx")

            time.sleep(0.5) # Polite delay

    logging.info("Scraping complete.")
    save_excel(all_rows, "experts_comptables_paris.xlsx")

def save_excel(data, filename):
    if not data:
        return
    df = pd.DataFrame(data)
    # Ensure column order
    cols = ["Appelé", "Mail envoyé", "Nom du cabinet", "Adresse", "CP", "Ville", "Madame/Monsieur", "Nom du métier", "Nom de la personne en maj", "Prenom", "Numéro de téléphone", "Mail", "Site internet"]

    # Add missing cols
    for c in cols:
        if c not in df.columns:
            df[c] = ""

    df = df[cols]
    df.to_excel(filename, index=False)
    logging.info(f"Saved to {filename}")

if __name__ == "__main__":
    main()
