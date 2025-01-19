const Company = require('../models/Company');
const financialRatioService = require('../services/financialRatioService');

exports.getCompanyRatios = async (req, res) => {
    try {
        const { id } = req.params;
        console.log(`Getting financial ratios for company ID: ${id}`);

        const company = await Company.findById(id);

        if (!company) {
            console.error(`Company with ID ${id} not found`);
            return res.status(404).json({
                success: false,
                error: 'Ettevõtet ei leitud'
            });
        }

        if (!company.financialData || company.financialData.length === 0) {
            console.error(`No financial data found for company ${company.name} (${id})`);
            return res.status(404).json({
                success: false,
                error: 'Ettevõtte finantsnäitajad puuduvad'
            });
        }

        // Apply default filter (current year and previous year)
        const currentYear = new Date().getFullYear();
        const previousYear = currentYear - 1;

        console.log(`Filtering data between years ${previousYear} and ${currentYear}`);

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

        console.log(`Calculating ratios for company ${company.name} with ${filteredData.length} periods of data`);

        const ratios = financialRatioService.calculateAllRatios(filteredData);

        console.log(`Successfully calculated ratios for company ${company.name}`);
        res.json({
            success: true,
            companyName: company.name,
            ratios
        });

    } catch (error) {
        console.error('Viga suhtarvude arvutamisel:', error);
        console.error(error.stack);
        res.status(500).json({
            success: false,
            error: `Viga suhtarvude arvutamisel: ${error.message}`
        });
    }
};

exports.getFilteredRatios = async (req, res) => {
    try {
        const { id } = req.params;
        const { startDate, endDate } = req.query;

        console.log(`Getting filtered ratios for company ID: ${id}, period: ${startDate}-${endDate}`);

        const company = await Company.findById(id);

        if (!company) {
            console.error(`Company with ID ${id} not found`);
            return res.status(404).json({
                success: false,
                error: 'Ettevõtet ei leitud'
            });
        }

        let financialData = company.financialData;

        if (startDate && endDate) {
            console.log(`Filtering data between years ${startDate} and ${endDate}`);
            financialData = financialData.filter(data => {
                if (!data || !data.period) return false;
                const year = parseInt(data.period.split('-')[0]);
                return year >= parseInt(startDate) && year <= parseInt(endDate);
            });
        }

        // Sort chronologically
        financialData.sort((a, b) => {
            if (!a.period || !b.period) return 0;
            const [yearA, quarterA] = a.period.split('-Q');
            const [yearB, quarterB] = b.period.split('-Q');
            if (yearA !== yearB) return yearA - yearB;
            return quarterA - quarterB;
        });

        if (financialData.length === 0) {
            console.error(`No financial data found for the specified period`);
            return res.status(404).json({
                success: false,
                error: 'Valitud perioodil puuduvad finantsnäitajad'
            });
        }

        const ratios = financialRatioService.calculateAllRatios(financialData);

        console.log(`Successfully calculated filtered ratios for company ${company.name}`);
        res.json({
            success: true,
            companyName: company.name,
            ratios
        });

    } catch (error) {
        console.error('Viga filtreeritud suhtarvude arvutamisel:', error);
        console.error(error.stack);
        res.status(500).json({
            success: false,
            error: `Viga suhtarvude arvutamisel: ${error.message}`
        });
    }
};