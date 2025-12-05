import json
import re
import os

def parse_liste(filepath):
    accounts = {}
    classes = {}

    with open(filepath, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    current_class = None

    # Regex for Class headers
    class_re = re.compile(r'Classe\s+(\d+)\s*:\s*(.*)')
    # Regex for Accounts: Optional [link] + Number + Separator + Label
    # Examples:
    # [80]101 - Capital
    # 1011 - Capital souscrit
    # 1209 acomptes sur dividendes
    # Also handles bullets like * or +
    account_re = re.compile(r'^\s*(?:[\*\+]\s+)?(?:\[\d+\])?\s*(\d+)\s*[-–]?\s*(.*)$')

    for line in lines:
        line = line.strip()
        if not line:
            continue

        # Check Class
        class_match = class_re.match(line)
        if class_match:
            class_num = class_match.group(1)
            class_label = class_match.group(2).strip()
            classes[class_num] = class_label
            # Add class as a root account
            accounts[class_num] = {
                "id": class_num,
                "label": class_label,
                "description": "",
                "parent": None
            }
            continue

        # Check Account
        # Filter out lines that are just navigation markers like [96]
        if re.match(r'^\[\d+\]$', line):
            continue

        account_match = account_re.match(line)
        if account_match:
            acc_num = account_match.group(1)
            acc_label = account_match.group(2).strip()

            # Clean label (remove leading dashes if regex missed them)
            if acc_label.startswith('- '):
                acc_label = acc_label[2:]

            # Determine parent
            parent = None
            if len(acc_num) > 1:
                # Try to find parent by stripping last digit, recursively
                # But here we just store the ID, we can build tree later or dynamically
                # Standard logic: Parent is acc_num[:-1] usually, but sometimes structure skips
                # e.g. 10 -> 101.
                pass

            accounts[acc_num] = {
                "id": acc_num,
                "label": acc_label,
                "description": "",
                "parent": None # Will calculate later
            }

    return accounts, classes

def parse_definitions(folder):
    definitions = {}

    # Regex for definitions in fonc files
    # Pattern 1: Compte 502 « Actions propres »
    # Pattern 2: Comptes 503 « Actions » et 504 « Autres ... »
    # Pattern 3: 50. VALEURS MOBILIERES (Header style)

    # We will read the whole file string to handle multi-line definitions

    files = [f for f in os.listdir(folder) if f.startswith('fonc') and f.endswith('.txt')]

    for filename in files:
        with open(os.path.join(folder, filename), 'r', encoding='utf-8') as f:
            content = f.read()

        # Strategy: Split by "Compte" or Number Headers and associate text
        # This is tricky because the text format is free form.

        # Let's try to identify blocks starting with a number.
        # We look for lines starting with a number followed by dot or space?
        # Actually `fonc*.txt` has explicit headers like:
        # 50. VALEURS MOBILIERES ...
        # Compte 502 ...

        # Simple parser:
        # 1. Split content by lines.
        # 2. Iterate lines. If line looks like a header (Number + Title) or "Compte X", start recording text.

        lines = content.split('\n')
        current_nums = []
        current_text = []

        header_re = re.compile(r'^\s*(\d+)\.\s+(.*)$')
        compte_re = re.compile(r'^\s*Compte(?:s)?\s+([\d\set,]+)\s+«(.*)»')

        for line in lines:
            line_stripped = line.strip()
            if not line_stripped:
                # Empty line might preserve paragraph breaks if we are in a block
                if current_nums:
                    current_text.append("\n")
                continue

            # Check for "50. LABEL"
            match_header = header_re.match(line_stripped)
            if match_header:
                # Save previous
                if current_nums:
                    save_definition(definitions, current_nums, current_text)

                # Start new
                num = match_header.group(1)
                # This is a class or group definition
                current_nums = [num]
                current_text = [] # The label is usually in the header, the text follows
                continue

            # Check for "Compte 502 ..." or "Comptes 503 ... et 504 ..."
            match_compte = compte_re.match(line_stripped)
            if match_compte:
                if current_nums:
                    save_definition(definitions, current_nums, current_text)

                nums_str = match_compte.group(1)
                # Extract all numbers
                nums = re.findall(r'\d+', nums_str)
                current_nums = nums
                current_text = []
                continue

            # If not a header, append to current text
            if current_nums:
                current_text.append(line_stripped)

        # Save last block
        if current_nums:
            save_definition(definitions, current_nums, current_text)

    return definitions

def save_definition(defs, nums, text_list):
    # Join text and clean up
    text = " ".join(text_list).strip()
    # Remove multiple spaces and newlines
    text = re.sub(r'\s+', ' ', text)

    for n in nums:
        if n not in defs:
            defs[n] = text
        else:
            defs[n] += " " + text

def add_manual_class_8(accounts):
    # Based on "Caleb Gestion" and typical associative PCG 8
    class_8 = {
        "8": "Comptes spéciaux (Contributions bénévoles)",
        "86": "Emplois des contributions volontaires en nature",
        "861": "Secours en nature",
        "862": "Mise à disposition gratuite de biens",
        "864": "Personnel bénévole",
        "87": "Contributions volontaires en nature",
        "870": "Bénévolat",
        "871": "Prestations en nature",
        "875": "Dons en nature"
    }

    for num, label in class_8.items():
        accounts[num] = {
            "id": num,
            "label": label,
            "description": "Compte utilisé pour la valorisation du bénévolat et des dons en nature (Associations).",
            "parent": None
        }

def build_hierarchy(accounts):
    # Sort accounts by ID length and then ID
    sorted_ids = sorted(accounts.keys(), key=lambda x: (len(x), x))

    for acc_id in sorted_ids:
        # Determine parent
        # Parent is the substring -1 char, repeat until found
        # e.g. 1011 -> 101 -> 10 -> 1

        if len(acc_id) == 1:
            continue

        parent_found = None
        for i in range(1, len(acc_id)):
            candidate = acc_id[:-i]
            if candidate in accounts:
                parent_found = candidate
                break

        if parent_found:
            accounts[acc_id]['parent'] = parent_found

    return accounts

def inherit_definitions(accounts):
    # If description is empty, try to inherit from parent, but prepend "Voir definition du compte parent X"
    # Or as per instructions: "affiche la définition du compte parent ou de la classe"

    # First, populate descriptions from definitions dict if not already present
    # (Done in merge step, but here we assume accounts has descriptions)

    # We need to fill EMPTY descriptions
    for acc_id, data in accounts.items():
        if not data['description']:
            curr = data
            while curr['parent'] and not curr['description']:
                parent_id = curr['parent']
                if parent_id in accounts:
                    curr = accounts[parent_id]
                    if curr['description']:
                        data['description'] = f"(Définition héritée du compte {parent_id}) {curr['description']}"
                        break
                else:
                    break

            # If still empty (e.g. Class has no desc), set generic
            if not data['description']:
                data['description'] = "Aucune définition spécifique disponible dans le PCG."

def generate_example(account):
    acc_id = account['id']
    cls = acc_id[0]

    # Logic based on instructions
    # Class 1: Capitaux -> Crédit 101 / Débit 512
    # Class 2: Immo -> Débit 2xx / Crédit 404
    # Class 3: Stocks -> Débit 3xx / Crédit 603 (Variation) - Wait, Stock entries are usually Inventory (D) / Variation (C) at year end? Or 603 D / 3xx C for opening.
    #   Let's use: Constatation stock final: Débit 3xx / Crédit 603
    # Class 4: Tiers -> Débit 411 / Crédit 707 (Vente) OR Débit 6xx / Crédit 401 (Achat) depend on 40 vs 41
    # Class 5: Fi -> Débit 512 / Crédit 411
    # Class 6: Charges -> Débit 6xx / Crédit 401
    # Class 7: Produits -> Crédit 7xx / Débit 411
    # Class 8: Spécial -> Débit 86 / Crédit 87

    debit = ""
    credit = ""
    amount = "1000 €"

    if cls == '1':
        debit = "512 Banque"
        credit = f"{acc_id} {account['label']}"
        desc = "Apport ou augmentation de capital / réserve"
    elif cls == '2':
        debit = f"{acc_id} {account['label']}"
        credit = "404 Fournisseurs d'immobilisations"
        desc = "Acquisition d'immobilisation"
    elif cls == '3':
        debit = f"{acc_id} {account['label']}"
        # Variation account depends on stock type (31->6031, 35->7135)
        # Simplified logic:
        if acc_id.startswith('35') or acc_id.startswith('33') or acc_id.startswith('34'):
            credit = "713 Variation des stocks"
        else:
            credit = "603 Variation des stocks"
        desc = "Comptabilisation du stock final"
    elif cls == '4':
        if acc_id.startswith('40'):
            debit = "607 Achat de marchandises"
            credit = f"{acc_id} {account['label']}"
            desc = "Facture fournisseur"
        elif acc_id.startswith('41'):
            debit = f"{acc_id} {account['label']}"
            credit = "707 Vente de marchandises"
            desc = "Facture client"
        else:
            debit = f"{acc_id} {account['label']}"
            credit = "512 Banque"
            desc = "Règlement ou opération diverse"
    elif cls == '5':
        if acc_id.startswith('51'):
            debit = f"{acc_id} {account['label']}"
            credit = "411 Clients"
            desc = "Encaissement client"
        else:
            debit = "512 Banque"
            credit = f"{acc_id} {account['label']}"
            desc = "Cession VMP ou virement"
    elif cls == '6':
        debit = f"{acc_id} {account['label']}"
        credit = "401 Fournisseurs"
        desc = "Comptabilisation de la charge"
    elif cls == '7':
        debit = "411 Clients"
        credit = f"{acc_id} {account['label']}"
        desc = "Comptabilisation du produit"
    elif cls == '8':
        if acc_id.startswith('86'):
             debit = f"{acc_id} {account['label']}"
             credit = "870 Contributions volontaires"
             desc = "Emploi des contributions"
        else:
             debit = "860 Emplois contributions"
             credit = f"{acc_id} {account['label']}"
             desc = "Constatation des contributions"
    else:
        debit = "Divers"
        credit = f"{acc_id} {account['label']}"
        desc = "Opération diverse"

    return {
        "description": desc,
        "rows": [
            {"account": debit, "debit": amount, "credit": ""},
            {"account": credit, "debit": "", "credit": amount}
        ]
    }

def main():
    print("Parsing structure...")
    accounts, classes = parse_liste('raw_data/liste.txt')

    print("Parsing definitions...")
    definitions = parse_definitions('raw_data')

    print("Adding Manual Class 8...")
    add_manual_class_8(accounts)

    print("Merging data...")
    for acc_id, text in definitions.items():
        if acc_id in accounts:
            accounts[acc_id]['description'] = text
        else:
            # Sometimes definitions exist for accounts not in the list (rare, but possible if regex missed)
            # Or these are group definitions like "53. CAISSE" where 53 might be in list
            pass

    print("Building hierarchy...")
    accounts = build_hierarchy(accounts)

    print("Inheriting definitions...")
    inherit_definitions(accounts)

    print("Generating examples...")
    for acc_id in accounts:
        accounts[acc_id]['example'] = generate_example(accounts[acc_id])

    # Convert to list for easier JS handling or keep dict?
    # Tree structure is requested for UI.
    # Best to return a flat list with parent IDs, let JS build the tree (easier to search).
    # Or return a ready-made tree. Flat list is more versatile for search.

    final_data = list(accounts.values())

    # Sort by ID
    final_data.sort(key=lambda x: x['id'])

    print(f"Total accounts: {len(final_data)}")

    with open('db.json', 'w', encoding='utf-8') as f:
        json.dump(final_data, f, ensure_ascii=False, indent=2)

    print("Done. db.json created.")

if __name__ == '__main__':
    main()
