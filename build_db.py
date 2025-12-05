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
                "title": "Constitution (1/3) : Promesse d'apport",
                "rows": [
                    {"account": "45611 Associés - Apports en nature", "debit": "50 000", "credit": ""},
                    {"account": "45615 Associés - Apports en numéraire", "debit": "50 000", "credit": ""},
                    {"account": "1012 Capital souscrit - appelé, non versé", "debit": "", "credit": "100 000"}
                ]
            })
            examples.append({
                "title": "Constitution (2/3) : Réalisation (Libération)",
                "rows": [
                    {"account": "512 Banque", "debit": "50 000", "credit": ""},
                    {"account": "21x Immobilisations", "debit": "50 000", "credit": ""},
                    {"account": "45615 Associés - Apports en numéraire", "debit": "", "credit": "50 000"},
                    {"account": "45611 Associés - Apports en nature", "debit": "", "credit": "50 000"}
                ]
            })
            examples.append({
                "title": "Constitution (3/3) : Virement au capital versé",
                "rows": [
                    {"account": "1012 Capital souscrit - appelé, non versé", "debit": "100 000", "credit": ""},
                    {"account": "1013 Capital souscrit - appelé, versé", "debit": "", "credit": "100 000"}
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
        elif acc_id.startswith('104'): # Primes
            examples.append({
                "title": "Augmentation de capital avec prime d'émission",
                "rows": [
                    {"account": "512 Banque", "debit": "15 000", "credit": ""},
                    {"account": "1013 Capital social", "debit": "", "credit": "10 000"},
                    {"account": f"{acc_id} {label}", "debit": "", "credit": "5 000"}
                ]
            })
        elif acc_id.startswith('12'): # Résultat
            if 'perte' in label.lower() or '129' in acc_id:
                examples.append({
                    "title": "Affectation de la perte (Report à nouveau)",
                    "rows": [
                        {"account": "119 Report à nouveau débiteur", "debit": "2 000", "credit": ""},
                        {"account": f"{acc_id} {label}", "debit": "", "credit": "2 000"}
                    ]
                })
            else:
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
                "title": "Encaissement des fonds (Emprunt bancaire)",
                "rows": [
                    {"account": "512 Banque", "debit": "50 000", "credit": ""},
                    {"account": f"{acc_id} {label}", "debit": "", "credit": "50 000"}
                ]
            })
            examples.append({
                "title": "Remboursement d'échéance (avec intérêts)",
                "rows": [
                    {"account": f"{acc_id} {label} (Capital)", "debit": "5 000", "credit": ""},
                    {"account": "6611 Intérêts des emprunts et dettes", "debit": "200", "credit": ""},
                    {"account": "512 Banque", "debit": "", "credit": "5 200"}
                ]
            })
        else:
            examples.append({
                "title": "Opération spécifique (Capitaux)",
                "rows": [
                    {"account": "120 Résultat de l'exercice", "debit": "1000", "credit": ""},
                    {"account": f"{acc_id} {label}", "debit": "", "credit": "1000"}
                ]
            })

    # --- CLASSE 2 (Immobilisations) ---
    elif cls == '2':
        if acc_id.startswith('28'): # Amortissements
            examples.append({
                "title": "Dotation annuelle aux amortissements",
                "rows": [
                    {"account": "6811 Dotations - Immos corporelles/incorporelles", "debit": "2 000", "credit": ""},
                    {"account": f"{acc_id} {label}", "debit": "", "credit": "2 000"}
                ]
            })
        elif acc_id.startswith('29'): # Dépréciations
            examples.append({
                "title": "Constatation d'une dépréciation (Perte de valeur)",
                "rows": [
                    {"account": "6816 Dotations pour dépréciations des immos", "debit": "1 500", "credit": ""},
                    {"account": f"{acc_id} {label}", "debit": "", "credit": "1 500"}
                ]
            })
            examples.append({
                "title": "Reprise de dépréciation (ajustement)",
                "rows": [
                    {"account": f"{acc_id} {label}", "debit": "500", "credit": ""},
                    {"account": "7816 Reprises sur dépréciations", "debit": "", "credit": "500"}
                ]
            })
        elif acc_id.startswith('27') or acc_id.startswith('26'): # Immobilisations financières
             examples.append({
                "title": "Acquisition de titres de participation",
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
                "title": "Frais d'acquisition (Droits d'enregistrement)",
                "rows": [
                    {"account": "6354 Droits d'enregistrement", "debit": "500", "credit": ""},
                    {"account": "6226 Honoraires", "debit": "300", "credit": ""},
                    {"account": "44566 TVA déductible", "debit": "60", "credit": ""},
                    {"account": "512 Banque", "debit": "", "credit": "860"}
                ]
            })
            examples.append({
                "title": "Cession (Étape 1 : Facture de vente)",
                "rows": [
                    {"account": "462 Créances sur cessions d'immobilisations", "debit": "6 000", "credit": ""},
                    {"account": "775 Produits des cessions d'éléments d'actif", "debit": "", "credit": "5 000"},
                    {"account": "44571 TVA collectée", "debit": "", "credit": "1 000"}
                ]
            })
            examples.append({
                "title": "Cession (Étape 2 : Sortie du patrimoine)",
                "rows": [
                    {"account": "675 VNC des éléments d'actif cédés", "debit": "4 000", "credit": ""},
                    {"account": "281 Amortissements (cumul)", "debit": "6 000", "credit": ""},
                    {"account": f"{acc_id} {label} (Valeur d'origine)", "debit": "", "credit": "10 000"}
                ]
            })

    # --- CLASSE 3 (Stocks) ---
    elif cls == '3':
        if acc_id.startswith('39'): # Dépréciation
             examples.append({
                "title": "Dotation dépréciation (Inventaire)",
                "rows": [
                    {"account": "6817 Dotations dépréciations actifs circulants", "debit": "500", "credit": ""},
                    {"account": f"{acc_id} {label}", "debit": "", "credit": "500"}
                ]
             })
        else:
            variation_account = "6031 Variation des stocks de MP" if "matière" in label.lower() else "6037 Variation des stocks de marchandises"
            if acc_id.startswith('35'): variation_account = "713 Variation des stocks de produits"

            examples.append({
                "title": "Annulation stock initial (Début exercice)",
                "rows": [
                    {"account": variation_account, "debit": "4 000", "credit": ""},
                    {"account": f"{acc_id} {label} (Stock initial)", "debit": "", "credit": "4 000"}
                ]
            })
            examples.append({
                "title": "Constatation stock final (Fin exercice)",
                "rows": [
                    {"account": f"{acc_id} {label} (Stock final)", "debit": "5 000", "credit": ""},
                    {"account": variation_account, "debit": "", "credit": "5 000"}
                ]
            })

    # --- CLASSE 4 (Tiers) ---
    elif cls == '4':
        if acc_id.startswith('40'): # Fournisseurs
            examples.append({
                "title": "Facture d'achat reçue",
                "rows": [
                    {"account": "607 Achats de marchandises", "debit": "1 000", "credit": ""},
                    {"account": "44566 TVA déductible", "debit": "200", "credit": ""},
                    {"account": f"{acc_id} {label}", "debit": "", "credit": "1 200"}
                ]
            })
            examples.append({
                "title": "Règlement fournisseur",
                "rows": [
                    {"account": f"{acc_id} {label}", "debit": "1 200", "credit": ""},
                    {"account": "512 Banque", "debit": "", "credit": "1 200"}
                ]
            })
            examples.append({
                "title": "Avoir reçu (Remise)",
                "rows": [
                    {"account": f"{acc_id} {label}", "debit": "120", "credit": ""},
                    {"account": "609 RRR obtenus sur achats", "debit": "", "credit": "100"},
                    {"account": "44566 TVA déductible", "debit": "", "credit": "20"}
                ]
            })
        elif acc_id.startswith('41') and not acc_id.startswith('416'): # Clients (Sain)
            examples.append({
                "title": "Facture de vente émise",
                "rows": [
                    {"account": f"{acc_id} {label}", "debit": "1 200", "credit": ""},
                    {"account": "707 Vente de marchandises", "debit": "", "credit": "1 000"},
                    {"account": "44571 TVA collectée", "debit": "", "credit": "200"}
                ]
            })
            examples.append({
                "title": "Encaissement client",
                "rows": [
                    {"account": "512 Banque", "debit": "1 200", "credit": ""},
                    {"account": f"{acc_id} {label}", "debit": "", "credit": "1 200"}
                ]
            })
        elif acc_id.startswith('416'): # Clients douteux
            examples.append({
                "title": "Reclassement (Client sain -> Douteux)",
                "rows": [
                    {"account": "416 Clients douteux", "debit": "1 200", "credit": ""},
                    {"account": "411 Clients", "debit": "", "credit": "1 200"}
                ]
            })
            examples.append({
                "title": "Constatation créance irrécouvrable",
                "rows": [
                    {"account": "654 Pertes sur créances irrécouvrables", "debit": "1 000", "credit": ""},
                    {"account": "44571 TVA collectée (Régularisation)", "debit": "200", "credit": ""},
                    {"account": "416 Clients douteux", "debit": "", "credit": "1 200"}
                ]
            })
        elif acc_id.startswith('42'): # Personnel
            examples.append({
                "title": "Comptabilisation de la paie (Bulletin complet)",
                "rows": [
                    {"account": "641 Rémunérations du personnel (Brut)", "debit": "3 000", "credit": ""},
                    {"account": "6411 Primes et gratifications", "debit": "500", "credit": ""},
                    {"account": "431 Sécurité Sociale (Part salariale)", "debit": "", "credit": "800"},
                    {"account": "437 Autres organismes sociaux (Mutuelle/Retraite)", "debit": "", "credit": "200"},
                    {"account": "4421 Prélèvement à la source (Impôt)", "debit": "", "credit": "150"},
                    {"account": f"{acc_id} {label} (Net à payer)", "debit": "", "credit": "2 350"}
                ]
            })
            examples.append({
                "title": "Paiement des salaires",
                "rows": [
                    {"account": f"{acc_id} {label}", "debit": "2 350", "credit": ""},
                    {"account": "512 Banque", "debit": "", "credit": "2 350"}
                ]
            })
        elif acc_id.startswith('43'): # Organismes sociaux
            examples.append({
                "title": "Charges patronales",
                "rows": [
                    {"account": "6451 Cotisations à l'Urssaf", "debit": "1 200", "credit": ""},
                    {"account": f"{acc_id} {label}", "debit": "", "credit": "1 200"}
                ]
            })
            examples.append({
                "title": "Règlement des charges (Salariales + Patronales)",
                "rows": [
                    {"account": f"{acc_id} {label}", "debit": "2 000", "credit": ""},
                    {"account": "512 Banque", "debit": "", "credit": "2 000"}
                ]
            })
        elif acc_id.startswith('445'): # TVA
            if 'déductible' in label.lower() or '4456' in acc_id:
                examples.append({
                    "title": "Constatation sur achat",
                    "rows": [
                        {"account": "607 Achats", "debit": "1 000", "credit": ""},
                        {"account": f"{acc_id} {label}", "debit": "200", "credit": ""},
                        {"account": "401 Fournisseurs", "debit": "", "credit": "1 200"}
                    ]
                })
            elif 'collectée' in label.lower() or '4457' in acc_id:
                examples.append({
                    "title": "Constatation sur vente",
                    "rows": [
                        {"account": "411 Clients", "debit": "1 200", "credit": ""},
                        {"account": "707 Ventes", "debit": "", "credit": "1 000"},
                        {"account": f"{acc_id} {label}", "debit": "", "credit": "200"}
                    ]
                })
            elif 'décaisser' in label.lower() or '4455' in acc_id:
                examples.append({
                    "title": "Déclaration mensuelle (CA3)",
                    "rows": [
                        {"account": "4457 TVA collectée", "debit": "5 000", "credit": ""},
                        {"account": "4456 TVA déductible", "debit": "", "credit": "2 000"},
                        {"account": f"{acc_id} {label}", "debit": "", "credit": "3 000"}
                    ]
                })
                examples.append({
                    "title": "Télépaiement TVA",
                    "rows": [
                        {"account": f"{acc_id} {label}", "debit": "3 000", "credit": ""},
                        {"account": "512 Banque", "debit": "", "credit": "3 000"}
                    ]
                })
            elif 'crédit' in label.lower() or '44567' in acc_id:
                 examples.append({
                    "title": "Constatation Crédit de TVA",
                    "rows": [
                        {"account": "4457 TVA collectée", "debit": "1 000", "credit": ""},
                        {"account": f"{acc_id} {label}", "debit": "1 000", "credit": ""},
                        {"account": "4456 TVA déductible", "debit": "", "credit": "2 000"}
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
                "title": "Opération courante avec un tiers",
                "rows": [
                    {"account": f"{acc_id} {label}", "debit": "500", "credit": ""},
                    {"account": "512 Banque", "debit": "", "credit": "500"}
                ]
            })

    # --- CLASSE 5 (Financier) ---
    elif cls == '5':
        if acc_id.startswith('512'): # Banque
            examples.append({
                "title": "Règlement fournisseur",
                "rows": [
                    {"account": "401 Fournisseurs", "debit": "1 000", "credit": ""},
                    {"account": f"{acc_id} {label}", "debit": "", "credit": "1 000"}
                ]
            })
            examples.append({
                "title": "Encaissement client",
                "rows": [
                    {"account": f"{acc_id} {label}", "debit": "2 000", "credit": ""},
                    {"account": "411 Clients", "debit": "", "credit": "2 000"}
                ]
            })
            examples.append({
                "title": "Frais bancaires et commissions",
                "rows": [
                    {"account": "627 Services bancaires", "debit": "20", "credit": ""},
                    {"account": "44566 TVA déductible", "debit": "4", "credit": ""},
                    {"account": f"{acc_id} {label}", "debit": "", "credit": "24"}
                ]
            })
        elif acc_id.startswith('53'): # Caisse
            examples.append({
                "title": "Alimentation (Retrait Banque)",
                "rows": [
                    {"account": f"{acc_id} {label}", "debit": "500", "credit": ""},
                    {"account": "580 Virements internes", "debit": "", "credit": "500"}
                ]
            })
            examples.append({
                "title": "Paiement en espèces (Fournitures)",
                "rows": [
                    {"account": "6064 Fournitures administratives", "debit": "20", "credit": ""},
                    {"account": "44566 TVA", "debit": "4", "credit": ""},
                    {"account": f"{acc_id} {label}", "debit": "", "credit": "24"}
                ]
            })
        elif acc_id.startswith('50'): # VMP
            examples.append({
                "title": "Acquisition de VMP",
                "rows": [
                    {"account": f"{acc_id} {label}", "debit": "3 000", "credit": ""},
                    {"account": "512 Banque", "debit": "", "credit": "3 000"}
                ]
            })
            examples.append({
                "title": "Cession de VMP (Plus-value)",
                "rows": [
                    {"account": "512 Banque", "debit": "3 500", "credit": ""},
                    {"account": f"{acc_id} {label}", "debit": "", "credit": "3 000"},
                    {"account": "767 Produits nets sur cessions de VMP", "debit": "", "credit": "500"}
                ]
            })
        elif acc_id.startswith('58'): # Virements internes
             examples.append({
                "title": "Virement Compte à Compte",
                "rows": [
                    {"account": "580 Virements internes", "debit": "1 000", "credit": ""},
                    {"account": "512 Banque A", "debit": "", "credit": "1 000"}
                ]
             })
             examples.append({
                "title": "Réception sur l'autre compte",
                "rows": [
                    {"account": "512 Banque B", "debit": "1 000", "credit": ""},
                    {"account": "580 Virements internes", "debit": "", "credit": "1 000"}
                ]
             })
        else:
            examples.append({
                "title": "Opération de trésorerie",
                "rows": [
                    {"account": f"{acc_id} {label}", "debit": "100", "credit": ""},
                    {"account": "512 Banque", "debit": "", "credit": "100"}
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
                "title": "Comptabilisation de la paie (Brut)",
                "rows": [
                    {"account": f"{acc_id} {label}", "debit": "3 000", "credit": ""},
                    {"account": "421 Personnel - Rémunérations dues", "debit": "", "credit": "2 200"},
                    {"account": "431 Sécurité sociale (part salariale)", "debit": "", "credit": "800"}
                ]
             })
        elif acc_id.startswith('63'): # Impôts
             examples.append({
                "title": "Avis d'imposition (CVAE/CFE)",
                "rows": [
                    {"account": f"{acc_id} {label}", "debit": "800", "credit": ""},
                    {"account": "447 Autres impôts, taxes", "debit": "", "credit": "800"}
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
                "title": "Activation de frais (Projet interne)",
                "rows": [
                    {"account": "213 Constructions", "debit": "50 000", "credit": ""},
                    {"account": f"{acc_id} {label}", "debit": "", "credit": "50 000"}
                ]
             })
        elif acc_id.startswith('74'): # Subventions
             examples.append({
                "title": "Attribution de subvention",
                "rows": [
                    {"account": "441 État - Subventions à recevoir", "debit": "10 000", "credit": ""},
                    {"account": f"{acc_id} {label}", "debit": "", "credit": "10 000"}
                ]
             })
        elif acc_id.startswith('77'): # Exceptionnel
             examples.append({
                "title": "Produit exceptionnel (Cession)",
                "rows": [
                    {"account": "462 Créances sur cessions d'immo", "debit": "6 000", "credit": ""},
                    {"account": f"{acc_id} {label}", "debit": "", "credit": "5 000"},
                    {"account": "44571 TVA collectée", "debit": "", "credit": "1 000"}
                ]
             })
        else:
             examples.append({
                "title": "Enregistrement d'un produit",
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
                "title": "Opération spéciale (Contribution)",
                "rows": [
                    {"account": "467 Débiteurs divers", "debit": "100", "credit": ""},
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
