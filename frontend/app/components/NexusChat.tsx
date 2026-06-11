"use client";
import React, { useState, useRef, useEffect } from 'react';
import { Send, Cpu, User, Bot, Loader2, Mic, Paperclip, X, FileText, Square } from 'lucide-react';

export default function NexusChat() {
  const [messages, setMessages] = useState<any[]>([
    { 
      id: "init", 
      role: 'assistant', 
      content: "Nexus Enterprise V3.4 Aktif. Dava dosyasını yükleyin veya hukuki sorunuzu sorun. Sizin için strateji geliştirmeye hazırım." 
    }
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  
  // --- STATE'LER ---
  const [isRecording, setIsRecording] = useState(false); // Kayıt durumu
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  
  // --- REFLER ---
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null); // Kayıt cihazını hafızada tutmak için

  // Otomatik Kaydırma
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isTyping, selectedFiles]);

  // --- GELİŞMİŞ SESLİ KOMUT (AÇ/KAPA) ---
  const handleVoiceInput = async () => {
    // DURUM 1: Eğer zaten kayıt yapıyorsa -> DURDUR
    if (isRecording) {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
            mediaRecorderRef.current.stop(); // 'onstop' fonksiyonunu tetikler
            setIsRecording(false);
        }
        return;
    }

    // DURUM 2: Kayıt yapmıyorsa -> BAŞLAT
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder; // Ref'e kaydet ki sonra durdurabilelim

        const audioChunks: BlobPart[] = [];
        setIsRecording(true);

        mediaRecorder.ondataavailable = (event) => {
            audioChunks.push(event.data);
        };

        mediaRecorder.onstop = async () => {
            // Kayıt durunca çalışacak kodlar
            const audioBlob = new Blob(audioChunks, { type: 'audio/mpeg' });
            const formData = new FormData();
            formData.append("file", audioBlob, "voice_command.mp3");

            // Stream'i temizle (Mikrofon ışığını söndür)
            stream.getTracks().forEach(track => track.stop());

            try {
                const res = await fetch('http://localhost:8000/chat/voice', {
                    method: 'POST',
                    body: formData
                });
                const data = await res.json();
                
                if(data.text) {
                    setInput(prev => (prev ? prev + " " : "") + data.text);
                }
            } catch (error) {
                console.error("Ses hatası:", error);
            } finally {
                setIsRecording(false);
            }
        };

        mediaRecorder.start();

    } catch (error) {
        console.error("Mikrofon hatası:", error);
        setIsRecording(false);
        alert("Mikrofon izni verilmedi.");
    }
  };

  // --- MESAJ GÖNDERME ---
  const sendMessage = async () => {
    if ((!input.trim() && !selectedFiles) || isTyping) return;

    const userContent = input.trim();
    const tempFiles = selectedFiles ? Array.from(selectedFiles).map(f => f.name) : [];
    
    setMessages(prev => [...prev, { 
        id: Date.now(), 
        role: 'user', 
        content: userContent,
        files: tempFiles
    }]);

    setInput("");
    setSelectedFiles(null); 
    setIsTyping(true);

    try {
      const token = localStorage.getItem('nexus_token');
      
      // Dosya Yükleme
      if (tempFiles.length > 0 && fileInputRef.current?.files) {
          const formData = new FormData();
          for (let i = 0; i < fileInputRef.current.files.length; i++) {
              formData.append("files", fileInputRef.current.files[i]);
          }
          await fetch('http://localhost:8000/chat/upload', {
              method: 'POST',
              headers: { 'Authorization': `Bearer ${token}` },
              body: formData
          });
      }

      // Soru Sorma
      const finalQuery = userContent || "Yüklediğim belgeleri analiz et.";
      const res = await fetch(`http://localhost:8000/sor?soru=${encodeURIComponent(finalQuery)}`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (res.status === 401) {
        window.location.href = '/login'; 
        return;
      }

      const data = await res.json();
      const cevapMetni = data.cevap || data.answer || "Analiz tamamlandı.";
      
      setMessages(prev => [...prev, { id: Date.now(), role: 'assistant', content: cevapMetni }]);

      if (data.dilekce_taslagi && data.dilekce_taslagi.length > 10) {
        window.dispatchEvent(new CustomEvent('updateEditor', { detail: data.dilekce_taslagi }));
      }
      window.dispatchEvent(new CustomEvent('newAnalysisData', { detail: data }));

    } catch (err) {
      setMessages(prev => [...prev, { id: Date.now(), role: 'assistant', content: "Bağlantı hatası oluştu." }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#121215] overflow-hidden">
      <input type="file" multiple ref={fileInputRef} className="hidden" onChange={(e) => setSelectedFiles(e.target.files)}/>

      {/* Header */}
      <div className="p-4 border-b border-zinc-800 flex items-center gap-3 bg-[#18181b] shrink-0">
        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Cpu size={18} className="text-white"/>
        </div>
        <div>
            <h3 className="text-xs font-bold text-white tracking-wider">NEXUS ULTIMATE</h3>
            <span className="text-[10px] text-green-500 font-mono flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span> Online
            </span>
        </div>
      </div>

      {/* Mesaj Alanı */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {messages.map((m) => (
          <div key={m.id} className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''} animate-in slide-in-from-bottom-2 duration-300`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-md ${m.role === 'user' ? 'bg-zinc-700' : 'bg-indigo-600'}`}>
                {m.role === 'user' ? <User size={14} className="text-white"/> : <Bot size={14} className="text-white"/>}
            </div>
            <div className="max-w-[85%] flex flex-col gap-1">
                {m.files && m.files.length > 0 && (
                    <div className={`flex flex-wrap gap-2 ${m.role === 'user' ? 'justify-end' : ''}`}>
                        {m.files.map((f: string, i: number) => (
                            <div key={i} className="bg-zinc-800 border border-zinc-700 rounded-md px-2 py-1 text-[10px] text-zinc-400 flex items-center gap-1">
                                <Paperclip size={10}/> {f}
                            </div>
                        ))}
                    </div>
                )}
                <div className={`p-4 rounded-2xl text-[13px] leading-relaxed shadow-sm ${
                m.role === 'user' 
                    ? 'bg-zinc-800 text-white rounded-tr-none border border-zinc-700' 
                    : 'bg-[#1e1e24] text-zinc-300 border border-zinc-800 rounded-tl-none shadow-indigo-500/5'
                }`}>
                <div className="whitespace-pre-wrap font-sans">{m.content}</div>
                </div>
            </div>
          </div>
        ))}
        {isTyping && (
            <div className="flex items-center gap-3 text-xs text-zinc-500 ml-12 animate-pulse">
                <Loader2 size={12} className="animate-spin text-indigo-500"/>
                <span className="font-semibold tracking-tight">Analiz yapılıyor...</span>
            </div>
        )}
      </div>

      {/* Input Alanı */}
      <div className="p-4 bg-[#18181b] border-t border-zinc-800 shrink-0 shadow-2xl space-y-3">
        {selectedFiles && selectedFiles.length > 0 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
                {Array.from(selectedFiles).map((file, i) => (
                    <div key={i} className="flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/30 px-3 py-1.5 rounded-lg text-xs text-indigo-300 animate-in zoom-in">
                        <FileText size={12}/>
                        <span className="max-w-[100px] truncate">{file.name}</span>
                        <button onClick={() => setSelectedFiles(null)} className="hover:text-white"><X size={12}/></button>
                    </div>
                ))}
            </div>
        )}

        <div className="flex gap-3 items-end">
            <button 
                onClick={() => fileInputRef.current?.click()}
                className="p-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded-xl transition-colors border border-zinc-700"
                title="Dosya Ekle"
            >
                <Paperclip size={20}/>
            </button>

            <div className="flex-1 relative group">
                <input 
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl pl-4 pr-12 py-4 text-[13px] text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition-all placeholder:text-zinc-600 shadow-inner"
                    placeholder={isRecording ? "Dinliyorum... (Durdurmak için butona basın)" : "Yazın veya konuşun..."}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                    disabled={isRecording} // Kayıt sırasında elle yazmayı engelle (isteğe bağlı)
                />
                
                {/* --- MİKROFON BUTONU (TOGGLE) --- */}
                <button 
                    onClick={handleVoiceInput}
                    className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg transition-all ${
                        isRecording 
                        ? 'bg-red-500 text-white animate-pulse shadow-lg shadow-red-500/50 scale-110' // Kayıttayken kırmızı ve canlı
                        : 'text-zinc-500 hover:text-indigo-400 hover:bg-zinc-800'
                    }`}
                    title={isRecording ? "Kaydı Durdur" : "Sesli Yaz"}
                >
                    {isRecording ? <Square size={14} fill="currentColor"/> : <Mic size={18}/>}
                </button>
            </div>

            <button 
                onClick={sendMessage} 
                disabled={isTyping || (!input.trim() && !selectedFiles) || isRecording}
                className="p-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 disabled:cursor-not-allowed text-white rounded-xl transition-all shadow-lg active:scale-95 shadow-indigo-600/20"
            >
                {isTyping ? <Loader2 size={20} className="animate-spin"/> : <Send size={20}/>}
            </button>
        </div>
      </div>
    </div>
  );
}