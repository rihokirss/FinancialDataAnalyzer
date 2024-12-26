document.addEventListener('DOMContentLoaded', function() {
    const modal = document.getElementById('companyModal');
    console.log('Modal element:', modal);
    console.log('Modal content:', modal?.innerHTML);

    const urlParams = new URLSearchParams(window.location.search);
    const companyIds = urlParams.get('companies')?.split(',') || [];

    // Date filter elements
    const startDateInput = document.getElementById('startDate');
    const endDateInput = document.getElementById('endDate');
    const applyFilterBtn = document.getElementById('applyDateFilter');

    if (companyIds.length < 2) {
        console.log('Not enough companies selected for comparison');
        alert('Vähemalt kaks ettevõtet peavad olema valitud võrdluseks');
        window.location.href = '/comparison';
        return;
    }

    // Set current year as default
    const currentYear = new Date().getFullYear();
    startDateInput.value = currentYear - 1;
    endDateInput.value = currentYear;

    // Initialize with all data
    fetchComparisonData(companyIds);

    // Handle date filter
    applyFilterBtn.addEventListener('click', () => {
        const startYear = startDateInput.value;
        const endYear = endDateInput.value;

        if (!startYear || !endYear) {
            alert('Palun valige mõlemad aastad');
            return;
        }

        if (parseInt(endYear) < parseInt(startYear)) {
            alert('Lõppaasta ei saa olla varasem kui algusaasta');
            return;
        }

        fetchComparisonData(companyIds);
    });
});

async function fetchComparisonData(companyIds) {
    try {
        console.log('Fetching comparison data for companies:', companyIds);

        const response = await fetch('/comparison/compare', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                companyIds,
                startYear: document.getElementById('startDate').value,
                endYear: document.getElementById('endDate').value
            })
        });

        const data = await response.json();
        if (!data.success) {
            throw new Error(data.error);
        }

        console.log('Successfully retrieved comparison data');
        console.log('Attempting to initialize charts');
        displayComparisonData(data.comparisonData);
    } catch (error) {
        console.error('Error fetching comparison data:', error);
        console.error(error.stack);
        alert('Viga võrdlusandmete laadimisel: ' + error.message);
    }
}

let charts = {}; // Store chart instances

function displayComparisonData(comparisonData) {
    const metrics = [
        { key: 'revenue', label: 'Käive' },
        { key: 'taxes', label: 'Maksud' },
        { key: 'laborTaxes', label: 'Tööjõumaksud' },
        { key: 'employees', label: 'Töötajate arv' }
    ];

    metrics.forEach(metric => {
        const chartContainer = document.getElementById(`${metric.key}Chart`);
        const tableContainer = document.getElementById(`${metric.key}Table`);
        if (!chartContainer || !tableContainer) {
            console.error(`Container not found for ${metric.key}`);
            return;
        }

        // Clear existing table
        tableContainer.innerHTML = '';

        // Destroy existing chart if it exists
        if (charts[metric.key]) {
            charts[metric.key].destroy();
        }

        const series = comparisonData.map(company => ({
            name: company.name,
            data: company.financialData
                .filter(d => d.period !== null)
                .sort((a, b) => {
                    const [yearA, quarterA] = a.period.split('-Q');
                    const [yearB, quarterB] = b.period.split('-Q');
                    return (yearA - yearB) || (quarterA - quarterB);
                })
                .map(d => ({
                    x: d.period,
                    y: d[metric.key] || null
                }))
        }));

        charts[metric.key] = new ApexCharts(chartContainer, {
            series,
            chart: {
                type: 'line',
                height: 350,
                zoom: { enabled: false }
            },
            title: {
                text: metric.label,
                align: 'center'
            },
            xaxis: {
                type: 'category'
            },
            yaxis: {
                min: 0,
                labels: {
                    formatter: (value) => value?.toLocaleString('et-EE')
                }
            },
            tooltip: {
                y: {
                    formatter: (value) => value?.toLocaleString('et-EE')
                }
            }
        });
        charts[metric.key].render();

        // Create new table
        const table = document.createElement('table');
        table.className = 'table table-bordered mt-3';

        // Create table header with periods
        const periods = [...new Set(comparisonData.flatMap(c =>
            c.financialData.map(d => d.period)
        ))].sort((a, b) => {
            const [yearA, quarterA] = a.split('-Q');
            const [yearB, quarterB] = b.split('-Q');
            return (yearA - yearB) || (quarterA - quarterB);
        });

        let thead = `<tr><th>Company</th>${periods.map(p =>
            `<th>${p}</th>`).join('')}</tr>`;

        // Create rows for each company
        let tbody = comparisonData.map(company => {
            let row = `<tr><td>${company.name}</td>`;
            periods.forEach(period => {
                const data = company.financialData.find(d => d.period === period);
                row += `<td>${data ? data[metric.key]?.toLocaleString('et-EE') : '-'}</td>`;
            });
            row += '</tr>';
            return row;
        }).join('');

        table.innerHTML = `<thead>${thead}</thead><tbody>${tbody}</tbody>`;
        tableContainer.appendChild(table);
    });
}