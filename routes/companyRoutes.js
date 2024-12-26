const express = require('express');
const router = express.Router();
const companyController = require('../controllers/companyController');
const ScraperSettings = require('../models/ScraperSettings');
const { scheduleScraperJob } = require('../services/cronJobs');
const { isAuthenticated } = require('./middleware/authMiddleware');
const scraperService = require('../services/scraperService');  // Add this line

router.post('/add', companyController.addCompany);
router.get('/list', companyController.listCompanies);
router.get('/add', companyController.getAllTags, (req, res) => res.render('add-company'));
router.get('/edit/:id', companyController.getAllTags, companyController.getEditCompany);
router.post('/edit/:id', companyController.updateCompany);
router.delete('/delete/:id', companyController.deleteCompany);
router.get('/scraper-settings', isAuthenticated, companyController.getScraperSettings);

router.post('/scraper-settings', async (req, res) => {
  try {
    const { schedule } = req.body;
    let settings = await ScraperSettings.findOne();
    if (!settings) {
      settings = new ScraperSettings();
    }
    settings.schedule = schedule;
    await settings.save();

    // Reschedule the cron job with the new schedule
    scheduleScraperJob(schedule);

    res.redirect('/companies/scraper-settings');
  } catch (error) {
    console.error('Error updating scraper settings:', error);
    res.status(500).send('Error updating scraper settings');
  }
});

router.post('/manual-scrape', isAuthenticated, companyController.manualScrape);

router.post('/download-csv', isAuthenticated, async (req, res) => {
  try {
    const { urls } = req.body;
    const results = [];

    for (const url of urls) {
      const data = await scraperService.downloadAndParseCSV(url);
      console.log(`Downloaded and parsed ${url}, calling processAndSaveData`);
      const period = scraperService.extractPeriodFromURL(url);
      await scraperService.processAndSaveData(data, period);
      console.log(`Finished processing and saving data for ${url}`);
      results.push({ url, data: data.slice(0, 5) }); // Only send back the first 5 rows for brevity
    }

    res.json({ success: true, results });
  } catch (error) {
    console.error('Error downloading and parsing CSV:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/update-included-companies', companyController.updateIncludedCompanies);

router.get('/data/:id', companyController.getCompanyData);
router.get('/data/:id/filter', companyController.getFilteredCompanyData);

module.exports = router;