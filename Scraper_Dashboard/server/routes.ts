import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { runScraper, getScraperStatus } from "./scraper";
import { findCSVFiles, parseCSV, extractInstagramId, parseFollowerData } from "./csv-ingestion";
import { dataCache } from "./cache";
import { z } from "zod";
import { scraperConfigSchema, instagramCredentialsSchema } from "@shared/schema";
import path from "path";
import { fileURLToPath } from "url";

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

  app.post("/api/config", async (req, res) => {
    try {
      const validatedConfig = scraperConfigSchema.parse(req.body);
      const config = await storage.saveConfig(validatedConfig);
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
        autoTag: false,
        emailNotifications: false
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

  app.patch("/api/reels/:reelUrl/tag", async (req, res) => {
    try {
      const { reelUrl } = req.params;
      const { tag } = req.body;
      
      if (!tag) {
        return res.status(400).json({ error: "Tag is required" });
      }

      const decodedUrl = decodeURIComponent(reelUrl);
      
      // Find the CSV file containing this reel
      const csvFiles = await findCSVFiles();
      let updated = false;

      for (const file of csvFiles) {
        const reels = await parseCSV(file);
        const reelIndex = reels.findIndex(r => r.url === decodedUrl);
        
        if (reelIndex !== -1) {
          // Update the CSV file with the new tag
          const fs = await import('fs/promises');
          const csv = await fs.readFile(file, 'utf-8');
          const lines = csv.split('\n');
          
          if (lines.length > reelIndex + 1) {
            const columns = lines[reelIndex + 1].split(',');
            // Add or update the manual_tags column (last column)
            if (columns.length >= 12) {
              columns[11] = tag;
            } else {
              columns.push(tag);
            }
            lines[reelIndex + 1] = columns.join(',');
            await fs.writeFile(file, lines.join('\n'));
            updated = true;
            
            // Invalidate cache
            dataCache.invalidateAll();
            break;
          }
        }
      }

      if (updated) {
        res.json({ success: true, message: "Tag saved successfully" });
      } else {
        res.status(404).json({ error: "Reel not found" });
      }
    } catch (error) {
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "Failed to save tag" 
      });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
