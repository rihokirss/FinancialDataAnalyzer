document.addEventListener('DOMContentLoaded', function() {
    const companySelector = document.getElementById('companySelector');
    const companyId = document.getElementById('companySelector').value;
    const startDate = document.getElementById('startDate');
    const endDate = document.getElementById('endDate');
    const filterButton = document.getElementById('filterDates');
    const exportButton = document.getElementById('exportData');
    let chart = null;

    // Get URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const startParam = urlParams.get('startDate');
    const endParam = urlParams.get('endDate');

    // Set filter values from URL parameters if they exist
    if (startParam) startDate.value = startParam;
    if (endParam) endDate.value = endParam;

/*     // Apply filters automatically if parameters exist
    if (startParam && endParam) {
        fetchAndDisplayData(companySelector.value, startParam, endParam);
    } */

    if (companySelector) {
        console.log('Company selector found, adding change listener');

        companySelector.addEventListener('change', async function() {
            const selectedCompanyId = this.value;
            if (selectedCompanyId) {
                console.log(`Company selected: ${selectedCompanyId}`);
                try {
                    const start = startDate.value;
                    const end = endDate.value;
                    await fetchAndDisplayData(selectedCompanyId, start, end);
                    // Update URL without page reload
                    const newUrl = `/companies/data/${selectedCompanyId}?startDate=${start}&endDate=${end}`;
                    window.history.pushState({}, '', newUrl);
                } catch (error) {
                    console.error('Error loading company data:', error);
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
                await fetchAndDisplayData(companyId, start, end);
                // Update URL without page reload
                const newUrl = `/companies/data/${companyId}?startDate=${start}&endDate=${end}`;
                window.history.pushState({}, '', newUrl);
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

    async function fetchAndDisplayData(companyId, startDate, endDate) {
        const response = await fetch(`/companies/data/${companyId}/filter?startDate=${startDate}&endDate=${endDate}`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        updateTable(data.financialData);
        updateChart(data.chartData);
    }

    function updateTable(financialData) {
        const tbody = document.querySelector('table tbody');
        tbody.innerHTML = '';

        // Sort data - newest first
        const sortedData = [...financialData]
            .filter(data => data.period !== null)
            .sort((a, b) => {
                const [yearA, quarterA] = a.period.split('-Q');
                const [yearB, quarterB] = b.period.split('-Q');
                // Reverse the comparison to sort newest first
                if (yearA !== yearB) {
                    return yearB - yearA;
                }
                return quarterB - quarterA;
            });

        sortedData.forEach(data => {
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
        const sortedData = chartData.labels.map((label, index) => ({
            label,
            revenue: chartData.revenue[index],
            taxes: chartData.taxes[index],
            laborTaxes: chartData.laborTaxes[index],
            employees: chartData.employees[index]
        })).filter(d => d.label !== null)
          .sort((a, b) => new Date(a.label) - new Date(b.label));

        const maxEmployees = Math.max(...sortedData.map(d => d.employees));

        const options = {
            series: [
                {
                    name: 'Käive',
                    type: 'line',
                    data: sortedData.map(d => d.revenue),
                },
                {
                    name: 'Maksud',
                    type: 'line',
                    data: sortedData.map(d => d.taxes),
                },
                {
                    name: 'Tööjõumaksud',
                    type: 'line',
                    data: sortedData.map(d => d.laborTaxes || 0),
                },
                {
                    name: 'Töötajad',
                    type: 'line',
                    data: sortedData.map(d => d.employees),
                }
            ],
            chart: {
                height: 450,
                type: 'line',
                zoom: { enabled: false }
            },
            stroke: {
                width: [2, 2, 2, 2],
                curve: 'straight'
            },
            legend: {
                position: 'bottom',
                horizontalAlign: 'center'
            },
            xaxis: {
                categories: sortedData.map(d => d.label)
            },
            yaxis: [
                {
                    title: { text: 'Käive (EUR)' },
                    labels: {
                        formatter: (val) => Math.round(val)
                    },
                    min: 0
                },
                {
                    title: { text: 'Maksud (EUR)' },
                    labels: {
                        formatter: (val) => Math.round(val)
                    },
                    min: 0,
                    opposite: true
                },
                {
                    title: { text: 'Töötajate arv' },
                    min: 0,
                    max: Math.ceil(maxEmployees * 1.1),
                    labels: {
                        formatter: (val) => Math.round(val)
                    },
                    opposite: true
                }
            ]
        };

        //document.querySelector("#financialChart").innerHTML = '';
        chart = new ApexCharts(document.querySelector("#financialChart"), options);
        chart.render();
    }

    // Initial load with current year and previous year filter
    if (companyId) {
        const currentYear = new Date().getFullYear();
        const previousYear = currentYear - 1;
        fetchAndDisplayData(companyId, previousYear, currentYear);
    }
});