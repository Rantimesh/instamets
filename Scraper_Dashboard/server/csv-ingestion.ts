import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface ReelMetricData {
  username: string;
  url: string;
  likes: number;
  comments: number;
  views: number;
  caption: string;
  hashtags: string;
  mentions: string;
  videoUrl: string;
  datePosted: string;
  instagramId: string;
  manual_tags?: string;
}

export async function parseCSV(filePath: string): Promise<ReelMetricData[]> {
  const content = await fs.readFile(filePath, 'utf-8');
  
  // Extract username from filename (e.g., "she_is_ada__reels_metrics.csv" -> "she_is_ada_")
  const filename = path.basename(filePath);
  const usernameMatch = filename.match(/^(.+?)_reels_metrics\.csv$/);
  const username = usernameMatch ? usernameMatch[1] : '';

  const rows = parseCSVContent(content);
  
  if (rows.length < 2) {
    return [];
  }

  const headers = rows[0].map(h => h.trim().replace(/^"|"$/g, ''));
  const data: ReelMetricData[] = [];

  for (let i = 1; i < rows.length; i++) {
    const values = rows[i];
    if (values.length === headers.length) {
      const row: any = {};
      headers.forEach((header, index) => {
        row[header] = values[index];
      });

      const videoUrl = row['video_url'] || row['url'] || '';
      const instagramId = extractInstagramId(videoUrl);
      
      data.push({
        username: username,
        url: `https://instagram.com/reel/${instagramId}`,
        likes: parseInt(row['likes'] || '0'),
        comments: parseInt(row['comments'] || '0'),
        views: parseInt(row['views'] || '0'),
        caption: row['caption'] || '',
        hashtags: row['hashtags'] || '',
        mentions: row['mentions'] || '',
        videoUrl: videoUrl,
        datePosted: row['date'] || '',
        instagramId: instagramId,
        manual_tags: row['manual_tags'] || '',
      });
    }
  }

  return data;
}

function parseCSVContent(content: string): string[][] {
  const rows: string[][] = [];
  const row: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < content.length; i++) {
    const char = content[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      row.push(current.trim().replace(/^"|"$/g, ''));
      current = '';
    } else if (char === '\n' && !inQuotes) {
      row.push(current.trim().replace(/^"|"$/g, ''));
      if (row.some(cell => cell.length > 0)) {
        rows.push([...row]);
      }
      row.length = 0;
      current = '';
    } else {
      current += char;
    }
  }
  
  if (row.length > 0 || current) {
    row.push(current.trim().replace(/^"|"$/g, ''));
    if (row.some(cell => cell.length > 0)) {
      rows.push(row);
    }
  }
  
  return rows;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result.map(v => v.replace(/^"|"$/g, ''));
}

export async function findCSVFiles(): Promise<string[]> {
  const projectRoot = path.resolve(__dirname, '..', '..');
  const dataDir = path.join(projectRoot, 'data');

  try {
    const files = await fs.readdir(dataDir);
    return files
      .filter(file => file.endsWith('_reels_metrics.csv'))
      .map(file => path.join(dataDir, file));
  } catch (error) {
    console.error('Error reading data directory:', error);
    return [];
  }
}

export function extractInstagramId(url: string): string {
  const match = url.match(/\/reel\/([A-Za-z0-9_-]+)/);
  return match ? match[1] : '';
}

function escapeCSVField(field: string): string {
  if (field.includes(',') || field.includes('"') || field.includes('\n')) {
    return `"${field.replace(/"/g, '""')}"`;
  }
  return field;
}

export async function updateCSVTag(filePath: string, reelUrl: string, tag: string): Promise<boolean> {
  const content = await fs.readFile(filePath, 'utf-8');
  const rows = parseCSVContent(content);
  
  if (rows.length < 2) {
    return false;
  }

  const headers = rows[0];
  const manualTagsIndex = headers.findIndex(h => h.toLowerCase().trim() === 'manual_tags');
  
  // Ensure manual_tags column exists
  if (manualTagsIndex === -1) {
    headers.push('manual_tags');
  }

  let updated = false;
  const instagramIdToFind = extractInstagramId(reelUrl);

  // Find and update the row
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const videoUrlIndex = headers.findIndex(h => h.toLowerCase().trim() === 'video_url');
    
    if (videoUrlIndex !== -1 && row[videoUrlIndex]) {
      const rowInstagramId = extractInstagramId(row[videoUrlIndex]);
      
      if (rowInstagramId === instagramIdToFind) {
        // Ensure row has enough columns
        while (row.length < headers.length) {
          row.push('');
        }
        
        const tagIndex = manualTagsIndex !== -1 ? manualTagsIndex : headers.length - 1;
        row[tagIndex] = tag;
        updated = true;
        break;
      }
    }
  }

  if (updated) {
    // Write back the CSV with proper escaping
    const csvLines = rows.map(row => 
      row.map(field => escapeCSVField(field)).join(',')
    );
    await fs.writeFile(filePath, csvLines.join('\n'));
  }

  return updated;
}

export interface FollowerData {
  username: string;
  followers: number;
  reelsScraped: number;
  timestamp: string;
}

export async function parseFollowerData(): Promise<FollowerData[]> {
  const projectRoot = path.resolve(__dirname, '..', '..');
  const scrapeHistoryPath = path.join(projectRoot, 'data', 'scrape_history.csv');

  try {
    const content = await fs.readFile(scrapeHistoryPath, 'utf-8');
    const rows = parseCSVContent(content);
    
    if (rows.length < 2) {
      return [];
    }

    const headers = rows[0].map(h => h.trim().replace(/^"|"$/g, ''));
    const data: FollowerData[] = [];

    for (let i = 1; i < rows.length; i++) {
      const values = rows[i];
      if (values.length === headers.length) {
        const row: any = {};
        headers.forEach((header, index) => {
          row[header] = values[index];
        });

        data.push({
          username: row['username'] || '',
          followers: parseInt(row['followers'] || '0'),
          reelsScraped: parseInt(row['reels_scraped'] || '0'),
          timestamp: row['timestamp'] || '',
        });
      }
    }

    return data;
  } catch (error) {
    console.error('Error reading scrape_history.csv:', error);
    return [];
  }
}
