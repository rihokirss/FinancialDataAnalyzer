// services/cronJobs.js
const cron = require('node-cron');
const { runScraper } = require('./scraperService');
const ScraperSettings = require('../models/ScraperSettings');

let scraperJob;

async function initializeScraperJob() {
  const settings = await ScraperSettings.findOne();
  if (settings) {
    scheduleScraperJob(settings.schedule);
  } else {
    console.log('No scraper settings found. Using default schedule.');
    scheduleScraperJob('0 0 1 */3 *');
  }
}

function scheduleScraperJob(schedule) {
  if (scraperJob) {
    scraperJob.stop();
  }

  scraperJob = cron.schedule(schedule, async () => {
    console.log('Running scheduled scraper job');
    try {
      await runScraper();
      console.log('Scheduled scraper job completed successfully');
    } catch (error) {
      console.error('Error in scheduled scraper job:', error);
    }
  });

  console.log(`Scraper job scheduled with cron expression: ${schedule}`);
}

module.exports = {
  initializeScraperJob,
  scheduleScraperJob
};