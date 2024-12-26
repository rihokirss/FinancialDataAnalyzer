const mongoose = require('mongoose');

const scraperSettingsSchema = new mongoose.Schema({
  schedule: {
    type: String,
    default: '0 0 1 */3 *' // Default to run at midnight on the first day of every third month
  },
  includedCompanies: [{ type: String }]
});

module.exports = mongoose.model('ScraperSettings', scraperSettingsSchema);