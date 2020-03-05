window.onload = function () {
  chrome.tabs.query({ url: 'https://www.belacam.com/*' }, (tabs) => {
    if (tabs) {
      tabs.forEach((item, i, arr) => {
        const code = 'window.location.reload();';
        chrome.tabs.executeScript(item.id, { code }, (result) => {
          // end.
        });
      });
    }
  });
};

chrome.webRequest.onBeforeRequest.addListener(() => (
  { cancel: true }
), {
  urls: [
    'https://dynamodb.us-east-1.amazonaws.com/*',
    'https://www.belacam.com/api/ads/random/*',
    'https://a.teads.tv/*',
    'https://ad.a-ads.com/*',
    'https://ads.adaptv.advertising.com/*'],
}, ['blocking']);
