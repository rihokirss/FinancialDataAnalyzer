const extractQuarterFromPeriod = (period) => {
    if (!period) return null;
    const [year, quarterPart] = period.split('-Q');
    const quarterStartDates = {
        '1': '01-01',
        '2': '04-01', 
        '3': '07-01',
        '4': '10-01'
    };
    return new Date(`${year}-${quarterStartDates[quarterPart]}`);
};

const filterByDateRange = (data, startYear, endYear) => {
    console.log(`Filtering data between years ${startYear} and ${endYear}`);
    if (!startYear || !endYear) return data;

    return data.filter(entry => {
        if (!entry.period) return false;
        const periodDate = extractQuarterFromPeriod(entry.period);
        const periodYear = periodDate.getFullYear();
        return periodYear >= startYear && periodYear <= endYear;
    });
};

const generateTableHeader = (companies) => {
    console.log('Generating table header for companies:', companies.map(c => c.name));
    return `
        <tr>
            <th rowspan="2">Periood</th>
            ${companies.map(company => `
                <th colspan="4" class="company-header">${company.name}</th>
            `).join('')}
        </tr>
        <tr>
            ${companies.map(() => `
                <th class="metric-header">Käive</th>
                <th class="metric-header">Maksud</th>
                <th class="metric-header">Tööjõumaksud</th>
                <th class="metric-header">Töötajad</th>
            `).join('')}
        </tr>
    `;
};

const formatNumber = (number) => {
    if (number === null || number === undefined) return '-';
    return number.toLocaleString('et-EE', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
    });
};

const generateTableBody = (companies) => {
    console.log('Generating table body from company data');
    const allPeriods = new Set();
    
    // Collect all unique periods
    companies.forEach(company => {
        company.financialData.forEach(data => {
            if (data.period) allPeriods.add(data.period);
        });
    });

    // Sort periods in descending order (newest first)
    const sortedPeriods = Array.from(allPeriods).sort().reverse();

    return sortedPeriods.map(period => {
        return `
            <tr>
                <td>${period}</td>
                ${companies.map(company => {
                    const periodData = company.financialData.find(d => d.period === period) || {};
                    return `
                        <td>${formatNumber(periodData.revenue)}</td>
                        <td>${formatNumber(periodData.taxes)}</td>
                        <td>${formatNumber(periodData.laborTaxes)}</td>
                        <td>${formatNumber(periodData.employees)}</td>
                    `;
                }).join('')}
            </tr>
        `;
    }).join('');
};

const generateComparisonTable = (companies, startYear, endYear) => {
    console.log(`Generating comparison table for ${companies.length} companies`);
    
    try {
        const filteredCompanies = companies.map(company => ({
            ...company,
            financialData: filterByDateRange(company.financialData, startYear, endYear)
        }));

        return {
            header: generateTableHeader(filteredCompanies),
            body: generateTableBody(filteredCompanies)
        };
    } catch (error) {
        console.error('Error generating comparison table:', error);
        console.error(error.stack);
        throw new Error('Võrdlustabeli genereerimisel tekkis viga');
    }
};

module.exports = {
    generateComparisonTable,
    filterByDateRange,
    extractQuarterFromPeriod
};