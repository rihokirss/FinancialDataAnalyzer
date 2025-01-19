/**
 * Formats financial ratio data for chart visualization
 * @param {Array} companiesData - Array of company data with ratios
 * @param {string} metric - The ratio metric to format
 * @returns {Object} Formatted data for ApexCharts
 */
exports.formatRatioChartData = (companiesData, metric) => {
    try {
        console.log(`Formatting chart data for ratio metric: ${metric}`);

        // Get all unique periods across all companies
        const periods = [...new Set(
            companiesData.flatMap(company =>
                company.ratios.map(r => r.period)
            )
        )].sort((a, b) => {
            const [yearA, quarterA] = a.split('-Q');
            const [yearB, quarterB] = b.split('-Q');
            return yearA === yearB ? quarterA - quarterB : yearA - yearB;
        });

        // Format data for ApexCharts
        const series = companiesData.map(company => {
            const data = periods.map(period => {
                const periodData = company.ratios.find(r => r.period === period);
                return periodData ? periodData.ratios[metric] : null;
            });

            return {
                name: company.companyName,
                data: data
            };
        });

        return {
            periods,
            series
        };
    } catch (error) {
        console.error('Error formatting ratio chart data:', error);
        throw error;
    }
};

/**
 * Returns configuration for available ratio metrics
 */
exports.getRatioMetrics = () => {
    return [
        { id: 'grossProfitMargin', name: 'Brutokasumi marginaal', unit: '%' },
        { id: 'netProfitMargin', name: 'Netokasumi marginaal', unit: '%' },
        { id: 'revenuePerEmployee', name: 'Käive töötaja kohta', unit: '€' },
        { id: 'employeeCost', name: 'Tööjõukulu', unit: '€' },
        { id: 'taxToRevenue', name: 'Maksude osakaal käibest', unit: '%' },
        { id: 'laborTaxToRevenue', name: 'Tööjõumaksude osakaal käibest', unit: '%' }
    ];
};