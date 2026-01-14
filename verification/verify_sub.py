from playwright.sync_api import sync_playwright
import os
import time

def verify_frontend():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Simulate Admin User
        page.add_init_script("""
            localStorage.setItem('wh_user', JSON.stringify({
                email: 'admin@test.com',
                firstName: 'AdminTest',
                token: 'dummy',
                isAdmin: true,
                canCreate: true,
                isSubscriber: true
            }));
        """)

        cwd = os.getcwd()
        page.goto(f"file://{cwd}/netlify/index.html")

        # Open Admin Panel (Mock function call since we can't click the protected avatar easily without setup)
        # Actually, let's try to click the avatar or just execute the showAdmin
        page.evaluate("app.showAdmin()")

        # Switch to Abos tab
        page.click("button[data-tab='subscriptions']")

        # Wait a bit
        time.sleep(1)

        # Check if the modal exists in the DOM
        modal = page.query_selector("#edit-sub-modal")
        if modal:
            print("Edit Modal found in DOM.")
        else:
            print("Edit Modal NOT found.")

        page.screenshot(path="verification/admin_subs.png")
        print("Screenshot taken.")
        browser.close()

if __name__ == "__main__":
    verify_frontend()
