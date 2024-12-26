document.addEventListener('DOMContentLoaded', function() {
  const form = document.getElementById('csvDownloadForm');
  const statusDiv = document.getElementById('downloadStatus');

  form.addEventListener('submit', async function(e) {
    e.preventDefault();

    const checkboxes = form.querySelectorAll('input[name="csvFiles"]:checked');
    const urls = Array.from(checkboxes).map(cb => cb.value);

    if (urls.length === 0) {
      statusDiv.textContent = 'Palun valige vähemalt üks CSV-fail allalaadimiseks.';
      return;
    }

    statusDiv.textContent = 'CSV-failide allalaadimine ja parsimine...';

    try {
      const response = await fetch('/companies/download-csv', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ urls }),
      });

      const result = await response.json();

      if (result.success) {
        statusDiv.textContent = `Edukalt alla laaditud ja parsitud ${result.results.length} CSV-faili.`;
        console.log('Parsitud CSV-failid:', result.results);
      } else {
        statusDiv.textContent = 'Viga: ' + result.error;
        console.error('Viga CSV-failide allalaadimisel ja parsimisel:', result.error);
      }
    } catch (error) {
      console.error('Viga:', error);
      statusDiv.textContent = 'Tekkis viga CSV-failide allalaadimisel ja parsimisel.';
    }
  });
});