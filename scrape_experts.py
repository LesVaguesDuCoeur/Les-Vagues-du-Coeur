import requests
from bs4 import BeautifulSoup
import pandas as pd
import time
import json
import re
from concurrent.futures import ThreadPoolExecutor, as_completed

# Configuration
BASE_URL = "https://annuaire.experts-comptables.org"
SEARCH_URL_TEMPLATE = "https://annuaire.experts-comptables.org/recherche/{page}?localite=Paris&adresse=&insee=75056&type_localite=municipality&localityLat=48.859&localityLon=2.347&comptable=&type_cabinet=SEC,%20SUCCURSALE&langue=&departmentCode=&radius=&seed=74349"
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
}
LIMIT_PAGES = 406  # Set to 1 or 2 for testing
MAX_WORKERS = 5   # Number of concurrent threads for detail fetching

def get_soup(url):
    try:
        time.sleep(0.5) # Be polite
        response = requests.get(url, headers=HEADERS, timeout=30)
        response.raise_for_status()
        return BeautifulSoup(response.text, 'html.parser')
    except Exception as e:
        print(f"Error fetching {url}: {e}")
        return None

def parse_contact_name(full_name):
    """
    Parses 'LASTNAME Firstname' into (Last Name, First Name).
    """
    if not full_name:
        return "", ""
    parts = full_name.split()
    last_name_parts = []
    first_name_parts = []

    for part in parts:
        if part.isupper():
            last_name_parts.append(part)
        else:
            first_name_parts.append(part)

    return " ".join(last_name_parts), " ".join(first_name_parts)

def scrape_detail_page(firm_url):
    """
    Fetches detail page and extracts: full address, phone, website.
    Returns a dict.
    """
    data = {
        "address_street": "",
        "cp": "",
        "city": "",
        "phone": "",
        "website": "",
        "email": ""
    }

    soup = get_soup(firm_url)
    if not soup:
        return data

    # 1. Extract JSON-LD for address and phone
    try:
        json_lds = soup.find_all('script', type='application/ld+json')
        for json_ld in json_lds:
            if not json_ld.string:
                continue

            try:
                ld_data = json.loads(json_ld.string)
            except json.JSONDecodeError:
                continue

            # It might be a list or a dict
            if isinstance(ld_data, list):
                ld_data = ld_data[0] # Take first item if list

            # Check if this is the correct schema (has address or telephone)
            if 'telephone' in ld_data or 'address' in ld_data:
                # Found the right block

                # Address
                address = ld_data.get('address', {})
                if isinstance(address, dict):
                    data["address_street"] = address.get('streetAddress', '')
                    data["cp"] = address.get('postalCode', '')
                    data["city"] = address.get('addressLocality', '')

                # Phone
                data["phone"] = ld_data.get('telephone', '')

                # Website
                same_as = ld_data.get('sameAs')
                if same_as:
                    if isinstance(same_as, list):
                        for link in same_as:
                            if "experts-comptables.org" not in link:
                                data["website"] = link
                                break
                    elif isinstance(same_as, str) and "experts-comptables.org" not in same_as:
                        data["website"] = same_as

                break # Stop after finding the firm data

    except Exception as e:
        print(f"Error parsing JSON-LD in {firm_url}: {e}")

    # 2. Fallback for Phone (if JSON-LD missed it)
    if not data["phone"]:
        phone_link = soup.find('a', href=re.compile(r'^tel:'))
        if phone_link:
            data["phone"] = phone_link['href'].replace('tel:', '').strip()

    # 3. Fallback / Additional check for website link in HTML
    if not data["website"]:
        # Check for explicit website link class or text
        # Common pattern: <a href="..." target="_blank">Site internet</a>
        website_link = soup.find('a', string=re.compile(r'Site internet|Visiter le site', re.I))
        if website_link:
            data["website"] = website_link['href']

    # 4. Check for Email (rarely visible, but check mailto)
    if not data["email"]:
        mailto = soup.find('a', href=re.compile(r'^mailto:'))
        if mailto:
            data["email"] = mailto['href'].replace('mailto:', '')

    return data

def scrape_list_page(page_num):
    url = SEARCH_URL_TEMPLATE.format(page=page_num)
    print(f"Scraping page {page_num}: {url}")
    soup = get_soup(url)
    if not soup:
        return []

    firms = []
    firm_blocks = soup.select('.profil-block.firm')

    for block in firm_blocks:
        firm_data = {}

        # Name
        name_container = block.find('h3', class_='name')
        if not name_container:
            name_container = block.find('div', class_='name')

        if name_container:
            name_link = name_container.find('a')
            if name_link:
                # Extract Firm Name (text node before span)
                # Structure: <a ...> NAME <span ...>TYPE</span> </a>
                # The text is usually the first element in contents, or mixed.
                # Use .contents to get nodes.

                # Default
                firm_data['nom_cabinet'] = name_link.get_text(strip=True)

                type_span = name_link.find('span', class_='name-type')
                if type_span:
                    firm_data['nom_metier'] = type_span.get_text(strip=True)

                    # If span exists, firm name is the text content excluding the span
                    # We can get it by iterating contents
                    text_parts = []
                    for content in name_link.contents:
                        if content.name != 'span':
                            text_parts.append(str(content).strip())
                    firm_data['nom_cabinet'] = " ".join(filter(None, text_parts))
                else:
                    firm_data['nom_metier'] = "Expert-comptable"
            else:
                continue # No link found
        else:
            continue # Skip if no name container

        # Link to detail
        link_tag = block.find('a', href=True)
        if link_tag:
            firm_data['detail_url'] = BASE_URL + link_tag['href']

        # Contact Person
        competence_div = block.find('div', class_='competence')
        if competence_div:
            full_name = competence_div.get_text(strip=True)
            last, first = parse_contact_name(full_name)
            firm_data['nom_personne'] = last
            firm_data['prenom_personne'] = first
        else:
            firm_data['nom_personne'] = ""
            firm_data['prenom_personne'] = ""

        # Check for phone button data-id just in case
        phone_btn = block.find(class_='firm-phone')
        if phone_btn and 'data-id' in phone_btn.attrs:
            firm_data['data_id'] = phone_btn['data-id']

        firms.append(firm_data)

    return firms

def main():
    all_firms = []

    # 1. Scrape List Pages
    for page in range(1, LIMIT_PAGES + 1):
        firms = scrape_list_page(page)
        if not firms:
            break

        # Fetch details concurrently for this batch
        with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
            future_to_firm = {executor.submit(scrape_detail_page, firm['detail_url']): firm for firm in firms if 'detail_url' in firm}

            for future in as_completed(future_to_firm):
                firm = future_to_firm[future]
                try:
                    details = future.result()
                    firm.update(details)
                except Exception as e:
                    print(f"Error scraping details for {firm.get('nom_cabinet')}: {e}")

        all_firms.extend(firms)
        # Optional: Save partial progress
        # if page % 10 == 0:
        #     print(f"Processed {page} pages...")

    # 2. Create DataFrame
    df = pd.DataFrame(all_firms)

    # 3. Deduplicate by phone
    # User said: "enleve les doublons et ceux qui ont le meme numéro"
    if 'phone' in df.columns and not df.empty:
        initial_count = len(df)
        print(f"Total firms found before deduplication: {initial_count}")

        # Split into with phone and without phone
        df_with_phone = df[df['phone'] != '']
        df_no_phone = df[df['phone'] == '']

        # Deduplicate those with phone
        df_with_phone = df_with_phone.drop_duplicates(subset=['phone'], keep='first')

        # Combine back
        df = pd.concat([df_with_phone, df_no_phone], ignore_index=True)
        print(f"Firms after removing duplicate phones: {len(df)}")

    # 4. Format Columns
    # Target columns:
    # appelé (case a coché), mail envoyé (case a coché), nom du capbinet, adresse, cp, ville,
    # madame/monsieur, nom du métier (l'Experte-comptable), nom de la personne en maj, prenom,
    # numero de téléphone, mail, site internet

    output_columns = [
        "Appelé", "Mail envoyé", "Nom du cabinet", "Adresse", "CP", "Ville",
        "Madame/Monsieur", "Nom du métier", "Nom de la personne", "Prenom",
        "Téléphone", "Mail", "Site internet"
    ]

    # Map data to columns
    final_data = []
    for _, row in df.iterrows():
        item = {
            "Appelé": "[ ]",
            "Mail envoyé": "[ ]",
            "Nom du cabinet": row.get('nom_cabinet', ''),
            "Adresse": row.get('address_street', ''),
            "CP": row.get('cp', ''),
            "Ville": row.get('city', ''),
            "Madame/Monsieur": "", # Placeholder
            "Nom du métier": row.get('nom_metier', 'Expert-comptable'),
            "Nom de la personne": row.get('nom_personne', ''),
            "Prenom": row.get('prenom_personne', ''),
            "Téléphone": row.get('phone', ''),
            "Mail": row.get('email', ''),
            "Site internet": row.get('website', '')
        }
        final_data.append(item)

    final_df = pd.DataFrame(final_data)

    # Save to Excel
    output_file = "experts_comptables_paris.xlsx"
    final_df.to_excel(output_file, index=False)
    print(f"Saved {len(final_df)} firms to {output_file}")

if __name__ == "__main__":
    main()
