function setValue(id) {
  // $(function() {
  // $('button').on('click', function() {
  $.ajax({
    method: 'POST',
    url: '/reports',
    data: id,
    success: function(result) {
      console.log(result);
    }
  });
  // });
  return true;
}
