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
        const findToken = () => {
          try {
            console.log("Deep Trace: Inventorying storage keys...");
            
            // 1. Explicitly check discovered keys from US/CA portals
            const containers = ['accessToken', 'idToken', 'sessionToken', 'okta-token-storage', 'oidc.user', 'auth_storage'];
            for (const c of containers) {
              const fromLocal = localStorage.getItem(c);
              const fromSession = sessionStorage.getItem(c);
              const val = fromLocal || fromSession;
              if (val && val.includes('AQIC')) {
                 console.log("Deep Trace: Success! Found token in", c);
                 return val;
              }
            }

            // 2. Bruteforce Local/Session Storage Scan
            const storages = [sessionStorage, localStorage];
            for (let storage of storages) {
              for (let i = 0; i < storage.length; i++) {
                const k = storage.key(i);
                try {
                  const v = storage.getItem(k);
                  if (v && v.length > 400 && v.includes('AQIC')) {
                    console.log("Deep Trace: Found token via brute-force in", k);
                    return v;
                  }
                } catch(inner) {}
              }
            }

            // 3. Cookie Scan
            const cookies = document.cookie.split(';');
            for (let c of cookies) {
              const val = c.trim().split('=')[1];
              if (val && val.length > 400 && val.includes('AQIC')) return val;
            }
          } catch (err) {
            console.error("Deep Trace Error:", err);
          }
          return null;
        };

        const authToken = findToken();
        if (!authToken) {
           console.error("Deep Trace: NO TOKEN FOUND. Session might be inactive.");
           return { error: "Session Token not detected. Please make sure you are logged in and looking at the job page." };
        }

        const headers = {
          'Accept': 'application/json, text/plain, */*',
          'X-Requested-With': 'XMLHttpRequest',
          'Authorization': authToken
        };

        console.log("Deep Trace: Fetching with authorization...");
        return fetch(url, { headers })
        .then(response => {
          if (!response.ok) throw new Error("Status " + response.status);
          return response.json();
        })
        .then(json => {
          if (json && json.data) {
             const d = json.data;
             return {
                // Labor (Overall Schedule)
                laborOrderCount: d.laborOrderCount || 0,
                laborDemandCount: d.laborDemandCount || 0,
                laborDemandOpenCount: d.laborDemandOpenCount || 0,
                laborDemandFillCount: d.laborDemandFillCount || 0,
                laborDemandAvailableCount: d.laborDemandAvailableCount || 0,
                laborDemandSoftMatchCount: d.laborDemandSoftMatchCount || 0,
                laborDemandHardMatchCount: d.laborDemandHardMatchCount || 0,
                
                // Start Date (Specific Batch)
                startDateDemandCount: d.startDateDemandCount || 0,
                startDateFillCount: d.startDateFillCount || 0,
                startDateAvailableCount: d.startDateAvailableCount || 0,
                startDateDeniedCount: d.startDateDeniedCount || 0,
                
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