document.addEventListener('DOMContentLoaded', function() {
    const companySelector = document.getElementById('companySelector');
    const startDate = document.getElementById('startDate');
    const endDate = document.getElementById('endDate');
    const filterButton = document.getElementById('filterDates');
    const exportButton = document.getElementById('exportData');
    let chart = null;

    if (companySelector) {
        console.log('Company selector found, adding change listener');

        companySelector.addEventListener('change', function() {
            const selectedCompanyId = this.value;
            if (selectedCompanyId) {
                console.log(`Company selected: ${selectedCompanyId}, redirecting...`);
                try {
                    window.location.href = `/companies/data/${selectedCompanyId}`;
                } catch (error) {
                    console.error('Error redirecting to company data:', error);
                    alert('Viga ettevõtte andmete laadimisel. Palun proovige uuesti.');
                }
            } else {
                console.log('No company selected');
            }
        });
    } else {
        console.error('Company selector element not found');
    }

    if (filterButton) {
        filterButton.addEventListener('click', async function() {
            const companyId = companySelector.value;
            const start = startDate.value;
            const end = endDate.value;

            if (!start || !end) {
                alert('Palun valige mõlemad kuupäevad');
                return;
            }

            try {
                const response = await fetch(`/companies/data/${companyId}/filter?startDate=${start}&endDate=${end}`);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data = await response.json();

                // Update table
                updateTable(data.financialData);

                // Update chart
                updateChart(data.chartData);

            } catch (error) {
                console.error('Error fetching filtered data:', error);
                alert('Viga andmete filtreerimisel: ' + error.message);
            }
        });
    }

    if (exportButton) {
        exportButton.addEventListener('click', function() {
            const companyId = companySelector.value;
            let url = `/companies/data/${companyId}/export`;

            // Add date range parameters if they exist
            const start = startDate.value;
            const end = endDate.value;
            if (start && end) {
                url += `?startDate=${start}&endDate=${end}`;
            }

            // Trigger file download
            window.location.href = url;
        });
    }

    function updateTable(financialData) {
        const tbody = document.querySelector('table tbody');
        tbody.innerHTML = '';

        financialData.forEach(data => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${data.period}</td>
                <td>${data.taxes ? data.taxes.toLocaleString('et-EE') : 'N/A'} €</td>
                <td>${data.laborTaxes ? data.laborTaxes.toLocaleString('et-EE') : 'N/A'} €</td>
                <td>${data.revenue ? data.revenue.toLocaleString('et-EE') : 'N/A'} €</td>
                <td>${data.employees ?? 'N/A'}</td>
            `;
            tbody.appendChild(row);
        });
    }

    function updateChart(chartData) {
        const ctx = document.getElementById('financialChart');

        // Find any existing chart instance
        const existingChart = Chart.getChart(ctx);
        if (existingChart) {
            existingChart.destroy();
        }

        chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: chartData.labels,
                datasets: [
                    {
                        label: 'Revenue',
                        data: chartData.revenue,
                        borderColor: 'rgb(75, 192, 192)',
                        tension: 0.1
                    },
                    {
                        label: 'Taxes',
                        data: chartData.taxes,
                        borderColor: 'rgb(255, 99, 132)',
                        tension: 0.1
                    },
                    {
                        label: 'Employees',
                        data: chartData.employees,
                        borderColor: 'rgb(54, 162, 235)',
                        tension: 0.1
                    }
                ]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }
});