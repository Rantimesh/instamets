# Instagram Scraper Dashboard

## Overview

A full-stack analytics dashboard for scraping and analyzing Instagram reels data. The system combines Python-based web scraping with a modern React dashboard for visualization and analysis. It automates the collection of Instagram reel metrics (views, likes, comments) and provides comprehensive analytics across multiple creators.

The application consists of two main components:
1. **Python Scrapers**: Automated scripts using Playwright and Apify to collect Instagram data
2. **Web Dashboard**: React/TypeScript SPA for visualizing metrics and managing scraper operations

**Current Status**: Dashboard displays real analytics data from CSV files (she_is_ada_, 5thkind_) including 7 reels with actual views, likes, comments, captions, and hashtags. All pages show real data with transparent messaging for unavailable metrics (follower demographics, detailed run history).

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Technology Stack**: React 18 with TypeScript, built using Vite

**UI Framework**: Shadcn/ui component library with Radix UI primitives
- Design system follows "New York" style with utility-focused components
- Dark mode by default with light mode support via theme provider
- Tailwind CSS for styling with custom HSL color system

**State Management**:
- TanStack Query (React Query) for server state and API calls
- Local React state for UI-specific concerns
- No global state management library (Redux/Zustand) needed

**Routing**: Wouter for lightweight client-side routing

**Key Pages**:
- Dashboard: Overview analytics with real engagement rates, top hashtags, and follower growth charts
- Configuration: Scraper settings and credentials (file-based storage in /tmp/scraper_config)
- Scraper Control: Manual scraper execution with creator selection
- Reel Analytics: Real performance metrics calculated from CSV data (7 reels, 26.0% avg engagement)
- Followers: Creator list and reel counts; demographic data noted as unavailable from CSV scraper
- Video Tagging: Manual categorization with real reel data and "Tag Video" buttons
- Run History: Current status tracking; detailed history will be available when runs are persisted to database

**Component Architecture**:
- Atomic design with reusable UI components
- Separation of presentation (ui/) and business logic (pages/)
- Modal dialogs for user interactions (2FA, video tagging)

### Backend Architecture

**Technology Stack**: Express.js with TypeScript, running on Node.js

**Server Structure**:
- RESTful API design
- No authentication currently implemented (in-memory user storage exists but unused)
- Request/response logging middleware
- Error handling middleware

**API Endpoints**:
- `POST /api/scrape/run`: Triggers scraper with list of Instagram usernames
- `GET /api/scrape/status`: Returns current scraper execution status
- `GET /api/reels`: Fetches all reel data from CSV files

**Data Flow**:
1. Dashboard triggers scraper via API
2. Express spawns Python child processes
3. Python scripts scrape Instagram and write CSV files
4. API reads CSV files and serves data to frontend
5. Frontend displays real analytics calculated from CSV data

**Real Data Implementation**:
- All pages display actual metrics from CSV files
- Dashboard shows: 7 reels, 26.0% engagement, top hashtags (#trending, #music, #viral)
- Reel Analytics calculates: avg views (162), total reach (1.1K), top performer (258 views)
- Video Tagging shows real captions and metrics with functional "Tag Video" buttons
- Followers page shows 2 tracked creators with transparent messaging for unavailable demographics
- Run History shows current scraper status with note that detailed history requires database persistence

**CSV Ingestion System**:
- Reads CSV files from `data/` directory
- Parses reel metrics (likes, comments, views, captions, hashtags, mentions)
- Extracts Instagram IDs from URLs and usernames from filenames
- Column mapping: date, likes, views, comments, video_url, caption, hashtags, mentions
- Serves aggregated real data to frontend for all analytics pages
- Currently processing 2 creators (she_is_ada_, 5thkind_) with 7 total reels

**Scraper Orchestration**:
- Spawns Python scripts as child processes
- Monitors script output and logs
- Tracks scraper status (queued, running, fetching_metrics, completed, failed)
- Sequential execution: URLs first, then metrics

### Data Storage

**Current Implementation**: File-based CSV storage
- Python scripts write to `data/` directory
- CSV format with headers for reel metrics
- URL lists stored in `reel_urls/` directory

**Database Schema Defined** (Drizzle ORM):
The application has a complete PostgreSQL schema defined but not currently in use:
- `users`: User authentication (prepared but not implemented)
- `creators`: Instagram creator profiles with follower counts
- `reels`: Individual reel records with URLs and metadata
- `reel_metrics`: Time-series metrics for each reel
- `scrape_runs`: Execution history and logs

**Migration Path**: The system is designed to migrate from CSV files to PostgreSQL database using Drizzle ORM when needed.

### Python Scraping Pipeline

**Part 1 - URL Scraper** (`part_1_scrape_urls.py`):
- Uses Playwright for browser automation
- Logs into Instagram with credentials
- Handles 2FA authentication
- Scrolls creator profiles to discover reels
- Saves reel URLs to text files
- Session persistence for reduced login frequency

**Part 2 - Metrics Scraper** (`part_2_get_metrics.py`):
- Uses Instaloader for session management
- Leverages Apify API for data extraction
- Fetches detailed metrics (views, likes, comments)
- Retrieves captions, hashtags, mentions
- Outputs CSV files with timestamp
- Includes follower counts for creators

**Scraper Features**:
- Configurable via environment variables
- Maximum 10 creators per run
- Automatic retry and error handling
- Progress logging for monitoring

## External Dependencies

### Third-Party Services

**Apify**: Web scraping platform
- Used for reliable Instagram data extraction
- Requires API token
- Handles rate limiting and anti-bot detection
- Alternative to direct Instagram API access

**Instagram**: Source platform
- Requires valid account credentials
- Session cookies stored locally
- Subject to Instagram's rate limits and terms of service

### Python Libraries

- `playwright`: Browser automation for login and navigation
- `instaloader`: Instagram session management and authentication
- `apify-client`: Integration with Apify scraping service

### Node.js Dependencies

**Frontend**:
- `react` & `react-dom`: UI framework
- `@tanstack/react-query`: Server state management
- `wouter`: Lightweight routing
- `@radix-ui/*`: Headless UI primitives (dialogs, dropdowns, etc.)
- `tailwindcss`: Utility-first CSS framework
- `class-variance-authority` & `clsx`: Component styling utilities
- `zod`: Schema validation
- `date-fns`: Date formatting

**Backend**:
- `express`: Web server framework
- `drizzle-orm`: Type-safe SQL ORM
- `@neondatabase/serverless`: PostgreSQL driver (prepared for future use)
- `drizzle-zod`: Schema to Zod validation bridge
- `vite`: Development server and build tool

**Development**:
- `typescript`: Type checking
- `tsx`: TypeScript execution
- `esbuild`: Fast bundling for production
- `@replit/vite-plugin-*`: Replit-specific tooling

### Environment Configuration

Required secrets/environment variables:
- `INSTAGRAM_USERNAME`: Instagram login username
- `INSTAGRAM_PASSWORD`: Instagram login password
- `APIFY_TOKEN`: API key for Apify service
- `INSTALOADER_SESSION`: Instagram username for session file
- `DATABASE_URL`: PostgreSQL connection string (for future database migration)

### Infrastructure

**Development**: Designed to run on Replit
- Auto-configuration for Replit environment
- Custom Vite plugins for Replit features
- HMR configured for Replit's proxy setup

**Production Build**:
- Vite builds frontend to `dist/public`
- esbuild bundles backend to `dist/`
- Express serves static files in production

**Port Configuration**:
- Frontend dev server: 5173
- Backend API: 5000 (configurable)
- HMR through port 443 (Replit proxy)