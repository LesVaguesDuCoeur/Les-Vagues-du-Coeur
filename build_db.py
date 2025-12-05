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
        definitions[acc] += txt.strip() + "\n\n"

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
                # This is a heuristic.
                # We look for digits following "compte"

                mentions = re.findall(r'(?:compte[s]?)\s+((?:\d+(?:[\s,]+(?:et|ou)?[\s,]+)?)+)', p, re.IGNORECASE)

                extracted_ids = set()
                for m in mentions:
                    # Clean up string "271, 272" -> [271, 272]
                    # "271 et 272" -> [271, 272]
                    found = re.findall(r'\d+', m)
                    extracted_ids.update(found)

                if extracted_ids:
                    # Paragraph is specific
                    for eid in extracted_ids:
                        add_text(eid, p)

                    # Also add to block header IF block header is mentioned OR if extracted_ids contains sub-accounts of header?
                    # The user wants "definition global" for header.
                    # If paragraph says "Le compte 271 is...", this is NOT global for 27.
                    # If paragraph says "Le compte 27 (header) comprises...", this IS global.

                    # So, if extracted_ids contains any of current_nums, add to those current_nums.
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

            # Header match
            match_header = header_re.match(line_stripped)
            if match_header:
                process_block(current_nums, current_text_lines)
                current_nums = [match_header.group(1)]
                current_text_lines = []
                # Header title might be useful description?
                # "27. AUTRES..." -> Add as text? Maybe not.
                continue

            # Compte match
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
            # Try to get parent description?
            # User said: "adapte la définition... remets pas tout... logique".
            # If empty, maybe better to say "Voir compte parent" rather than copy-pasting the parent?
            # Or copy parent ONLY if parent description is short?

            # The prompt requirement "Zero Undefined" says: "affiche la définition du compte parent ou de la classe".
            # So I MUST show something.
            # But the user complains about "gros pavé".

            # Compromise: Inherit, but prepend a marker.
            # And since we improved parsing, hopefully specific accounts have text now.

            curr = data
            while curr['parent'] and not curr['description']:
                parent_id = curr['parent']
                if parent_id in accounts:
                    curr = accounts[parent_id]
                    if curr['description']:
                        data['description'] = f"(Définition générale du compte {parent_id}) {curr['description']}"
                        break
                else:
                    break

            if not data['description']:
                data['description'] = "Aucune définition spécifique disponible."

def generate_example(account):
    acc_id = account['id']
    cls = acc_id[0]
    debit = "Divers"
    credit = "Divers"
    amount = "1000 €"
    desc = "Opération type"

    # Logic refinements
    if cls == '2':
        if acc_id.startswith('28'):
            debit = "681 Dotations aux amortissements"
            credit = f"{acc_id} {account['label']}"
            desc = "Dotation aux amortissements"
        elif acc_id.startswith('29'):
            debit = "681 Dotations aux dépréciations"
            credit = f"{acc_id} {account['label']}"
            desc = "Dotation aux dépréciations"
        else:
            debit = f"{acc_id} {account['label']}"
            credit = "404 Fournisseurs d'immobilisations"
            desc = "Acquisition d'immobilisation"

    # ... (Keep existing simple logic for others, or expand if needed)
    elif cls == '6':
        debit = f"{acc_id} {account['label']}"
        credit = "401 Fournisseurs"
        desc = "Constatation de la charge"
    elif cls == '7':
        debit = "411 Clients"
        credit = f"{acc_id} {account['label']}"
        desc = "Constatation du produit"

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
