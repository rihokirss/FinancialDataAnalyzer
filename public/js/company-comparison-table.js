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
        displayComparisonData(data.comparisonData);
    } catch (error) {
        console.error('Error fetching comparison data:', error);
        console.error(error.stack);
        alert('Viga võrdlusandmete laadimisel: ' + error.message);
    }
}

function displayComparisonData(comparisonData) {
    try {
        const container = document.querySelector('.container');

        // Get all unique periods
        const periods = [...new Set(
            comparisonData.flatMap(company =>
                company.financialData
                    .filter(data => data.period !== null) // Filter out null periods
                    .map(data => data.period)
            ))
        ].sort().reverse();

        // Create a table for each metric
        const metrics = [
            { key: 'taxes', label: 'Maksud' },
            { key: 'laborTaxes', label: 'Tööjõumaksud' },
            { key: 'revenue', label: 'Käive' },
            { key: 'employees', label: 'Töötajate arv' }
        ];

        // Clear existing content
        container.innerHTML = '<h2>Ettevõtete võrdlus</h2>';

        metrics.forEach(metric => {
            const tableDiv = document.createElement('div');
            tableDiv.className = 'table-responsive mt-4';
            tableDiv.innerHTML = `
                <h3>${metric.label}</h3>
                <table class="table table-bordered comparison-table">
                    <thead>
                        <tr>
                            <th>Ettevõte</th>
                            ${periods.map(period => `<th>${period}</th>`).join('')}
                        </tr>
                    </thead>
                    <tbody>
                        ${comparisonData.map(company => `
                            <tr>
                                <td>${company.name}</td>
                                ${periods.map(period => {
                                    const periodData = company.financialData.find(d => d.period === period);
                                    const value = periodData && periodData[metric.key]
                                        ? periodData[metric.key].toLocaleString('et-EE')
                                        : '-';
                                    return `<td>${value}</td>`;
                                }).join('')}
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
            container.appendChild(tableDiv);
        });

        // Add back button
        container.innerHTML += `
            <div class="mt-4">
                <a href="/comparison" class="btn btn-primary">
                    Tagasi ettevõtete valikusse
                </a>
            </div>
        `;

    } catch (error) {
        console.error('Error displaying comparison data:', error);
        console.error(error.stack);
        alert('Viga võrdlustabeli kuvamisel: ' + error.message);
    }
}