from playwright.sync_api import sync_playwright
import json
import os

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page()

    # Mock API to allow registration flow
    def handle_route(route):
        url = route.request.url
        if "script.google.com" in url:
            request = route.request
            post_data = request.post_data_json if request.post_data else {}
            action = post_data.get('action') if post_data else 'unknown'

            if action == 'register':
                # Return success
                response = {
                    "success": True,
                    "token": "test-token",
                    "user": {"firstName": "TestUser", "email": "test@test.com", "isAdmin": False, "canCreate": False}
                }
                route.fulfill(status=200, content_type="application/json", body=json.dumps(response), headers={"Access-Control-Allow-Origin": "*"})
            else:
                 route.fulfill(status=200, content_type="application/json", body=json.dumps({"success":True}), headers={"Access-Control-Allow-Origin": "*"})

        else:
            route.continue_()

    page.route("**", handle_route)

    cwd = os.getcwd()
    url = f"file://{cwd}/netlify/index.html"
    page.goto(url)

    # Click "Créer un compte"
    page.click("text=Créer un compte")

    # Check if "Confirmer Mot de passe" exists
    confirm_input = page.locator("#reg-code-confirm")
    if confirm_input.is_visible():
        print("VERIFIED: Confirm password input is visible.")
    else:
        print("FAILED: Confirm password input is missing.")

    # Type password and check gauge
    reg_code = page.locator("#reg-code")
    reg_code.fill("123")

    # Check gauge visibility (should be visible after input?)
    # Logic: if (!password) hidden. So now it should be visible.
    gauge_container = page.locator("#password-strength-container")
    if gauge_container.is_visible():
        print("VERIFIED: Password gauge is visible after typing.")
    else:
        print("FAILED: Password gauge is NOT visible.")

    # Check text update
    # 123 -> Length 3 -> Score 0 -> Faible
    strength_text = page.locator("#password-strength-text").inner_text()
    print(f"Strength text for '123': {strength_text}")

    # Strong password
    reg_code.fill("StrongP@ss1")
    strength_text = page.locator("#password-strength-text").inner_text()
    print(f"Strength text for 'StrongP@ss1': {strength_text}")

    # Check if mismatch prevents submission
    # We need to spy on window.alert or the modal.
    # The app uses app.showError -> showModal.

    page.fill("#reg-firstname", "Test")
    page.fill("#reg-email", "test@test.com")
    page.fill("#reg-code", "password")
    page.fill("#reg-code-confirm", "mismatch")

    page.click("#form-register button[type=submit]")

    # Check for modal error
    modal = page.locator("#modal-box")
    page.wait_for_selector("#modal-box", timeout=2000)
    msg = modal.locator(".modal-message").inner_text()
    print(f"Modal Message on mismatch: {msg}")

    page.screenshot(path="/home/jules/verification/verify_password.png")

    browser.close()

if __name__ == "__main__":
    with sync_playwright() as playwright:
        run(playwright)
