from playwright.sync_api import sync_playwright
import os

def verify_editor_features():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        cwd = os.getcwd()
        page.goto(f"file://{cwd}/index.html")

        # Login
        page.click("#nav-admin")
        page.fill("#admin-code", "15112000")
        page.keyboard.press("Enter")

        # Open Editor
        page.click("button:has-text('Nouvelle Recette')")

        # Add Ingredients
        page.click("button:has-text('+ Ajouter Ingrédient')")
        page.click("button:has-text('+ Ajouter Ingrédient')")

        # Verify Drag Handles in Ingredients
        handles = page.query_selector_all(".ing-row .drag-handle")
        if len(handles) >= 2:
            print("SUCCESS: Ingredient Drag Handles found.")
        else:
            print("FAILURE: Ingredient Drag Handles missing.")

        # Switch to Steps
        page.select_option("#editor-mode", "steps")
        page.click("button:has-text('+ Ajouter Étape')")
        page.click("button:has-text('+ Ajouter Étape')")

        # Verify Drag Handles in Steps
        handles = page.query_selector_all(".step-row .drag-handle")
        if len(handles) >= 2:
            print("SUCCESS: Step Drag Handles found.")
        else:
            print("FAILURE: Step Drag Handles missing.")

        # Test Esc key
        page.keyboard.press("Escape")
        page.wait_for_timeout(500)
        is_hidden = page.evaluate("document.getElementById('editor-modal').classList.contains('hidden')")
        if is_hidden:
            print("SUCCESS: Esc key closed modal.")
        else:
            print("FAILURE: Esc key did NOT close modal.")

        browser.close()

if __name__ == "__main__":
    verify_editor_features()
