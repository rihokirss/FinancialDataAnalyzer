document.addEventListener('DOMContentLoaded', function() {
    const companySelector = document.getElementById('companySelector');

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
});