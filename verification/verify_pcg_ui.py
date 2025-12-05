from playwright.sync_api import sync_playwright

def verify_frontend():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Load the local HTML file
        page.goto("file:///app/index.html")

        # 1. Search for a TVA account that we know has complex examples
        page.fill("#search-input", "44566")

        # Wait for tree to update
        page.wait_for_timeout(500)

        # Click on the result in the tree
        # The tree node ID is dynamic based on our JS, it's `node-content-44566`
        page.click("#node-content-44566")

        # Wait for detail view to appear
        page.wait_for_selector("#detail-view")

        # Check if the example table is populated
        # We expect a row with "401 Fournisseurs" and "60... Achats" or similar
        content = page.content()
        if "401 Fournisseurs" in content:
            print("Found 401 Fournisseurs in the page content.")
        else:
            print("Did NOT find 401 Fournisseurs.")

        # Take a screenshot of the detail view
        page.screenshot(path="verification/screenshot.png")

        browser.close()

if __name__ == "__main__":
    verify_frontend()
