document.addEventListener('DOMContentLoaded', () => {
  const urlInput = document.getElementById('urlInput');
  const archiveBtn = document.getElementById('archiveBtn');
  const statusMsg = document.getElementById('statusMsg');
  const clearBtn = document.getElementById('clearBtn');
  const historyList = document.getElementById('historyList');
  
  initializePopup();
  
  archiveBtn.addEventListener('click', archiveCurrentUrl);
  if (clearBtn) clearBtn.addEventListener('click', clearHistory);
  
  function initializePopup() {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length > 0 && tabs[0].url) {
        urlInput.value = tabs[0].url;
      }
    });
    
    if (historyList) {
      loadArchivedUrls();
    }
    
    urlInput.addEventListener('keyup', (e) => {
      if (e.key === 'Enter') {
        archiveCurrentUrl();
      }
    });
  }
  
  function formatUrl(url) {
    url = url.trim();
    if (!url) return '';
    
    if (!url.match(/^https?:\/\//i)) {
      url = 'https://' + url;
    }
    
    return url;
  }
  
  function archiveCurrentUrl() {
    const inputUrl = formatUrl(urlInput.value);
    
    if (!inputUrl) {
      showStatus('Please enter a valid URL', 'error');
      return;
    }
    
    showStatus('Sending to archive.today...', 'info');
    
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
    
    chrome.tabs.create({ url: dataUri }, () => {
      saveToHistory(inputUrl);
    });
  }
  
  function showStatus(message, type = 'info') {
    if (!statusMsg) return;
    
    statusMsg.textContent = message;
    statusMsg.className = `status ${type}`;
    
    if (type !== 'error') {
      setTimeout(() => {
        statusMsg.textContent = '';
        statusMsg.className = 'status';
      }, 3000);
    }
  }
  
  function saveToHistory(url) {
    if (!chrome.storage) return;
    
    chrome.storage.local.get(['archivedUrls'], (result) => {
      const archivedUrls = result.archivedUrls || [];
      
      if (!archivedUrls.includes(url)) {
        archivedUrls.unshift(url);
        if (archivedUrls.length > 10) {
          archivedUrls.pop();
        }
        
        chrome.storage.local.set({ archivedUrls }, () => {
          if (historyList) {
            loadArchivedUrls();
          }
        });
      }
    });
  }
  
  function loadArchivedUrls() {
    if (!chrome.storage || !historyList) return;
    
    chrome.storage.local.get(['archivedUrls'], (result) => {
      const archivedUrls = result.archivedUrls || [];
      
      historyList.innerHTML = '';
      
      if (archivedUrls.length === 0) {
        const emptyItem = document.createElement('li');
        emptyItem.textContent = 'No archived URLs yet';
        emptyItem.className = 'empty-history';
        historyList.appendChild(emptyItem);
        return;
      }
      
      archivedUrls.forEach((url) => {
        const listItem = document.createElement('li');
        
        const urlText = document.createElement('span');
        urlText.textContent = url.length > 50 ? url.substring(0, 47) + '...' : url;
        urlText.title = url;
        urlText.className = 'url-text';
        
        const useBtn = document.createElement('button');
        useBtn.textContent = 'Use';
        useBtn.className = 'use-btn';
        useBtn.addEventListener('click', () => {
          urlInput.value = url;
        });
        
        listItem.appendChild(urlText);
        listItem.appendChild(useBtn);
        historyList.appendChild(listItem);
      });
    });
  }
  
  function clearHistory() {
    if (!chrome.storage) return;
    
    chrome.storage.local.set({ archivedUrls: [] }, () => {
      if (historyList) {
        loadArchivedUrls();
      }
      showStatus('History cleared', 'success');
    });
  }
});
