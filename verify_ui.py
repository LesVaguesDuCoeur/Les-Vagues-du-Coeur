import asyncio
from playwright.async_api import async_playwright

async def verify_feature():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        # Add video recording context
        context = await browser.new_context(record_video_dir="/home/jules/verification/video")
        page = await context.new_page()

        # Route block for external fonts/styles to speed up and avoid timeouts
        await page.route("**/*", lambda route: route.continue_() if not route.request.url.startswith("https://fonts") else route.abort())

        try:
            print("Navigating to index...")
            await page.goto("http://localhost:8000/index.html", wait_until="networkidle")
            await page.wait_for_timeout(500)

            print("Wait for setup link to appear since DB is empty...")
            setup_link = page.locator("#setup-link")
            await setup_link.wait_for(state="visible", timeout=5000)
            await page.wait_for_timeout(500)

            print("Clicking setup link...")
            await setup_link.locator("a").click()
            await page.wait_for_timeout(500)

            print("Waiting for setup page...")
            await page.wait_for_selector("#setup-form", state="visible")
            await page.wait_for_timeout(500)

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
            await page.wait_for_timeout(500)

            print("Submitting setup...")
            await page.click("button[type=submit]")
            await page.wait_for_timeout(500)

            print("Waiting for redirect back to index.html...")
            await page.wait_for_url("**/index.html", timeout=10000)
            await page.wait_for_timeout(500)

            print("Logging in as Admin...")
            await page.fill("#password", "AdminPass")
            await page.click("button[type=submit]")
            await page.wait_for_timeout(500)

            print("Waiting for redirect to admin.html...")
            await page.wait_for_url("**/admin.html", timeout=10000)
            await page.wait_for_selector("text=Panel d'Administration", state="visible")
            await page.wait_for_timeout(500)

            print("Navigating to Vault from Admin...")
            await page.locator("text=Accéder").nth(1).click()
            await page.wait_for_selector("text=Fiche Personnelle (Vault)", state="visible")
            await page.wait_for_timeout(500)

            # Test saving in vault
            print("Saving to Vault...")
            await page.fill("#vault-medical", "No allergies")
            await page.wait_for_timeout(500)
            await page.click("button[type=submit]")

            # Wait for toast
            await page.wait_for_selector(".toast.success", state="visible")
            await page.wait_for_timeout(1000)

            print("Taking screenshot...")
            await page.screenshot(path="/home/jules/verification/verification.png")
            await page.wait_for_timeout(1000)
            print("Success! Closing browser.")
        finally:
            await context.close()
            await browser.close()

if __name__ == "__main__":
    asyncio.run(verify_feature())
