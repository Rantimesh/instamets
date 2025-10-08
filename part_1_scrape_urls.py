import time
import json
import os
import asyncio
import sys
import io

from playwright.async_api import async_playwright

# Fix Unicode encoding for Windows compatibility
if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

# CONFIGURATION - HARDCODED FOR LOCAL USE
# WARNING: These credentials are hardcoded. Do not share this file or commit to public repositories.
INSTAGRAM_USERNAME = 'zebra.4500860'
INSTAGRAM_PASSWORD = 'Meshack@7474'

# LIST OF TARGET USERS (Maximum 10) - can be passed as argument
import argparse

TARGET_USERS = [
    'she_is_ada_',
    '_olasubomi_',
    '5thkind_'
]

SESSION_FILE = 'instagram_session.json'

MAX_SCROLL_ATTEMPTS = 50
SCROLL_WAIT_TIME = 2

# Create output folder for URLs
os.makedirs("reel_urls", exist_ok=True)

async def save_storage_state(context):
    """Saves the entire browser storage state (cookies, localStorage, etc.) to a file."""
    state = await context.storage_state()
    with open(SESSION_FILE, "w") as f:
        json.dump(state, f)
    print(f"💾 Session state saved to {SESSION_FILE}")

async def login_with_2fa(page):
    """Handles the Instagram login process, including 2FA."""
    print("🔐 Attempting to log in to Instagram...")
    await page.goto("https://www.instagram.com/accounts/login/", wait_until="domcontentloaded", timeout=45000)
    await page.wait_for_selector("input[name='username']", timeout=20000)
    await page.fill("input[name='username']", INSTAGRAM_USERNAME)
    await page.fill("input[name='password']", INSTAGRAM_PASSWORD)
    await page.click("button[type='submit']")
    print("⏳ Waiting for login to process...")
    await page.wait_for_timeout(5000)

    # --- Check for 2FA ---
    print("🔍 Checking for 2FA requirement...")
    if await page.locator("input[name='verificationCode']").is_visible():
        print("🔐 2FA required.")
        print("📝 Please enter your 2FA code in the console:")
        
        # Use asyncio's input method that works better in headless mode
        loop = asyncio.get_event_loop()
        verification_code = await loop.run_in_executor(None, input, "Enter 2FA code: ")
        
        await page.fill("input[name='verificationCode']", verification_code)
        await page.click("button[type='submit']")
        print("⏳ Verifying 2FA code...")
        await page.wait_for_timeout(5000)
        
        # Check if 2FA was successful
        try:
            await page.wait_for_selector('svg[aria-label="Search"]', timeout=30000)
            print("✅ 2FA completed successfully.")
        except:
            print("❌ 2FA verification failed. Please check your code and try again.")
            return False

    # --- After 2FA or regular login, navigate to Instagram homepage ---
    print("🔍 Navigating to Instagram homepage after login...")
    await page.goto("https://www.instagram.com/", wait_until="domcontentloaded", timeout=30000)
    await page.wait_for_timeout(3000)
    print("✅ Successfully navigated to Instagram homepage.")

    # --- Final check to confirm login was successful ---
    print("🔍 Performing final check for login success...")
    await page.wait_for_timeout(3000)
    search_icon = page.locator('svg[aria-label="Search"]').first
    if await search_icon.is_visible():
        print("✅ Logged in successfully.")
        return True
    else:
        print("❌ Login failed. The search bar is not visible.")
        return False

async def scroll_to_collect_reel_urls(page):
    """Scrolls the Reels tab to collect all unique Reel URLs."""
    print("📜 Scrolling to load all Reels...")
    seen_urls = set()
    scroll_attempts = 0
    no_new_urls_count = 0

    while scroll_attempts < MAX_SCROLL_ATTEMPTS:
        anchors = await page.query_selector_all("a[href*='/reel/']")
        new_urls = set()

        for a in anchors:
            href = await a.get_attribute("href")
            if href:
                if href.startswith("/reel/"):
                    new_urls.add("https://www.instagram.com" + href)
                elif "/reel/" in href:
                    new_urls.add(href)

        urls_before = len(seen_urls)
        seen_urls.update(new_urls)
        urls_after = len(seen_urls)

        if urls_after == urls_before:
            no_new_urls_count += 1
            if no_new_urls_count >= 3:
                print("✅ Reached end of Reels (no new URLs found after 3 scroll attempts).")
                break
        else:
            no_new_urls_count = 0

        await page.mouse.wheel(0, 5000)
        await asyncio.sleep(SCROLL_WAIT_TIME)
        scroll_attempts += 1

        if scroll_attempts % 5 == 0:
            print(f"📊 Progress: Found {len(seen_urls)} unique Reels so far (scroll attempt {scroll_attempts}/{MAX_SCROLL_ATTEMPTS})")

    print(f"🎯 Total Reels found: {len(seen_urls)}")
    return sorted(list(seen_urls))

async def scrape_user_reels(page, username):
    """Scrape reels for a specific user."""
    print(f"\n{'='*70}")
    print(f"🎯 SCRAPING USER: {username}")
    print(f"{'='*70}\n")
    
    reels_url = f"https://www.instagram.com/{username}/reels/"
    print(f"📍 Navigating to {reels_url}")
    
    try:
        await page.goto(reels_url, wait_until="domcontentloaded", timeout=30000)
        await page.wait_for_timeout(5000)
    except Exception as e:
        print(f"❌ Failed to navigate to {username}'s profile: {e}")
        return None

    print("🔍 Checking if the Reels tab has loaded content...")
    try:
        await page.wait_for_selector('section > main > div', timeout=30000)
        print("✅ Main content area is visible.")
        await page.wait_for_selector("a[href*='/reel/']", timeout=10000)
        print("✅ Found at least one Reel link. Proceeding with scraping.")
    except Exception as e:
        print(f"❌ Failed to find Reels on the page for {username}. Error: {e}")
        print(f"⚠️ User might have no reels or profile is private. Skipping...")
        return None

    urls = await scroll_to_collect_reel_urls(page)
    
    # Save to individual file
    output_file = f"reel_urls/{username}_reels.txt"
    with open(output_file, "w") as f:
        for url in urls:
            f.write(url + "\n")
    
    print(f"✅ Saved {len(urls)} Reel URLs to {output_file}")
    return len(urls)

async def scrape_reels():
    """Main function to orchestrate the scraping process."""
    # Validate user count
    if len(TARGET_USERS) > 10:
        print("❌ ERROR: Maximum 10 usernames allowed!")
        print(f"   You provided {len(TARGET_USERS)} usernames.")
        return
    
    if len(TARGET_USERS) == 0:
        print("❌ ERROR: No target users specified!")
        return
    
    print(f"🎯 Will scrape {len(TARGET_USERS)} user(s): {', '.join(TARGET_USERS)}\n")
    
    async with async_playwright() as p:
        print("🚀 Launching browser...")
        
        # Use Playwright's built-in browser (works on Windows)
        browser = await p.chromium.launch(
            headless=True,
            args=[
                '--disable-blink-features=AutomationControlled',
                '--no-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu',
                '--no-first-run',
                '--no-default-browser-check',
                '--disable-default-apps'
            ]
        )

        context_options = {
            'user_agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'viewport': {'width': 1920, 'height': 1080},
            'locale': 'en-US',
            'timezone_id': 'America/New_York'
        }

        if os.path.exists(SESSION_FILE):
            print("✅ Session state file found. Creating context from state.")
            context_options['storage_state'] = SESSION_FILE
            context = await browser.new_context(**context_options)
        else:
            print("❌ No session state file found. Starting fresh.")
            context = await browser.new_context(**context_options)

        await context.set_extra_http_headers({
            'Accept-Language': 'en-US,en;q=0.9',
            'Referer': 'https://www.instagram.com/'
        })

        page = await context.new_page()
        try:
            await page.goto("https://www.instagram.com/", wait_until="networkidle", timeout=60000)
            await page.wait_for_timeout(3000)
        except Exception as e:
            print(f"⚠️ Warning: Initial navigation failed: {e}")
            print("🔄 Retrying...")
            await page.goto("https://www.instagram.com/", wait_until="domcontentloaded", timeout=60000)

        search_icon = page.locator('svg[aria-label="Search"]').first
        if not await search_icon.is_visible():
            print("🔐 Session is invalid or expired. Proceeding with login.")
            if not await login_with_2fa(page):
                await browser.close()
                return
            await save_storage_state(context)
        else:
            print("✅ Session is valid. Logged in successfully.")

        # Scrape each user
        results = {}
        for username in TARGET_USERS:
            url_count = await scrape_user_reels(page, username)
            results[username] = url_count
            
            # Wait between users to avoid rate limiting
            if username != TARGET_USERS[-1]:  # Don't wait after last user
                print(f"⏳ Waiting 5 seconds before next user...")
                await page.wait_for_timeout(5000)
        
        await browser.close()
        
        # Print summary
        print(f"\n{'='*70}")
        print("📊 SCRAPING SUMMARY")
        print(f"{'='*70}")
        for username, count in results.items():
            if count is not None:
                print(f"✅ {username}: {count} reels")
            else:
                print(f"❌ {username}: Failed to scrape")
        print(f"{'='*70}\n")

if __name__ == "__main__":
    # Parse command-line arguments
    parser = argparse.ArgumentParser(description='Scrape Instagram reels URLs')
    parser.add_argument('--users', nargs='+', help='List of Instagram usernames to scrape')
    args = parser.parse_args()
    
    # Override TARGET_USERS if provided via command line
    if args.users:
        TARGET_USERS = args.users
        print(f"📋 Using usernames from command line: {', '.join(TARGET_USERS)}")
    
    asyncio.run(scrape_reels())
