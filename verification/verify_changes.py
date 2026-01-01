from playwright.sync_api import sync_playwright
import os

def verify_frontend():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Load the index.html
        cwd = os.getcwd()
        page.goto(f"file://{cwd}/index.html")

        # Click Nav Admin
        page.click("#nav-admin")

        # Wait for login
        page.wait_for_selector("#admin-code", state="visible")
        page.fill("#admin-code", "15112000")
        page.click("#login-btn")

        # Wait for the view-admin to become visible
        page.wait_for_selector("#view-admin:not(.hidden-view)", state="visible")

        # Create a new recipe
        page.click("button:has-text('Nouvelle Recette')")
        page.wait_for_selector("#editor-modal:not(.hidden)", state="visible")

        # Add Title
        page.fill("#edit-title", "Test Recipe for Sync")

        # Click "Ajouter Ingrédient" (the text in HTML is "+ Ajouter Ingrédient")
        page.click("button:has-text('+ Ajouter Ingrédient')")
        page.wait_for_selector(".ing-row", state="visible")

        # Add Step
        page.select_option("#editor-mode", "steps")
        page.click("button:has-text('+ Ajouter Étape')")
        page.wait_for_selector(".step-row", state="visible")

        # Take Screenshot of Editor
        page.screenshot(path="verification/verification_editor.png")

        # Save
        page.click("button:has-text('Sauvegarder')")

        # Wait for list update
        page.wait_for_selector(".admin-recipe-row", state="visible")
        page.screenshot(path="verification/verification_admin_list.png")

        browser.close()

if __name__ == "__main__":
    verify_frontend()
