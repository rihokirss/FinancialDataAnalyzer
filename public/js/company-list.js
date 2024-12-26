document.addEventListener('DOMContentLoaded', function() {
  const deleteButtons = document.querySelectorAll('.delete-company');

  deleteButtons.forEach(button => {
    button.addEventListener('click', function(e) {
      e.preventDefault();
      const companyId = this.getAttribute('data-id');

      if (confirm('Kas olete kindel, et soovite selle ettevõtte kustutada?')) {
        fetch(`/companies/delete/${companyId}`, {
          method: 'DELETE',
        })
        .then(response => response.json())
        .then(data => {
          if (data.message) {
            // alert(data.message);
            // Remove the row from the table
            this.closest('tr').remove();
          } else {
            alert(data.error || 'Viga ettevõtte kustutamisel.');
          }
        })
        .catch(error => {
          console.error('Error:', error);
          alert('Viga ettevõtte kustutamisel. Palun proovige uuesti.');
        });
      }
    });
  });
});