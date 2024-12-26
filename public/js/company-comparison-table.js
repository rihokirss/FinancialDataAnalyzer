document.addEventListener('DOMContentLoaded', function() {
    const urlParams = new URLSearchParams(window.location.search);
    const companyIds = urlParams.get('companies')?.split(',') || [];

    if (companyIds.length < 2) {
        console.log('Not enough companies selected for comparison');
        alert('Vähemalt kaks ettevõtet peavad olema valitud võrdluseks');
        window.location.href = '/comparison';
        return;
    }

    fetchComparisonData(companyIds);
});

async function fetchComparisonData(companyIds) {
    try {
        console.log('Fetching comparison data for companies:', companyIds);
        const response = await fetch('/comparison/compare', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ companyIds })
        });

        const data = await response.json();
        if (!data.success) {
            throw new Error(data.error);
        }

        console.log('Successfully retrieved comparison data');
        console.log('Attempting to initialize charts');
        console.log('Chart containers in DOM:', {
            taxes: document.getElementById('taxesChart'),
            laborTaxes: document.getElementById('laborTaxesChart'),
            revenue: document.getElementById('revenueChart'),
            employees: document.getElementById('employeesChart')
        });
        displayComparisonData(data.comparisonData);
    } catch (error) {
        console.error('Error fetching comparison data:', error);
        console.error(error.stack);
        alert('Viga võrdlusandmete laadimisel: ' + error.message);
    }
}

function displayComparisonData(comparisonData) {
    try {
        const metrics = [
            { key: 'revenue', label: 'Käive' },
            { key: 'taxes', label: 'Maksud' },
            { key: 'laborTaxes', label: 'Tööjõumaksud' },
            { key: 'employees', label: 'Töötajate arv' }
        ];

        metrics.forEach(metric => {
            const chartContainer = document.getElementById(`${metric.key}Chart`);
            if (!chartContainer) {
                console.error(`Container not found for ${metric.key}`);
                return;
            }

            const series = comparisonData.map(company => ({
                name: company.name,
                data: company.financialData
                    .filter(d => d.period !== null)
                    .sort((a, b) => new Date(a.period) - new Date(b.period))
                    .map(d => ({
                        x: d.period,
                        y: d[metric.key] || null
                    }))
            }));

            new ApexCharts(chartContainer, {
                series,
                chart: {
                    type: 'line',
                    height: 350
                },
                title: {
                    text: metric.label,
                    align: 'center'
                },
                xaxis: {
                    type: 'category'
                },
                yaxis: {
                    labels: {
                        formatter: (value) => value?.toLocaleString('et-EE')
                    }
                },
                tooltip: {
                    y: {
                        formatter: (value) => value?.toLocaleString('et-EE')
                    }
                }
            }).render();
        });
    } catch (error) {
        console.error('Error initializing charts:', error);
    }
}