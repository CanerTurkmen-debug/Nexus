"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import NexusChat from "./components/NexusChat";
import NexusEditor from "./components/NexusEditor";
import DashboardStats from "./components/DashboardStats";
import { 
  LayoutDashboard, LogOut, Menu, UploadCloud, Scale, 
  Settings, FileText, X, Search, Key, CheckCircle2,
  Briefcase, Calendar, Clock, Plus, File, ListTodo, Globe, ShieldAlert,
  Trash2, Archive, RotateCcw, DollarSign, Users, StickyNote, Wallet, 
  Printer, ChevronRight, Zap, Bell, ArrowRight, Cpu, 
  Camera, Loader2, ScanText, Copy
} from 'lucide-react';

// MENÜ TANIMLARI
const MENU_ITEMS = [
  { id: 'dashboard', label: 'Operasyon Merkezi', icon: LayoutDashboard },
  { id: 'davalar', label: 'Davalar & Finans', icon: Briefcase },
  { id: 'dilekce', label: 'Dilekçe Motoru', icon: FileText },
  { id: 'emsal', label: 'Emsal Karar Arşivi', icon: Scale },
  { id: 'ayarlar', label: 'Sistem Ayarları', icon: Settings },
];

export default function NexusPage() {
  const router = useRouter();
  
  // --- REF TANIMLARI ---
  const caseFileInputRef = useRef<HTMLInputElement>(null);
  const visionInputRef = useRef<HTMLInputElement>(null); 
  
  // --- MODERN SCROLL YÖNETİMİ ---
  const [activeTab, setActiveTab] = useState('dashboard');
  
  const scrollToSection = (id: string) => {
    setActiveTab(id);
    const element = document.getElementById(`section-${id}`);
    if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const sectionId = entry.target.id.replace('section-', '');
                setActiveTab(sectionId);
            }
        });
    }, { threshold: 0.5 });

    MENU_ITEMS.forEach(item => {
        const el = document.getElementById(`section-${item.id}`);
        if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  // --- STATE MANAGEMENT ---
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [analysis, setAnalysis] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  
  const [emsalQuery, setEmsalQuery] = useState("");
  const [emsalResults, setEmsalResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [apiKeys, setApiKeys] = useState({ groq: "", tavily: "" });

  const [cases, setCases] = useState<any[]>([]);
  const [selectedCase, setSelectedCase] = useState<any>(null);
  const [newCaseName, setNewCaseName] = useState("");

  const [caseDetails, setCaseDetails] = useState<any>(null); 
  const [globalCalendar, setGlobalCalendar] = useState<any[]>([]); 
  const [showGlobalCalendar, setShowGlobalCalendar] = useState(false); 
  const [caseFilter, setCaseFilter] = useState<'Aktif' | 'Arşiv'>('Aktif');

  const [detailTab, setDetailTab] = useState<'ozet' | 'ocr' | 'finans' | 'kisiler' | 'notlar'>('ozet');
  const [newFinance, setNewFinance] = useState({ type: 'Gider', amount: '', description: '' });
  const [newParty, setNewParty] = useState({ role: 'Müvekkil', name: '', contact_info: '' });
  const [newNote, setNewNote] = useState("");

  const [visionAnalyzing, setVisionAnalyzing] = useState(false);

  // --- KİMLİK DOĞRULAMA ---
  const getAuthToken = useCallback(() => {
    if (typeof window !== 'undefined') {
        const token = localStorage.getItem('nexus_token');
        if (!token) router.push('/login');
        return token;
    }
    return null;
  }, [router]);

  // --- API İSTEKLERİ ---
  const fetchHistory = useCallback(async () => {
    const token = getAuthToken(); if (!token) return;
    try {
      const res = await fetch('http://localhost:8000/gecmis', { headers: { 'Authorization': `Bearer ${token}` } });
      const data = await res.json(); setHistory(Array.isArray(data) ? data : []);
    } catch(e) { console.error(e); }
  }, [getAuthToken]);

  const fetchCases = useCallback(async () => {
    const token = getAuthToken(); if (!token) return;
    try {
      const res = await fetch('http://localhost:8000/cases/list', { headers: { 'Authorization': `Bearer ${token}` } });
      const data = await res.json(); setCases(Array.isArray(data) ? data : []);
    } catch(e) { console.error(e); }
  }, [getAuthToken]);

  const fetchCaseDetails = useCallback(async (caseId: number) => {
    const token = getAuthToken(); if(!token) return;
    try {
        const res = await fetch(`http://localhost:8000/cases/${caseId}/details`, { headers: { 'Authorization': `Bearer ${token}` } });
        const data = await res.json(); 
        setCaseDetails(data);
        // Eğer OCR verisi varsa konsola yaz (Debug için)
        if(data?.case?.ocr_text) console.log("OCR Verisi Alındı:", data.case.ocr_text);
    } catch(e) { console.error(e); }
  }, [getAuthToken]);

  const fetchGlobalCalendar = async () => {
    const token = getAuthToken(); if(!token) return;
    try {
        const res = await fetch('http://localhost:8000/calendar/global', { headers: { 'Authorization': `Bearer ${token}` } });
        const data = await res.json(); setGlobalCalendar(data); setShowGlobalCalendar(true);
    } catch(e) { console.error(e); }
  };

  useEffect(() => {
    fetchHistory(); fetchCases();
    const handleNewData = (e: any) => { setAnalysis(e.detail); if (e.detail.dilekce_taslagi) setTimeout(() => window.dispatchEvent(new CustomEvent('updateEditor', { detail: e.detail.dilekce_taslagi })), 200); };
    window.addEventListener('newAnalysisData', handleNewData); window.addEventListener('historyUpdated', fetchHistory);
    return () => { window.removeEventListener('newAnalysisData', handleNewData); window.removeEventListener('historyUpdated', fetchHistory); };
  }, [fetchHistory, fetchCases]);

  useEffect(() => {
    if(selectedCase) { fetchCaseDetails(selectedCase.id); setDetailTab('ozet'); } 
    else { setCaseDetails(null); }
  }, [selectedCase, fetchCaseDetails]);

  // --- İŞLEM FONKSİYONLARI ---
  const createCase = async () => {
    if(!newCaseName) return;
    try {
        const res = await fetch('http://localhost:8000/cases/create', {
            method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('nexus_token')}` },
            body: JSON.stringify({ case_name: newCaseName, court_name: "Hazırlık Bürosu" })
        });
        if(res.ok) { setNewCaseName(""); fetchCases(); }
    } catch(e) { console.error(e); }
  };

  const handleDeleteCase = async (e: React.MouseEvent, caseId: number) => {
    e.stopPropagation(); if(!confirm("Bu dava dosyasını ve tüm verilerini silmek istediğinize emin misiniz?")) return;
    try {
        const res = await fetch(`http://localhost:8000/cases/${caseId}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${localStorage.getItem('nexus_token')}` } });
        if(res.ok) { fetchCases(); if(selectedCase?.id === caseId) setSelectedCase(null); }
    } catch(e) { alert("Silme işlemi başarısız."); }
  };

  const handleArchiveCase = async (newStatus: string) => {
    if(!selectedCase) return;
    try {
        const res = await fetch(`http://localhost:8000/cases/${selectedCase.id}/status`, {
            method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('nexus_token')}` },
            body: JSON.stringify({ status: newStatus })
        });
        if(res.ok) { fetchCases(); setSelectedCase(null); }
    } catch(e) { alert("İşlem başarısız."); }
  };

  const handleCaseFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files; if(!files || files.length === 0 || !selectedCase) return;
    const formData = new FormData(); for (let i = 0; i < files.length; i++) { formData.append("files", files[i]); }
    try {
        const res = await fetch(`http://localhost:8000/cases/${selectedCase.id}/upload`, {
            method: 'POST', headers: { 'Authorization': `Bearer ${localStorage.getItem('nexus_token')}` }, body: formData
        });
        const data = await res.json();
        if(data.status === 'ok') { fetchCaseDetails(selectedCase.id); } 
        else { alert("Hata: " + data.msg); }
    } catch(e) { alert("Sunucu hatası."); }
  };

  // --- VISION YÜKLEME ---
  const handleVisionUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedCase) return;

    if (!file.type.startsWith('image/')) {
        alert("Lütfen sadece resim dosyası (JPG, PNG) seçin.");
        return;
    }

    const formData = new FormData();
    formData.append('file', file);

    setVisionAnalyzing(true);
    try {
        const res = await fetch(`http://localhost:8000/cases/${selectedCase.id}/upload-vision`, {
            method: 'POST', 
            headers: { 'Authorization': `Bearer ${localStorage.getItem('nexus_token')}` }, 
            body: formData
        });
        
        const data = await res.json();

        if (res.ok && data.status === 'ok') {
            await fetchCaseDetails(selectedCase.id);
            setDetailTab('ocr'); // Otomatik olarak OCR sekmesine geç
            alert("✅ Görüntü başarıyla analiz edildi!");
        } else {
            alert("Görüntü analiz edilemedi: " + (data.msg || "Bilinmeyen hata"));
        }
    } catch(e) { 
        alert("Sunucu hatası."); console.error(e);
    } finally {
        setVisionAnalyzing(false);
        if(visionInputRef.current) visionInputRef.current.value = ""; // Inputu temizle
    }
  };

  const addFinance = async () => {
      if(!newFinance.amount || !selectedCase) return;
      await fetch(`http://localhost:8000/cases/${selectedCase.id}/finance`, {
          method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('nexus_token')}` },
          body: JSON.stringify(newFinance)
      });
      fetchCaseDetails(selectedCase.id); setNewFinance({ ...newFinance, amount: '', description: '' });
  };

  const addParty = async () => {
      if(!newParty.name || !selectedCase) return;
      await fetch(`http://localhost:8000/cases/${selectedCase.id}/party`, {
          method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('nexus_token')}` },
          body: JSON.stringify(newParty)
      });
      fetchCaseDetails(selectedCase.id); setNewParty({ ...newParty, name: '', contact_info: '' });
  };

  const addNote = async () => {
      if(!newNote || !selectedCase) return;
      await fetch(`http://localhost:8000/cases/${selectedCase.id}/note`, {
          method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('nexus_token')}` },
          body: JSON.stringify({ note: newNote })
      });
      fetchCaseDetails(selectedCase.id); setNewNote("");
  };

  const handleEmsalSearch = async () => {
    if(!emsalQuery) return; setIsSearching(true);
    try {
      const res = await fetch(`http://localhost:8000/sor?soru=${encodeURIComponent(emsalQuery)}`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('nexus_token')}` } });
      const data = await res.json(); setEmsalResults([{ title: "İçtihat Sonucu (AI Analizi)", content: data.cevap, date: new Date().toLocaleDateString() }]);
    } catch (e) { console.error(e); } finally { setIsSearching(false); }
  };

  const filteredCases = cases.filter(c => c.status === caseFilter);
  const totalIncome = caseDetails?.finance?.filter((f:any) => f.type === 'Gelir').reduce((acc:number, curr:any) => acc + parseFloat(curr.amount), 0) || 0;
  const totalExpense = caseDetails?.finance?.filter((f:any) => f.type === 'Gider').reduce((acc:number, curr:any) => acc + parseFloat(curr.amount), 0) || 0;
  const balance = totalIncome - totalExpense;

  return (
    <div className="flex h-screen w-full bg-[#020202] text-zinc-300 font-sans overflow-hidden selection:bg-indigo-500/30">
      
      <input type="file" ref={caseFileInputRef} className="hidden" multiple accept=".pdf,.docx" onChange={handleCaseFileUpload}/>
      <input type="file" ref={visionInputRef} className="hidden" accept="image/*" onChange={handleVisionUpload}/>

      {showGlobalCalendar && (
         <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
             <div className="bg-[#09090b] border border-zinc-800 w-full max-w-4xl rounded-[2rem] p-8 shadow-2xl relative">
                 <button onClick={()=>setShowGlobalCalendar(false)} className="absolute top-6 right-6 p-2 bg-zinc-800 rounded-full hover:bg-zinc-700 text-white transition-colors"><X size={20}/></button>
                 <div className="flex items-center gap-4 mb-8">
                     <div className="p-4 bg-indigo-600 rounded-2xl text-white shadow-lg shadow-indigo-500/30"><Globe size={32}/></div>
                     <div><h2 className="text-3xl font-black text-white tracking-tight">KÜRESEL AJANDA</h2><p className="text-zinc-500 text-sm font-bold uppercase tracking-widest">Tüm Dosyaların Kritik Süreleri</p></div>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
                     {globalCalendar.map((item, i) => (
                         <div key={i} className="flex items-center gap-4 p-5 bg-[#0e0e11] border border-zinc-800 rounded-2xl hover:border-indigo-500/30 transition-all group">
                             <div className="text-center min-w-[60px] p-2 bg-zinc-900 rounded-xl border border-zinc-800 group-hover:border-indigo-500/50 transition-colors">
                                <div className="text-xs font-black text-zinc-500 uppercase">{item.due_date?.split('.')[1]}</div>
                                <div className="text-xl font-black text-white">{item.due_date?.split('.')[0]}</div>
                             </div>
                             <div className="flex-1"><h4 className="text-white font-bold text-sm">{item.case_name}</h4><p className="text-zinc-400 text-xs mt-1">{item.description}</p></div>
                             <div className="text-[9px] font-black bg-red-500/10 text-red-500 px-3 py-1 rounded-full uppercase tracking-wider border border-red-500/20">KRİTİK</div>
                         </div>
                     ))}
                     {globalCalendar.length === 0 && <p className="col-span-2 text-center text-zinc-600 py-10 text-sm">Yaklaşan duruşma veya süre bulunmuyor.</p>}
                 </div>
             </div>
         </div>
      )}

      <aside className={`${isSidebarOpen ? 'w-72 translate-x-0' : 'w-0 -translate-x-full lg:w-20 lg:translate-x-0'} bg-[#050505] border-r border-zinc-800 flex flex-col transition-all duration-500 shrink-0 z-50 absolute lg:relative h-full`}>
        <div className="h-24 flex items-center justify-center border-b border-zinc-800/50 shrink-0">
           <div className="flex items-center gap-3 overflow-hidden px-4">
             <div className="w-10 h-10 bg-gradient-to-tr from-indigo-600 to-violet-600 rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-indigo-500/20 rotate-3 group-hover:rotate-0 transition-transform"><Scale className="text-white" size={20}/></div>
             {isSidebarOpen && (<div className="flex flex-col"><span className="font-black text-white text-lg tracking-tighter leading-none">NEXUS</span><span className="text-indigo-500 text-[9px] font-bold tracking-[0.3em] uppercase">V5.1 Ultimate</span></div>)}
           </div>
        </div>
        
        <div className="flex-1 py-8 px-3 space-y-2 overflow-y-auto custom-scrollbar">
          {MENU_ITEMS.map(item => (
            <button key={item.id} onClick={()=>scrollToSection(item.id)} className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 group ${activeTab===item.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'hover:bg-zinc-900 text-zinc-500 hover:text-zinc-200'}`}>
                <item.icon size={20} className={`shrink-0 transition-transform ${activeTab===item.id ? 'scale-110' : 'group-hover:scale-110'}`}/>
                {isSidebarOpen && <span className="text-xs font-bold tracking-widest uppercase">{item.label}</span>}
                {!isSidebarOpen && activeTab===item.id && <div className="absolute left-16 bg-indigo-600 text-white text-[10px] px-2 py-1 rounded shadow-lg animate-in fade-in zoom-in">{item.label}</div>}
            </button>
          ))}
          
          {isSidebarOpen && (
             <div className="mt-12 px-2 animate-in fade-in slide-in-from-left-4 duration-700">
                <h4 className="text-[9px] font-black text-zinc-700 uppercase mb-4 ml-2 tracking-[0.2em] flex items-center gap-2"><div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div> GEÇMİŞ İŞLEMLER</h4>
                <div className="space-y-1">
                    {history.slice(0, 5).map(h => (
                        <button key={h.id} onClick={() => { setAnalysis(JSON.parse(h.analysis)); scrollToSection('dashboard'); }} className="w-full text-left p-3 rounded-xl text-[10px] text-zinc-500 hover:bg-zinc-900 hover:text-zinc-300 truncate transition-all flex items-center gap-2 group">
                           <Clock size={10} className="shrink-0 opacity-50 group-hover:text-indigo-500"/>{h.title || "İsimsiz Analiz"}
                        </button>
                    ))}
                </div>
             </div>
          )}
        </div>

        <div className="p-4 border-t border-zinc-800/50 bg-[#050505]">
            <button onClick={()=>{localStorage.removeItem('nexus_token'); router.push('/login')}} className="flex items-center justify-center gap-3 w-full p-4 text-zinc-500 hover:text-white hover:bg-red-600 rounded-2xl transition-all group">
                <LogOut size={18} className="shrink-0"/>{isSidebarOpen && <span className="text-xs font-black uppercase tracking-wider">GÜVENLİ ÇIKIŞ</span>}
            </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 bg-[#020202] relative">
        <header className="h-24 border-b border-zinc-800/50 bg-[#020202]/80 backdrop-blur-xl flex items-center justify-between px-8 shrink-0 z-40 absolute top-0 w-full">
            <div className="flex items-center gap-6">
                <button onClick={()=>setIsSidebarOpen(!isSidebarOpen)} className="text-zinc-500 hover:text-white transition-colors bg-zinc-900/50 p-2.5 rounded-xl border border-zinc-800"><Menu size={20}/></button>
                <div className="h-8 w-[1px] bg-zinc-800"></div>
                <div className="flex flex-col">
                   <span className="text-[9px] font-bold text-indigo-500 uppercase tracking-widest leading-none mb-1">NEXUS OPERASYON</span>
                   <span className="text-xl font-black text-white tracking-tighter">{MENU_ITEMS.find(m => m.id === activeTab)?.label}</span>
                </div>
            </div>
            <div className="flex items-center gap-4">
               <button className="p-3 bg-zinc-900/50 rounded-xl border border-zinc-800 text-zinc-500 hover:text-white transition-colors relative">
                  <Bell size={18}/>
                  <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-[#020202]"></span>
               </button>
               <div className="flex items-center gap-3 pl-6 border-l border-zinc-800">
                  <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white font-black text-sm shadow-lg shadow-indigo-500/20">AV</div>
                  <div className="hidden md:block">
                     <p className="text-xs font-bold text-white">Av. Kullanıcı</p>
                     <p className="text-[10px] text-zinc-500">Yönetici</p>
                  </div>
               </div>
            </div>
        </header>

        <div className="flex-1 overflow-y-auto snap-y snap-mandatory scroll-smooth relative mt-24 h-[calc(100vh-96px)] custom-scrollbar">
            
            <div id="section-dashboard" className="h-full w-full p-4 lg:p-8 snap-start flex flex-col shrink-0">
                <div className="flex flex-col lg:flex-row gap-6 h-full w-full">
                    <div className="flex-1 bg-[#09090b] border border-zinc-800 rounded-[2rem] shadow-2xl overflow-hidden flex flex-col relative group hover:border-zinc-700 transition-colors">
                       <NexusChat />
                    </div>
                    <div className="w-full lg:w-[480px] flex flex-col gap-6 h-auto lg:h-full shrink-0">
                        <div className="flex-1 rounded-[2rem] border border-zinc-800 overflow-hidden bg-[#09090b] shadow-2xl relative hover:border-zinc-700 transition-colors">
                           <NexusEditor />
                        </div>
                        <div className="h-[280px] bg-[#09090b] border border-zinc-800 rounded-[2rem] p-6 shadow-2xl hover:border-zinc-700 transition-colors">
                           <DashboardStats analysis={analysis} />
                        </div>
                    </div>
                </div>
            </div>

            <div id="section-davalar" className="h-full w-full p-4 lg:p-8 snap-start flex flex-col shrink-0">
                <div className="h-full w-full flex gap-8">
                    {!selectedCase ? (
                        <div className="flex-1 bg-[#09090b] border border-zinc-800 rounded-[3rem] p-8 lg:p-12 overflow-hidden flex flex-col shadow-2xl relative">
                            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600/5 rounded-full blur-[100px] pointer-events-none"></div>

                            <div className="flex justify-between items-center mb-10 z-10">
                                <div className="flex items-center gap-6">
                                    <h2 className="text-4xl font-black text-white tracking-tighter">Dava Dosyaları</h2>
                                    <div className="flex bg-zinc-900 p-1.5 rounded-xl border border-zinc-800">
                                        <button onClick={()=>setCaseFilter('Aktif')} className={`px-5 py-2.5 rounded-lg text-[10px] font-black tracking-widest transition-all uppercase ${caseFilter === 'Aktif' ? 'bg-indigo-600 text-white shadow-lg' : 'text-zinc-500 hover:text-white'}`}>GÜNCEL</button>
                                        <button onClick={()=>setCaseFilter('Arşiv')} className={`px-5 py-2.5 rounded-lg text-[10px] font-black tracking-widest transition-all uppercase ${caseFilter === 'Arşiv' ? 'bg-indigo-600 text-white shadow-lg' : 'text-zinc-500 hover:text-white'}`}>ARŞİV</button>
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <button onClick={fetchGlobalCalendar} className="bg-zinc-800 hover:bg-zinc-700 text-white px-5 py-3 rounded-xl text-xs font-bold border border-zinc-700 flex items-center gap-2 transition-all"><Globe size={16}/> AJANDA</button>
                                    <div className="flex items-center bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-2 focus-within:border-indigo-500 transition-colors">
                                       <Plus size={16} className="text-zinc-500 mr-2"/>
                                       <input value={newCaseName} onChange={(e)=>setNewCaseName(e.target.value)} placeholder="Yeni Dava Adı..." className="bg-transparent text-sm text-white outline-none w-40 placeholder:text-zinc-600 font-medium"/>
                                    </div>
                                    <button onClick={createCase} className="bg-white hover:bg-zinc-200 text-black p-3 rounded-xl transition-all"><ChevronRight/></button>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 overflow-y-auto custom-scrollbar pb-20 pr-2 z-10">
                                {filteredCases.length === 0 && (
                                   <div className="col-span-4 flex flex-col items-center justify-center py-20 opacity-50">
                                      <Briefcase size={48} className="text-zinc-600 mb-4"/>
                                      <p className="text-zinc-500 font-bold">Bu kategoride henüz bir dosya yok.</p>
                                   </div>
                                )}
                                {filteredCases.map(c => (
                                    <div key={c.id} onClick={()=>setSelectedCase(c)} className="bg-zinc-900/40 border border-zinc-800 p-6 rounded-[2rem] hover:border-indigo-500/50 hover:bg-zinc-900/60 cursor-pointer transition-all group relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-20 h-20 bg-indigo-500/10 rounded-bl-[4rem] -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                                        <button onClick={(e)=>handleDeleteCase(e, c.id)} className="absolute top-4 right-4 text-zinc-600 hover:text-red-500 transition-colors z-20 p-2 hover:bg-red-500/10 rounded-full"><Trash2 size={16}/></button>
                                        
                                        <div className="flex justify-between items-start mb-6 relative z-10">
                                            <div className="w-12 h-12 bg-zinc-800 rounded-2xl flex items-center justify-center text-zinc-400 group-hover:text-indigo-400 group-hover:bg-indigo-500/20 transition-all shadow-inner"><Briefcase size={20}/></div>
                                            <span className={`text-[9px] px-3 py-1.5 rounded-full font-black uppercase tracking-wider border ${c.status === 'Aktif' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-orange-500/10 text-orange-500 border-orange-500/20'}`}>{c.status}</span>
                                        </div>
                                        
                                        <h3 className="text-xl font-bold text-white mb-1 group-hover:text-indigo-300 transition-colors truncate pr-8">{c.case_name}</h3>
                                        <p className="text-xs text-zinc-500 font-medium">{c.court_name}</p>
                                        
                                        <div className="mt-8 flex items-center justify-between text-[10px] text-zinc-600 font-bold uppercase tracking-wider border-t border-zinc-800/50 pt-4">
                                           <span>{c.created_at?.split(' ')[0]}</span>
                                           <span className="group-hover:translate-x-1 transition-transform">Detaylar &rarr;</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 bg-[#09090b] border border-zinc-800 rounded-[3rem] p-8 flex flex-col overflow-hidden animate-in slide-in-from-right-8 duration-500 shadow-2xl relative">
                            {/* Header */}
                            <div className="flex items-center justify-between mb-8 shrink-0 pb-6 border-b border-zinc-800">
                                <div className="flex items-center gap-6">
                                    <button onClick={()=>setSelectedCase(null)} className="p-3 bg-zinc-900 rounded-xl hover:bg-zinc-800 text-zinc-400 hover:text-white transition-all"><X size={20}/></button>
                                    <div>
                                       <h2 className="text-3xl font-black text-white tracking-tight">{selectedCase.case_name}</h2>
                                       <div className="flex gap-2 text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1">
                                          <span>{selectedCase.court_name}</span> • <span>No: #{selectedCase.id}</span>
                                       </div>
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    {/* VISION BUTONU (GÜNCELLENDİ) */}
                                    <button 
                                        onClick={()=>visionInputRef.current?.click()} 
                                        disabled={visionAnalyzing}
                                        className="bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-400 border border-indigo-500/30 px-6 py-3 rounded-xl text-xs font-bold flex items-center gap-2 transition-all"
                                    >
                                        {visionAnalyzing ? <Loader2 size={18} className="animate-spin"/> : <Camera size={18}/>}
                                        {visionAnalyzing ? "GÖRÜNTÜ İŞLENİYOR..." : "VISION ILE TARA"}
                                    </button>

                                    <button onClick={()=>caseFileInputRef.current?.click()} className="bg-white hover:bg-zinc-200 text-black px-6 py-3 rounded-xl text-xs font-bold flex items-center gap-2 transition-all"><UploadCloud size={18}/> DOSYA YÜKLE</button>
                                </div>
                            </div>
                            
                            {/* Tabs (GÜNCELLENDİ) */}
                            <div className="flex bg-zinc-900/50 p-1.5 rounded-2xl border border-zinc-800 w-fit mb-8">
                                <button onClick={()=>setDetailTab('ozet')} className={`px-6 py-2.5 rounded-xl text-xs font-black tracking-wider transition-all uppercase ${detailTab === 'ozet' ? 'bg-indigo-600 text-white shadow-lg' : 'text-zinc-500 hover:text-white'}`}>GENEL BAKIŞ</button>
                                <button onClick={()=>setDetailTab('ocr')} className={`px-6 py-2.5 rounded-xl text-xs font-black tracking-wider transition-all uppercase ${detailTab === 'ocr' ? 'bg-indigo-600 text-white shadow-lg' : 'text-zinc-500 hover:text-white'}`}>EL YAZISI / OCR</button>
                                <button onClick={()=>setDetailTab('finans')} className={`px-6 py-2.5 rounded-xl text-xs font-black tracking-wider transition-all uppercase ${detailTab === 'finans' ? 'bg-indigo-600 text-white shadow-lg' : 'text-zinc-500 hover:text-white'}`}>FİNANS</button>
                                <button onClick={()=>setDetailTab('kisiler')} className={`px-6 py-2.5 rounded-xl text-xs font-black tracking-wider transition-all uppercase ${detailTab === 'kisiler' ? 'bg-indigo-600 text-white shadow-lg' : 'text-zinc-500 hover:text-white'}`}>TARAF & KİŞİ</button>
                                <button onClick={()=>setDetailTab('notlar')} className={`px-6 py-2.5 rounded-xl text-xs font-black tracking-wider transition-all uppercase ${detailTab === 'notlar' ? 'bg-indigo-600 text-white shadow-lg' : 'text-zinc-500 hover:text-white'}`}>NOTLAR</button>
                            </div>

                            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-6 pr-2">
                                {detailTab === 'ozet' && (
                                    <>
                                        {caseDetails?.case?.summary && (
                                            <div className="bg-indigo-900/10 border border-indigo-500/20 p-8 rounded-[2rem] relative overflow-hidden">
                                                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 rounded-full blur-[50px] pointer-events-none"></div>
                                                <h3 className="text-indigo-400 font-bold mb-4 flex items-center gap-2 text-sm uppercase tracking-widest"><Scale size={18}/> DAVA ÖZETİ (AI)</h3>
                                                <p className="text-zinc-200 text-sm leading-loose font-medium">{caseDetails.case.summary}</p>
                                            </div>
                                        )}
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                            <div className="bg-red-900/10 border border-red-500/10 p-8 rounded-[2rem] hover:border-red-500/30 transition-colors">
                                               <h3 className="text-red-400 font-bold mb-4 flex items-center gap-2 text-sm uppercase tracking-widest"><ShieldAlert size={18}/> RİSK ANALİZİ</h3>
                                               <p className="text-zinc-400 text-xs whitespace-pre-line leading-relaxed">{caseDetails?.case?.risks || "Analiz bekleniyor..."}</p>
                                            </div>
                                            <div className="bg-green-900/10 border border-green-500/10 p-8 rounded-[2rem] hover:border-green-500/30 transition-colors">
                                               <h3 className="text-green-500 font-bold mb-4 flex items-center gap-2 text-sm uppercase tracking-widest"><ListTodo size={18}/> STRATEJİK ADIMLAR</h3>
                                               <p className="text-zinc-400 text-xs whitespace-pre-line leading-relaxed">{caseDetails?.case?.todo_list || "Analiz bekleniyor..."}</p>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-6">
                                            <div className="bg-zinc-900/30 border border-zinc-800 p-8 rounded-[2rem]">
                                                <h3 className="text-zinc-500 font-bold mb-6 flex items-center gap-2 text-sm uppercase tracking-widest"><File size={16}/> BELGELER</h3>
                                                <div className="space-y-3">
                                                    {caseDetails?.documents?.map((doc: any) => (<div key={doc.id} className="flex justify-between items-center p-4 bg-zinc-900 rounded-2xl text-xs text-zinc-300 border border-zinc-800 hover:border-indigo-500/30 transition-colors group"><div className="flex items-center gap-3"><FileText size={16} className="text-zinc-600 group-hover:text-indigo-500"/><span className="truncate max-w-[180px] font-medium">{doc.file_name}</span></div><span className="text-zinc-600 font-mono text-[10px]">{doc.uploaded_at?.split(' ')[0]}</span></div>))}
                                                    {(!caseDetails?.documents || caseDetails.documents.length === 0) && <p className="text-zinc-600 text-xs italic">Henüz belge yüklenmedi.</p>}
                                                </div>
                                            </div>
                                            <div className="bg-zinc-900/30 border border-zinc-800 p-8 rounded-[2rem]">
                                                <h3 className="text-zinc-500 font-bold mb-6 flex items-center gap-2 text-sm uppercase tracking-widest"><Calendar size={16}/> TAKVİM & SÜRELER</h3>
                                                <div className="space-y-3">
                                                    {caseDetails?.reminders?.map((r: any, i: number) => (<div key={i} className="flex gap-5 p-4 bg-zinc-900 rounded-2xl border border-zinc-800 items-center"><div className="text-center min-w-[50px] p-2 bg-black/50 rounded-xl border border-zinc-800"><div className="text-[9px] text-zinc-500 font-black uppercase">{r.due_date?.split('.')[1]}</div><div className="text-lg font-black text-white">{r.due_date?.split('.')[0]}</div></div><div className="flex-1"><p className="text-xs font-bold text-zinc-300">{r.description}</p></div></div>))}
                                                    {(!caseDetails?.reminders || caseDetails.reminders.length === 0) && <p className="text-zinc-600 text-xs italic">Hatırlatıcı yok.</p>}
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                )}

                                {/* --- YENİ OCR SEKMESİ --- */}
                                {detailTab === 'ocr' && (
                                    <div className="bg-zinc-900/30 border border-zinc-800 p-8 rounded-[2rem] h-full flex flex-col">
                                        <div className="flex justify-between items-center mb-6">
                                            <h3 className="text-white font-bold flex items-center gap-2 text-sm uppercase tracking-widest"><ScanText size={18} className="text-indigo-500"/> OCR / HAM METİN OKUMASI</h3>
                                            <button 
                                                onClick={() => {
                                                    navigator.clipboard.writeText(caseDetails?.case?.ocr_text || "");
                                                    alert("Metin kopyalandı!");
                                                }}
                                                className="text-xs flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 px-4 py-2 rounded-lg text-zinc-300 transition-colors"
                                            >
                                                <Copy size={14}/> KOPYALA
                                            </button>
                                        </div>
                                        <div className="flex-1 bg-[#050505] p-6 rounded-2xl border border-zinc-800 overflow-y-auto custom-scrollbar font-mono text-xs text-zinc-400 leading-relaxed whitespace-pre-wrap">
                                            {caseDetails?.case?.ocr_text ? caseDetails.case.ocr_text : "Henüz bir görüntü taraması yapılmadı. 'VISION ILE TARA' butonunu kullanarak bir belge yükleyin."}
                                        </div>
                                    </div>
                                )}

                                {detailTab === 'finans' && (
                                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                                        {/* Finans içeriği aynı */}
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                            <div className="bg-zinc-900/50 p-8 rounded-[2.5rem] border border-zinc-800 relative overflow-hidden group">
                                               <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><ArrowRight size={48} className="text-green-500 -rotate-45"/></div>
                                               <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mb-2">TOPLAM GELİR</p>
                                               <p className="text-4xl font-black text-green-500">₺{totalIncome}</p>
                                            </div>
                                            <div className="bg-zinc-900/50 p-8 rounded-[2.5rem] border border-zinc-800 relative overflow-hidden group">
                                               <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><ArrowRight size={48} className="text-red-500 rotate-45"/></div>
                                               <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mb-2">TOPLAM GİDER</p>
                                               <p className="text-4xl font-black text-red-500">₺{totalExpense}</p>
                                            </div>
                                            <div className="bg-zinc-900/50 p-8 rounded-[2.5rem] border border-zinc-800 relative overflow-hidden group">
                                               <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><Wallet size={48} className="text-white"/></div>
                                               <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mb-2">NET BAKİYE</p>
                                               <p className={`text-4xl font-black ${balance >= 0 ? 'text-white' : 'text-red-500'}`}>₺{balance}</p>
                                            </div>
                                        </div>

                                        <div className="bg-zinc-900/30 border border-zinc-800 p-8 rounded-[2rem]">
                                            <h3 className="text-white font-bold mb-6 flex items-center gap-2 text-sm uppercase tracking-widest"><DollarSign size={18}/> YENİ İŞLEM</h3>
                                            <div className="flex gap-3">
                                                <select className="bg-zinc-900 border border-zinc-700 text-white rounded-xl px-4 py-3 text-sm focus:border-indigo-500 outline-none" value={newFinance.type} onChange={(e)=>setNewFinance({...newFinance, type: e.target.value})}><option>Gelir</option><option>Gider</option></select>
                                                <input className="bg-zinc-900 border border-zinc-700 text-white rounded-xl px-4 py-3 w-32 text-sm focus:border-indigo-500 outline-none font-mono" placeholder="0.00" type="number" value={newFinance.amount} onChange={(e)=>setNewFinance({...newFinance, amount: e.target.value})}/>
                                                <input className="flex-1 bg-zinc-900 border border-zinc-700 text-white rounded-xl px-4 py-3 text-sm focus:border-indigo-500 outline-none" placeholder="Açıklama (Örn: Vekalet ücreti)" value={newFinance.description} onChange={(e)=>setNewFinance({...newFinance, description: e.target.value})}/>
                                                <button onClick={addFinance} className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 rounded-xl font-bold text-xs tracking-wider shadow-lg shadow-indigo-500/20">KAYDET</button>
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            {caseDetails?.finance?.map((f:any) => (
                                               <div key={f.id} className="flex justify-between items-center p-5 bg-zinc-900 rounded-2xl border border-zinc-800 hover:border-zinc-700 transition-colors">
                                                  <div className="flex items-center gap-4">
                                                     <div className={`p-2 rounded-lg ${f.type === 'Gelir' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>{f.type === 'Gelir' ? <ArrowRight size={16} className="-rotate-45"/> : <ArrowRight size={16} className="rotate-45"/>}</div>
                                                     <div><p className="text-white font-bold text-sm">{f.description}</p><p className="text-zinc-500 text-[10px] font-mono mt-1">{f.date}</p></div>
                                                  </div>
                                                  <span className={`font-black text-lg ${f.type === 'Gelir' ? 'text-green-500' : 'text-red-500'}`}>{f.type === 'Gelir' ? '+' : '-'} ₺{f.amount}</span>
                                               </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {detailTab === 'kisiler' && (
                                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                                        <div className="bg-zinc-900/30 border border-zinc-800 p-8 rounded-[2rem]">
                                            <h3 className="text-white font-bold mb-6 flex items-center gap-2 text-sm uppercase tracking-widest"><Users size={18}/> KİŞİ EKLE</h3>
                                            <div className="flex gap-3">
                                                <select className="bg-zinc-900 border border-zinc-700 text-white rounded-xl px-4 py-3 text-sm outline-none" value={newParty.role} onChange={(e)=>setNewParty({...newParty, role: e.target.value})}><option>Müvekkil</option><option>Karşı Taraf</option><option>Hakim</option><option>Tanık</option></select>
                                                <input className="flex-1 bg-zinc-900 border border-zinc-700 text-white rounded-xl px-4 py-3 text-sm outline-none" placeholder="Ad Soyad" value={newParty.name} onChange={(e)=>setNewParty({...newParty, name: e.target.value})}/>
                                                <input className="flex-1 bg-zinc-900 border border-zinc-700 text-white rounded-xl px-4 py-3 text-sm outline-none" placeholder="İletişim (Tel/Mail)" value={newParty.contact_info} onChange={(e)=>setNewParty({...newParty, contact_info: e.target.value})}/>
                                                <button onClick={addParty} className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 rounded-xl font-bold text-xs tracking-wider">EKLE</button>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {caseDetails?.parties?.map((p:any) => (<div key={p.id} className="p-6 bg-zinc-900/50 rounded-[2rem] border border-zinc-800 flex items-center gap-5 hover:border-indigo-500/30 transition-colors"><div className="w-14 h-14 bg-zinc-800 rounded-2xl flex items-center justify-center text-zinc-400 font-bold text-xl shadow-inner">{p.name[0]}</div><div><p className="text-white font-bold text-lg">{p.name}</p><p className="text-indigo-400 text-[10px] font-black uppercase tracking-widest mb-1">{p.role}</p><p className="text-zinc-500 text-xs font-medium">{p.contact_info}</p></div></div>))}
                                        </div>
                                    </div>
                                )}

                                {detailTab === 'notlar' && (
                                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                                        <div className="bg-zinc-900/30 border border-zinc-800 p-8 rounded-[2rem]">
                                            <h3 className="text-white font-bold mb-6 flex items-center gap-2 text-sm uppercase tracking-widest"><StickyNote size={18}/> HIZLI NOT</h3>
                                            <div className="flex gap-3">
                                                <input className="flex-1 bg-zinc-900 border border-zinc-700 text-white rounded-xl px-5 py-4 text-sm outline-none focus:border-indigo-500 transition-colors" placeholder="Duruşma notu, hatırlatma vb..." value={newNote} onChange={(e)=>setNewNote(e.target.value)}/>
                                                <button onClick={addNote} className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 rounded-xl font-bold text-xs tracking-wider">KAYDET</button>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {caseDetails?.notes?.map((n:any) => (<div key={n.id} className="p-6 bg-yellow-500/5 border border-yellow-500/10 rounded-[2rem] relative group hover:bg-yellow-500/10 transition-colors"><div className="absolute top-6 right-6 text-yellow-500/20 group-hover:text-yellow-500/40"><StickyNote size={24}/></div><p className="text-zinc-300 text-sm whitespace-pre-wrap leading-relaxed font-medium">{n.note}</p><p className="text-zinc-600 text-[10px] font-mono mt-4 pt-4 border-t border-yellow-500/10">{n.created_at}</p></div>))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div id="section-dilekce" className="h-full w-full p-4 lg:p-8 snap-start flex flex-col shrink-0">
                <div className="h-full w-full bg-[#09090b] border border-zinc-800 rounded-[3rem] shadow-2xl overflow-hidden flex flex-col relative">
                    <div className="bg-[#09090b] border-b border-zinc-800 p-6 flex items-center justify-between shrink-0">
                         <div className="flex items-center gap-5">
                            <div className="p-3 bg-indigo-500/10 rounded-2xl text-indigo-500 border border-indigo-500/20"><FileText size={24}/></div>
                            <div>
                              <h3 className="text-xl font-black tracking-tight text-white leading-none">PROFESYONEL EDİTÖR</h3>
                              <p className="text-[10px] text-zinc-500 font-bold uppercase mt-1.5 tracking-[0.2em]">Yüksek Yargı Standartlarında Belge Üretimi</p>
                            </div>
                         </div>
                         <div className="flex gap-3">
                             <button className="px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 rounded-xl text-xs font-bold transition-all border border-zinc-800 flex items-center gap-2 text-zinc-400"><Printer size={16}/> YAZDIR</button>
                             <button onClick={()=>scrollToSection('dashboard')} className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-xs font-bold transition-all text-white shadow-lg shadow-indigo-500/20">PANELE DÖN</button>
                         </div>
                    </div>
                    <div className="flex-1 bg-zinc-950/50">
                        <NexusEditor />
                    </div>
                </div>
            </div>

            <div id="section-emsal" className="h-full w-full p-4 lg:p-8 snap-start flex flex-col shrink-0">
                <div className="h-full w-full flex flex-col gap-8 justify-center items-center">
                    <div className="w-full max-w-5xl flex flex-col items-center">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-400 text-[10px] font-black tracking-widest uppercase mb-8 shadow-lg shadow-indigo-500/20 backdrop-blur-md">
                             <Zap size={12}/> AI Destekli Arama
                        </div>
                        <h2 className="text-5xl lg:text-7xl font-black text-white mb-6 tracking-tighter text-center">İçtihat <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">Motoru</span></h2>
                        <p className="text-zinc-500 text-lg mb-12 max-w-xl text-center leading-relaxed">Yargıtay, Danıştay ve BAM kararları arasında yapay zeka destekli anlamsal arama yapın.</p>
                        
                        <div className="w-full relative group">
                            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-[2rem] blur opacity-20 group-hover:opacity-30 transition-opacity"></div>
                            <div className="relative bg-[#09090b] border border-zinc-800 rounded-[2rem] p-2 flex items-center shadow-2xl">
                                <Search size={24} className="text-zinc-500 ml-6"/>
                                <input 
                                    className="flex-1 bg-transparent px-6 py-6 text-white focus:outline-none placeholder:text-zinc-700 text-xl font-medium"
                                    placeholder="Örn: İş kazası manevi tazminat zamanaşımı..."
                                    value={emsalQuery}
                                    onChange={(e)=>setEmsalQuery(e.target.value)}
                                    onKeyDown={(e)=>e.key==='Enter' && handleEmsalSearch()}
                                />
                                <button onClick={handleEmsalSearch} disabled={isSearching} className="bg-white hover:bg-zinc-200 text-black px-10 py-5 rounded-[1.5rem] font-black flex items-center gap-3 transition-all disabled:opacity-50">
                                    {isSearching ? <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin"></div> : <ArrowRight size={20}/>} 
                                    {isSearching ? 'ANALİZ EDİLİYOR' : 'ARA'}
                                </button>
                            </div>
                        </div>

                        {emsalResults.length > 0 && (
                            <div className="mt-12 w-full animate-in slide-in-from-bottom-10 fade-in duration-700">
                                {emsalResults.map((res, i) => (
                                    <div key={i} className="bg-[#09090b] border border-zinc-800 p-10 rounded-[2.5rem] hover:border-indigo-500/30 transition-all group relative overflow-hidden shadow-2xl">
                                        <div className="absolute top-0 right-0 p-6 opacity-50"><Scale size={48} className="text-zinc-800 group-hover:text-indigo-500/20 transition-colors"/></div>
                                        <h3 className="text-white font-black text-2xl mb-6 flex items-center gap-3"><CheckCircle2 size={24} className="text-green-500"/> {res.title}</h3>
                                        <div className="text-zinc-400 text-lg leading-relaxed whitespace-pre-wrap font-serif pl-4 border-l-2 border-zinc-800">{res.content}</div>
                                        <div className="mt-8 pt-6 border-t border-zinc-900 flex gap-4 text-xs font-bold text-zinc-500 uppercase tracking-widest">
                                            <span>AI Özeti</span> • <span>Güven Skoru: %98</span> • <span>Kaynak: Yargıtay</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div id="section-ayarlar" className="h-full w-full p-4 lg:p-8 snap-start flex flex-col shrink-0">
                <div className="max-w-3xl mx-auto w-full pt-20">
                    <h2 className="text-4xl font-black text-white mb-12 tracking-tighter flex items-center gap-6"><div className="p-4 bg-zinc-900 rounded-2xl border border-zinc-800"><Settings size={32} className="text-white"/></div> SİSTEM YAPILANDIRMASI</h2>
                    <div className="bg-[#09090b] border border-zinc-800 rounded-[2.5rem] p-10 space-y-10 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-[80px] pointer-events-none"></div>
                        <section className="space-y-8 relative z-10">
                            <div className="group flex flex-col gap-3">
                                <label className="text-[10px] text-zinc-500 font-black uppercase ml-2 tracking-widest flex items-center gap-2"><Key size={12}/> Groq API Entegrasyonu</label>
                                <div className="flex items-center gap-4 bg-[#050505] p-5 rounded-2xl border border-zinc-800 focus-within:border-indigo-500/50 focus-within:ring-1 focus-within:ring-indigo-500/50 transition-all">
                                    <div className="p-2 bg-zinc-900 rounded-lg"><Cpu size={18} className="text-indigo-500"/></div>
                                    <input className="flex-1 bg-transparent text-sm outline-none text-white font-mono placeholder:text-zinc-700" type="password" placeholder="gsk_..." value={apiKeys.groq} onChange={(e)=>setApiKeys({...apiKeys, groq: e.target.value})}/>
                                </div>
                                <p className="text-[10px] text-zinc-600 ml-2">Yapay zeka modellerinin (LLama-3) çalışması için gereklidir.</p>
                            </div>
                            
                            <div className="h-px w-full bg-zinc-900"></div>

                            <div className="group flex flex-col gap-3">
                                <label className="text-[10px] text-zinc-500 font-black uppercase ml-2 tracking-widest flex items-center gap-2"><Globe size={12}/> Tavily Search API</label>
                                <div className="flex items-center gap-4 bg-[#050505] p-5 rounded-2xl border border-zinc-800 focus-within:border-indigo-500/50 focus-within:ring-1 focus-within:ring-indigo-500/50 transition-all">
                                    <div className="p-2 bg-zinc-900 rounded-lg"><Search size={18} className="text-green-500"/></div>
                                    <input className="flex-1 bg-transparent text-sm outline-none text-white font-mono placeholder:text-zinc-700" type="password" placeholder="tvly-..." value={apiKeys.tavily} onChange={(e)=>setApiKeys({...apiKeys, tavily: e.target.value})}/>
                                </div>
                                <p className="text-[10px] text-zinc-600 ml-2">İnternet tabanlı güncel mevzuat taraması için gereklidir.</p>
                            </div>
                        </section>
                        <button className="w-full bg-white hover:bg-zinc-200 text-black py-5 rounded-2xl text-xs font-black tracking-widest transition-all shadow-xl active:scale-[0.98] relative z-10">DEĞİŞİKLİKLERİ KAYDET</button>
                    </div>
                </div>
            </div>

        </div>
      </main>
    </div>
  );
}