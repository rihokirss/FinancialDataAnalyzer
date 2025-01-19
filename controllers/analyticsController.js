const Company = require('../models/Company');
const financialRatioService = require('../services/financialRatioService');
const advancedAnalyticsChartService = require('../services/advancedAnalyticsChartService');

exports.getAdvancedAnalytics = async (req, res) => {
    try {
        const companies = await Company.find({});
        const metrics = advancedAnalyticsChartService.getRatioMetrics();
        res.render('advanced-analytics', {
            companies: companies,
            metrics: metrics,
            session: req.session
        });
    } catch (error) {
        console.error('Error fetching companies for analytics:', error);
        res.status(500).json({
            success: false,
            error: `Viga ettevõtete andmete laadimisel: ${error.message}`
        });
    }
};

exports.getAllCompaniesRatios = async (req, res) => {
    try {
        const { startYear, endYear } = req.query;
        console.log(`Fetching ratios for all companies between ${startYear} and ${endYear}`);

        const companies = await Company.find({});
        const ratiosData = [];

        for (const company of companies) {
            if (!company.financialData || company.financialData.length === 0) {
                console.log(`No financial data for company ${company.name}`);
                continue;
            }

            let financialData = company.financialData;

            // Filter by date range if provided
            if (startYear && endYear) {
                financialData = financialData.filter(data => {
                    if (!data.period) return false;
                    const year = parseInt(data.period.split('-')[0]);
                    return year >= parseInt(startYear) && year <= parseInt(endYear);
                });
            }

            // Sort data chronologically
            financialData.sort((a, b) => {
                if (!a.period || !b.period) return 0;
                const [yearA, quarterA] = a.period.split('-Q');
                const [yearB, quarterB] = b.period.split('-Q');
                if (yearA !== yearB) return yearA - yearB;
                return quarterA - quarterB;
            });

            const ratios = financialRatioService.calculateAllRatios(financialData);

            ratiosData.push({
                companyId: company._id,
                companyName: company.name,
                registrationCode: company.registrationCode,
                ratios: ratios
            });
        }

        res.json({
            success: true,
            data: ratiosData
        });

    } catch (error) {
        console.error('Error calculating ratios for companies:', error);
        res.status(500).json({
            success: false,
            error: `Viga suhtarvude arvutamisel: ${error.message}`
        });
    }
};

exports.getRatioChartData = async (req, res) => {
    try {
        const { startYear, endYear, metric } = req.query;
        console.log(`Generating chart data for metric ${metric} between ${startYear} and ${endYear}`);

        if (!metric) {
            return res.status(400).json({
                success: false,
                error: 'Suhtarvu metrika on kohustuslik'
            });
        }

        const companies = await Company.find({});
        const ratiosData = [];

        for (const company of companies) {
            if (!company.financialData || company.financialData.length === 0) {
                console.log(`Skipping company ${company.name} - no financial data available`);
                continue;
            }

            let financialData = company.financialData;

            // Filter by date range if provided
            if (startYear && endYear) {
                financialData = financialData.filter(data => {
                    if (!data.period) return false;
                    const year = parseInt(data.period.split('-')[0]);
                    return year >= parseInt(startYear) && year <= parseInt(endYear);
                });
            }

            const ratios = financialRatioService.calculateAllRatios(financialData);

            ratiosData.push({
                companyId: company._id,
                companyName: company.name,
                registrationCode: company.registrationCode,
                ratios: ratios
            });
        }

        console.log(`Formatting chart data for ${ratiosData.length} companies`);
        const chartData = advancedAnalyticsChartService.formatRatioChartData(ratiosData, metric);

        res.json({
            success: true,
            data: chartData,
            metrics: advancedAnalyticsChartService.getRatioMetrics()
        });

    } catch (error) {
        console.error('Error generating chart data:', error.stack);
        res.status(500).json({
            success: false,
            error: `Viga graafikute andmete genereerimisel: ${error.message}`
        });
    }
};