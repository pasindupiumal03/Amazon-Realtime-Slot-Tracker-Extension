import React, { useState, useEffect } from "react";

export default function App() {
  const [slots, setSlots] = useState([]);
  const [tracking, setTracking] = useState(false);

  useEffect(() => {
    // Logic to sync with browser storage
    chrome.storage.local.get(["slots", "tracking"], (result) => {
      if (result.slots) setSlots(result.slots);
      if (result.tracking !== undefined) setTracking(result.tracking);
    });
  }, []);

  const toggleTracking = () => {
    const newState = !tracking;
    setTracking(newState);
    chrome.storage.local.set({ tracking: newState });
    
    if (newState) {
      // Start tracking alarm or periodic checks
      chrome.alarms.create("checkSlots", { periodInMinutes: 5 });
    } else {
      chrome.alarms.clear("checkSlots");
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 text-white p-4 font-sans border-r shadow-2xl">
      <header className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">Amazon Slot Tracker</h1>
        <div 
          onClick={toggleTracking}
          className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-300 ${tracking ? 'bg-orange-500' : 'bg-gray-600'}`}
        >
          <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${tracking ? 'translate-x-6' : 'translate-x-0'}`} />
        </div>
      </header>
      
      <main className="flex-1 overflow-y-auto">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-2">Real-time Slots</h2>
        {slots.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-gray-400">
            <p className="text-sm">No slots detected yet.</p>
            <p className="text-xs mt-1">Start browsing Amazon to catch 'em!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Slot items will go here */}
          </div>
        )}
      </main>
      
      <footer className="mt-4 pt-4 border-t border-slate-800 text-center">
        <p className="text-xs text-gray-500">Last checked: Just now</p>
      </footer>
    </div>
  );
}