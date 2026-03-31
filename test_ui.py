import asyncio
from playwright.async_api import async_playwright

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        # Route block for external fonts/styles
        await page.route("**/*", lambda route: route.continue_() if not route.request.url.startswith("https://fonts") else route.abort())

        print("Navigating to index...")
        await page.goto("http://localhost:8000/index.html", wait_until="networkidle")

        print("Wait for setup link to appear since DB is empty...")
        # Since it's a dynamic check, we should see the setup link
        setup_link = page.locator("#setup-link")
        await setup_link.wait_for(state="visible", timeout=5000)

        print("Clicking setup link...")
        await setup_link.locator("a").click()

        print("Waiting for setup page...")
        await page.wait_for_selector("#setup-form", state="visible")

        print("Filling setup form...")
        await page.fill("#email", "test@example.com")

        await page.fill("#pwd-contact", "ContactPass")
        await page.fill("#pwd-contact-confirm", "ContactPass")

        await page.fill("#pwd-admin", "AdminPass")
        await page.fill("#pwd-admin-confirm", "AdminPass")

        await page.fill("#pwd-vault", "VaultPass")
        await page.fill("#pwd-vault-confirm", "VaultPass")

        await page.fill("#pwd-testament", "TestPass")
        await page.fill("#pwd-testament-confirm", "TestPass")

        print("Submitting setup...")
        await page.click("button[type=submit]")

        print("Waiting for redirect back to index.html...")
        # wait for index.html load
        await page.wait_for_url("**/index.html", timeout=10000)

        print("Logging in as Admin...")
        await page.fill("#password", "AdminPass")
        await page.click("button[type=submit]")

        print("Waiting for redirect to admin.html...")
        await page.wait_for_url("**/admin.html", timeout=10000)
        await page.wait_for_selector("text=Panel d'Administration", state="visible")

        print("Navigating to Vault from Admin...")
        await page.locator("text=Accéder").nth(1).click()
        # Should bypass vault login
        await page.wait_for_selector("text=Fiche Personnelle (Vault)", state="visible")

        # Test saving in vault
        print("Saving to Vault...")
        await page.fill("#vault-medical", "No allergies")
        await page.click("button[type=submit]")
        # Wait for toast
        await page.wait_for_selector(".toast.success", state="visible")

        print("Success! Closing browser.")
        await browser.close()

if __name__ == "__main__":
    asyncio.run(run())
