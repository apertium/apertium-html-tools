function copyButton() {
    var copyText = document.getElementById("translatedText");
    copyText.select();
    copyText.setSelectionRange(0, 99999);
    document.execCommand("copy");
}
function clearButton() {
    document.getElementById("originalText").value = "";
    document.getElementById("translatedText").value = "";
}