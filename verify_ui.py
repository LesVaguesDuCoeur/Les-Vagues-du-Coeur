from playwright.sync_api import sync_playwright

def verify_logo_and_ui():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Navigate to local server
        page.goto("http://localhost:8000")

        # Wait for Logo
        page.wait_for_selector("#app-logo")

        # Screenshot Login
        page.screenshot(path="verification_login.png")

        # Verify Buttons CSS (can't see them on login, but we can inspect style if we want)
        # We will assume they are there if the file was written.
        # But we can try to "Login" with fake data to see dashboard?
        # The app uses localStorage. If I set it, I can bypass login.

        page.evaluate("""
            localStorage.setItem('wh_user', JSON.stringify({
                firstName: 'TestUser',
                email: 'test@test.com',
                token: 'fake',
                isAdmin: true
            }));
        """)

        page.reload()
        page.wait_for_selector("#view-dashboard")

        # Screenshot Dashboard with FAB buttons
        page.screenshot(path="verification_dashboard.png")

        # Enter a chat view to see Delete Button
        page.evaluate("app.showView('view-chat')")
        page.screenshot(path="verification_chat.png")

        browser.close()

if __name__ == "__main__":
    verify_logo_and_ui()
