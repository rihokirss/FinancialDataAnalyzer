const axios = require('axios');
const cheerio = require('cheerio');
const csv = require('csv-parser');
const stream = require('stream');
const { promisify } = require('util');
const Company = require('../models/Company');
const ScraperSettings = require('../models/ScraperSettings');

const pipeline = promisify(stream.pipeline);

const csvParser = require('csv-parser');

const EMTA_URL = 'https://www.emta.ee/eraklient/amet-uudised-ja-kontakt/uudised-pressiinfo-statistika/statistika-ja-avaandmed#tasutud-maksud';

async function fetchAvailableCSVFiles() {
  try {
    const response = await axios.get(EMTA_URL);
    const $ = cheerio.load(response.data);

    const csvFiles = [];
    $('a[href$=".csv"]').each((index, element) => {
      const link = $(element).attr('href');
      const text = $(element).text().trim();
      if (text.includes('tasutud maksud, käive ja töötajate arv')) {
        csvFiles.push({ text, link });
        console.log(`Found CSV file: ${text} | ${link}`); // Added log
      }
    });

    console.log(`Found ${csvFiles.length} CSV files.`);
    console.log('All CSV files:', JSON.stringify(csvFiles, null, 2)); // Added log
    return csvFiles;
  } catch (error) {
    console.error('Error fetching CSV files:', error);
    throw error;
  }
}

async function downloadAndParseCSV(url) {
  try {
    const response = await axios({
      method: 'GET',
      url: url,
      responseType: 'stream'
    });

    const results = [];

    await pipeline(
      response.data,

      // Eemaldame BOM-i, kui see on olemas
      new stream.Transform({
        transform(chunk, encoding, callback) {
          const chunkString = chunk.toString('utf8').replace(/^\uFEFF/, '');
          callback(null, chunkString);
        }
      }),

      csvParser({
        separator: ';',        // Määrame eraldajaks semikooloni
        mapHeaders: ({ header }) => header.trim(), // Eemaldame tühikud veerupäistest
        mapValues: ({ value }) => value.trim(),    // Eemaldame tühikud väärtustest
        skipLines: 0,
        strict: false,         // Lubame muutuvat veergude arvu
        quote: '"',            // Käsitleme jutumärke
        escape: '\\',          // Käsitleme tagasilööki kui põgenemismärki
        skipComments: false    // Ärge jätke ühtegi rida vahele
      }),

      new stream.Writable({
        objectMode: true,
        write(chunk, encoding, callback) {
          results.push(chunk);
          callback();
        }
      })
    );

    console.log(`Parsed data for ${url}:`, JSON.stringify(results.slice(0, 5), null, 2));
    console.log(`CSV file downloaded and parsed: ${url}`);
    return results;
  } catch (error) {
    console.error('Error downloading or parsing CSV:', error);
    throw error;
  }
}

async function runScraper() {
  try {
    const availableFiles = await fetchAvailableCSVFiles();
    console.log('Available files before selection:', JSON.stringify(availableFiles, null, 2));

    const latestEntry = selectLatestQuarterFile(availableFiles);
    const latestFile = latestEntry ? latestEntry.file : null;

    console.log('Selected latest file:', latestFile ? JSON.stringify(latestFile, null, 2) : 'No file selected');

    if (latestFile) {
      console.log('Downloading and parsing CSV file:', latestFile.text);
      const data = await downloadAndParseCSV(latestFile.link);
      console.log('CSV data parsed, first 5 rows:', data.slice(0, 5));

      const period = `${latestEntry.year}-Q${latestEntry.quarter}`; // Näiteks "2024-Q3"
      await processAndSaveData(data, period);
      console.log('Scraping completed successfully for file:', latestFile.text);
    } else {
      console.log('No suitable CSV file found for scraping');
    }
  } catch (error) {
    console.error('Error during scraping process:', error);
    throw error;
  }
}

function romanToInt(roman) {
  switch (roman) {
    case 'I':
      return 1;
    case 'II':
      return 2;
    case 'III':
      return 3;
    case 'IV':
      return 4;
    default:
      return null;
  }
}

function selectLatestQuarterFile(files) {
  console.log('Selecting latest quarter file from:', JSON.stringify(files, null, 2));
  if (!files.length) return null;

  const latestEntry = files.reduce((latest, file) => {
    const match = file.text.match(/(I{1,3}|IV)\s*kv\s*(\d{4})/);
    if (match) {
      const romanQuarter = match[1];
      const year = parseInt(match[2], 10);
      const quarter = romanToInt(romanQuarter);

      console.log(`Matched quarter: ${quarter}, year: ${year} for file: ${file.text}`);

      if (
        !latest ||
        year > latest.year ||
        (year === latest.year && quarter > latest.quarter)
      ) {
        latest = { year, quarter, file };
      }
    } else {
      console.log(`No match found for file: ${file.text}`);
    }
    return latest;
  }, null);

  console.log('Latest entry:', latestEntry);

  return latestEntry;
}

function extractPeriodFromURL(url) {
  const match = url.match(/(\d{4})_([i|v]+)_kvartal/);
  if (match) {
    const year = match[1];
    const quarter = romanToInt(match[2].toUpperCase());
    return `${year}-Q${quarter}`;
  }
  console.log(`Failed to extract period from URL: ${url}`);
  return null;
}

async function processAndSaveData(data, period) {
  console.log(`Starting to process data for period: ${period}`);
  let processedCount = 0;
  let updatedCount = 0;

  const settings = await ScraperSettings.findOne();
  const includedCompanies = settings ? settings.includedCompanies : [];
  console.log(`Included companies: ${includedCompanies.join(', ')}`);

  for (const row of data) {
    if (!row.Registrikood) {
      console.log('Skipping row due to missing Registrikood');
      continue;
    }

    processedCount++;

    if (includedCompanies.length > 0 && !includedCompanies.includes(row.Registrikood.trim())) {
      //console.log(`Skipping company ${row.Registrikood.trim()} as it's not in the included list`);
      continue;
    }

    const company = await Company.findOne({ registrationCode: row.Registrikood.trim() });
    if (company) {
      console.log(`Found company: ${company.name}, Registrikood: ${company.registrationCode}`);

      company.financialData = company.financialData || [];
      const existingDataIndex = company.financialData.findIndex(data => data.period === period);
      if (existingDataIndex !== -1) {
        console.log(`Updating existing data for period ${period}`);
        company.financialData[existingDataIndex] = {
          period: period,
          taxes: parseNumber(row['Riiklikud Maksud']),
          laborTaxes: parseNumber(row['Tööjõumaksud Ja Maksed']),
          revenue: parseNumber(row['Käive'] || row['Kaive']),
          employees: parseNumber(row['Töötajaid'] || row['Tootajaid'])
        };
      } else {
        console.log(`Adding new data for period ${period}`);
        company.financialData.push({
          period: period,
          taxes: parseNumber(row['Riiklikud Maksud']),
          laborTaxes: parseNumber(row['Tööjõumaksud Ja Maksed']),
          revenue: parseNumber(row['Käive'] || row['Kaive']),
          employees: parseNumber(row['Töötajaid'] || row['Tootajaid'])
        });
      }

      try {
        await company.save();
        updatedCount++;
        console.log(`Financial data updated for company: ${company.name}`);
      } catch (error) {
        console.error(`Error saving data for company ${company.name}:`, error);
      }
    } else {
      console.warn(`Company not found with registration code: ${row.Registrikood}`);
    }
  }

  console.log(`Finished processing data for period: ${period}. Processed: ${processedCount}, Updated: ${updatedCount}`);
}

// Arvude parsimise funktsioon
function parseNumber(value) {
  if (typeof value === 'string') {
    const normalized = value.trim().replace(/\./g, '').replace(/,/g, '.');
    const number = parseFloat(normalized);
    return isNaN(number) ? null : number;
  }
  return null;
}

module.exports = {
  fetchAvailableCSVFiles,
  downloadAndParseCSV,
  runScraper,
  extractPeriodFromURL,
  processAndSaveData
};