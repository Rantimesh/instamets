import fs from 'fs/promises';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  fileStats?: Map<string, number>; // file path -> mtime
}

class DataCache {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private ttl: number = 5 * 60 * 1000; // 5 minutes default TTL

  async get<T>(
    key: string,
    fetchFn: () => Promise<T>,
    filePaths?: string[]
  ): Promise<T> {
    const cached = this.cache.get(key);
    const now = Date.now();

    if (cached) {
      // Check if cache is still valid (not expired)
      const isExpired = now - cached.timestamp > this.ttl;
      
      if (!isExpired && filePaths) {
        // Check if any files have been modified
        const filesModified = await this.checkFilesModified(filePaths, cached.fileStats);
        if (!filesModified) {
          return cached.data as T;
        }
      } else if (!isExpired && !filePaths) {
        return cached.data as T;
      }
    }

    // Cache miss or expired - fetch fresh data
    const data = await fetchFn();
    
    // Store file stats if file paths are provided
    let fileStats: Map<string, number> | undefined;
    if (filePaths && filePaths.length > 0) {
      fileStats = new Map();
      for (const filePath of filePaths) {
        try {
          const stats = await fs.stat(filePath);
          fileStats.set(filePath, stats.mtimeMs);
        } catch (error) {
          // File doesn't exist or can't be accessed
          console.warn(`Could not stat file: ${filePath}`);
        }
      }
    }

    this.cache.set(key, {
      data,
      timestamp: now,
      fileStats
    });

    return data;
  }

  private async checkFilesModified(
    filePaths: string[],
    cachedStats?: Map<string, number>
  ): Promise<boolean> {
    if (!cachedStats) return true;

    for (const filePath of filePaths) {
      try {
        const stats = await fs.stat(filePath);
        const cachedMtime = cachedStats.get(filePath);
        
        if (!cachedMtime || stats.mtimeMs > cachedMtime) {
          return true; // File modified
        }
      } catch (error) {
        // File doesn't exist anymore - invalidate cache
        return true;
      }
    }

    return false; // No files modified
  }

  invalidate(key: string): void {
    this.cache.delete(key);
  }

  invalidateAll(): void {
    this.cache.clear();
  }

  setTTL(ms: number): void {
    this.ttl = ms;
  }
}

export const dataCache = new DataCache();
