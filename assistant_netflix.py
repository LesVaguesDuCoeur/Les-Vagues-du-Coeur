import time
import os
import sys

def afficher_guide():
    print("\n" + "="*40)
    print("CHARGEMENT DU GUIDE...")
    print("="*40 + "\n")
    try:
        with open("GUIDE_NETFLIX_HORS_LIGNE.md", "r", encoding="utf-8") as f:
            print(f.read())
    except FileNotFoundError:
        print("Erreur: Le fichier GUIDE_NETFLIX_HORS_LIGNE.md est introuvable.")
    print("\n" + "="*40 + "\n")

def main():
    print("========================================")
    print("   ASSISTANT NETFLIX HORS-LIGNE (PC)    ")
    print("========================================")
    print("Cet assistant vous aide à configurer Netflix hors ligne.")
    print("Rappel: Le téléchargement direct (crack) est illégal.")
    print("Ce programme vous guide vers les solutions officielles.\n")

    print("1. Lire le guide complet (Explications)")
    print("2. Voir les liens (BlueStacks / Microsoft Store)")
    print("3. Quitter")

    try:
        # Support for non-interactive environments or piped input
        if sys.stdin.isatty():
            choix = input("\nVotre choix (1-3): ")
        else:
            # If not a TTY (e.g. running in a test without input), default to showing help or read from pipe
             # Read one line from stdin if available
            input_data = sys.stdin.read().strip()
            if input_data:
                choix = input_data
            else:
                # Default behavior if no input provided
                print("\n[Mode non-interactif détecté, affichage des liens par défaut]")
                choix = '2'

    except EOFError:
        choix = '3'

    if choix == '1':
        afficher_guide()
    elif choix == '2':
        print("\n--- LIENS UTILES ---")
        print("1. BlueStacks (Pour émuler Android sur PC - Recommandé):")
        print("   -> https://www.bluestacks.com/")
        print("\n2. Netflix (Application Windows Officielle):")
        print("   -> https://apps.microsoft.com/store/detail/netflix/9WZDNCRFJ3TJ")
        print("--------------------\n")
    elif choix == '3':
        print("Au revoir !")
    else:
        print(f"Choix '{choix}' invalide.")

if __name__ == "__main__":
    main()
