import React, { useState, useEffect, useCallback } from "react";

const Card = ({ title, value, subValue, icon, accentColor = "orange", isLarge = false }) => {
  const getAccentClass = () => {
    switch (accentColor) {
      case "emerald": return "from-emerald-400 to-teal-500 text-emerald-400 border-emerald-500/20 shadow-emerald-500/10";
      case "rose": return "from-rose-400 to-red-500 text-rose-400 border-rose-500/20 shadow-rose-500/10";
      case "orange": return "from-orange-400 to-amber-500 text-orange-400 border-orange-500/20 shadow-orange-500/10";
      default: return "from-slate-400 to-slate-500 text-slate-300 border-white/10 shadow-black/20";
    }
  };

  return (
    <div className={`relative group overflow-hidden transition-all duration-500 hover:translate-y-[-2px] ${isLarge ? 'p-6' : 'p-5'} rounded-3xl border bg-slate-800/40 backdrop-blur-xl ${getAccentClass()} shadow-2xl`}>
      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity transform group-hover:scale-110 duration-500">
        {icon}
      </div>
      <div className="relative z-10">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 mb-1 group-hover:text-slate-400 transition-colors">{title}</p>
        <div className={`flex items-baseline gap-2 ${isLarge ? 'mt-2' : ''}`}>
          <span className={`font-black tracking-tighter tabular-nums bg-gradient-to-br bg-clip-text text-transparent ${getAccentClass()} ${isLarge ? 'text-6xl' : 'text-3xl'}`}>
            {value}
          </span>
          {subValue && <span className="text-slate-600 text-xs font-bold uppercase">{subValue}</span>}
        </div>
      </div>
      {/* Subtle hover glow */}
      <div className={`absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-5 transition-opacity duration-500 ${getAccentClass()}`} />
    </div>
  );
};

export default function App() {
  const [data, setData] = useState({ available: 0, filled: 0, total: 0 });
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

  const fillingRate = data.total > 0 ? Math.round((data.filled / data.total) * 100) : 0;

  if (loading && !data.total) { // Only show full loading if we have no data
    return (
      <div className="flex flex-col items-center justify-center w-[400px] h-[600px] bg-[#020617] p-8 space-y-4">
        <div className="relative">
          <div className="w-16 h-16 rounded-full border-t-4 border-orange-500 animate-spin shadow-lg shadow-orange-500/20"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 bg-orange-500/20 rounded-full animate-pulse"></div>
          </div>
        </div>
        <div className="text-center">
          <p className="text-slate-400 font-medium tracking-tight">Syncing with Amazon...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-[400px] h-[600px] bg-gradient-to-b from-[#0f172a] to-[#020617] text-white p-6 font-sans overflow-hidden border border-white/5 selection:bg-orange-500/30">
      {/* Header */}
      <header className="flex justify-between items-center mb-10 mt-2">
        <div className="flex items-center gap-4">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-orange-400 to-rose-500 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
            <div className="relative w-12 h-12 bg-slate-900 border border-white/10 rounded-2xl flex items-center justify-center shadow-2xl overflow-hidden">
              <img src="assets/icons/logo.png" alt="Logo" className="w-10 h-10 object-contain transform group-hover:scale-110 transition-transform" />
            </div>
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight leading-none bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">Amazon Realtime</h1>
            <p className="text-[10px] text-slate-500 font-extrabold uppercase tracking-[0.3em] mt-1">Slot Hub • v1.0</p>
          </div>
        </div>
        
        <button 
          onClick={fetchData}
          className="p-3 bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl transition-all active:scale-95 group"
        >
          <svg className={`w-5 h-5 text-slate-400 group-hover:text-white transition-colors ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </header>

      {error ? (
        <div className="flex-1 flex flex-col items-center justify-center animate-in fade-in duration-700">
           <div className="w-20 h-20 bg-rose-500/10 rounded-3xl flex items-center justify-center mb-6 shadow-2xl shadow-rose-500/10 border border-rose-500/20">
              <svg className="w-10 h-10 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
           </div>
           <h2 className="text-xl font-black text-white mb-3">Sync Error</h2>
           <p className="text-slate-500 text-sm max-w-[240px] leading-relaxed text-center mb-8 font-medium italic">"{error}"</p>
           <button 
             onClick={fetchData}
             className="px-8 py-3 bg-white hover:bg-slate-100 text-slate-950 rounded-2xl transition-all font-bold text-sm shadow-xl shadow-white/5 active:scale-95"
           >
             Try Again
           </button>
        </div>
      ) : (
        <div className="flex-1 space-y-5 animate-in slide-in-from-bottom-4 duration-500">
          {/* Main Card */}
          <Card 
            title="Available Vacancies" 
            value={data.available} 
            subValue="Slots"
            isLarge={true}
            accentColor={data.available > 0 ? "emerald" : "rose"}
            icon={
              <svg className="w-20 h-20" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2m-2 10h-4v4h-2v-4H7v-2h4V7h2v4h4v2z" />
              </svg>
            }
          />

          <div className="grid grid-cols-2 gap-5">
            <Card 
              title="Filled" 
              value={data.filled}
              accentColor="default"
              icon={
                <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
                </svg>
              }
            />
            <Card 
              title="Total" 
              value={data.total}
              accentColor="default"
              icon={
                <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M13 13v8h8v-8h-8zM3 21h8v-8H3v8zM3 3v8h8V3H3zm13.66 2L13 11h7.32L16.66 5z" />
                </svg>
              }
            />
          </div>

          {/* Progress Section */}
          <div className="pt-4 px-1">
            <div className="flex justify-between items-end mb-3">
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Competition Level</p>
                <p className="text-xl font-black text-white mt-1">{fillingRate}% <span className="text-slate-600 text-[10px] font-bold uppercase ml-1 tracking-tight">Claimed</span></p>
              </div>
              <div className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-tighter ${fillingRate > 90 ? 'bg-rose-500/10 text-rose-400' : 'bg-orange-500/10 text-orange-400'}`}>
                {fillingRate > 90 ? 'Critical' : 'Moderate'}
              </div>
            </div>
            <div className="h-4 w-full bg-white/5 rounded-2xl p-1 overflow-hidden group shadow-inner">
              <div 
                className="h-full rounded-xl bg-gradient-to-r from-orange-400 via-orange-500 to-rose-600 transition-all duration-1000 relative shadow-lg shadow-orange-500/30"
                style={{ width: `${fillingRate}%` }}
              >
                <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="mt-auto pt-6 flex items-center justify-between border-t border-white/5">
        <div className="flex items-center gap-2 group cursor-default">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
          <p className="text-[10px] font-extrabold text-slate-600 uppercase tracking-widest group-hover:text-slate-400 transition-colors">
            Last Sync: {lastUpdated}
          </p>
        </div>
        <div className="flex gap-4">
           {/* Add social/link icons here if needed */}
           <span className="text-[10px] font-black text-slate-700 italic">SECURE CONNECTION</span>
        </div>
      </footer>
    </div>
  );
}