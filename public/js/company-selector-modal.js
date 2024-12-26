document.addEventListener('DOMContentLoaded', function() {
    console.log('Initializing company selector modal');

    const searchInput = document.getElementById('companySearch');
    const searchResults = document.getElementById('searchResults');
    const tagFilter = document.getElementById('tagFilter');
    const selectedCompanies = document.getElementById('selectedCompanies');
    const updateBtn = document.getElementById('updateComparisonBtn');
    let selectedCompanyIds = new Set();

    // Initialize selected companies from current comparison
    document.querySelectorAll('#selectedCompanies .list-group-item').forEach(item => {
        const companyId = item.getAttribute('data-company-id');
        if (companyId) {
            console.log(`Initializing previously selected company: ${companyId}`);
            selectedCompanyIds.add(companyId);
        }
    });

    // Handle search with Enter key
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            searchCompanies();
        }
    });

    // Handle tag selection
    tagFilter.addEventListener('change', async function() {
        console.log('Tag filter changed');
        const selectedTags = Array.from(tagFilter.selectedOptions).map(option => option.value);
        console.log('Selected tags:', selectedTags);

        if (selectedTags.length > 0) {
            try {
                const response = await fetch(`/comparison/search?tags=${encodeURIComponent(JSON.stringify(selectedTags))}`);
                const data = await response.json();

                if (data.success) {
                    console.log(`Found ${data.companies.length} companies with selected tags`);
                    displaySearchResults(data.companies);
                } else {
                    throw new Error(data.error || 'Viga ettevõtete otsimisel');
                }
            } catch (error) {
                console.error('Error fetching companies by tags:', error);
                console.error(error.stack);
                searchResults.innerHTML = `<div class="alert alert-danger">Viga tagide järgi otsimisel: ${error.message}</div>`;
            }
        }
    });

    async function searchCompanies() {
        const query = searchInput.value.trim();
        if (query.length < 2) {
            console.log('Search query too short');
            alert('Otsing peab olema vähemalt 2 tähemärki pikk');
            return;
        }

        try {
            console.log(`Searching companies with query: ${query}`);
            const response = await fetch(`/comparison/search?query=${encodeURIComponent(query)}`);
            const data = await response.json();

            if (data.success) {
                console.log(`Found ${data.companies.length} companies matching query`);
                displaySearchResults(data.companies);
            } else {
                throw new Error(data.error || 'Viga ettevõtete otsimisel');
            }
        } catch (error) {
            console.error('Error searching companies:', error);
            console.error(error.stack);
            searchResults.innerHTML = `<div class="alert alert-danger">Viga otsingul: ${error.message}</div>`;
        }
    }

    function displaySearchResults(companies) {
        if (!companies.length) {
            console.log('No companies found matching criteria');
            searchResults.innerHTML = '<div class="alert alert-info">Ettevõtteid ei leitud</div>';
            return;
        }

        console.log(`Displaying ${companies.length} companies in search results`);
        searchResults.innerHTML = companies.map(company => `
            <div class="list-group-item d-flex justify-content-between align-items-center">
                <div>
                    <strong>${company.name}</strong>
                    <br>
                    <small>Reg. nr: ${company.registrationCode}</small>
                </div>
                <button class="btn btn-primary btn-sm" onclick="addCompany('${company._id}', '${company.name}', '${company.registrationCode}')">
                    Lisa
                </button>
            </div>
        `).join('');
    }

    window.addCompany = function(id, name, registrationCode) {
        try {
            if (!selectedCompanyIds.has(id)) {
                console.log(`Adding company to selection: ${name} (${id})`);
                selectedCompanyIds.add(id);
                const item = document.createElement('div');
                item.className = 'list-group-item d-flex justify-content-between align-items-center';
                item.setAttribute('data-company-id', id);
                item.innerHTML = `
                    <div>
                        <strong>${name}</strong>
                        <br>
                        <small>Reg. nr: ${registrationCode}</small>
                    </div>
                    <button class="btn btn-danger btn-sm" onclick="removeCompany('${id}', '${name}')">
                        Eemalda
                    </button>
                `;
                selectedCompanies.appendChild(item);
            } else {
                console.log(`Company ${name} already in selection`);
            }
        } catch (error) {
            console.error('Error adding company:', error);
            console.error(error.stack);
            alert('Viga ettevõtte lisamisel: ' + error.message);
        }
    };

    window.removeCompany = function(id, name) {
        try {
            console.log(`Removing company from selection: ${name} (${id})`);
            selectedCompanyIds.delete(id);
            const item = selectedCompanies.querySelector(`[data-company-id="${id}"]`);
            if (item) {
                item.remove();
            }
        } catch (error) {
            console.error('Error removing company:', error);
            console.error(error.stack);
            alert('Viga ettevõtte eemaldamisel: ' + error.message);
        }
    };

    updateBtn.addEventListener('click', function() {
        try {
            if (selectedCompanyIds.size < 2) {
                console.log('Not enough companies selected');
                alert('Vähemalt kaks ettevõtet peavad olema valitud võrdluseks');
                return;
            }
            
            const companiesParam = Array.from(selectedCompanyIds).join(',');
            console.log(`Updating comparison with companies: ${companiesParam}`);
            window.location.href = `/comparison/table?companies=${companiesParam}`;
        } catch (error) {
            console.error('Error updating comparison:', error);
            console.error(error.stack);
            alert('Viga võrdluse uuendamisel: ' + error.message);
        }
    });
});