import React, { useState, useEffect, useCallback } from "react";

const DataSection = ({ title, items, accentColor = "orange" }) => {
  const getAccentClass = () => {
    switch (accentColor) {
       case "orange": return "border-orange-500/20 bg-orange-500/5 text-orange-400";
       case "emerald": return "border-emerald-500/20 bg-emerald-500/5 text-emerald-400";
       default: return "border-white/10 bg-white/5 text-slate-400";
    }
  };

  return (
    <div className={`p-4 rounded-3xl border ${getAccentClass()} backdrop-blur-xl transition-all duration-500 hover:bg-white/10`}>
      <h3 className="text-[10px] font-black uppercase tracking-[0.2em] mb-4 opacity-70">{title}</h3>
      <div className="space-y-2.5">
        {items.map((item, idx) => (
          <div key={idx} className="flex justify-between items-center group/row">
            <span className="text-[11px] font-bold text-slate-500 group-hover/row:text-slate-300 transition-colors">{item.label}</span>
            <span className={`text-sm font-black tabular-nums ${item.isZero ? 'text-slate-600' : 'text-white'}`}>
              {item.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default function App() {
  const [data, setData] = useState({
     laborOrderCount: 0,
     laborDemandCount: 0,
     laborDemandOpenCount: 0,
     laborDemandFillCount: 0,
     laborDemandAvailableCount: 0,
     laborDemandSoftMatchCount: 0,
     laborDemandHardMatchCount: 0,
     startDateDemandCount: 0,
     startDateFillCount: 0,
     startDateAvailableCount: 0,
     startDateDeniedCount: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));

  const getScheduleIdFromUrl = useCallback((url) => {
    try {
      const urlObj = new URL(url);
      const searchParams = new URLSearchParams(urlObj.search);
      let scheduleId = searchParams.get('scheduleId');
      if (!scheduleId && urlObj.hash.includes('?')) {
        const hashQuery = urlObj.hash.split('?')[1];
        const hashParams = new URLSearchParams(hashQuery);
        scheduleId = hashParams.get('scheduleId');
      }
      return { scheduleId, hostname: urlObj.hostname };
    } catch (e) {
      return { scheduleId: null, hostname: null };
    }
  }, []);

  const fetchData = useCallback(() => {
    setLoading(true);
    setError(null);

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0] && tabs[0].url) {
        const { scheduleId, hostname } = getScheduleIdFromUrl(tabs[0].url);
        const tabId = tabs[0].id;
        
        if (!scheduleId) {
          setError("Navigate to a Job Confirmation page to start tracking.");
          setLoading(false);
          return;
        }

        chrome.runtime.sendMessage({ action: "FETCH_SLOTS", tabId, scheduleId, hostname }, (response) => {
          if (chrome.runtime.lastError) {
            setError("Service Worker inactive. Refresh extension.");
            setLoading(false);
            return;
          }
          if (response?.error) {
            setError(response.error);
          } else if (response) {
            setData(response);
            setLastUpdated(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
          }
          setLoading(false);
        });
      } else {
        setLoading(false);
      }
    });
  }, [getScheduleIdFromUrl]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading && !data.laborDemandCount) {
    return (
      <div className="flex flex-col items-center justify-center w-[400px] h-[600px] bg-[#020617] p-8 space-y-4 font-sans text-white">
        <div className="relative">
          <div className="w-16 h-16 rounded-full border-t-4 border-orange-500 animate-spin shadow-lg shadow-orange-500/20"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 bg-orange-500/20 rounded-full animate-pulse"></div>
          </div>
        </div>
        <p className="text-slate-400 font-medium tracking-tight animate-pulse">Analyzing Amazon Data...</p>
      </div>
    );
  }

  const laborItems = [
    { label: "Total Orders", value: data.laborOrderCount, isZero: data.laborOrderCount === 0 },
    { label: "Total Positions", value: data.laborDemandCount, isZero: data.laborDemandCount === 0 },
    { label: "Open Positions", value: data.laborDemandOpenCount, isZero: data.laborDemandOpenCount === 0 },
    { label: "Filled Positions", value: data.laborDemandFillCount, isZero: data.laborDemandFillCount === 0 },
    { label: "Available Positions", value: data.laborDemandAvailableCount, isZero: data.laborDemandAvailableCount === 0 },
    { label: "Soft Matches", value: data.laborDemandSoftMatchCount, isZero: data.laborDemandSoftMatchCount === 0 },
    { label: "Hard Matches", value: data.laborDemandHardMatchCount, isZero: data.laborDemandHardMatchCount === 0 }
  ];

  const startDateItems = [
    { label: "Total Positions", value: data.startDateDemandCount, isZero: data.startDateDemandCount === 0 },
    { label: "Filled Positions", value: data.startDateFillCount, isZero: data.startDateFillCount === 0 },
    { label: "Available Positions", value: data.startDateAvailableCount, isZero: data.startDateAvailableCount === 0 },
    { label: "Denied Applications", value: data.startDateDeniedCount, isZero: data.startDateDeniedCount === 0 }
  ];

  return (
    <div className="flex flex-col w-[400px] h-[600px] bg-gradient-to-b from-[#0f172a] to-[#020617] text-white p-5 font-sans overflow-hidden border border-white/5 select-none">
      {/* Header */}
      <header className="flex justify-between items-center mb-6 mt-1">
        <div className="flex items-center gap-3">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-orange-400 to-rose-500 rounded-xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
            <div className="relative w-10 h-10 bg-slate-900 border border-white/10 rounded-xl flex items-center justify-center shadow-2xl overflow-hidden">
               <img src="assets/icons/logo.png" alt="Logo" className="w-8 h-8 object-contain transform group-hover:scale-110 transition-transform" />
            </div>
          </div>
          <div>
            <h1 className="text-base font-black tracking-tight leading-none bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">Slot Tracker Hub</h1>
            <p className="text-[9px] text-slate-500 font-extrabold uppercase tracking-[0.3em] mt-1">Realtime Metrics</p>
          </div>
        </div>
        
        <button 
          onClick={fetchData}
          className="p-2.5 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl transition-all active:scale-95 group"
        >
          <svg className={`w-4 h-4 text-slate-400 group-hover:text-white transition-colors ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </header>

      {error ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
           <svg className="w-12 h-12 text-rose-500 mb-4 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
           </svg>
           <h2 className="text-lg font-black text-white mb-2">Sync Error</h2>
           <p className="text-slate-500 text-xs italic mb-8 mx-auto max-w-[200px]">"{error}"</p>
           <button onClick={fetchData} className="px-6 py-2 bg-white text-slate-950 rounded-xl font-bold text-xs shadow-xl active:scale-95 hover:bg-slate-100 transition-all">TRY AGAIN</button>
        </div>
      ) : (
        <div className="flex-1 space-y-4 overflow-y-auto pr-1 customize-scrollbar pb-4 animate-in fade-in duration-500">
           {/* Section 1: Labor (Overall Schedule) */}
           <DataSection 
              title="Labor (Overall Schedule)" 
              items={laborItems} 
              accentColor={data.laborDemandAvailableCount > 0 ? "emerald" : "orange"}
           />

           {/* Section 2: Start Date (Specific Batch) */}
           <DataSection 
              title="Start Date (Specific Batch)" 
              items={startDateItems} 
              accentColor={data.startDateAvailableCount > 0 ? "emerald" : "default"}
           />
           
           {/* Summary Tooltip */}
           <div className="p-3 bg-white/5 border border-white/5 rounded-2xl flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-500 uppercase">System Integrity</span>
              <span className="text-[10px] font-black text-emerald-500">OPTIMIZED</span>
           </div>
        </div>
      )}

      {/* Footer */}
      <footer className="mt-auto pt-4 flex items-center justify-between border-t border-white/5 text-slate-700">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
          <p className="text-[9px] font-black uppercase tracking-widest leading-none">
            Synced {lastUpdated}
          </p>
        </div>
        <span className="text-[9px] font-black tracking-tighter opacity-50 uppercase">v1.1.0 (PRO)</span>
      </footer>
    </div>
  );
}