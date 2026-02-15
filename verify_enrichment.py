import pandas as pd
import random

FILE = "experts_comptables_paris_complete.xlsx"

try:
    df = pd.read_excel(FILE)
    print(f"Loaded {len(df)} rows.")

    # 1. Stats
    print("\nColumn Fill Rate:")
    print(df.count())

    # 2. Gender Consistency
    print("\nGender Distribution:")
    print(df['Madame/Monsieur'].value_counts())

    invalid_genders = df[~df['Madame/Monsieur'].isin(['Monsieur', 'Madame', '', pd.NA])]
    if not invalid_genders.empty:
        print(f"\nFound {len(invalid_genders)} invalid gender entries:")
        print(invalid_genders[['Madame/Monsieur', 'Prenom']].head())
    else:
        print("\nAll gender entries are valid (Monsieur/Madame).")

    # 3. Job Title Consistency
    print("\nJob Title Check:")
    females = df[df['Madame/Monsieur'] == 'Madame']
    female_expertes = females[females['Nom du métier'].str.contains('Experte', na=False)]
    print(f"Females with 'Experte': {len(female_expertes)}/{len(females)}")

    female_experts = females[~females['Nom du métier'].str.contains('Experte', na=False)]
    if not female_experts.empty:
        print(f"Females WITHOUT 'Experte': {len(female_experts)}")
        print(female_experts[['Nom du cabinet', 'Nom du métier']].head())

    # 4. Enriched Data Check
    print("\nEnriched Data Check:")
    sites = df['Site internet'].notna().sum()
    mails = df['Mail'].notna().sum()
    print(f"Sites: {sites} ({sites/len(df)*100:.1f}%)")
    print(f"Mails: {mails} ({mails/len(df)*100:.1f}%)")

    # Check for suspicious domains
    if 'Site internet' in df.columns:
        suspicious = []
        for idx, row in df.iterrows():
            site = str(row['Site internet'])
            if pd.isna(row['Site internet']) or site == 'nan' or site == '':
                continue
            if any(x in site for x in ['fandom.com', 'reddit.com', 'coinmarketcap.com', 'datalounge.com']):
                suspicious.append((row['Nom du cabinet'], site))

        if suspicious:
            print(f"\nFound {len(suspicious)} suspicious sites:")
            for s in suspicious:
                print(s)

    # 5. Sample
    print("\nSample Rows:")
    print(df[['Nom du cabinet', 'Madame/Monsieur', 'Nom du métier', 'Site internet', 'Mail']].sample(5))

except FileNotFoundError:
    print(f"File {FILE} not found yet.")
except Exception as e:
    print(f"Error: {e}")
