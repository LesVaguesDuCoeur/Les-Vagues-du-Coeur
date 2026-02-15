import pandas as pd
import sys

filename = "experts_comptables_paris.xlsx"
if len(sys.argv) > 1:
    filename = sys.argv[1]

try:
    df = pd.read_excel(filename)
    print(f"File: {filename}")
    print(f"Shape: {df.shape}")
    print("Columns:", df.columns.tolist())

    print("\nFirst 5 rows:")
    print(df.head(5).to_string())

    # Check duplicates in 'Numéro de téléphone' (ignoring NaN)
    phones = df['Numéro de téléphone'].dropna()
    dups = phones[phones.duplicated()]
    if not dups.empty:
        print(f"\nDuplicates found in phones (excluding NaN): {len(dups)}")
    else:
        print("\nNo duplicates found in phone numbers.")

    # Count non-empty Mail
    mails = df['Mail'].dropna()
    mails = mails[mails != ""]
    print(f"\nNon-empty Mail: {len(mails)}")

    # Count non-empty Site internet
    sites = df['Site internet'].dropna()
    sites = sites[sites != ""]
    print(f"\nNon-empty Site internet: {len(sites)}")

except Exception as e:
    print(f"Error: {e}")
