document.addEventListener('DOMContentLoaded', () => {
  chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
    if (tabs.length > 0) {
      document.getElementById('urlInput').value = tabs[0].url;
    }
  });

  // Format the URL properly (add https:// if needed)
  function formatUrl(url) {
    url = url.trim();
    if (url && !url.match(/^https?:\/\//i)) {
      url = 'https://' + url;
    }
    return url;
  }

  document.getElementById('archiveBtn').addEventListener('click', () => {
    const inputUrl = formatUrl(document.getElementById('urlInput').value);
    if (!inputUrl) return;

    // Use the form submission method that was working before
    const htmlContent = `
      <html>
        <body onload="document.forms[0].submit()">
          <form action='https://archive.today/submit/' method='POST'>
            <input type='hidden' name='url' value='${inputUrl}' />
          </form>
        </body>
      </html>
    `.trim();

    const encoded = encodeURIComponent(htmlContent)
      .replace(/'/g, "%27")
      .replace(/"/g, "%22");

    const dataUri = "data:text/html;charset=utf-8," + encoded;
    chrome.tabs.create({ url: dataUri });
  });
});