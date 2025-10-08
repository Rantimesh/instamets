# Instagram Scraper Dashboard

A full-stack dashboard for scraping and analyzing Instagram reels data. The system consists of Python scrapers for data collection and a React/TypeScript dashboard for visualization.

## 🏗️ Project Structure

```
.
├── Scraper_Dashboard/          # Dashboard application
│   ├── client/                 # React frontend
│   ├── server/                 # Express backend
│   └── shared/                 # Shared TypeScript schemas
├── part_1_scrape_urls.py      # Python script to scrape reel URLs
├── part_2_get_metrics.py      # Python script to fetch reel metrics
├── data/                       # CSV output folder for metrics
├── reel_urls/                  # Text files with scraped URLs
└── requirements.txt            # Python dependencies
```

## 📋 Prerequisites

### For Local Development

- **Node.js** 20.x or higher
- **Python** 3.11 or higher
- **npm** or **yarn**
- **Chromium** browser (for Playwright)

### Credentials

**⚠️ IMPORTANT:** Credentials are hardcoded in the Python scripts for local use:
- `part_1_scrape_urls.py` contains Instagram username and password
- `part_2_get_metrics.py` contains Apify API token and Instaloader session

**Do not share these files or commit them to public repositories.**

## 🚀 Setup Instructions

### Running on Your Local Computer

#### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd <repo-name>
```

#### 2. Install Node.js Dependencies

```bash
cd Scraper_Dashboard
npm install
cd ..
```

#### 3. Install Python Dependencies

```bash
pip install -r requirements.txt
playwright install chromium
```

If Playwright browser dependencies fail on Linux:
```bash
sudo apt-get install libnss3 libnspr4 libatk1.0-0 \
  libatk-bridge2.0-0 libcups2 libdrm2 libxkbcommon0 \
  libgbm1 libpango-1.0-0 libcairo2 libasound2
```

#### 4. Start the Dashboard

**Note:** Credentials are already hardcoded in `part_1_scrape_urls.py` and `part_2_get_metrics.py`. 
If you need to change them, edit these files directly.

```bash
cd Scraper_Dashboard
npm run dev
```

The dashboard will be available at `http://localhost:5000`

## 📊 Using the Scraper

### Method 1: Via Dashboard UI

1. Open the dashboard
2. Navigate to "Scraper Control" page
3. Click "Start Scraper" button
4. Monitor progress in the status panel

### Method 2: Via Python Scripts Directly

#### Step 1: Scrape Reel URLs

```bash
# Credentials are hardcoded in the script
python3 part_1_scrape_urls.py
```

This will:
- Log into Instagram (may require 2FA - enter code in browser)
- Navigate to target users' profiles
- Scrape reel URLs
- Save to `reel_urls/{username}_reels.txt`

#### Step 2: Fetch Metrics

```bash
# Credentials are hardcoded in the script
python3 part_2_get_metrics.py
```

This will:
- Read URLs from `reel_urls/` folder
- Use Apify to scrape metrics (likes, comments, views)
- Use Instaloader for follower counts
- Save to `data/{username}_reels_metrics.csv`

### Method 3: Via API

```bash
# Start a scrape run
curl -X POST http://localhost:5000/api/scrape/run \
  -H "Content-Type: application/json" \
  -d '{"usernames": ["username1", "username2"]}'

# Check status
curl http://localhost:5000/api/scrape/status

# Get results
curl http://localhost:5000/api/reels
```

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/scrape/run` | Start scraper with target usernames |
| GET | `/api/scrape/status` | Get current scraper status |
| GET | `/api/reels` | Get all scraped reel metrics |
| GET | `/api/creators` | Get list of tracked creators |

## 📁 Output Files

### Reel URLs
- Location: `reel_urls/{username}_reels.txt`
- Format: One URL per line
- Example:
  ```
  https://www.instagram.com/reel/ABC123/
  https://www.instagram.com/reel/DEF456/
  ```

### Reel Metrics
- Location: `data/{username}_reels_metrics.csv`
- Format: CSV with headers
- Columns:
  - Creator
  - Reel URL
  - Likes
  - Comments
  - Views
  - Caption
  - Hashtags
  - Mentions
  - Video URL
  - Date Posted

## 🛠️ Development

### Run TypeScript Type Checking

```bash
cd Scraper_Dashboard
npm run check
```

### Build for Production

```bash
cd Scraper_Dashboard
npm run build
npm run start
```

## ⚙️ Configuration

### Target Users

Edit the `TARGET_USERS` list in `part_1_scrape_urls.py`:

```python
TARGET_USERS = [
    'she_is_ada_',
    '_olasubomi_',
    '5thkind_'
    # Add up to 10 usernames
]
```

### Scraper Settings

- `MAX_SCROLL_ATTEMPTS` (part_1): Maximum scrolls on profile (default: 50)
- `SCROLL_WAIT_TIME` (part_1): Seconds between scrolls (default: 2)

## 🐛 Troubleshooting

### Issue: Playwright browser won't start
**Solution**: Install system dependencies (see step 3 above)

### Issue: Instagram login fails
**Solution**: 
- Verify hardcoded credentials in `part_1_scrape_urls.py`
- Complete 2FA if prompted in the browser
- Check if Instagram is blocking automated access

### Issue: Apify scraping fails
**Solution**:
- Verify hardcoded `APIFY_TOKEN` in `part_2_get_metrics.py` is correct
- Check Apify account has sufficient credits
- Ensure URLs are valid Instagram reel links

### Issue: Dashboard won't start
**Solution**:
- Check Node.js version: `node --version` (should be 20+)
- Reinstall dependencies: `cd Scraper_Dashboard && npm install`
- Check port 5000 is available

### Issue: CSV files not found
**Solution**:
- Ensure scrapers ran successfully
- Check `data/` folder exists
- Verify file naming matches pattern: `{username}_reels_metrics.csv`

## 📝 Notes

- Instagram may require 2FA verification during login
- Apify credits are consumed per scrape
- Large profiles may take several minutes to scrape
- Rate limiting: Instagram may block excessive requests

## 🔒 Security

**⚠️ WARNING:** This project contains hardcoded credentials for local use only.
- **Do not** commit `part_1_scrape_urls.py` or `part_2_get_metrics.py` to public repositories
- **Do not** share these files with others
- Keep Instagram credentials secure
- Rotate API tokens periodically

## 📄 License

MIT
