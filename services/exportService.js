const createCsvStringifier = require('csv-writer').createObjectCsvStringifier;

/**
 * Converts financial data to CSV format
 * @param {Object} data Object containing company info and financial data
 * @returns {Buffer} CSV file content as a buffer
 */
exports.generateFinancialDataCsv = (data) => {
  console.log('Generating CSV for company financial data');

  try {
    const csvStringifier = createCsvStringifier({
      header: [
        { id: 'period', title: 'PERIOOD' },
        { id: 'taxes', title: 'MAKSUD' },
        { id: 'laborTaxes', title: 'TÖÖJÕUMAKSUD' },
        { id: 'revenue', title: 'KÄIVE' },
        { id: 'employees', title: 'TÖÖTAJATE ARV' }
      ]
    });

    console.log('Created CSV stringifier with headers');

    const records = data.financialData.map(record => {
      console.log(`Processing record for period: ${record.period}`);
      return {
        period: record.period,
        taxes: record.taxes || '',
        laborTaxes: record.laborTaxes || '',
        revenue: record.revenue || '',
        employees: record.employees || ''
      };
    });

    console.log(`Processed ${records.length} financial records`);

    const headerString = csvStringifier.getHeaderString();
    const recordsString = csvStringifier.stringifyRecords(records);
    const csvContent = headerString + recordsString;

    console.log('Generated CSV content successfully');

    return Buffer.from(csvContent);
  } catch (error) {
    console.error('Error generating CSV file:', error);
    console.error(error.stack);
    throw new Error('Failed to generate CSV file: ' + error.message);
  }
};