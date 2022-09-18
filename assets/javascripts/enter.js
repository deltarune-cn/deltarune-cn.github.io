$('#free_entry_form').submit(function(e) {
    e.preventDefault();
    $('#errors').html("");
    $('#submit').attr("value", "ENTERING!!!");
    $('#submit').attr("disabled", true);
    $('#submit').addClass("disabled");
  
    $.ajax({
      type: 'POST',
      url: $(this).attr('action'),
      data: $(this).serialize(), // serializes the form's elements.
      success: function(data) {
        $('#free_entry_form').addClass('hidden');
        $('#entered').removeClass('hidden');
      },
      error: function(xhr, status, error) {
        var errorText = xhr.responseText;
        console.log(errorText);
        if (errorText.indexOf('verification token') !== -1) {
          errorText = "Verify your humanity above, then try again";
        }
        $('#errors').html("<div class='alert alert-danger'><strong>ERROR!!!!</strong> " + errorText + "</div>");
        $('#submit').attr("value", "ENTER");
        $('#submit').removeAttr("disabled");
        $('#submit').removeClass("disabled");
      }
    });    
  });