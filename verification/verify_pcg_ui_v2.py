from playwright.sync_api import sync_playwright

def verify_frontend():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Load the local HTML file
        page.goto("file:///app/index.html")

        # 1. Search for Account 101 to verify multiple examples
        page.fill("#search-input", "101")
        page.wait_for_timeout(500)
        page.click("#node-content-101")
        page.wait_for_selector("#detail-view")

        # Verify multiple examples exist
        content = page.content()
        if "Souscription du capital" in content and "Libération du capital" in content:
            print("Verified multiple examples for Account 101.")
        else:
            print("FAILED to verify multiple examples for Account 101.")

        # 2. Verify Accordion Logic
        # Expand Class 2
        page.fill("#search-input", "") # Clear search
        page.click("#node-content-2 span.w-4") # Click the toggle icon
        page.wait_for_timeout(300)

        # Expand Class 3 (Class 2 should collapse)
        page.click("#node-content-3 span.w-4")
        page.wait_for_timeout(300)

        # Check visibility
        # Class 2 children should NOT be visible
        # Class 3 children SHOULD be visible

        # Take a screenshot
        page.screenshot(path="verification/screenshot_v2.png")

        browser.close()

if __name__ == "__main__":
    verify_frontend()
