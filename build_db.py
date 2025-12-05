import json
import re
import os

def parse_liste(filepath):
    accounts = {}
    classes = {}

    with open(filepath, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    class_re = re.compile(r'Classe\s+(\d+)\s*:\s*(.*)')
    account_re = re.compile(r'^\s*(?:[\*\+]\s+)?(?:\[\d+\])?\s*(\d+)\s*[-–]\s*(.*)$')

    for line_idx, line in enumerate(lines):
        line = line.strip()
        if not line:
            continue

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

        if re.match(r'^\[\d+\]$', line):
            continue

        account_match = account_re.match(line)
        if account_match:
            acc_num = account_match.group(1)
            acc_label = account_match.group(2).strip()

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
    definitions = {}

    files = [f for f in os.listdir(folder) if f.startswith('fonc') and f.endswith('.txt')]

    header_re = re.compile(r'^\s*(\d+)\.\s+(.*)$')
    compte_re = re.compile(r'^\s*Compte(?:s)?\s+([\d\set,]+)\s+«(.*)»')

    def add_text(acc, txt):
        if not txt.strip(): return
        if acc not in definitions: definitions[acc] = ""

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
            paragraphs = re.split(r'\n\s*\n', full_text)

            for p in paragraphs:
                p = p.strip()
                p = re.sub(r'\s+', ' ', p)
                if not p: continue

                mentions = re.findall(r'(?:compte[s]?)\s+((?:\d+(?:[\s,]+(?:et|ou)?[\s,]+)?)+)', p, re.IGNORECASE)

                extracted_ids = set()
                for m in mentions:
                    found = re.findall(r'\d+', m)
                    extracted_ids.update(found)

                context_class = None
                if nums:
                    context_class = nums[0][0]

                if extracted_ids:
                    for eid in extracted_ids:
                        if context_class and eid.startswith(context_class):
                            add_text(eid, p)

                    for h in nums:
                        if h in extracted_ids:
                            add_text(h, p)
                else:
                    for h in nums:
                        add_text(h, p)

        for line in lines:
            line_stripped = line.strip()

            match_header = header_re.match(line_stripped)
            if match_header:
                process_block(current_nums, current_text_lines)
                current_nums = [match_header.group(1)]
                current_text_lines = []
                continue

            match_compte = compte_re.match(line_stripped)
            if match_compte:
                process_block(current_nums, current_text_lines)
                nums_str = match_compte.group(1)
                current_nums = re.findall(r'\d+', nums_str)
                current_text_lines = []
                continue

            if current_nums:
                current_text_lines.append(line_stripped)

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
    for acc_id, data in accounts.items():
        if not data['description']:
            curr = data
            while curr['parent'] and not curr['description']:
                parent_id = curr['parent']
                if parent_id in accounts:
                    curr = accounts[parent_id]
                    if curr['description']:
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

    rows = []
    desc = "Opération courante"

    # --- CLASSE 1 (Capitaux) ---
    if cls == '1':
        if acc_id.startswith('101'): # Capital
            desc = "Souscription du capital social"
            rows.append({"account": "456 Associés - opérations sur le capital", "debit": "10 000", "credit": ""})
            rows.append({"account": f"{acc_id} {label}", "debit": "", "credit": "10 000"})
        elif acc_id.startswith('106'): # Réserves
            desc = "Affectation du bénéfice en réserves"
            rows.append({"account": "120 Résultat de l'exercice (bénéfice)", "debit": "5 000", "credit": ""})
            rows.append({"account": f"{acc_id} {label}", "debit": "", "credit": "5 000"})
        elif acc_id.startswith('12'): # Résultat
            desc = "Solde des comptes de charges et produits (Clôture)"
            rows.append({"account": "7xx Comptes de produits", "debit": "100 000", "credit": ""})
            rows.append({"account": "6xx Comptes de charges", "debit": "", "credit": "80 000"})
            rows.append({"account": f"{acc_id} {label} (Bénéfice)", "debit": "", "credit": "20 000"})
        elif acc_id.startswith('16'): # Emprunts
            desc = "Encaissement d'un emprunt bancaire"
            rows.append({"account": "512 Banque", "debit": "50 000", "credit": ""})
            rows.append({"account": f"{acc_id} {label}", "debit": "", "credit": "50 000"})
        else:
            desc = "Opération diverse sur capitaux"
            rows.append({"account": "Divers", "debit": "1000", "credit": ""})
            rows.append({"account": f"{acc_id} {label}", "debit": "", "credit": "1000"})

    # --- CLASSE 2 (Immobilisations) ---
    elif cls == '2':
        if acc_id.startswith('28'): # Amortissements
            desc = "Enregistrement de la dotation aux amortissements"
            rows.append({"account": "681 Dotations aux amortissements", "debit": "2 000", "credit": ""})
            rows.append({"account": f"{acc_id} {label}", "debit": "", "credit": "2 000"})
        elif acc_id.startswith('29'): # Dépréciations
            desc = "Constatation d'une dépréciation d'actif"
            rows.append({"account": "681 Dotations aux dépréciations", "debit": "1 500", "credit": ""})
            rows.append({"account": f"{acc_id} {label}", "debit": "", "credit": "1 500"})
        else: # Acquisition
            desc = "Acquisition d'une immobilisation (avec TVA)"
            rows.append({"account": f"{acc_id} {label}", "debit": "10 000", "credit": ""})
            rows.append({"account": "44562 TVA sur immobilisations", "debit": "2 000", "credit": ""})
            rows.append({"account": "404 Fournisseurs d'immobilisations", "debit": "", "credit": "12 000"})

    # --- CLASSE 3 (Stocks) ---
    elif cls == '3':
        if acc_id.startswith('39'): # Dépréciation
             desc = "Dépréciation des stocks en fin d'exercice"
             rows.append({"account": "681 Dotations aux dépréciations", "debit": "500", "credit": ""})
             rows.append({"account": f"{acc_id} {label}", "debit": "", "credit": "500"})
        else:
            desc = "Constatation du stock final à l'inventaire"
            rows.append({"account": f"{acc_id} {label}", "debit": "5 000", "credit": ""})
            rows.append({"account": "603 Variation des stocks", "debit": "", "credit": "5 000"})

    # --- CLASSE 4 (Tiers) ---
    elif cls == '4':
        if acc_id.startswith('40'): # Fournisseurs
            desc = "Règlement d'une facture fournisseur"
            rows.append({"account": f"{acc_id} {label}", "debit": "1 200", "credit": ""})
            rows.append({"account": "512 Banque", "debit": "", "credit": "1 200"})
        elif acc_id.startswith('41'): # Clients
            desc = "Encaissement d'une créance client"
            rows.append({"account": "512 Banque", "debit": "1 200", "credit": ""})
            rows.append({"account": f"{acc_id} {label}", "debit": "", "credit": "1 200"})
        elif acc_id.startswith('42'): # Personnel
            desc = "Paiement des salaires nets"
            rows.append({"account": f"{acc_id} {label}", "debit": "2 000", "credit": ""})
            rows.append({"account": "512 Banque", "debit": "", "credit": "2 000"})
        elif acc_id.startswith('43'): # Org Sociaux
            desc = "Règlement des charges sociales (URSSAF/Retraite)"
            rows.append({"account": f"{acc_id} {label}", "debit": "800", "credit": ""})
            rows.append({"account": "512 Banque", "debit": "", "credit": "800"})
        elif acc_id.startswith('445'): # TVA
            if 'déductible' in label.lower() or '4456' in acc_id:
                desc = "Enregistrement d'une facture d'achat avec TVA"
                rows.append({"account": "607 Achats de marchandises", "debit": "1 000", "credit": ""})
                rows.append({"account": f"{acc_id} {label}", "debit": "200", "credit": ""})
                rows.append({"account": "401 Fournisseurs", "debit": "", "credit": "1 200"})
            elif 'collectée' in label.lower() or '4457' in acc_id:
                desc = "Enregistrement d'une facture de vente avec TVA"
                rows.append({"account": "411 Clients", "debit": "1 200", "credit": ""})
                rows.append({"account": "707 Ventes de marchandises", "debit": "", "credit": "1 000"})
                rows.append({"account": f"{acc_id} {label}", "debit": "", "credit": "200"})
            elif 'décaisser' in label.lower() or '4455' in acc_id:
                desc = "Paiement de la TVA due à l'État"
                rows.append({"account": f"{acc_id} {label}", "debit": "3 000", "credit": ""})
                rows.append({"account": "512 Banque", "debit": "", "credit": "3 000"})
            else:
                 desc = "Opération de TVA"
                 rows.append({"account": f"{acc_id} {label}", "debit": "100", "credit": ""})
                 rows.append({"account": "512 Banque", "debit": "", "credit": "100"})
        else:
            desc = "Opération avec un tiers"
            rows.append({"account": f"{acc_id} {label}", "debit": "500", "credit": ""})
            rows.append({"account": "512 Banque", "debit": "", "credit": "500"})

    # --- CLASSE 5 (Financier) ---
    elif cls == '5':
        if acc_id.startswith('512'): # Banque
            desc = "Paiement d'un fournisseur par virement"
            rows.append({"account": "401 Fournisseurs", "debit": "1 000", "credit": ""})
            rows.append({"account": f"{acc_id} {label}", "debit": "", "credit": "1 000"})
        elif acc_id.startswith('53'): # Caisse
            desc = "Retrait d'espèces à la banque pour alimenter la caisse"
            rows.append({"account": f"{acc_id} {label}", "debit": "500", "credit": ""})
            rows.append({"account": "580 Virements internes", "debit": "", "credit": "500"})
        else:
            desc = "Opération de trésorerie"
            rows.append({"account": f"{acc_id} {label}", "debit": "100", "credit": ""})
            rows.append({"account": "Divers", "debit": "", "credit": "100"})

    # --- CLASSE 6 (Charges) ---
    elif cls == '6':
        if acc_id.startswith('68'): # Dotations
             desc = "Enregistrement des amortissements de l'exercice"
             rows.append({"account": f"{acc_id} {label}", "debit": "2 500", "credit": ""})
             rows.append({"account": "281 Amortissements des immobilisations", "debit": "", "credit": "2 500"})
        elif acc_id.startswith('64'): # Personnel
             desc = "Enregistrement de la paie (Brut + Charges)"
             rows.append({"account": f"{acc_id} {label}", "debit": "3 000", "credit": ""})
             rows.append({"account": "421 Personnel - Rémunérations dues", "debit": "", "credit": "2 200"})
             rows.append({"account": "431 Sécurité Sociale", "debit": "", "credit": "800"})
        elif acc_id.startswith('66'): # Charges financières
             desc = "Paiement d'intérêts bancaires"
             rows.append({"account": f"{acc_id} {label}", "debit": "150", "credit": ""})
             rows.append({"account": "512 Banque", "debit": "", "credit": "150"})
        else: # Achats courants (60, 61, 62)
            desc = "Facture d'achat (avec TVA déductible)"
            rows.append({"account": f"{acc_id} {label}", "debit": "1 000", "credit": ""})
            rows.append({"account": "44566 TVA sur autres biens et services", "debit": "200", "credit": ""})
            rows.append({"account": "401 Fournisseurs", "debit": "", "credit": "1 200"})

    # --- CLASSE 7 (Produits) ---
    elif cls == '7':
        if acc_id.startswith('70'): # Ventes
            desc = "Facture de vente (avec TVA collectée)"
            rows.append({"account": "411 Clients", "debit": "1 200", "credit": ""})
            rows.append({"account": f"{acc_id} {label}", "debit": "", "credit": "1 000"})
            rows.append({"account": "44571 TVA collectée", "debit": "", "credit": "200"})
        elif acc_id.startswith('72'): # Production immobilisée
             desc = "Activation de frais de R&D ou production interne"
             rows.append({"account": "203 Frais de R&D", "debit": "5 000", "credit": ""})
             rows.append({"account": f"{acc_id} {label}", "debit": "", "credit": "5 000"})
        else:
             desc = "Enregistrement d'un produit divers"
             rows.append({"account": "411 Clients", "debit": "500", "credit": ""})
             rows.append({"account": f"{acc_id} {label}", "debit": "", "credit": "500"})

    # --- CLASSE 8 (Spéciaux) ---
    elif cls == '8':
        if acc_id.startswith('86'):
            desc = "Emploi des contributions volontaires (Bénévolat)"
            rows.append({"account": f"{acc_id} {label}", "debit": "1 000", "credit": ""})
            rows.append({"account": "870 Bénévolat", "debit": "", "credit": "1 000"})
        elif acc_id.startswith('87'):
            desc = "Constatation des contributions volontaires (Bénévolat)"
            rows.append({"account": "860 Emploi des contributions", "debit": "1 000", "credit": ""})
            rows.append({"account": f"{acc_id} {label}", "debit": "", "credit": "1 000"})
        else:
            desc = "Opération spéciale"
            rows.append({"account": "Divers", "debit": "100", "credit": ""})
            rows.append({"account": f"{acc_id} {label}", "debit": "", "credit": "100"})

    return {
        "description": desc,
        "rows": rows
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
