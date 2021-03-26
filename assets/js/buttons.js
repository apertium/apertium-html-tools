
function myFunction() {
    /* Get the text field */
    var copyText = document.getElementById("translatedText");

    /* Select the text field */
    copyText.select();
    copyText.setSelectionRange(0, 99999); /* For mobile devices */

    /* Copy the text inside the text field */
    document.execCommand("copy");
}



function ClearFields() {

    document.getElementById("originalText").value = "";
    document.getElementById("translatedText").value = "";
}
