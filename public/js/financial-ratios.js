document.addEventListener('DOMContentLoaded', function() {
    const companyId = document.getElementById('companySelector').value;
    let ratiosChart = null;

    async function fetchAndDisplayRatios(startDate = null, endDate = null) {
        try {
            let url = `/companies/ratios/${companyId}`;
            if (startDate && endDate) {
                url += `/filter?startDate=${startDate}&endDate=${endDate}`;
            }

            const response = await fetch(url);
            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Viga suhtarvude laadimisel');
            }

            const { ratios } = await response.json();

            // Filter out entries with null periods
            const cleanRatios = ratios.filter(r => r.period !== null);

            updateRatiosTable(cleanRatios);
            updateRatiosChart(cleanRatios);

        } catch (error) {
            console.error('Viga suhtarvude laadimisel:', error);
            alert(`Viga suhtarvude laadimisel: ${error.message}`);
        }
    }

    function updateRatiosTable(ratios) {
        const tbody = document.querySelector('#ratiosTable tbody');
        tbody.innerHTML = '';

        // Sort newest first
        const sortedRatios = [...ratios].sort((a, b) => {
            if (!a.period || !b.period) return 0;
            const [yearA, quarterA] = a.period.split('-Q');
            const [yearB, quarterB] = b.period.split('-Q');
            if (yearA !== yearB) return yearB - yearA;
            return quarterB - quarterA;
        });

        sortedRatios.forEach(({ period, ratios: r }) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${period}</td>
                <td>${r.grossProfitMargin.toFixed(2)}</td>
                <td>${r.netProfitMargin.toFixed(2)}</td>
                <td>${r.revenuePerEmployee.toLocaleString('et-EE')}</td>
                <td>${r.employeeCost.toLocaleString('et-EE')}</td>
                <td>${r.taxToRevenue.toFixed(2)}</td>
                <td>${(r.laborTaxToRevenue || 0).toFixed(2)}</td>
            `;
            tbody.appendChild(row);
        });
    }

    function updateRatiosChart(ratios) {
        const ctx = document.getElementById('ratiosChart');

        if (ratiosChart) {
            ratiosChart.destroy();
        }

        // Sort chronologically for the chart
        const sortedRatios = [...ratios].sort((a, b) => {
            if (!a.period || !b.period) return 0;
            const [yearA, quarterA] = a.period.split('-Q');
            const [yearB, quarterB] = b.period.split('-Q');
            if (yearA !== yearB) return yearA - yearB;
            return quarterA - quarterB;
        });

        const labels = sortedRatios.map(r => r.period).filter(label => label !== null);
        const datasets = [
            {
                name: 'Brutokasumi marginaal (%)',
                type: 'line',
                data: sortedRatios.map(r => r.ratios.grossProfitMargin)
            },
            {
                name: 'Netokasumi marginaal (%)',
                type: 'line',
                data: sortedRatios.map(r => r.ratios.netProfitMargin)
            },
            {
                name: 'Maksude osakaal käibest (%)',
                type: 'line',
                data: sortedRatios.map(r => r.ratios.taxToRevenue)
            }
        ];

        const options = {
            series: datasets,
            chart: {
                height: 450,
                type: 'line',
                zoom: { enabled: false }
            },
            legend: {
                position: 'bottom',
                horizontalAlign: 'center'
            },
            stroke: {
                width: [2, 2, 2]
            },
            title: {
                text: 'Ettevõtte Suhtarvud',
                align: 'left'
            },
            xaxis: {
                categories: labels
            },
            yaxis: {
                title: {
                    text: 'Protsent (%)'
                }
            }
        };

        ratiosChart = new ApexCharts(document.querySelector("#ratiosChart"), options);
        ratiosChart.render();
    }

    // Initial load with current year and previous year filter
    if (companyId) {
        const currentYear = new Date().getFullYear();
        const previousYear = currentYear - 1;
        fetchAndDisplayRatios(previousYear, currentYear);
    }

    // Connect to existing date filter functionality
    document.getElementById('filterDates')?.addEventListener('click', () => {
        const startDate = document.getElementById('startDate').value;
        const endDate = document.getElementById('endDate').value;
        fetchAndDisplayRatios(startDate, endDate);
    });
});