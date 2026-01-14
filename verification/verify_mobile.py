from playwright.sync_api import sync_playwright
import json
import os

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    # Simulate Pixel 5
    page = browser.new_page(
        viewport={"width": 393, "height": 851},
        user_agent="Mozilla/5.0 (Linux; Android 11; Pixel 5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.91 Mobile Safari/537.36"
    )

    def handle_route(route):
        url = route.request.url
        if "script.google.com" in url:
            response = {
                "success": True,
                "chats": [],
                "user": {"firstName": "Admin", "isAdmin": True, "canCreate": True}
            }
            route.fulfill(status=200, content_type="application/json", body=json.dumps(response), headers={"Access-Control-Allow-Origin": "*"})
        else:
            route.continue_()

    page.route("**", handle_route)

    user = {
        "email": "chaouiengage@gmail.com",
        "firstName": "Admin",
        "isAdmin": True,
        "canCreate": True,
        "token": "test-token"
    }

    page.add_init_script(f"""
        localStorage.setItem('wh_user', '{json.dumps(user)}');
    """)

    cwd = os.getcwd()
    url = f"file://{cwd}/netlify/index.html"
    page.goto(url)

    # Wait for dashboard
    page.wait_for_selector("#view-dashboard.active", timeout=5000)

    # Verify dashboard logo removal
    dash_logo = page.locator("#dashboard-logo-img")
    if not dash_logo.is_visible():
         print("VERIFIED: Dashboard logo is NOT present/visible.")
    else:
         print("FAILED: Dashboard logo is visible.")

    # Verify Support Icon
    support_btn = page.locator("#btn-contact-fab")
    if support_btn.is_visible():
        text = support_btn.inner_text()
        print(f"Support Button Text/Icon: {text}")
        if "✉️" in text:
             print("VERIFIED: Support icon is envelope.")
        else:
             print("FAILED: Support icon is NOT envelope.")

    page.screenshot(path="/home/jules/verification/mobile_verify.png")

    browser.close()

if __name__ == "__main__":
    with sync_playwright() as playwright:
        run(playwright)
