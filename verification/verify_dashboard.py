from playwright.sync_api import sync_playwright
import json
import os

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page()

    # page.on("console", lambda msg: print(f"CONSOLE: {msg.text}"))

    def handle_route(route):
        url = route.request.url
        if "script.google.com" in url:
            # print(f"Intercepted API: {url}")
            response = {
                "success": True,
                "chats": [
                    {
                        "id": "chat1",
                        "names": "Test Conversation",
                        "expiresAt": None,
                        "lastMessage": {"sender": "other@mail.com", "senderName": "Bob", "content": "Hello world", "timestamp": "2023-01-01T12:00:00Z"}
                    }
                ],
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

    # Wait for chat list
    page.wait_for_selector(".chat-card", timeout=5000)

    # Verify Logo
    logo = page.locator("#dashboard-logo-img")
    if logo.is_visible():
        print("VERIFIED: Logo is visible.")
    else:
        print("FAILED: Logo is NOT visible.")

    # Verify Delete Button
    chat_card = page.locator(".chat-card").first
    delete_btn = chat_card.locator(".chat-delete-btn")
    if delete_btn.is_visible():
        print("VERIFIED: Delete button is visible.")
    else:
        print("FAILED: Delete button is NOT visible.")

    # Check styling of Delete Button (trash icon)
    # It should have the class chat-delete-btn

    page.screenshot(path="/home/jules/verification/verification.png")

    browser.close()

if __name__ == "__main__":
    with sync_playwright() as playwright:
        run(playwright)
