from playwright.sync_api import sync_playwright
import time

def test_pages():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()

        errors = []
        page.on("console", lambda msg: errors.append(f"Console {msg.type}: {msg.text}") if msg.type == "error" else None)
        page.on("pageerror", lambda err: errors.append(f"Page Error: {err}"))

        pages = ["index.html", "setup.html", "admin.html", "emergency.html", "vault.html", "testament.html"]

        for p_name in pages:
            print(f"Testing {p_name}...")
            # Set sessionStorage mock for pages that need it
            if p_name == "admin.html":
                page.goto("http://localhost:8000/index.html")
                page.evaluate("sessionStorage.setItem('ak', 'dummy')")
            elif p_name == "emergency.html":
                page.goto("http://localhost:8000/index.html")
                page.evaluate("sessionStorage.setItem('ek', 'dummy')")
            elif p_name == "vault.html":
                page.goto("http://localhost:8000/index.html")
                page.evaluate("sessionStorage.setItem('vk', 'dummy')")
            elif p_name == "testament.html":
                page.goto("http://localhost:8000/index.html")
                page.evaluate("sessionStorage.setItem('tk', 'dummy')")

            page.goto(f"http://localhost:8000/{p_name}")
            page.wait_for_load_state("networkidle")
            time.sleep(1)

        browser.close()

        if errors:
            print("Errors found:")
            for e in errors:
                print(e)
        else:
            print("No F12 errors found!")

if __name__ == "__main__":
    test_pages()
