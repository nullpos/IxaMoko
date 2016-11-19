
chrome.runtime.onMessage.addListener(function(request, sender, sendMessage) {
    var xhr = new XMLHttpRequest();
    xhr.open('POST', request.url + '?' + request.query, true);
    xhr.onload(sendMessage(xhr.responseText));
    xhr.send(null);
});