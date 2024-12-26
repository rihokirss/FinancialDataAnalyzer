/**
 * Formats financial data for Chart.js visualization
 * @param {Array} comparisonData - Array of company data objects
 * @param {string} metric - The metric to format (taxes, laborTaxes, revenue, employees)
 * @returns {Object} Formatted data for Chart.js
 */
exports.formatChartData = (comparisonData, metric) => {
    try {
        console.log(`Formatting chart data for metric: ${metric}`);

        // Filter out entries with null period before processing
        comparisonData = comparisonData.map(company => ({
            ...company,
            financialData: company.financialData.filter(data => data.period !== null)
        }));

        // Get all unique periods
        const periods = [...new Set(
            comparisonData.flatMap(company =>
                company.financialData
                    .filter(data => data.period !== null)
                    .map(data => data.period)
            )
        )].sort();

        console.log(`Found ${periods.length} unique periods for charting`);

        // Format data for Chart.js
        const datasets = comparisonData.map((company, index) => {
            const chartData = periods.map(period => {
                const periodData = company.financialData.find(d => d.period === period);
                return periodData ? periodData[metric] : null;
            });

            console.log(`Formatted data for company ${company.name}: ${chartData.length} data points`);
            console.log(`Chart data for ${company.name}:`, {
                periods: periods,
                dataPoints: chartData
            });

            // Generate color for this dataset using golden angle
            const hue = (index * 137.508) % 360;

            return {
                label: company.name,
                data: chartData,
                fill: false,
                borderWidth: 2,
                borderColor: `hsl(${hue}, 70%, 60%)`,
                backgroundColor: `hsla(${hue}, 70%, 60%, 0.1)`,
                tension: 0.1
            };
        });

        console.log('Final formatted chart data:', {
            periods: periods,
            datasetValues: datasets.map(d => ({
                company: d.label,
                dataPoints: d.data
            }))
        });

        return {
            labels: periods,
            datasets: datasets
        };
    } catch (error) {
        console.error('Error formatting chart data:', error);
        console.error(error.stack);
        throw error;
    }
};

/**
 * Generates random colors for chart datasets
 * @param {number} count - Number of colors needed
 * @returns {Array} Array of color strings
 */
exports.generateChartColors = (count) => {
    try {
        console.log(`Generating ${count} colors for chart datasets`);

        const colors = [];
        for (let i = 0; i < count; i++) {
            const hue = (i * 137.508) % 360; // Use golden angle approximation
            colors.push(`hsl(${hue}, 70%, 60%)`);
        }

        console.log(`Generated ${colors.length} unique colors for charts`);
        return colors;
    } catch (error) {
        console.error('Error generating chart colors:', error);
        console.error(error.stack);
        throw error;
    }
};