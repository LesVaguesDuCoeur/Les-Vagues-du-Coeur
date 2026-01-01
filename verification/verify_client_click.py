from playwright.sync_api import sync_playwright
import os

def verify_client_click():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        cwd = os.getcwd()
        page.goto(f"file://{cwd}/index.html")

        # We need recipes to click on.
        # Since local file loading might fail due to lack of server/CORS for the "export?format=txt",
        # we manually inject recipes.
        page.evaluate("""
            recipes = [{
                id: '123',
                title: 'Test Recipe',
                image: '',
                ingredients: [],
                steps: [],
                baseServings: 4,
                mode: 'description',
                description: 'Desc'
            }];
            renderRecipeGrid();
        """)

        # Verify card exists
        page.wait_for_selector(".recipe-card")

        # Attempt Click
        page.click(".recipe-card")

        # Check if modal opened
        # .modal should not have .hidden class
        is_hidden = page.evaluate("document.getElementById('detail-modal').classList.contains('hidden')")

        if not is_hidden:
            print("SUCCESS: Client card click opened modal.")
        else:
            print("FAILURE: Client card click did NOT open modal.")
            # Debug: Check if any element is blocking
            # But Playwright 'click' usually auto-scrolls and checks visibility.
            # If it clicked and nothing happened, maybe JS error?

        page.screenshot(path="verification/client_click.png")
        browser.close()

if __name__ == "__main__":
    verify_client_click()
