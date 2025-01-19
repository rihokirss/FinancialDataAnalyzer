/**
 * Service for calculating various financial ratios
 */

const calculateProfitabilityRatios = (revenue, costs = 0, taxes = 0) => {
    // Mock implementation since we don't have actual profit data
    // In real implementation, this would use actual financial data
    const grossProfit = revenue * 0.3; // Mocking 30% gross profit
    const netProfit = grossProfit - taxes;

    return {
        grossProfitMargin: revenue > 0 ? (grossProfit / revenue) * 100 : 0,
        netProfitMargin: revenue > 0 ? (netProfit / revenue) * 100 : 0
    };
};

const calculateEfficiencyRatios = (revenue, employees) => {
    return {
        revenuePerEmployee: employees > 0 ? revenue / employees : 0,
        employeeCost: employees > 0 ? (revenue * 0.4) / employees : 0 // Mocking 40% of revenue as employee cost
    };
};

const calculateTaxEfficiencyRatios = (revenue, taxes, laborTaxes) => {
    const totalTaxes = (taxes || 0) + (laborTaxes || 0); // Handle null values
    return {
        taxToRevenue: revenue > 0 ? (totalTaxes / revenue) * 100 : 0,
        laborTaxToRevenue: revenue > 0 ? ((laborTaxes || 0) / revenue) * 100 : 0 // Handle null laborTaxes
    };
};

const calculateAllRatios = (financialData) => {
    if (!financialData || !Array.isArray(financialData) || financialData.length === 0) {
        console.error('Invalid financial data provided for ratio calculations');
        throw new Error('Invalid financial data provided');
    }

    console.log(`Calculating financial ratios for ${financialData.length} periods`);

    try {
        const ratios = financialData.filter(period => period && period.period).map(period => {
            console.log(`Processing ratios for period: ${period.period}`);

            const profitability = calculateProfitabilityRatios(period.revenue, 0, period.taxes);
            const efficiency = calculateEfficiencyRatios(period.revenue, period.employees);
            const taxEfficiency = calculateTaxEfficiencyRatios(period.revenue, period.taxes, period.laborTaxes);

            return {
                period: period.period,
                ratios: {
                    ...profitability,
                    ...efficiency,
                    ...taxEfficiency
                }
            };
        });

        console.log('Successfully calculated all financial ratios');
        return ratios;
    } catch (error) {
        console.error('Error calculating financial ratios:', error);
        console.error(error.stack);
        throw new Error(`Failed to calculate financial ratios: ${error.message}`);
    }
};

module.exports = {
    calculateAllRatios,
    calculateProfitabilityRatios,
    calculateEfficiencyRatios,
    calculateTaxEfficiencyRatios
};