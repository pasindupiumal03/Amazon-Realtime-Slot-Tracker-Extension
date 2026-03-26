/**
 * Background script for Amazon Realtime Slot Tracker
 */

chrome.runtime.onInstalled.addListener(() => {
  console.log('Amazon Realtime Slot Tracker installed and ready.');
});

// Powerful fetch that runs in the page's own JavaScript context (MAIN world)
// This bypasses CORS and sends cookies as if it were the website's own code.
const fetchInPageContext = async (tabId, scheduleId, hostname) => {
  try {
    const locale = hostname.endsWith('.ca') ? 'en-CA' : 'en-US';
    const apiUrl = `https://${hostname}/application/api/job/get-schedule-details/${scheduleId}?locale=${locale}`;

    const [{ result }] = await chrome.scripting.executeScript({
      target: { tabId },
      world: 'MAIN',
      func: (url) => {
        // HELPER: Try to find the authorization token in the page session
        // Amazon often stores this in localStorage or a global variable
        const findToken = () => {
          try {
            // 1. Check common localStorage keys
            for (let i = 0; i < localStorage.length; i++) {
              const key = localStorage.key(i);
              const val = localStorage.getItem(key);
              if (val && val.length > 500 && val.startsWith('AQIC')) return val;
            }
            // 2. Check common sessionStorage keys
            for (let i = 0; i < sessionStorage.length; i++) {
              const key = sessionStorage.key(i);
              const val = sessionStorage.getItem(key);
              if (val && val.length > 500 && val.startsWith('AQIC')) return val;
            }
            // 3. Search window object for common property names
            const commonKeys = ['authorization', 'authToken', 'token', 'auth'];
            for (const key of commonKeys) {
               if (window[key] && typeof window[key] === 'string' && window[key].startsWith('AQIC')) return window[key];
            }
          } catch (e) {}
          return null;
        };

        const authToken = findToken();
        const headers = {
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        };

        if (authToken) {
          headers['Authorization'] = authToken;
        }

        return fetch(url, { headers })
        .then(response => {
          if (!response.ok) throw new Error("Status " + response.status);
          return response.json();
        })
        .then(json => {
          if (json && json.data) {
             return {
                available: json.data.laborDemandAvailableCount || 0,
                filled: json.data.laborDemandFillCount || 0,
                total: json.data.laborDemandCount || 0,
                success: true
             };
          }
          return { error: "Missing data in API response" };
        })
        .catch(err => {
          return { error: err.message };
        });
      },
      args: [apiUrl]
    });

    if (!result) {
       return { error: "Empty result from page injection. Please refresh the page." };
    }

    if (result.error) {
       return { error: result.error };
    }

    return result;
  } catch (error) {
    console.error("Scripting error:", error);
    return { error: error.message };
  }
};

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "FETCH_SLOTS") {
    // We need the tabId from the request if the service worker can't get it
    fetchInPageContext(request.tabId, request.scheduleId, request.hostname).then((data) => {
      sendResponse(data);
    });
    return true; // Keep message channel open for async response
  }
});