document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('companySearch');
    const searchResults = document.getElementById('searchResults');
    const selectedCompanies = document.getElementById('selectedCompanies');
    const tagFilter = document.getElementById('tagFilter');

    let selectedCompanyIds = new Set();
    let searchTimeout;

    searchInput.addEventListener('input', function() {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            const query = this.value.trim();
            if (query.length >= 2) {
                searchCompanies(query);
            } else {
                searchResults.innerHTML = '';
            }
        }, 300);
    });

    tagFilter.addEventListener('change', async function() {
        const selectedTags = Array.from(this.selectedOptions).map(option => option.value);

        if (selectedTags.length > 0) {
            try {
                // Clear all existing selections first
                selectedCompanyIds.clear();
                selectedCompanies.innerHTML = '';

                const response = await fetch(`/comparison/search?tags=${encodeURIComponent(JSON.stringify(selectedTags))}`);
                const data = await response.json();

                if (data.success) {
                    data.companies.forEach(company => {
                        addCompany(company);
                    });
                }
            } catch (error) {
                console.error('Error fetching companies by tags:', error);
            }
        }
    });

    async function searchCompanies(query) {
        try {
            console.log(`Searching companies with query: ${query}`);
            const response = await fetch(`/comparison/search?query=${encodeURIComponent(query)}`);
            const data = await response.json();

            if (data.success) {
                console.log(`Found ${data.companies.length} companies matching query`);
                displaySearchResults(data.companies);
            } else {
                throw new Error(data.error);
            }
        } catch (error) {
            console.error('Error searching companies:', error);
            console.error(error.stack);
            searchResults.innerHTML = `<div class="alert alert-danger">Viga otsingul: ${error.message}</div>`;
        }
    }

    function displaySearchResults(companies) {
        searchResults.innerHTML = '';
        console.log('Displaying search results');

        companies.forEach(company => {
            if (!selectedCompanyIds.has(company._id)) {
                const element = document.createElement('a');
                element.href = '#';
                element.className = 'list-group-item list-group-item-action';
                element.innerHTML = `
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <strong>${company.name}</strong>
                            <br>
                            <small>Reg. nr: ${company.registrationCode}</small>
                        </div>
                        <button class="btn btn-sm btn-primary add-company" data-id="${company._id}">
                            Lisa
                        </button>
                    </div>
                `;

                element.querySelector('.add-company').addEventListener('click', (e) => {
                    e.preventDefault();
                    console.log(`Adding company ${company.name} to selection`);
                    addCompany(company);
                });

                searchResults.appendChild(element);
            }
        });

        if (companies.length === 0) {
            console.log('No companies found matching search criteria');
            searchResults.innerHTML = '<div class="alert alert-info">Ettevõtteid ei leitud</div>';
        }
    }

    function addCompany(company) {
        if (selectedCompanyIds.has(company._id)) {
            console.log(`Company ${company.name} already selected`);
            return;
        }

        console.log(`Adding company ${company.name} to selected companies`);
        selectedCompanyIds.add(company._id);

        const element = document.createElement('div');
        element.className = 'list-group-item';
        element.innerHTML = `
            <div class="d-flex justify-content-between align-items-center">
                <div>
                    <strong>${company.name}</strong>
                    <br>
                    <small>Reg. nr: ${company.registrationCode}</small>
                </div>
                <button class="btn btn-sm btn-danger remove-company" data-id="${company._id}">
                    Eemalda
                </button>
            </div>
        `;

        element.querySelector('.remove-company').addEventListener('click', () => {
            console.log(`Removing company ${company.name} from selection`);
            selectedCompanyIds.delete(company._id);
            element.remove();
            // Refresh search results if there's a search query
            if (searchInput.value.trim().length >= 2) {
                searchCompanies(searchInput.value.trim());
            }
        });

        selectedCompanies.appendChild(element);
        // Clear the search results
        searchResults.innerHTML = '';
        searchInput.value = '';
    }
});