const mongoose = require('mongoose');

const companySchema = new mongoose.Schema({
  registrationCode: { type: String, required: true, unique: true },
  name: String,
  type: String,
  vatRegistered: String,
  emtakField: String,
  county: String,
  address: String, // Keep this field if it's still needed
  tags: [String], // Keep this field if it's still needed
  financialData: [
    {
      period: String,
      taxes: Number,
      laborTaxes: Number,
      revenue: Number,
      employees: Number
    }
  ]
});

console.log('Company schema defined:', JSON.stringify(companySchema.obj)); // New log

module.exports = mongoose.model('Company', companySchema);