import pandas as pd
import gender_guesser.detector as gender
from duckduckgo_search import DDGS
import requests
from bs4 import BeautifulSoup
import time
import random
import re
import logging
import os

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

INPUT_FILE = "experts_comptables_paris.xlsx"
OUTPUT_FILE = "experts_comptables_paris_complete.xlsx"

# Initialize gender detector
d = gender.Detector()

COMMON_MALE_NAMES = {
    'jean', 'pierre', 'michel', 'philippe', 'alain', 'patrick', 'nicolas', 'christophe',
    'laurent', 'olivier', 'frederic', 'david', 'stephane', 'thomas', 'julien', 'sebastien',
    'guillaume', 'eric', 'bruno', 'thierry', 'vincent', 'pascal', 'marc', 'franck', 'cedric',
    'luc', 'antoine', 'maxime', 'jerome', 'arnaud', 'romain', 'mathieu', 'alexandre', 'benoit',
    'fabrice', 'denis', 'herve', 'didier', 'gilles', 'olivier', 'christian', 'yves', 'daniel',
    'gerard', 'bernard', 'francois', 'jacques', 'andre', 'claude', 'dominique', 'cyril', 'hugo'
}

COMMON_FEMALE_NAMES = {
    'marie', 'nathalie', 'isabelle', 'sylvie', 'catherine', 'sandrine', 'valerie', 'christine',
    'martine', 'sophie', 'celine', 'monique', 'aurelie', 'francoise', 'anne', 'stephanie',
    'chantal', 'nicole', 'beatrice', 'julie', 'virginie', 'karine', 'brigitte', 'corinne',
    'laurence', 'veronique', 'patricia', 'caroline', 'elodie', 'emilie', 'claire', 'helene',
    'laura', 'camille', 'sarah', 'audrey', 'chloe', 'lea', 'manon', 'emma', 'alice', 'charlotte'
}

def guess_gender_from_name(prenom):
    if not isinstance(prenom, str) or not prenom.strip():
        return "Monsieur" # Default fallback

    first_name = prenom.strip().split()[0].title()

    # Check common lists first (faster and safer for French specifics)
    lower_name = first_name.lower()
    if lower_name in COMMON_MALE_NAMES:
        return "Monsieur"
    if lower_name in COMMON_FEMALE_NAMES:
        return "Madame"

    # Use library
    g = d.get_gender(first_name)
    if g in ['male', 'mostly_male']:
        return "Monsieur"
    if g in ['female', 'mostly_female']:
        return "Madame"

    # Heuristics for unknown
    if g == 'andy':
        # Ambiguous. Claude, Dominique, Camille.
        # In French accounting (older demographic), often Male.
        # In younger, can be Female.
        # Default to Monsieur?
        if lower_name in ['camille', 'dominique', 'claude']:
            return "Monsieur" # Risk
        return "Monsieur"

    # Ending heuristic (weak but useful)
    if lower_name.endswith('a') or lower_name.endswith('e'):
         # Exceptions already covered by COMMON_MALE_NAMES hopefully
         return "Madame"

    return "Monsieur"

def find_info(cabinet, prenom, nom):
    """
    Searches for website and email.
    Returns (website, email)
    """
    query = f'"{cabinet}" "{prenom} {nom}" expert comptable Paris site officiel'
    website = None
    email = None

    try:
        # Search using DuckDuckGo
        with DDGS() as ddgs:
            results = list(ddgs.text(query, max_results=3))

        # Find website
        for r in results:
            url = r['href']
            title = r.get('title', '').lower()
            body = r.get('body', '').lower()

            # Exclude directories and junk
            if any(x in url for x in ['societe.com', 'pagesjaunes.fr', 'annuaire.experts-comptables.org',
                                      'linkedin.com', 'facebook.com', 'mappy.com', 'infogreffe.fr',
                                      'verif.com', 'pappers.fr', 'kompass.com',
                                      'reddit.com', 'tripadvisor', 'yelp', 'foursquare', 'trustpilot',
                                      'indeed', 'glassdoor', 'monster', 'jobijoba', 'meteojob',
                                      'twitter.com', 'instagram.com', 'youtube.com', 'tiktok.com',
                                      'pinterest.com', 'tumblr.com', 'wikipedia.org', 'amazon',
                                      'ebay', 'cdiscount', 'fnac', 'darty', 'boulanger', 'apple.com',
                                      'microsoft.com', 'google.com', 'bing.com', 'yahoo.com', 'orange.fr',
                                      'sfr.fr', 'free.fr', 'bouyguestelecom.fr', 'lemonde.fr', 'lefigaro.fr',
                                      'liberation.fr', '20minutes.fr', 'leparisien.fr', 'datalounge.com',
                                      'forum', 'discussion', 'fandom.com', 'coinmarketcap.com', 'merriam-webster.com',
                                      'daytonrealtors.org', 'zhihu.com', 'quora.com', 'stackoverflow.com',
                                      'github.com']):
                continue

            # Verify Relevance: title or body must contain cabinet name or person name
            # Normalize for comparison
            # Remove generic terms
            ignore_terms = ['expert', 'experte', 'experts', 'comptable', 'comptables',
                            'audit', 'conseil', 'conseils', 'fiduciaire', 'cabinet',
                            'groupe', 'societe', 'entreprise', 'expertise', 'comptabilite',
                            'gestion', 'finance', 'juridique', 'social', 'fiscal',
                            'partenaires', 'associés', 'associes', 'consulting', 'consultant']
            cab_norm = str(cabinet).lower()
            for term in ignore_terms:
                cab_norm = cab_norm.replace(term, '')
            cab_norm = cab_norm.strip()
            # If nothing left, revert to original (e.g. if name is just "Fiduciaire Paris")
            if not cab_norm:
                cab_norm = str(cabinet).lower()

            name_norm = f"{str(prenom).lower()} {str(nom).lower()}"
            last_name_norm = str(nom).lower()

            is_relevant = False

            # Strict check for short cabinet names
            if len(cab_norm) <= 4:
                # Must find exact cabinet name as a word
                # Use regex for word boundaries
                try:
                    pattern = r'\b' + re.escape(cab_norm) + r'\b'
                    if re.search(pattern, title) or re.search(pattern, body):
                        is_relevant = True
                except:
                    if cab_norm in title or cab_norm in body:
                        is_relevant = True
            else:
                # Longer names: require parts
                cab_parts = cab_norm.split()
                if not cab_parts:
                     # If generic terms were removed and nothing left, use original cabinet name minus generics if possible or just use original
                     cab_parts = str(cabinet).lower().split()

                matches = sum(1 for p in cab_parts if p in title or p in body)
                if matches >= len(cab_parts) / 2:
                    is_relevant = True

            # Also accept if full person name is found + 'expert' or 'comptable'
            if not is_relevant:
                if name_norm in title or name_norm in body:
                    if 'expert' in title or 'comptable' in title or 'expert' in body or 'comptable' in body:
                        is_relevant = True

            if not is_relevant:
                logging.info(f"Skipping irrelevant result: {url} (Title: {title})")
                continue

            # Prioritize clean domains
            if not website:
                website = url

            # Look for email in snippets
            body = r.get('body', '')
            found_emails = re.findall(r'[\w\.-]+@[\w\.-]+\.\w+', body)
            if found_emails and not email:
                # Validate email structure
                for e in found_emails:
                    if not any(x in e for x in ['.png', '.jpg', '.jpeg', '.gif', 'example.com']):
                        email = e
                        break

        # If website found but no email, try to scrape website
        if website and not email:
            try:
                headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'}
                resp = requests.get(website, headers=headers, timeout=5)
                if resp.status_code == 200:
                    soup = BeautifulSoup(resp.text, 'html.parser')

                    # Look for mailto
                    mailtos = soup.select('a[href^=mailto]')
                    for m in mailtos:
                        href = m.get('href')
                        if href:
                            addr = href.replace('mailto:', '').split('?')[0]
                            if '@' in addr:
                                email = addr
                                break

                    # Look in text if no mailto
                    if not email:
                        text_content = soup.get_text()
                        found_emails = re.findall(r'[\w\.-]+@[\w\.-]+\.\w+', text_content)
                        for e in found_emails:
                             if not any(x in e for x in ['.png', '.jpg', '.jpeg', '.gif', 'example.com', '.js', '.css']):
                                email = e
                                break

                    # If still no email, check for contact page link
                    if not email:
                        contact_links = soup.find_all('a', href=True)
                        for link in contact_links:
                            if 'contact' in link.text.lower() or 'contact' in link['href'].lower():
                                contact_url = link['href']
                                if not contact_url.startswith('http'):
                                    if contact_url.startswith('/'):
                                        contact_url = website.rstrip('/') + contact_url
                                    else:
                                        contact_url = website.rstrip('/') + '/' + contact_url.lstrip('/')

                                try:
                                    c_resp = requests.get(contact_url, headers=headers, timeout=5)
                                    c_soup = BeautifulSoup(c_resp.text, 'html.parser')
                                    # Look for mailto
                                    c_mailtos = c_soup.select('a[href^=mailto]')
                                    for cm in c_mailtos:
                                         href = cm.get('href')
                                         if href:
                                             addr = href.replace('mailto:', '').split('?')[0]
                                             if '@' in addr:
                                                 email = addr
                                                 break
                                    if not email:
                                         text_content = c_soup.get_text()
                                         found_emails = re.findall(r'[\w\.-]+@[\w\.-]+\.\w+', text_content)
                                         for e in found_emails:
                                              if not any(x in e for x in ['.png', '.jpg', '.jpeg', '.gif', 'example.com', '.js', '.css']):
                                                  email = e
                                                  break
                                except:
                                    pass
                                break
            except Exception as e:
                logging.warning(f"Error scraping {website}: {e}")

    except Exception as e:
        logging.error(f"Error searching for {cabinet}: {e}")

    return website, email

def main():
    if os.path.exists(OUTPUT_FILE):
        logging.info(f"Resuming from {OUTPUT_FILE}")
        df = pd.read_excel(OUTPUT_FILE)
    elif os.path.exists(INPUT_FILE):
        logging.info(f"Starting from {INPUT_FILE}")
        df = pd.read_excel(INPUT_FILE)
    else:
        logging.error("No input file found.")
        return

    # Add columns if missing and ensure object type to hold strings
    for col in ["Madame/Monsieur", "Site internet", "Mail", "Nom du métier"]:
        if col not in df.columns:
            df[col] = ""
        else:
            df[col] = df[col].astype(object)

    logging.info(f"Loaded {len(df)} rows.")

    # 1. Normalize Gender and Update Job Title
    logging.info("Normalizing gender and job titles...")
    for idx, row in df.iterrows():
        # Update Gender
        current_gender = row.get('Madame/Monsieur', '')
        prenom = row.get('Prenom', '')

        # Normalize existing
        if pd.notna(current_gender):
            current_gender_str = str(current_gender).strip().lower()
            if current_gender_str in ['m', 'm.', 'monsieur']:
                 df.at[idx, 'Madame/Monsieur'] = "Monsieur"
            elif current_gender_str in ['mme', 'mme.', 'madame']:
                 df.at[idx, 'Madame/Monsieur'] = "Madame"
            else:
                 # Guess if missing or unknown
                 df.at[idx, 'Madame/Monsieur'] = guess_gender_from_name(prenom)
        else:
            df.at[idx, 'Madame/Monsieur'] = guess_gender_from_name(prenom)

        # Update Job Title based on newly set gender
        final_gender = df.at[idx, 'Madame/Monsieur']
        if final_gender == 'Madame':
             metier = str(row.get('Nom du métier', ''))
             if 'Expert' in metier and 'Experte' not in metier:
                 df.at[idx, 'Nom du métier'] = metier.replace('Expert', 'Experte')
             elif metier == 'nan':
                 df.at[idx, 'Nom du métier'] = 'Experte-comptable'
        else:
             # Ensure Male title
             metier = str(row.get('Nom du métier', ''))
             if 'Experte' in metier:
                 df.at[idx, 'Nom du métier'] = metier.replace('Experte', 'Expert')
             elif metier == 'nan':
                 df.at[idx, 'Nom du métier'] = 'Expert-comptable'

    # Save after normalization
    df.to_excel(OUTPUT_FILE, index=False)
    logging.info(f"Saved normalized data to {OUTPUT_FILE}")

    # 2. Enrich missing Site and Mail
    logging.info("Enriching missing website and email...")

    updates_count = 0

    for idx, row in df.iterrows():
        cabinet = row.get('Nom du cabinet', '')
        prenom = row.get('Prenom', '')
        nom = row.get('Nom de la personne en maj', '')
        site = row.get('Site internet', '')
        mail = row.get('Mail', '')

        # Check if we need to search
        need_search = False
        if pd.isna(site) or str(site).strip() == '' or str(site) == 'nan':
            need_search = True
        if pd.isna(mail) or str(mail).strip() == '' or str(mail) == 'nan':
            need_search = True

        if need_search:
            # Skip if cabinet name is missing or invalid
            if pd.isna(cabinet) or str(cabinet).strip() == '' or str(cabinet) == 'nan':
                continue

            logging.info(f"Processing {idx+1}/{len(df)}: {cabinet}")

            found_site, found_email = find_info(cabinet, prenom, nom)

            updated = False
            if (pd.isna(site) or str(site).strip() == '') and found_site:
                df.at[idx, 'Site internet'] = found_site
                logging.info(f"  -> Found site: {found_site}")
                updated = True

            if (pd.isna(mail) or str(mail).strip() == '') and found_email:
                df.at[idx, 'Mail'] = found_email
                logging.info(f"  -> Found email: {found_email}")
                updated = True

            if updated:
                updates_count += 1
                if updates_count % 2 == 0:
                    df.to_excel(OUTPUT_FILE, index=False)
                    logging.info(f"Saved progress to {OUTPUT_FILE}")

            # Sleep to be polite
            time.sleep(random.uniform(2, 4))

    # Final Save
    df.to_excel(OUTPUT_FILE, index=False)
    logging.info(f"Done. Saved to {OUTPUT_FILE}")

if __name__ == "__main__":
    main()
