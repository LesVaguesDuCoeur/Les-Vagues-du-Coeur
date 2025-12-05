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

def generate_examples(account):
    acc_id = account['id']
    label = account['label']
    cls = acc_id[0]

    examples = []

    # --- CLASSE 1 (Capitaux) ---
    if cls == '1':
        if acc_id.startswith('101') or acc_id == '10': # Capital
            examples.append({
                "title": "Souscription du capital",
                "rows": [
                    {"account": "4561 Associés - Comptes d'apport en société", "debit": "10 000", "credit": ""},
                    {"account": f"{acc_id} {label}", "debit": "", "credit": "10 000"}
                ]
            })
            examples.append({
                "title": "Libération du capital (Versement)",
                "rows": [
                    {"account": "512 Banque", "debit": "10 000", "credit": ""},
                    {"account": "4561 Associés - Comptes d'apport en société", "debit": "", "credit": "10 000"}
                ]
            })
        elif acc_id.startswith('106'): # Réserves
            examples.append({
                "title": "Affectation du bénéfice en réserves",
                "rows": [
                    {"account": "120 Résultat de l'exercice (bénéfice)", "debit": "5 000", "credit": ""},
                    {"account": f"{acc_id} {label}", "debit": "", "credit": "5 000"}
                ]
            })
        elif acc_id.startswith('12'): # Résultat
            examples.append({
                "title": "Clôture des comptes de gestion (Bénéfice)",
                "rows": [
                    {"account": "7xx Comptes de produits", "debit": "100 000", "credit": ""},
                    {"account": "6xx Comptes de charges", "debit": "", "credit": "80 000"},
                    {"account": f"{acc_id} {label}", "debit": "", "credit": "20 000"}
                ]
            })
        elif acc_id.startswith('16'): # Emprunts
            examples.append({
                "title": "Encaissement des fonds",
                "rows": [
                    {"account": "512 Banque", "debit": "50 000", "credit": ""},
                    {"account": f"{acc_id} {label}", "debit": "", "credit": "50 000"}
                ]
            })
            examples.append({
                "title": "Remboursement d'échéance",
                "rows": [
                    {"account": f"{acc_id} {label} (Capital)", "debit": "5 000", "credit": ""},
                    {"account": "661 Charges d'intérêts", "debit": "200", "credit": ""},
                    {"account": "512 Banque", "debit": "", "credit": "5 200"}
                ]
            })
        else:
            examples.append({
                "title": "Opération diverse sur capitaux",
                "rows": [
                    {"account": "Divers", "debit": "1000", "credit": ""},
                    {"account": f"{acc_id} {label}", "debit": "", "credit": "1000"}
                ]
            })

    # --- CLASSE 2 (Immobilisations) ---
    elif cls == '2':
        if acc_id.startswith('28'): # Amortissements
            examples.append({
                "title": "Dotation annuelle",
                "rows": [
                    {"account": "681 Dotations aux amortissements", "debit": "2 000", "credit": ""},
                    {"account": f"{acc_id} {label}", "debit": "", "credit": "2 000"}
                ]
            })
        elif acc_id.startswith('29'): # Dépréciations
            examples.append({
                "title": "Constatation d'une dépréciation",
                "rows": [
                    {"account": "681 Dotations aux dépréciations", "debit": "1 500", "credit": ""},
                    {"account": f"{acc_id} {label}", "debit": "", "credit": "1 500"}
                ]
            })
            examples.append({
                "title": "Reprise de dépréciation (ajustement)",
                "rows": [
                    {"account": f"{acc_id} {label}", "debit": "500", "credit": ""},
                    {"account": "781 Reprises sur dépréciations", "debit": "", "credit": "500"}
                ]
            })
        elif acc_id.startswith('27') or acc_id.startswith('26'): # Immobilisations financières
             examples.append({
                "title": "Acquisition de titres",
                "rows": [
                    {"account": f"{acc_id} {label}", "debit": "5 000", "credit": ""},
                    {"account": "512 Banque", "debit": "", "credit": "5 000"}
                ]
             })
        else: # Immobilisation Corporelle / Incorporelle
            examples.append({
                "title": "Acquisition (Achat)",
                "rows": [
                    {"account": f"{acc_id} {label}", "debit": "10 000", "credit": ""},
                    {"account": "44562 TVA sur immobilisations", "debit": "2 000", "credit": ""},
                    {"account": "404 Fournisseurs d'immobilisations", "debit": "", "credit": "12 000"}
                ]
            })
            examples.append({
                "title": "Cession (Vente)",
                "rows": [
                    {"account": "462 Créances sur cessions d'immobilisations", "debit": "6 000", "credit": ""},
                    {"account": "757 Produit de cessions d'immobilisations", "debit": "", "credit": "5 000"},
                    {"account": "44571 TVA collectée", "debit": "", "credit": "1 000"}
                ]
            })
            examples.append({
                "title": "Sortie du patrimoine (après cession)",
                "rows": [
                    {"account": "675 VNC des immobilisations cédées", "debit": "4 000", "credit": ""},
                    {"account": "281 Amortissements (cumul)", "debit": "6 000", "credit": ""},
                    {"account": f"{acc_id} {label} (Valeur brute)", "debit": "", "credit": "10 000"}
                ]
            })

    # --- CLASSE 3 (Stocks) ---
    elif cls == '3':
        if acc_id.startswith('39'): # Dépréciation
             examples.append({
                "title": "Dotation dépréciation (Inventaire)",
                "rows": [
                    {"account": "681 Dotations aux dépréciations", "debit": "500", "credit": ""},
                    {"account": f"{acc_id} {label}", "debit": "", "credit": "500"}
                ]
             })
        else:
            examples.append({
                "title": "Annulation stock initial (Début exercice)",
                "rows": [
                    {"account": "603 Variation des stocks", "debit": "4 000", "credit": ""},
                    {"account": f"{acc_id} {label} (Stock initial)", "debit": "", "credit": "4 000"}
                ]
            })
            examples.append({
                "title": "Constatation stock final (Fin exercice)",
                "rows": [
                    {"account": f"{acc_id} {label} (Stock final)", "debit": "5 000", "credit": ""},
                    {"account": "603 Variation des stocks", "debit": "", "credit": "5 000"}
                ]
            })

    # --- CLASSE 4 (Tiers) ---
    elif cls == '4':
        if acc_id.startswith('40'): # Fournisseurs
            examples.append({
                "title": "Facture reçue",
                "rows": [
                    {"account": "6xx Charge", "debit": "1 000", "credit": ""},
                    {"account": "44566 TVA déductible", "debit": "200", "credit": ""},
                    {"account": f"{acc_id} {label}", "debit": "", "credit": "1 200"}
                ]
            })
            examples.append({
                "title": "Règlement",
                "rows": [
                    {"account": f"{acc_id} {label}", "debit": "1 200", "credit": ""},
                    {"account": "512 Banque", "debit": "", "credit": "1 200"}
                ]
            })
        elif acc_id.startswith('41'): # Clients
            examples.append({
                "title": "Facture émise",
                "rows": [
                    {"account": f"{acc_id} {label}", "debit": "1 200", "credit": ""},
                    {"account": "7xx Produit", "debit": "", "credit": "1 000"},
                    {"account": "44571 TVA collectée", "debit": "", "credit": "200"}
                ]
            })
            examples.append({
                "title": "Encaissement",
                "rows": [
                    {"account": "512 Banque", "debit": "1 200", "credit": ""},
                    {"account": f"{acc_id} {label}", "debit": "", "credit": "1 200"}
                ]
            })
        elif acc_id.startswith('42'): # Personnel
            examples.append({
                "title": "Bulletin de paie",
                "rows": [
                    {"account": "641 Rémunérations du personnel", "debit": "3 000", "credit": ""},
                    {"account": "431 Sécurité Sociale (part salariale)", "debit": "", "credit": "600"},
                    {"account": f"{acc_id} {label} (Net à payer)", "debit": "", "credit": "2 400"}
                ]
            })
            examples.append({
                "title": "Paiement salaire",
                "rows": [
                    {"account": f"{acc_id} {label}", "debit": "2 400", "credit": ""},
                    {"account": "512 Banque", "debit": "", "credit": "2 400"}
                ]
            })
        elif acc_id.startswith('445'): # TVA
            if 'déductible' in label.lower() or '4456' in acc_id:
                examples.append({
                    "title": "Sur facture d'achat",
                    "rows": [
                        {"account": "607 Achats de marchandises", "debit": "1 000", "credit": ""},
                        {"account": f"{acc_id} {label}", "debit": "200", "credit": ""},
                        {"account": "401 Fournisseurs", "debit": "", "credit": "1 200"}
                    ]
                })
            elif 'collectée' in label.lower() or '4457' in acc_id:
                examples.append({
                    "title": "Sur facture de vente",
                    "rows": [
                        {"account": "411 Clients", "debit": "1 200", "credit": ""},
                        {"account": "707 Ventes de marchandises", "debit": "", "credit": "1 000"},
                        {"account": f"{acc_id} {label}", "debit": "", "credit": "200"}
                    ]
                })
            elif 'décaisser' in label.lower() or '4455' in acc_id:
                examples.append({
                    "title": "Déclaration TVA (CA3)",
                    "rows": [
                        {"account": "4457 TVA collectée", "debit": "5 000", "credit": ""},
                        {"account": "4456 TVA déductible", "debit": "", "credit": "2 000"},
                        {"account": f"{acc_id} {label}", "debit": "", "credit": "3 000"}
                    ]
                })
                examples.append({
                    "title": "Paiement à l'État",
                    "rows": [
                        {"account": f"{acc_id} {label}", "debit": "3 000", "credit": ""},
                        {"account": "512 Banque", "debit": "", "credit": "3 000"}
                    ]
                })
            else:
                 examples.append({
                    "title": "Opération de TVA",
                    "rows": [
                        {"account": f"{acc_id} {label}", "debit": "100", "credit": ""},
                        {"account": "512 Banque", "debit": "", "credit": "100"}
                    ]
                 })
        else:
            examples.append({
                "title": "Opération courante",
                "rows": [
                    {"account": f"{acc_id} {label}", "debit": "500", "credit": ""},
                    {"account": "512 Banque", "debit": "", "credit": "500"}
                ]
            })

    # --- CLASSE 5 (Financier) ---
    elif cls == '5':
        if acc_id.startswith('512'): # Banque
            examples.append({
                "title": "Paiement Fournisseur",
                "rows": [
                    {"account": "401 Fournisseurs", "debit": "1 000", "credit": ""},
                    {"account": f"{acc_id} {label}", "debit": "", "credit": "1 000"}
                ]
            })
            examples.append({
                "title": "Encaissement Client",
                "rows": [
                    {"account": f"{acc_id} {label}", "debit": "2 000", "credit": ""},
                    {"account": "411 Clients", "debit": "", "credit": "2 000"}
                ]
            })
        elif acc_id.startswith('53'): # Caisse
            examples.append({
                "title": "Retrait Banque -> Caisse",
                "rows": [
                    {"account": f"{acc_id} {label}", "debit": "500", "credit": ""},
                    {"account": "580 Virements internes", "debit": "", "credit": "500"}
                ]
            })
            examples.append({
                "title": "Paiement petite dépense",
                "rows": [
                    {"account": "6064 Fournitures administratives", "debit": "20", "credit": ""},
                    {"account": "44566 TVA", "debit": "4", "credit": ""},
                    {"account": f"{acc_id} {label}", "debit": "", "credit": "24"}
                ]
            })
        else:
            examples.append({
                "title": "Opération de trésorerie",
                "rows": [
                    {"account": f"{acc_id} {label}", "debit": "100", "credit": ""},
                    {"account": "Divers", "debit": "", "credit": "100"}
                ]
            })

    # --- CLASSE 6 (Charges) ---
    elif cls == '6':
        if acc_id.startswith('68'): # Dotations
             examples.append({
                "title": "Inventaire (Amortissement)",
                "rows": [
                    {"account": f"{acc_id} {label}", "debit": "2 500", "credit": ""},
                    {"account": "281 Amortissements", "debit": "", "credit": "2 500"}
                ]
             })
        elif acc_id.startswith('64'): # Personnel
             examples.append({
                "title": "Journal de paie",
                "rows": [
                    {"account": f"{acc_id} {label} (Brut)", "debit": "3 000", "credit": ""},
                    {"account": "421 Personnel", "debit": "", "credit": "2 200"},
                    {"account": "431 Urssaf", "debit": "", "credit": "800"}
                ]
             })
        else: # Achats courants
            examples.append({
                "title": "Facture d'achat standard",
                "rows": [
                    {"account": f"{acc_id} {label}", "debit": "1 000", "credit": ""},
                    {"account": "44566 TVA sur autres biens et services", "debit": "200", "credit": ""},
                    {"account": "401 Fournisseurs", "debit": "", "credit": "1 200"}
                ]
            })
            examples.append({
                "title": "Avoir reçu (Retour marchandise)",
                "rows": [
                    {"account": "401 Fournisseurs", "debit": "120", "credit": ""},
                    {"account": f"{acc_id} {label}", "debit": "", "credit": "100"},
                    {"account": "44566 TVA", "debit": "", "credit": "20"}
                ]
            })

    # --- CLASSE 7 (Produits) ---
    elif cls == '7':
        if acc_id.startswith('70'): # Ventes
            examples.append({
                "title": "Facture de vente standard",
                "rows": [
                    {"account": "411 Clients", "debit": "1 200", "credit": ""},
                    {"account": f"{acc_id} {label}", "debit": "", "credit": "1 000"},
                    {"account": "44571 TVA collectée", "debit": "", "credit": "200"}
                ]
            })
            examples.append({
                "title": "Avoir émis (Retour)",
                "rows": [
                    {"account": f"{acc_id} {label}", "debit": "100", "credit": ""},
                    {"account": "44571 TVA collectée", "debit": "20", "credit": ""},
                    {"account": "411 Clients", "debit": "", "credit": "120"}
                ]
            })
        elif acc_id.startswith('72'): # Production immobilisée
             examples.append({
                "title": "Production d'une immo par l'entreprise",
                "rows": [
                    {"account": "213 Constructions", "debit": "50 000", "credit": ""},
                    {"account": f"{acc_id} {label}", "debit": "", "credit": "50 000"}
                ]
             })
        else:
             examples.append({
                "title": "Produit divers",
                "rows": [
                    {"account": "411 Clients", "debit": "500", "credit": ""},
                    {"account": f"{acc_id} {label}", "debit": "", "credit": "500"}
                ]
             })

    # --- CLASSE 8 (Spéciaux) ---
    elif cls == '8':
        if acc_id.startswith('86'):
            examples.append({
                "title": "Constatation emploi contributions",
                "rows": [
                    {"account": f"{acc_id} {label}", "debit": "1 000", "credit": ""},
                    {"account": "870 Bénévolat", "debit": "", "credit": "1 000"}
                ]
            })
        elif acc_id.startswith('87'):
            examples.append({
                "title": "Constatation contributions volontaires",
                "rows": [
                    {"account": "860 Emploi des contributions", "debit": "1 000", "credit": ""},
                    {"account": f"{acc_id} {label}", "debit": "", "credit": "1 000"}
                ]
            })
        else:
            examples.append({
                "title": "Opération spéciale",
                "rows": [
                    {"account": "Divers", "debit": "100", "credit": ""},
                    {"account": f"{acc_id} {label}", "debit": "", "credit": "100"}
                ]
            })

    return examples

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
        accounts[acc_id]['examples'] = generate_examples(accounts[acc_id])

    final_data = list(accounts.values())
    final_data.sort(key=lambda x: x['id'])

    print(f"Total accounts: {len(final_data)}")

    with open('db.json', 'w', encoding='utf-8') as f:
        json.dump(final_data, f, ensure_ascii=False, indent=2)

    print("Done. db.json created.")

if __name__ == '__main__':
    main()
