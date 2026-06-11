"use client";
import React, { useState, useEffect } from 'react';
import { Download, FileSignature, Eraser, Save, CheckCircle2, Loader2 } from 'lucide-react';

export default function NexusEditor() {
  const [content, setContent] = useState("");
  const [isDownloading, setIsDownloading] = useState(false);
  const [lastAutoSave, setLastAutoSave] = useState<string>("");

  // --- KRİTİK: Chat ve Page'den gelen Sinyalleri Dinle ---
  useEffect(() => {
    const handleUpdate = (e: any) => {
        // e.detail içinde dilekçe metni doğrudan gelmektedir
        if (e.detail && typeof e.detail === 'string') {
            setContent(e.detail);
            setLastAutoSave(new Date().toLocaleTimeString());
        }
    };

    // 'updateEditor' olayı hem Chat'ten hem de Sekme Geçişlerinden tetiklenir
    window.addEventListener('updateEditor', handleUpdate);
    return () => window.removeEventListener('updateEditor', handleUpdate);
  }, []);

  // --- Backend Üzerinden Profesyonel Word Çıktısı Al ---
  const handleDownload = async () => {
    if(!content) return alert("İndirilecek bir metin yok. Önce Chat üzerinden bir analiz başlatın.");
    
    setIsDownloading(true);
    const token = localStorage.getItem('nexus_token');
    
    try {
      // Backend'deki /indir_word endpoint'ine güvenli istek gönder
      // icerik parametresini güvenli hale getiriyoruz
      const res = await fetch(`http://localhost:8000/indir_word?icerik=${encodeURIComponent(content)}&baslik=Nexus_Hukuk_Dilekcesi`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!res.ok) throw new Error("Backend Word oluşturma hatası");
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Nexus_Legal_Draft_${Date.now()}.docx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      
    } catch(err) {
      console.error("İndirme Hatası:", err);
      alert("Word dosyası oluşturulamadı. Lütfen Backend (api.py) bağlantısını kontrol edin.");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#121215] border border-zinc-800 rounded-[2rem] overflow-hidden shadow-2xl transition-all duration-500">
        {/* Üst Bar (Toolbar) */}
        <div className="h-16 bg-[#18181b] border-b border-zinc-800 flex items-center justify-between px-6 shrink-0 shadow-sm">
            <div className="flex items-center gap-4">
                <div className="w-9 h-9 bg-indigo-500/10 rounded-xl flex items-center justify-center border border-indigo-500/20 shadow-inner">
                    <FileSignature size={18} className="text-indigo-400"/>
                </div>
                <div>
                    <h3 className="text-xs font-black text-white tracking-[0.15em] uppercase">Akıllı Editör</h3>
                    {lastAutoSave && (
                      <span className="text-[10px] text-green-500/70 font-bold flex items-center gap-1.5 mt-0.5 animate-in fade-in">
                        <CheckCircle2 size={10}/> Veri Senkronize: {lastAutoSave}
                      </span>
                    )}
                </div>
            </div>

            <div className="flex gap-3">
                <button 
                    onClick={() => { if(confirm("Tüm metni silmek istediğinize emin misiniz?")) setContent(""); }} 
                    className="p-2.5 hover:bg-red-500/10 hover:text-red-400 rounded-xl text-zinc-500 transition-all duration-300 border border-transparent hover:border-red-500/20" 
                    title="Temizle"
                >
                    <Eraser size={18}/>
                </button>
                
                <button 
                    onClick={handleDownload} 
                    disabled={isDownloading || !content}
                    className="flex items-center gap-3 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-black uppercase tracking-wider rounded-xl transition-all shadow-xl shadow-indigo-500/20 disabled:opacity-30 disabled:cursor-not-allowed active:scale-95 border border-indigo-400/20"
                >
                    {isDownloading ? (
                        <><Loader2 size={16} className="animate-spin"/> Hazırlanıyor</>
                    ) : (
                        <><Download size={16}/> Word Aktar</>
                    )}
                </button>
            </div>
        </div>

        {/* Yazı Alanı */}
        <div className="flex-1 relative bg-[#09090b] group">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/[0.02] to-transparent pointer-events-none"></div>
            <textarea 
                className="w-full h-full bg-transparent text-zinc-300 p-8 text-[13px] font-mono resize-none focus:outline-none leading-relaxed custom-scrollbar selection:bg-indigo-500/30 transition-all placeholder:text-zinc-700"
                placeholder="Burada işlem yapmak için Chat ekranından bir talimat verin veya belge yükleyin. Yazılan dilekçeler anlık olarak buraya yansır..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                spellCheck={false}
            />
            {/* Karakter ve Kelime Sayacı */}
            <div className="absolute bottom-4 right-6 flex items-center gap-4 text-[10px] text-zinc-600 font-bold bg-[#121215]/80 backdrop-blur-md px-4 py-2 rounded-full border border-zinc-800/50 shadow-lg">
                <span className="uppercase tracking-widest">{content.split(/\s+/).filter(x => x).length} Kelime</span>
                <div className="w-[1px] h-3 bg-zinc-800"></div>
                <span className="uppercase tracking-widest">{content.length} Karakter</span>
            </div>
        </div>
    </div>
  );
}