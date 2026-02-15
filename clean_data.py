import pandas as pd
import sys
import html

# Common French names
GENDERS = {
    # Female
    'marie': 'Mme', 'nathalie': 'Mme', 'isabelle': 'Mme', 'sylvie': 'Mme', 'catherine': 'Mme',
    'martine': 'Mme', 'christine': 'Mme', 'françoise': 'Mme', 'valérie': 'Mme', 'sandrine': 'Mme',
    'véronique': 'Mme', 'sophie': 'Mme', 'céline': 'Mme', 'chantal': 'Mme', 'patricia': 'Mme',
    'anne': 'Mme', 'nicole': 'Mme', 'monique': 'Mme', 'béatrice': 'Mme', 'stéphanie': 'Mme',
    'caroline': 'Mme', 'hélène': 'Mme', 'michelle': 'Mme', 'aurélie': 'Mme', 'christelle': 'Mme',
    'laurence': 'Mme', 'annie': 'Mme', 'brigitte': 'Mme', 'julie': 'Mme', 'elodie': 'Mme',
    'dominique': 'Mme', # Ambiguous but often female in older generations? Or keep ambiguous.
    'camille': 'Mme', # Ambiguous
    'claire': 'Mme', 'corinne': 'Mme', 'elisabeth': 'Mme', 'karine': 'Mme', 'florence': 'Mme',
    'virginie': 'Mme', 'nadine': 'Mme', 'danielle': 'Mme', 'micheline': 'Mme', 'simone': 'Mme',

    # Male
    'jean': 'M.', 'michel': 'M.', 'alain': 'M.', 'pierre': 'M.', 'philippe': 'M.',
    'patrick': 'M.', 'nicolas': 'M.', 'christophe': 'M.', 'laurent': 'M.', 'olivier': 'M.',
    'daniel': 'M.', 'eric': 'M.', 'frédéric': 'M.', 'david': 'M.', 'bertrand': 'M.',
    'thierry': 'M.', 'pascal': 'M.', 'dominique': 'M.', # Ambiguous
    'gérard': 'M.', 'bernard': 'M.', 'christian': 'M.', 'jacques': 'M.', 'didier': 'M.',
    'stéphane': 'M.', 'sébastien': 'M.', 'bruno': 'M.', 'marc': 'M.', 'vincent': 'M.',
    'guillaume': 'M.', 'julien': 'M.', 'thomas': 'M.', 'alexandre': 'M.', 'benoît': 'M.',
    'françois': 'M.', 'gilles': 'M.', 'guy': 'M.', 'serge': 'M.', 'yves': 'M.',
    'jean-pierre': 'M.', 'jean-luc': 'M.', 'jean-claude': 'M.', 'jean-marc': 'M.',
    'jean-michel': 'M.', 'jean-paul': 'M.', 'jean-françois': 'M.', 'jean-louis': 'M.',
    'lionel': 'M.', 'mathieu': 'M.', 'matthieu': 'M.', 'jerome': 'M.', 'arnaud': 'M.'
}

def guess_gender(prenom):
    if not isinstance(prenom, str):
        return ""
    p = prenom.split()[0].lower() # Take first part if composite? Or use full string
    return GENDERS.get(p, "")

def main():
    infile = "experts_comptables_paris.xlsx"
    outfile = "experts_comptables_paris_cleaned.xlsx"

    try:
        df = pd.read_excel(infile)

        # Deduplicate
        initial_len = len(df)
        # Drop duplicates where phone is present
        # We need to treat NaNs as unique (not duplicates)
        # One way: subset valid phones, dedup, then concat with NaNs

        valid_phones = df[df['Numéro de téléphone'].notna()]
        invalid_phones = df[df['Numéro de téléphone'].isna()]

        valid_phones_dedup = valid_phones.drop_duplicates(subset=['Numéro de téléphone'])

        df_clean = pd.concat([valid_phones_dedup, invalid_phones])

        print(f"Removed {initial_len - len(df_clean)} duplicates based on phone number.")

        # Guess Gender
        # Iterate and fill if empty
        mask = df_clean['Madame/Monsieur'].isna() | (df_clean['Madame/Monsieur'] == "")

        df_clean.loc[mask, 'Madame/Monsieur'] = df_clean.loc[mask, 'Prenom'].apply(guess_gender)

        # Decode HTML entities in string columns
        string_cols = ['Nom du cabinet', 'Adresse', 'Ville', 'Nom de la personne en maj', 'Prenom']
        for col in string_cols:
            if col in df_clean.columns:
                df_clean[col] = df_clean[col].apply(lambda x: html.unescape(x) if isinstance(x, str) else x)

        # Ensure checkbox columns are filled with [ ]
        for col in ['Appelé', 'Mail envoyé']:
             df_clean[col] = df_clean[col].fillna('[ ]')
             df_clean.loc[df_clean[col] == "", col] = '[ ]'

        # Save
        df_clean.to_excel(outfile, index=False)
        print(f"Saved cleaned data to {outfile}")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    main()
