const Company = require('../models/Company');
const scraperService = require('../services/scraperService');
const ScraperSettings = require('../models/ScraperSettings');
const exportService = require('../services/exportService');

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

    const companies = await Company.find().sort('name');
    console.log(`Fetched ${companies.length} companies for selector`);

    // Get current year and previous year for default filter
    const currentYear = new Date().getFullYear();
    const previousYear = currentYear - 1;

    // Sort and filter data by default
    const filteredData = company.financialData
      .filter(data => {
        if (!data || !data.period) return false;
        const year = parseInt(data.period.split('-')[0]);
        return year >= previousYear && year <= currentYear;
      })
      .sort((a, b) => {
        const [yearA, quarterA] = a.period.split('-Q');
        const [yearB, quarterB] = b.period.split('-Q');
        if (yearA !== yearB) return yearA - yearB;
        return quarterA - quarterB;
      });

    const chartData = {
      labels: filteredData.map(d => d.period),
      revenue: filteredData.map(d => d.revenue),
      taxes: filteredData.map(d => d.taxes),
      laborTaxes: filteredData.map(d => d.laborTaxes || 0),
      employees: filteredData.map(d => d.employees)
    };

    console.log('Preparing chart data:', {
      labels: chartData.labels,
      revenue: chartData.revenue,
      taxes: chartData.taxes,
      laborTaxes: chartData.laborTaxes,
      employees: chartData.employees
    });

    console.log(`Prepared chart data for company ${company.name}`);
    res.render('company-data', { 
      company,
      companies,
      chartData,
      startYear: previousYear,
      endYear: currentYear,
      financialData: filteredData
    });
  } catch (error) {
    console.error('Viga ettevõtte andmete laadimisel:', error);
    console.error(error.stack);
    res.status(500).render('error', { error: 'Viga ettevõtte andmete laadimisel. Palun proovige uuesti.' });
  }
};

exports.getFilteredCompanyData = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const companyId = req.params.id;

    console.log(`Fetching filtered data for company ${companyId} from ${startDate} to ${endDate}`);

    const company = await Company.findById(companyId);
    if (!company) {
      console.error(`Company not found with ID: ${companyId}`);
      return res.status(404).json({ error: 'Ettevõtet ei leitud.' });
    }

    console.log('Found company financial data:', company.financialData);

    // Filter and sort financial data
    const sortedData = company.financialData
      .filter(data => {
        if (!data || !data.period) return false;
        const year = parseInt(data.period.split('-')[0]);
        console.log('Checking period:', data.period, 'Year:', year);
        return year >= parseInt(startDate) && year <= parseInt(endDate);
      })
      .sort((a, b) => {
        const [yearA, quarterA] = a.period.split('-Q');
        const [yearB, quarterB] = b.period.split('-Q');
        if (yearA !== yearB) {
          return yearA - yearB;
        }
        return quarterA - quarterB;
      });

    console.log('All periods before filtering:', company.financialData.map(d => d.period));
    console.log('Sorted and filtered data:', sortedData);
    console.log(`Found ${sortedData.length} records within year range`);

    // Prepare clean chart data
    const chartData = {
      labels: sortedData.map(data => data.period),
      revenue: sortedData.map(data => data.revenue),
      taxes: sortedData.map(data => data.taxes),
      laborTaxes: sortedData.map(data => data.laborTaxes || 0),
      employees: sortedData.map(data => data.employees)
    };

    console.log('Preparing chart data:', {
      labels: chartData.labels,
      revenue: chartData.revenue,
      taxes: chartData.taxes,
      laborTaxes: chartData.laborTaxes,
      employees: chartData.employees
    });

    console.log(`Prepared filtered chart data for company ${company.name}`);
    res.json({
      success: true,
      financialData: sortedData,
      chartData: chartData
    });

  } catch (error) {
    console.error('Viga filtreeritud andmete laadimisel:', error);
    console.error(error.stack);
    res.status(500).json({
      success: false,
      error: 'Viga andmete filtreerimisel: ' + error.message
    });
  }
};

exports.exportCompanyData = async (req, res) => {
  try {
    console.log(`Exporting data for company ID: ${req.params.id}`);
    const company = await Company.findById(req.params.id);
    if (!company) {
      console.error(`Company not found with ID: ${req.params.id}`);
      return res.status(404).json({ error: 'Ettevõtet ei leitud.' });
    }

    const { startDate, endDate } = req.query;
    let financialData = company.financialData;

    // Apply date filtering if provided
    if (startDate && endDate) {
      console.log(`Filtering data between years ${startDate} and ${endDate}`);
      financialData = financialData.filter(data => {
        if (!data || !data.period) return false;
        const year = parseInt(data.period.split('-')[0]);
        return year >= parseInt(startDate) && year <= parseInt(endDate);
      });
    }

    const exportData = {
      ...company.toObject(),
      financialData
    };

    console.log(`Generating CSV for ${financialData.length} records`);
    const csvBuffer = exportService.generateFinancialDataCsv(exportData);

    const filename = `${company.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_financial_data.csv`;
    console.log(`Sending CSV file: ${filename}`);

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    res.send(csvBuffer);

  } catch (error) {
    console.error('Viga andmete eksportimisel:', error);
    console.error(error.stack);
    res.status(500).json({ error: 'Viga andmete eksportimisel: ' + error.message });
  }
};