#!/usr/bin/env python3
"""
Instagram Reel Scraper - Main Entry Point
Runs both part 1 (URL scraping) and part 2 (metrics scraping) in sequence.
"""

import subprocess
import sys
import argparse

def run_command(command, description):
    """Run a shell command and stream output."""
    print(f"\n{'='*70}")
    print(f"  {description}")
    print(f"{'='*70}\n")
    
    try:
        process = subprocess.Popen(
            command,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            bufsize=1
        )
        
        for line in process.stdout:
            print(line, end='')
        
        process.wait()
        
        if process.returncode != 0:
            print(f"\n❌ {description} failed with exit code {process.returncode}")
            return False
        
        print(f"\n✅ {description} completed successfully!")
        return True
        
    except Exception as e:
        print(f"\n❌ Error running {description}: {e}")
        return False

def main():
    parser = argparse.ArgumentParser(description='Run Instagram Reel Scraper')
    parser.add_argument(
        '--users',
        nargs='+',
        help='Instagram usernames to scrape (e.g., --users user1 user2 user3)'
    )
    
    args = parser.parse_args()
    
    print("╔═══════════════════════════════════════════════════════════════════╗")
    print("║        Instagram Reel Scraper - Automated Workflow               ║")
    print("╚═══════════════════════════════════════════════════════════════════╝")
    
    # Step 1: Scrape URLs
    step1_cmd = [sys.executable, 'part_1_scrape_urls.py']
    if args.users:
        step1_cmd.extend(['--users'] + args.users)
    
    if not run_command(step1_cmd, "STEP 1: Scraping Reel URLs"):
        print("\n⚠️  Scraping stopped due to error in Step 1")
        sys.exit(1)
    
    # Step 2: Get Metrics
    step2_cmd = [sys.executable, 'part_2_get_metrics.py']
    
    if not run_command(step2_cmd, "STEP 2: Fetching Reel Metrics"):
        print("\n⚠️  Scraping stopped due to error in Step 2")
        sys.exit(1)
    
    print("\n" + "="*70)
    print("🎉 ALL SCRAPING COMPLETED SUCCESSFULLY!")
    print("="*70)
    print("\n📊 Your data is ready in the 'data/' folder:")
    print("   • {username}_reels_metrics.csv - Metrics for each user")
    print("   • scrape_history.csv - Follower tracking history")
    print("\n💡 View your data in the dashboard at: http://localhost:5000")
    print("="*70 + "\n")

if __name__ == "__main__":
    main()
