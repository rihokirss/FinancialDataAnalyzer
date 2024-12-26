document.addEventListener('DOMContentLoaded', function() {
  if (typeof $.fn.tagsinput !== 'undefined') {
    $('#tags').tagsinput({
      trimValue: true,
      confirmKeys: [13, 44], // Enter and comma keys
      tagClass: 'badge bg-primary'
    });
  } else {
    console.error('Bootstrap Tagsinput is not loaded properly.');
  }
});