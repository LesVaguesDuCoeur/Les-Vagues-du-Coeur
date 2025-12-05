import json
import re
import os

def parse_liste(filepath):
    accounts = {}
    classes = {}

    with open(filepath, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    class_re = re.compile(r'Classe\s+(\d+)\s*:\s*(.*)')
    # Updated regex to handle bullets, brackets, etc.
    # Group 1: Number
    # Group 2: Label
    # Enforce separator [-–] to avoid matching line continuations like "213)"
    account_re = re.compile(r'^\s*(?:[\*\+]\s+)?(?:\[\d+\])?\s*(\d+)\s*[-–]\s*(.*)$')

    for line_idx, line in enumerate(lines):
        line = line.strip()
        if not line:
            continue

        # Check Class
        class_match = class_re.match(line)
        if class_match:
            class_num = class_match.group(1)
            class_label = class_match.group(2).strip()
            classes[class_num] = class_label
            accounts[class_num] = {
                "id": class_num,
                "label": class_label,
                "description": "",
                "parent": None
            }
            continue

        # Filter purely navigation lines like [96]
        if re.match(r'^\[\d+\]$', line):
            continue

        account_match = account_re.match(line)
        if account_match:
            acc_num = account_match.group(1)
            acc_label = account_match.group(2).strip()

            # Clean label (remove leading dashes if regex missed them)
            # Regex should handle it with [-–]? but sometimes it's space dash space
            if acc_label.startswith('- '):
                acc_label = acc_label[2:]
            if acc_label.startswith('– '):
                acc_label = acc_label[2:]

            accounts[acc_num] = {
                "id": acc_num,
                "label": acc_label,
                "description": "",
                "parent": None
            }

    return accounts, classes

def parse_definitions(folder):
    definitions = {} # acc_id -> text

    files = [f for f in os.listdir(folder) if f.startswith('fonc') and f.endswith('.txt')]

    header_re = re.compile(r'^\s*(\d+)\.\s+(.*)$')
    compte_re = re.compile(r'^\s*Compte(?:s)?\s+([\d\set,]+)\s+«(.*)»')

    def add_text(acc, txt):
        if not txt.strip(): return
        if acc not in definitions: definitions[acc] = ""

        # Deduplication: Check if text is already present
        # Normalize whitespace for comparison
        clean_txt = txt.strip()
        if clean_txt in definitions[acc]:
            return

        definitions[acc] += clean_txt + "\n\n"

    for filename in files:
        with open(os.path.join(folder, filename), 'r', encoding='utf-8') as f:
            content = f.read()

        lines = content.split('\n')
        current_nums = []
        current_text_lines = []

        def process_block(nums, lines):
            if not nums or not lines: return

            full_text = "\n".join(lines)
            # Split into paragraphs
            paragraphs = re.split(r'\n\s*\n', full_text)

            for p in paragraphs:
                p = p.strip()
                # Remove excessive whitespace within paragraph
                p = re.sub(r'\s+', ' ', p)
                if not p: continue

                # Check for mentions
                # Regex to find "compte X" or "comptes X et Y"
                mentions = re.findall(r'(?:compte[s]?)\s+((?:\d+(?:[\s,]+(?:et|ou)?[\s,]+)?)+)', p, re.IGNORECASE)

                extracted_ids = set()
                for m in mentions:
                    found = re.findall(r'\d+', m)
                    extracted_ids.update(found)

                # Context Rule: Only add to accounts that match the Class of the current block header
                # usage: if current_nums is [101] (Class 1), only accept eids starting with 1.
                # If current_nums is [26], only accept eids starting with 2.

                # Determine block context class
                context_class = None
                if nums:
                    context_class = nums[0][0] # First digit of first header number

                if extracted_ids:
                    # Paragraph is specific
                    for eid in extracted_ids:
                        # Apply Context Rule
                        # If the mentioned account is in the same class as the header, it's likely a definition.
                        # If it's a different class, it's likely a counterparty reference (e.g. "Credited by debit of 401").
                        # We want to keep definitions clean.
                        if context_class and eid.startswith(context_class):
                            add_text(eid, p)

                    # Also add to block header IF block header is mentioned OR if it is a general statement?
                    # If specific sub-accounts are mentioned, we usually DON'T want to pollute the header.
                    # UNLESS the header IS one of the extracted IDs.
                    for h in nums:
                        if h in extracted_ids:
                            add_text(h, p)
                else:
                    # Paragraph is general (no specific account mentioned)
                    # Assign to all current_nums (headers)
                    for h in nums:
                        add_text(h, p)

        for line in lines:
            line_stripped = line.strip()

            # Header match "10. CAPITAL"
            match_header = header_re.match(line_stripped)
            if match_header:
                process_block(current_nums, current_text_lines)
                current_nums = [match_header.group(1)]
                current_text_lines = []
                continue

            # Compte match "Le compte 101"
            match_compte = compte_re.match(line_stripped)
            if match_compte:
                process_block(current_nums, current_text_lines)
                nums_str = match_compte.group(1)
                current_nums = re.findall(r'\d+', nums_str)
                current_text_lines = []
                continue

            if current_nums:
                current_text_lines.append(line_stripped)

        # End of file
        process_block(current_nums, current_text_lines)

    return definitions

def add_manual_class_8(accounts):
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
        if num not in accounts:
            accounts[num] = {
                "id": num,
                "label": label,
                "description": "Compte utilisé pour la valorisation du bénévolat et des dons en nature (Associations).",
                "parent": None
            }

def build_hierarchy(accounts):
    sorted_ids = sorted(accounts.keys(), key=lambda x: (len(x), x))
    for acc_id in sorted_ids:
        if len(acc_id) == 1: continue
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
    # Only inherit if description is empty
    for acc_id, data in accounts.items():
        if not data['description']:
            curr = data
            while curr['parent'] and not curr['description']:
                parent_id = curr['parent']
                if parent_id in accounts:
                    curr = accounts[parent_id]
                    if curr['description']:
                        # Use a visual marker for inheritance
                        data['description'] = f"(Définition générale héritée du compte {parent_id})\n\n{curr['description']}"
                        break
                else:
                    break

            if not data['description']:
                data['description'] = "Aucune définition spécifique disponible dans le PCG."

def generate_example(account):
    acc_id = account['id']
    label = account['label']
    cls = acc_id[0]

    debit = "Divers"
    credit = "Divers"
    amount = "1000 €"
    desc = "Opération courante"

    # Heuristics based on Class and Subclass

    if cls == '1': # Capitaux
        if acc_id.startswith('101'): # Capital
            debit = "456 Associés - opérations sur le capital"
            credit = f"{acc_id} {label}"
            desc = "Souscription de capital social"
        elif acc_id.startswith('106'): # Réserves
            debit = "120 Résultat de l'exercice (bénéfice)"
            credit = f"{acc_id} {label}"
            desc = "Affectation du résultat en réserves"
        elif acc_id.startswith('12'): # Résultat
            if 'perte' in label.lower() or 'déficit' in label.lower():
                 debit = f"{acc_id} {label}"
                 credit = "120 Résultat de l'exercice" # Simplification
                 desc = "Constatation de la perte"
            else:
                 debit = "7xx Comptes de produits"
                 credit = f"{acc_id} {label}"
                 desc = "Solde des comptes de produits (Fin d'exercice)"
        elif acc_id.startswith('16'): # Emprunts
            debit = "512 Banque"
            credit = f"{acc_id} {label}"
            desc = "Encaissement d'un emprunt bancaire"
        else:
            debit = "Divers"
            credit = f"{acc_id} {label}"
            desc = "Opération sur capitaux propres"

    elif cls == '2': # Immo
        if acc_id.startswith('28'): # Amortissements
            debit = "681 Dotations aux amortissements"
            credit = f"{acc_id} {label}"
            desc = "Dotation annuelle aux amortissements"
        elif acc_id.startswith('29'): # Dépréciations
            debit = "681 Dotations aux dépréciations"
            credit = f"{acc_id} {label}"
            desc = "Constatation d'une dépréciation d'actif"
        else: # Acquisition
            debit = f"{acc_id} {label}"
            credit = "404 Fournisseurs d'immobilisations"
            desc = "Acquisition d'une immobilisation"

    elif cls == '3': # Stocks
        if acc_id.startswith('39'): # Dépréciation
             debit = "681 Dotations aux dépréciations"
             credit = f"{acc_id} {label}"
             desc = "Dépréciation de stocks"
        else:
            # Variation de stocks
            # Pour stock initial/final, on montre souvent la constatation du stock final
            debit = f"{acc_id} {label}"
            credit = "603 Variation des stocks"
            desc = "Constatation du stock final (Inventaire)"

    elif cls == '4': # Tiers
        if acc_id.startswith('40'): # Fournisseurs
            debit = f"{acc_id} {label}"
            credit = "512 Banque"
            desc = "Règlement d'une dette fournisseur"
        elif acc_id.startswith('41'): # Clients
            debit = "512 Banque"
            credit = f"{acc_id} {label}"
            desc = "Encaissement d'une créance client"
        elif acc_id.startswith('42'): # Personnel
            debit = f"{acc_id} {label}"
            credit = "512 Banque"
            desc = "Paiement des salaires"
        elif acc_id.startswith('43'): # Sécurité sociale
            debit = f"{acc_id} {label}"
            credit = "512 Banque"
            desc = "Paiement des charges sociales"
        elif acc_id.startswith('445'): # TVA
            if 'déductible' in label.lower():
                debit = f"{acc_id} {label}"
                credit = "401 Fournisseurs"
                desc = "TVA sur achat"
            elif 'collectée' in label.lower():
                debit = "411 Clients"
                credit = f"{acc_id} {label}"
                desc = "TVA sur vente"
            else: # TVA à payer
                debit = f"{acc_id} {label}"
                credit = "512 Banque"
                desc = "Décaissement de TVA"
        else:
            debit = f"{acc_id} {label}"
            credit = "512 Banque"
            desc = "Règlement dette / Encaissement créance"

    elif cls == '5': # Financier
        if acc_id.startswith('51'): # Banque
            debit = f"{acc_id} {label}"
            credit = "411 Clients"
            desc = "Encaissement d'un client"
        elif acc_id.startswith('53'): # Caisse
            debit = f"{acc_id} {label}"
            credit = "580 Virements internes"
            desc = "Alimentation de la caisse"
        else:
            debit = f"{acc_id} {label}"
            credit = "Divers"
            desc = "Opération de trésorerie"

    elif cls == '6': # Charges
        if acc_id.startswith('68'): # Dotations
             debit = f"{acc_id} {label}"
             credit = "281 Amortissements des immobilisations"
             desc = "Enregistrement de la dotation"
        else:
            debit = f"{acc_id} {label}"
            credit = "401 Fournisseurs"
            desc = "Enregistrement d'une facture d'achat"

    elif cls == '7': # Produits
        debit = "411 Clients"
        credit = f"{acc_id} {label}"
        desc = "Enregistrement d'une facture de vente"

    elif cls == '8': # Spéciaux
        if acc_id.startswith('86'):
            debit = f"{acc_id} {label}"
            credit = "870 Contributions volontaires"
            desc = "Constatation de l'emploi des contributions (Bénévolat)"
        elif acc_id.startswith('87'):
            debit = "860 Emplois des contributions"
            credit = f"{acc_id} {label}"
            desc = "Constatation des contributions volontaires (Bénévolat)"
        else:
            debit = "Divers"
            credit = f"{acc_id} {label}"
            desc = "Opération spéciale"

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
            accounts[acc_id]['description'] = text.strip()

    print("Building hierarchy...")
    accounts = build_hierarchy(accounts)

    print("Inheriting definitions...")
    inherit_definitions(accounts)

    print("Generating examples...")
    for acc_id in accounts:
        accounts[acc_id]['example'] = generate_example(accounts[acc_id])

    final_data = list(accounts.values())
    final_data.sort(key=lambda x: x['id'])

    print(f"Total accounts: {len(final_data)}")

    with open('db.json', 'w', encoding='utf-8') as f:
        json.dump(final_data, f, ensure_ascii=False, indent=2)

    print("Done. db.json created.")

if __name__ == '__main__':
    main()
