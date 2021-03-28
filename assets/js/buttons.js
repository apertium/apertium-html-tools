$('#copy').click(function () {
    $('#translatedText').select();
    document.execCommand("copy");
    alert("Text copied! Now paste in the below textarea to check.");
});

$( "#clear" ).click(function() {
    $('#translatedText').val('');
    $('#originalText').val('');
  });
