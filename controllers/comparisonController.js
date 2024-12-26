const Company = require('../models/Company');

exports.getComparisonPage = async (req, res) => {
    try {
        console.log('Loading comparison page');
        const allTags = await Company.distinct('tags');
        console.log(`Found ${allTags.length} unique tags for filtering`);
        res.render('company-comparison', { allTags });
    } catch (error) {
        console.error('Error loading comparison page:', error);
        console.error(error.stack);
        res.status(500).render('error', {
            error: 'Viga võrdluslehe laadimisel: ' + error.message
        });
    }
};

exports.searchCompanies = async (req, res) => {
    try {
        const { query, tags } = req.query;

        if (tags) {
            const selectedTags = JSON.parse(tags);
            console.log('Searching companies with tags:', selectedTags);
            const companies = await Company.find({
                tags: { $in: selectedTags }
            });
            console.log('Found companies with tags:', companies.map(c => ({
                name: c.name,
                tags: c.tags
            })));
            return res.json({ success: true, companies });
        }

        if (!query || query.length < 2) {
            return res.status(400).json({
                success: false,
                error: 'Otsingu päring peab olema vähemalt 2 tähemärki pikk'
            });
        }

        const searchRegex = new RegExp(query, 'i');

        const companies = await Company.find({
            $or: [
                { name: searchRegex },
                { registrationCode: searchRegex }
            ]
        }).limit(10);

        console.log(`Found ${companies.length} companies matching search query`);

        if (companies.length === 0) {
            console.log('No companies found for search query');
            return res.json({
                success: true,
                companies: [],
                message: 'Ettevõtteid ei leitud'
            });
        }

        res.json({ success: true, companies });
    } catch (error) {
        console.error('Error searching companies:', error);
        console.error(error.stack);
        res.status(500).json({
            success: false,
            error: 'Viga ettevõtete otsimisel: ' + error.message
        });
    }
};

exports.getCompanyDetails = async (req, res) => {
    try {
        const { id } = req.params;
        console.log(`Fetching details for company ID: ${id}`);

        const company = await Company.findById(id);

        if (!company) {
            console.error(`Company with ID ${id} not found`);
            return res.status(404).json({
                success: false,
                error: 'Ettevõtet ei leitud'
            });
        }

        console.log(`Successfully retrieved details for company: ${company.name}`);
        res.json({
            success: true,
            company
        });
    } catch (error) {
        console.error('Error fetching company details:', error);
        console.error(error.stack);
        res.status(500).json({
            success: false,
            error: 'Viga ettevõtte andmete laadimisel: ' + error.message
        });
    }
};

exports.compareCompanies = async (req, res) => {
    try {
        const { companyIds } = req.body;
        console.log(`Comparing companies with IDs: ${companyIds}`);

        if (!Array.isArray(companyIds) || companyIds.length < 2) {
            return res.status(400).json({
                success: false,
                error: 'Võrdluseks on vaja valida vähemalt 2 ettevõtet'
            });
        }

        const companies = await Company.find({
            '_id': { $in: companyIds }
        });

        console.log(`Found ${companies.length} companies for comparison`);

        if (companies.length !== companyIds.length) {
            console.error('Some requested companies were not found');
            return res.status(404).json({
                success: false,
                error: 'Mõnda valitud ettevõtet ei leitud'
            });
        }

        const comparisonData = companies.map(company => {
            console.log(`Financial data for company ${company.name}:`, JSON.stringify(company.financialData));
            return {
                id: company._id,
                name: company.name,
                registrationCode: company.registrationCode,
                financialData: company.financialData
            };
        });

        console.log('Full comparison data:', JSON.stringify(comparisonData));

        res.json({
            success: true,
            comparisonData
        });
    } catch (error) {
        console.error('Error comparing companies:', error);
        console.error(error.stack);
        res.status(500).json({
            success: false,
            error: 'Viga ettevõtete võrdlemisel: ' + error.message
        });
    }
};

exports.getComparisonTableView = async (req, res) => {
    try {
        console.log('Rendering comparison table view');
        res.render('company-comparison-table');
    } catch (error) {
        console.error('Error rendering comparison table view:', error);
        console.error(error.stack);
        res.status(500).render('error', {
            error: 'Viga võrdlustabeli kuvamisel: ' + error.message
        });
    }
};