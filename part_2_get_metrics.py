import instaloader
import csv
import os
import glob
from datetime import datetime
from apify_client import ApifyClient

# 🔧 CONFIGURATION FROM ENVIRONMENT VARIABLES
APIFY_TOKEN = os.getenv('APIFY_TOKEN', '')
INSTALOADER_SESSION = os.getenv('INSTALOADER_SESSION', 'zebra.4500860')

# 📁 Ensure output folders exist
os.makedirs("data", exist_ok=True)
os.makedirs("reel_urls", exist_ok=True)

# 📅 Timestamp
now = datetime.now()
timestamp = now.strftime('%Y-%m-%d %H:%M')

def get_username_from_file(filename):
    """Extract username from filename like 'username_reels.txt'"""
    basename = os.path.basename(filename)
    return basename.replace('_reels.txt', '')

def scrape_user_metrics(username, urls):
    """Scrape metrics for a specific user's reels."""
    print(f"\n{'='*70}")
    print(f"🎯 SCRAPING METRICS FOR: {username}")
    print(f"{'='*70}\n")
    
    # 🔐 Load Instaloader session and get follower count
    L = instaloader.Instaloader()
    try:
        L.load_session_from_file(INSTALOADER_SESSION)
        profile = instaloader.Profile.from_username(L.context, username)
        followers = profile.followers
        print(f"✅ Loaded Instaloader session. Followers: {followers}")
    except Exception as e:
        print(f"❌ Instaloader failed for {username}: {e}")
        followers = "Unknown"

    # 🔌 Apify setup
    client = ApifyClient(APIFY_TOKEN)

    print(f"📊 Processing {len(urls)} Reel URLs for {username}")

    # 🚀 Run Apify actor
    run_input = {
        "username": [username],
        "postUrls": urls,
        "shouldDownloadPostUrlsOnly": True
    }

    print("🚀 Starting Apify scraper...")
    try:
        run = client.actor("apify/instagram-reel-scraper").call(run_input=run_input)
    except Exception as e:
        print(f"❌ Apify scraping failed for {username}: {e}")
        return None

    # 📦 Collect Reel metrics
    reels_data = []
    for item in client.dataset(run["defaultDatasetId"]).iterate_items():
        likes = item.get("likesCount", 0)
        comments = item.get("commentsCount", 0)
        views = item.get("videoViewCount", 0)
        caption = item.get("caption", "")
        hashtags = ', '.join(item.get("hashtags", []))
        mentions = ', '.join(item.get("mentions", []))
        video_url = item.get("videoUrl", "")
        
        # 📅 Try multiple date field names and formats
        date_posted = None
        
        for field_name in ['takenAt', 'timestamp', 'createdTime', 'postedAt', 'uploadDate', 'taken_at', 'created_time']:
            date_value = item.get(field_name)
            if date_value:
                try:
                    if isinstance(date_value, (int, float)):
                        date_posted = datetime.fromtimestamp(date_value).strftime('%Y-%m-%d')
                        break
                    elif isinstance(date_value, str):
                        if len(date_value) >= 10:
                            date_posted = date_value[:10]
                            break
                except Exception as e:
                    continue
        
        if not date_posted:
            date_posted = timestamp[:10]
        
        date = date_posted
        
        # Calculate estimated metrics
        saves = int(likes * 0.15)
        shares = int(likes * 0.10)
        engagement = round((likes + comments + saves + shares), 4)
        
        reels_data.append({
            'date': date,
            'likes': likes,
            'views': views,
            'comments': comments,
            'estimated_saves': saves,
            'estimated_shares': shares,
            'engagement_rate': engagement,
            'video_url': video_url,
            'caption': caption,
            'hashtags': hashtags,
            'mentions': mentions,
            'manual_tags': ''
        })

    print(f"✅ Scraped {len(reels_data)} Reels for {username}")

    # 📁 Save CSV: Reel Metrics (individual file per user)
    metrics_file = f"data/{username}_reels_metrics.csv"
    fieldnames = [
        'date', 'likes', 'views', 'comments', 'estimated_saves', 'estimated_shares',
        'engagement_rate', 'video_url', 'caption', 'hashtags', 'mentions', 'manual_tags'
    ]

    with open(metrics_file, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        for row in reels_data:
            writer.writerow(row)

    print(f"📁 Metrics saved to: {metrics_file}")
    
    return {
        'username': username,
        'followers': followers,
        'reels_scraped': len(reels_data),
        'csv_file': metrics_file
    }

def main():
    """Main function to process all users."""
    # Find all reel URL files
    url_files = glob.glob("reel_urls/*_reels.txt")
    
    if not url_files:
        print("❌ No reel URL files found in 'reel_urls/' folder!")
        print("   Please run part_1_scrape_urls.py first.")
        return
    
    print(f"📂 Found {len(url_files)} user(s) to process\n")
    
    results = []
    
    for url_file in url_files:
        username = get_username_from_file(url_file)
        
        # Load URLs
        with open(url_file, "r") as f:
            urls = [line.strip() for line in f if line.strip()]
        
        urls = [f"https://www.instagram.com{url}" if url.startswith("/") else url for url in urls]
        urls = [url for url in urls if "/reel/" in url]
        
        if not urls:
            print(f"⚠️ No valid URLs found for {username}, skipping...")
            continue
        
        # Scrape metrics
        result = scrape_user_metrics(username, urls)
        if result:
            results.append(result)
    
    # 📊 Save master scrape history
    history_file = "data/scrape_history.csv"
    history_fields = ['timestamp', 'username', 'followers', 'reels_scraped', 'csv_file']
    history_exists = os.path.exists(history_file)

    with open(history_file, 'a', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=history_fields)
        if not history_exists:
            writer.writeheader()
        for result in results:
            writer.writerow({
                'timestamp': timestamp,
                'username': result['username'],
                'followers': result['followers'],
                'reels_scraped': result['reels_scraped'],
                'csv_file': result['csv_file']
            })

    # Print final summary
    print(f"\n{'='*70}")
    print("📊 FINAL SUMMARY")
    print(f"{'='*70}")
    for result in results:
        print(f"✅ {result['username']}: {result['reels_scraped']} reels | {result['followers']} followers")
    print(f"\n📈 Master history logged to: {history_file}")
    print(f"{'='*70}\n")

if __name__ == "__main__":
    main()
