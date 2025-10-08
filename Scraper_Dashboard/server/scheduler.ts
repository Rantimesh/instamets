import cron from 'node-cron';
import { storage } from './storage';
import { runScraper } from './scraper';

interface ScheduledTask {
  task: cron.ScheduledTask | null;
  frequency: string;
}

let scheduledTask: ScheduledTask = {
  task: null,
  frequency: 'manual'
};

function getCronExpression(frequency: string): string | null {
  switch (frequency) {
    case '6h':
      return '0 */6 * * *'; // Every 6 hours
    case '12h':
      return '0 */12 * * *'; // Every 12 hours
    case '24h':
      return '0 0 * * *'; // Every day at midnight
    case 'manual':
      return null;
    default:
      return null;
  }
}

export async function initializeScheduler() {
  try {
    const config = await storage.getConfig();
    if (config) {
      await updateSchedule(config.scheduleFrequency, config.targetUsername);
    }
  } catch (error) {
    console.error('Failed to initialize scheduler:', error);
  }
}

export async function updateSchedule(frequency: string, targetUsernames: string) {
  if (scheduledTask.task) {
    scheduledTask.task.stop();
    scheduledTask.task = null;
  }

  if (frequency === 'manual') {
    console.log('Scheduler: Manual mode - no automatic scraping');
    scheduledTask.frequency = 'manual';
    return;
  }

  const cronExpression = getCronExpression(frequency);
  if (!cronExpression) {
    console.error('Invalid frequency:', frequency);
    return;
  }

  const usernames = targetUsernames.split(',').map(u => u.trim()).filter(u => u.length > 0);
  if (usernames.length === 0) {
    console.log('Scheduler: No usernames configured, skipping schedule');
    return;
  }

  scheduledTask.task = cron.schedule(cronExpression, async () => {
    console.log(`Scheduler: Running automatic scrape for ${usernames.join(', ')}`);
    try {
      await runScraper(usernames);
      console.log('Scheduler: Automatic scrape completed successfully');
    } catch (error) {
      console.error('Scheduler: Automatic scrape failed:', error);
    }
  });

  scheduledTask.frequency = frequency;
  console.log(`Scheduler: Configured to run every ${frequency} for ${usernames.join(', ')}`);
}

export function getScheduleStatus() {
  return {
    isActive: scheduledTask.task !== null,
    frequency: scheduledTask.frequency,
    cronExpression: getCronExpression(scheduledTask.frequency)
  };
}
