const Company = require('../models/Company');
const scraperService = require('../services/scraperService');
const ScraperSettings = require('../models/ScraperSettings');

exports.addCompany = async (req, res) => {
  try {
    const { name, registrationCode, address, tags, type, vatRegistered, emtakField, county } = req.body;
    console.log('Received company data:', JSON.stringify(req.body)); // New log

    const tagsArray = tags.split(',').map(tag => tag.trim()).filter(tag => tag !== '');

    const existingCompany = await Company.findOne({ registrationCode });
    if (existingCompany) {
      console.log('Company already exists:', existingCompany); // New log
      return res.status(400).render('add-company', { error: 'Ettevõte selle registrikoodiga on juba olemas.' });
    }

    const newCompany = new Company({
      name,
      registrationCode,
      address,
      tags: tagsArray,
      type,
      vatRegistered,
      emtakField,
      county
    });

    console.log('New company to be saved:', JSON.stringify(newCompany)); // New log

    await newCompany.save();
    res.redirect('/');
    console.log(`New company added: ${name}`);
  } catch (error) {
    console.error('Viga ettevõtte lisamisel:', error);
    console.error(error.stack);
    res.status(500).render('add-company', { error: 'Viga ettevõtte lisamisel. Palun proovige uuesti.' });
  }
};

exports.listCompanies = async (req, res) => {
  try {
    const companies = await Company.find().sort('name');
    res.render('company-list', { companies });
  } catch (error) {
    console.error('Viga ettevõtete laadimisel:', error);
    console.error(error.stack);
    res.status(500).render('error', { error: 'Viga ettevõtete laadimisel. Palun proovige uuesti.' });
  }
};

exports.getEditCompany = async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);
    if (!company) {
      return res.status(404).render('error', { error: 'Ettevõtet ei leitud.' });
    }
    res.render('edit-company', { company });
  } catch (error) {
    console.error('Viga ettevõtte laadimisel:', error);
    console.error(error.stack);
    res.status(500).render('error', { error: 'Viga ettevõtte laadimisel. Palun proovige uuesti.' });
  }
};

exports.updateCompany = async (req, res) => {
  try {
    const { name, registrationCode, address, tags, type, vatRegistered, emtakField, county } = req.body;
    const tagsArray = tags.split(',').map(tag => tag.trim()).filter(tag => tag !== '');

    const updatedCompany = await Company.findByIdAndUpdate(
      req.params.id,
      { name, registrationCode, address, tags: tagsArray, type, vatRegistered, emtakField, county },
      { new: true, runValidators: true }
    );

    if (!updatedCompany) {
      return res.status(404).render('error', { error: 'Ettevõtet ei leitud.' });
    }

    res.redirect('/companies/list');
    console.log(`Company updated: ${updatedCompany.name}`);
  } catch (error) {
    console.error('Viga ettevõtte uuendamisel:', error);
    console.error(error.stack);
    res.status(500).render('error', { error: 'Viga ettevõtte uuendamisel. Palun proovige uuesti.' });
  }
};

exports.getAllTags = async (req, res, next) => {
  try {
    const allTags = await Company.distinct('tags');
    res.locals.allTags = allTags;
    next();
  } catch (error) {
    console.error('Error fetching tags:', error);
    console.error(error.stack);
    next(error);
  }
};

exports.deleteCompany = async (req, res) => {
  try {
    const company = await Company.findByIdAndDelete(req.params.id);
    if (!company) {
      return res.status(404).json({ error: 'Ettevõtet ei leitud.' });
    }
    res.json({ message: 'Ettevõte edukalt kustutatud.' });
    console.log(`Company deleted: ${req.params.id}`);
  } catch (error) {
    console.error('Viga ettevõtte kustutamisel:', error);
    console.error(error.stack);
    res.status(500).json({ error: 'Viga ettevõtte kustutamisel. Palun proovige uuesti.' });
  }
};

exports.getScraperSettings = async (req, res) => {
  try {
    const settings = await ScraperSettings.findOne();
    const currentSchedule = settings ? settings.schedule : '0 0 1 */3 *';
    const includedCompanies = settings ? settings.includedCompanies : [];
    const availableFiles = await scraperService.fetchAvailableCSVFiles();
    res.render('scraper-settings', { currentSchedule, includedCompanies, availableFiles });
  } catch (error) {
    console.error('Error fetching scraper settings:', error);
    console.error(error.stack);
    res.status(500).render('error', { error: 'Viga seadete laadimisel. Palun proovige uuesti.' });
  }
};

exports.updateIncludedCompanies = async (req, res) => {
  try {
    const { includedCompanies } = req.body;
    let settings = await ScraperSettings.findOne();
    if (!settings) {
      settings = new ScraperSettings();
    }
    settings.includedCompanies = includedCompanies.split(',').map(code => code.trim()).filter(code => code !== '');
    await settings.save();
    res.redirect('/companies/scraper-settings');
  } catch (error) {
    console.error('Error updating included companies:', error);
    console.error(error.stack);
    res.status(500).render('error', { error: 'Viga kaasatud ettevõtete värskendamisel. Palun proovige uuesti.' });
  }
};

exports.updateScraperSettings = async (req, res) => {
  try {
    const { schedule } = req.body;
    let settings = await ScraperSettings.findOne();
    if (!settings) {
      settings = new ScraperSettings();
    }
    settings.schedule = schedule;
    await settings.save();
    res.redirect('/companies/scraper-settings');
  } catch (error) {
    console.error('Error updating scraper settings:', error);
    console.error(error.stack);
    res.status(500).render('error', { error: 'Viga seadete salvestamisel. Palun proovige uuesti.' });
  }
};

exports.manualScrape = async (req, res) => {
  try {
    await scraperService.runScraper();
    res.redirect('/companies/scraper-settings');
  } catch (error) {
    console.error('Error during manual scrape:', error);
    console.error(error.stack);
    res.status(500).render('error', { error: 'Viga käsitsi skraapimisel. Palun proovige uuesti.' });
  }
};

exports.downloadAndParseCSV = async (req, res) => {
  try {
    const { urls } = req.body;
    const results = [];

    for (const url of urls) {
      const data = await scraperService.downloadAndParseCSV(url);
      results.push({ url, data });
    }

    res.json({ success: true, results });
  } catch (error) {
    console.error('Error downloading and parsing CSV:', error);
    console.error(error.stack);
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getCompanyData = async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);
    if (!company) {
      return res.status(404).render('error', { error: 'Ettevõtet ei leitud.' });
    }

    // Fetch all companies for the selector
    const companies = await Company.find().sort('name');
    console.log(`Fetched ${companies.length} companies for selector`);

    // Prepare data for the chart
    const chartData = {
      labels: [],
      revenue: [],
      taxes: [],
      employees: []
    };

    company.financialData.forEach(data => {
      chartData.labels.push(data.period);
      chartData.revenue.push(data.revenue);
      chartData.taxes.push(data.taxes);
      chartData.employees.push(data.employees);
    });

    console.log(`Prepared chart data for company ${company.name}`);
    res.render('company-data', { company, companies, chartData });
  } catch (error) {
    console.error('Viga ettevõtte andmete laadimisel:', error);
    console.error(error.stack);
    res.status(500).render('error', { error: 'Viga ettevõtte andmete laadimisel. Palun proovige uuesti.' });
  }
};