document.addEventListener('DOMContentLoaded', function() {
    const startDateInput = document.getElementById('startDate');
    const endDateInput = document.getElementById('endDate');
    const applyFilterBtn = document.getElementById('applyDateFilter');
    const ratiosTable = document.getElementById('ratiosTable');

    // Set default date range (current year and previous year)
    const currentYear = new Date().getFullYear();
    startDateInput.value = currentYear - 1;
    endDateInput.value = currentYear;

    // Initial load
    fetchAndDisplayRatios();

    applyFilterBtn.addEventListener('click', fetchAndDisplayRatios);

    async function fetchAndDisplayRatios() {
        try {
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

            const response = await fetch(`/analytics/ratios?startYear=${startYear}&endYear=${endYear}`);
            const data = await response.json();

            if (!data.success) {
                throw new Error(data.error);
            }

            updateTable(data.data);
        } catch (error) {
            console.error('Error fetching ratios:', error);
            alert(`Viga suhtarvude laadimisel: ${error.message}`);
        }
    }

    function updateTable(companiesData) {
        const tbody = ratiosTable.querySelector('tbody');
        tbody.innerHTML = '';

        companiesData.forEach(company => {
            company.ratios.forEach(periodData => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${company.companyName}</td>
                    <td>${periodData.period}</td>
                    <td>${periodData.ratios.grossProfitMargin.toFixed(2)}</td>
                    <td>${periodData.ratios.netProfitMargin.toFixed(2)}</td>
                    <td>${periodData.ratios.revenuePerEmployee.toLocaleString('et-EE')}</td>
                    <td>${periodData.ratios.employeeCost.toLocaleString('et-EE')}</td>
                    <td>${periodData.ratios.taxToRevenue.toFixed(2)}</td>
                    <td>${(periodData.ratios.laborTaxToRevenue || 0).toFixed(2)}</td>
                `;
                tbody.appendChild(row);
            });
        });
    }
});