from playwright.sync_api import sync_playwright
import time

def verify_app():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 375, "height": 812})
        page = context.new_page()

        page.on("console", lambda msg: print(f"CONSOLE: {msg.text}"))
        page.on("pageerror", lambda exc: print(f"PAGE ERROR: {exc}"))

        try:
            # 1. Login
            page.goto("http://localhost:3000")
            page.click("#nav-admin")
            page.fill("#admin-code", "15112000")
            page.click("#login-btn")
            page.wait_for_selector("#view-admin")

            # 2. Create Recipe
            page.click("text=+ Nouvelle Recette")
            page.wait_for_selector("#editor-modal:not(.hidden)")
            page.fill("#edit-title", "Test Mobile Steps")

            # Add Ingredient
            if page.locator(".ing-row").count() == 0:
                 page.click("text=+ Ajouter Ingrédient")
            page.fill(".ing-group", "Base")
            page.fill(".ing-name", "Farine")
            page.fill(".ing-qty", "100")
            page.fill(".ing-unit", "g")

            # Switch Mode - Force event if needed
            page.select_option("#editor-mode", "steps")
            # Sometimes select_option doesn't trigger onchange in some headless contexts if focus is weird
            # We can force it
            page.evaluate("document.getElementById('editor-mode').dispatchEvent(new Event('change'))")

            # Wait for container
            page.wait_for_selector("#steps-container:not(.hidden)")

            # Add Step
            page.click("text=+ Ajouter Étape")

            # Type Step
            page.click(".step-editor")
            page.keyboard.type("Mix @Far", delay=100)

            # Mention
            page.wait_for_selector(".mention-item")
            page.click(".mention-item")

            # Save
            page.click("text=Sauvegarder")

            # 3. Client View
            page.click("#nav-client")
            page.wait_for_timeout(500)
            page.click(".recipe-card")

            page.wait_for_selector("#detail-modal:not(.hidden)")
            page.wait_for_timeout(1000)

            page.screenshot(path="verification_mobile.png", full_page=True)
            print("Success!")

        except Exception as e:
            print(f"Error: {e}")
            page.screenshot(path="debug_fail.png")

        finally:
            browser.close()

if __name__ == "__main__":
    verify_app()
