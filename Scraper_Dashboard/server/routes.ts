import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { runScraper, getScraperStatus } from "./scraper";
import { findCSVFiles, parseCSV, extractInstagramId, parseFollowerData, parseLatestFollowerData, updateCSVTag } from "./csv-ingestion";
import { dataCache } from "./cache";
import { z } from "zod";
import { scraperConfigSchema, instagramCredentialsSchema } from "@shared/schema";
import path from "path";
import { fileURLToPath } from "url";
import { updateSchedule } from "./scheduler";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function registerRoutes(app: Express): Promise<Server> {
  app.post("/api/scrape/run", async (req, res) => {
    try {
      const schema = z.object({
        usernames: z.array(z.string()).min(1).max(10)
      });
      
      const { usernames } = schema.parse(req.body);
      
      runScraper(usernames).catch(console.error);
      
      res.json({ 
        success: true, 
        message: "Scraper started",
        runId: Date.now().toString()
      });
    } catch (error) {
      res.status(400).json({ 
        success: false, 
        error: error instanceof Error ? error.message : "Failed to start scraper" 
      });
    }
  });

  app.get("/api/scrape/status", async (req, res) => {
    const status = getScraperStatus();
    res.json(status || { status: 'idle', logs: [] });
  });

  app.get("/api/reels", async (req, res) => {
    try {
      const creator = req.query.creator as string | undefined;
      const cacheKey = creator ? `reels:${creator}` : 'reels:all';
      
      const allReels = await dataCache.get(
        cacheKey,
        async () => {
          const csvFiles = await findCSVFiles();
          const reels: any[] = [];

          for (const file of csvFiles) {
            const fileReels = await parseCSV(file);
            reels.push(...fileReels);
          }

          return reels;
        },
        await findCSVFiles()
      );

      // Filter by creator if specified
      const filteredReels = creator 
        ? allReels.filter((reel: any) => reel.username === creator)
        : allReels;

      res.json(filteredReels);
    } catch (error) {
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "Failed to fetch reels" 
      });
    }
  });

  app.get("/api/creators", async (req, res) => {
    try {
      const creators = await dataCache.get(
        'creators:all',
        async () => {
          const csvFiles = await findCSVFiles();
          const creatorSet = new Set<string>();

          for (const file of csvFiles) {
            const reels = await parseCSV(file);
            reels.forEach(reel => {
              if (reel.username) {
                creatorSet.add(reel.username);
              }
            });
          }

          return Array.from(creatorSet).map(username => ({ username }));
        },
        await findCSVFiles()
      );

      res.json(creators);
    } catch (error) {
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "Failed to fetch creators" 
      });
    }
  });

  app.get("/api/followers", async (req, res) => {
    try {
      const creator = req.query.creator as string | undefined;
      
      const followerData = await dataCache.get(
        'followers:all',
        async () => await parseFollowerData(),
        [path.resolve(__dirname, '..', '..', 'data', 'scrape_history.csv')]
      );

      // Filter by creator if specified
      const filteredData = creator
        ? followerData.filter((f: any) => f.username === creator)
        : followerData;

      res.json(filteredData);
    } catch (error) {
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "Failed to fetch follower data" 
      });
    }
  });

  app.get("/api/followers/latest", async (req, res) => {
    try {
      const creator = req.query.creator as string | undefined;
      
      const followerData = await dataCache.get(
        'followers:latest',
        async () => await parseLatestFollowerData(),
        [path.resolve(__dirname, '..', '..', 'data', 'scrape_history.csv')]
      );

      // Filter by creator if specified
      const filteredData = creator
        ? followerData.filter((f: any) => f.username === creator)
        : followerData;

      res.json(filteredData);
    } catch (error) {
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "Failed to fetch latest follower data" 
      });
    }
  });

  app.post("/api/config", async (req, res) => {
    try {
      const validatedConfig = scraperConfigSchema.parse(req.body);
      const config = await storage.saveConfig(validatedConfig);
      
      // Update scheduler with new configuration
      await updateSchedule(config.scheduleFrequency, config.targetUsername);
      
      res.json({ success: true, config });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ 
          error: "Invalid configuration data",
          details: error.errors
        });
      } else {
        res.status(500).json({ 
          error: error instanceof Error ? error.message : "Failed to save configuration" 
        });
      }
    }
  });

  app.get("/api/config", async (req, res) => {
    try {
      const config = await storage.getConfig();
      res.json(config || {
        targetUsername: "",
        scheduleFrequency: "24h",
        autoTag: false
      });
    } catch (error) {
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "Failed to fetch configuration" 
      });
    }
  });

  app.post("/api/credentials", async (req, res) => {
    try {
      const validatedCredentials = instagramCredentialsSchema.parse(req.body);
      const credentials = await storage.saveCredentials(validatedCredentials);
      res.json({ success: true, message: "Credentials saved successfully" });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ 
          error: "Invalid credentials data",
          details: error.errors
        });
      } else {
        res.status(500).json({ 
          error: error instanceof Error ? error.message : "Failed to save credentials" 
        });
      }
    }
  });

  app.get("/api/credentials", async (req, res) => {
    try {
      const credentials = await storage.getCredentials();
      res.json(credentials || {
        instagramUsername: "",
        instagramPassword: ""
      });
    } catch (error) {
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "Failed to fetch credentials" 
      });
    }
  });

  app.patch("/api/reels/:videoUrl(*)/tag", async (req, res) => {
    try {
      const { videoUrl } = req.params;
      const { tag } = req.body;
      
      if (!tag) {
        return res.status(400).json({ error: "Tag is required" });
      }

      // Decode URL and HTML entities
      let decodedVideoUrl = decodeURIComponent(videoUrl);
      // Replace HTML entities like &amp; with &
      decodedVideoUrl = decodedVideoUrl.replace(/&amp;/g, '&');
      console.log('Tagging reel with videoUrl:', decodedVideoUrl);
      
      // Find the CSV file containing this reel by matching the video_url
      const csvFiles = await findCSVFiles();
      let updated = false;
      let foundReel = false;

      for (const file of csvFiles) {
        const reels = await parseCSV(file);
        const matchingReel = reels.find(r => r.videoUrl === decodedVideoUrl);
        
        if (matchingReel) {
          foundReel = true;
          console.log('Found reel in file:', file);
          // Update the CSV file with the new tag using video_url as identifier
          updated = await updateCSVTag(file, decodedVideoUrl, tag);
          
          if (updated) {
            console.log('Tag updated successfully');
            // Invalidate cache immediately
            dataCache.invalidateAll();
            // Small delay to ensure file system updates modification time
            await new Promise(resolve => setTimeout(resolve, 10));
            break;
          }
        }
      }

      if (!foundReel) {
        console.log('Reel not found. Checked files:', csvFiles);
        console.log('Looking for videoUrl:', decodedVideoUrl);
      }

      if (updated) {
        res.json({ success: true, message: "Tag saved successfully" });
      } else {
        res.status(404).json({ error: "Reel not found", videoUrl: decodedVideoUrl });
      }
    } catch (error) {
      console.error('Error in tag route:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "Failed to save tag" 
      });
    }
  });

  app.get("/api/analytics/download", async (req, res) => {
    try {
      const creator = req.query.creator as string | undefined;
      const startDate = req.query.startDate as string | undefined;
      const endDate = req.query.endDate as string | undefined;
      
      // Fetch reels and follower data
      const csvFiles = await findCSVFiles();
      let reels: any[] = [];
      
      for (const file of csvFiles) {
        const fileReels = await parseCSV(file);
        reels.push(...fileReels);
      }
      
      const followerData = await parseFollowerData();
      
      // Filter by creator if specified
      if (creator) {
        reels = reels.filter(r => r.username === creator);
      }
      
      // Filter by date range if specified
      if (startDate || endDate) {
        reels = reels.filter(r => {
          const reelDate = new Date(r.datePosted);
          if (startDate && reelDate < new Date(startDate)) return false;
          if (endDate && reelDate > new Date(endDate)) return false;
          return true;
        });
      }
      
      // Build CSV content
      let csvContent = 'Username,Date Posted,Views,Likes,Comments,Engagement Rate,Video Type,Hashtags,Video URL\n';
      
      reels.forEach(reel => {
        const engagementRate = reel.views > 0 
          ? (((reel.likes + reel.comments) / reel.views) * 100).toFixed(2)
          : '0.00';
        
        csvContent += `${reel.username},${reel.datePosted},${reel.views},${reel.likes},${reel.comments},${engagementRate}%,"${reel.manual_tags || ''}","${reel.hashtags || ''}","${reel.videoUrl}"\n`;
      });
      
      // Add follower summary at the end
      csvContent += '\n\nFollower History\n';
      csvContent += 'Username,Followers,Reels Scraped,Timestamp\n';
      
      const creatorFollowers = creator 
        ? followerData.filter(f => f.username === creator)
        : followerData;
        
      creatorFollowers.forEach(f => {
        csvContent += `${f.username},${f.followers},${f.reelsScraped},${f.timestamp}\n`;
      });
      
      // Set headers for download
      const filename = creator 
        ? `${creator}_analytics_${new Date().toISOString().split('T')[0]}.csv`
        : `all_creators_analytics_${new Date().toISOString().split('T')[0]}.csv`;
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(csvContent);
    } catch (error) {
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "Failed to generate analytics download" 
      });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
