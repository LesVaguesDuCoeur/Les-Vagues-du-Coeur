# Enrichment of Experts Comptables Data

This directory contains scripts to enrich the list of experts comptables.

## Files

*   `experts_comptables_paris.xlsx`: The original data file.
*   `experts_comptables_paris_complete.xlsx`: The enriched data file (Gender normalized, Job titles updated, Websites/Emails added where found).
*   `enrich_experts.py`: The main script to perform the enrichment.
*   `verify_enrichment.py`: A script to verify the quality of the data.

## Usage

1.  **Install dependencies**:
    ```bash
    pip install pandas openpyxl requests beautifulsoup4 duckduckgo-search gender-guesser
    ```

2.  **Run the enrichment script**:
    ```bash
    python enrich_experts.py
    ```
    This script will:
    *   Normalize "Madame/Monsieur" based on existing data or guess from the first name.
    *   Update "Nom du métier" to "Experte-comptable" for women.
    *   Search for missing "Site internet" and "Mail" using DuckDuckGo.
    *   Save progress to `experts_comptables_paris_complete.xlsx`.

    *Note: The search process can take time due to rate limiting and the number of queries. You can stop the script with `Ctrl+C` and restart it later; it will resume from where it left off.*

3.  **Verify the results**:
    ```bash
    python verify_enrichment.py
    ```
    This will print statistics about the data quality and check for potential issues.

## Logic Used

*   **Gender Normalization**: Uses `gender-guesser` library and a list of common French names.
*   **Web Search**: Uses strictly quoted queries to find official websites. Filters out directories (societe.com, pagesjaunes, etc.) and irrelevant domains.
*   **Email Extraction**: Scrapes found websites for `mailto:` links and email patterns in text.
