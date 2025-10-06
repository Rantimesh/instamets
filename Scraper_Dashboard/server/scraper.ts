import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface ScraperProgress {
  status: 'queued' | 'running' | 'fetching_metrics' | 'ingesting' | 'completed' | 'failed';
  logs: string[];
  error?: string;
  reelsScraped?: number;
}

let currentRun: ScraperProgress | null = null;

export async function runScraper(usernames: string[]): Promise<void> {
  if (currentRun && (currentRun.status === 'running' || currentRun.status === 'fetching_metrics')) {
    throw new Error('A scraper is already running');
  }

  currentRun = {
    status: 'queued',
    logs: [],
  };

  const projectRoot = path.resolve(__dirname, '..', '..');

  try {
    currentRun.status = 'running';
    currentRun.logs.push('Starting URL scraper...');

    await runPythonScript(
      path.join(projectRoot, 'part_1_scrape_urls.py'),
      usernames,
      (data) => {
        if (currentRun) {
          currentRun.logs.push(data);
        }
      }
    );

    currentRun.status = 'fetching_metrics';
    currentRun.logs.push('Starting metrics scraper...');

    await runPythonScript(
      path.join(projectRoot, 'part_2_get_metrics.py'),
      [],
      (data) => {
        if (currentRun) {
          currentRun.logs.push(data);
        }
      }
    );

    currentRun.status = 'completed';
    currentRun.logs.push('Scraping completed successfully');
  } catch (error) {
    if (currentRun) {
      currentRun.status = 'failed';
      currentRun.error = error instanceof Error ? error.message : String(error);
      currentRun.logs.push(`Error: ${currentRun.error}`);
    }
    throw error;
  }
}

function runPythonScript(
  scriptPath: string,
  usernames: string[],
  onData: (data: string) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    const args = usernames.length > 0 ? ['--users', ...usernames] : [];
    const pythonProcess = spawn('python3', [scriptPath, ...args]);

    pythonProcess.stdout.on('data', (data) => {
      const output = data.toString().trim();
      if (output) {
        onData(output);
        console.log(`[Python] ${output}`);
      }
    });

    pythonProcess.stderr.on('data', (data) => {
      const output = data.toString().trim();
      if (output) {
        onData(`[ERROR] ${output}`);
        console.error(`[Python Error] ${output}`);
      }
    });

    pythonProcess.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Python script exited with code ${code}`));
      }
    });

    pythonProcess.on('error', (error) => {
      reject(error);
    });
  });
}

export function getScraperStatus(): ScraperProgress | null {
  return currentRun;
}
