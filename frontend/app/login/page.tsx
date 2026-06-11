"use client";

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { GoogleOAuthProvider, useGoogleLogin } from '@react-oauth/google'; 
import { 
  ShieldCheck, Lock, Mail, User, ArrowRight, 
  CheckCircle, AlertTriangle, Globe,
  BrainCircuit, Wallet, Scale, Zap,
  Files, CalendarClock, ChevronDown, 
  Database, Share2, Layers, Search, Cpu,
  Chrome, TrendingUp, FileText, Briefcase, 
  MessageSquare, Gavel, Landmark, Clock,
  KeyRound, ArrowLeft 
} from 'lucide-react';

// --- İÇ BİLEŞEN: TÜM MANTIK VE TASARIM BURADA ---
function LoginForm() {
  const router = useRouter();
  
  // --- STATE YÖNETİMİ ---
  const [isLogin, setIsLogin] = useState(true); // Giriş mi Kayıt mı?
  const [otpMode, setOtpMode] = useState(false); // Şifre sıfırlama modunda mıyız?
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [formData, setFormData] = useState({ full_name: "", email: "", password: "", otpCode: "" });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError(""); 
    setSuccess("");
  };

  const scrollToTop = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // --- GOOGLE LOGIN HOOK (CANLI) ---
  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setLoading(true);
      setError("");
      console.log("Google Token:", tokenResponse);
      
      // Token'ı localStorage'a kaydet ve yönlendir
      localStorage.setItem('nexus_token', 'google_access_' + tokenResponse.access_token);
      setSuccess(`Google doğrulandı! Kokpite bağlanılıyor...`);
      
      setTimeout(() => router.push('/'), 1500);
    },
    onError: () => {
      setError("Google bağlantısı kurulamadı. Lütfen tekrar deneyin.");
      setLoading(false);
    },
  });

  // --- ADIM 1: ŞİFRE SIFIRLAMA KODU GÖNDER (GERÇEK API) ---
  const handleSendResetCode = async (e: React.MouseEvent) => {
     e.preventDefault();
     setSuccess("");
     setError("");

     if (!formData.email) {
        setError("Lütfen kodun gönderileceği e-posta adresini girin.");
        return;
     }

     setLoading(true);

     try {
        // Backend'e gerçek istek atıyoruz
        const res = await fetch('http://localhost:8000/auth/forgot-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: formData.email })
        });

        const data = await res.json();
        
        if (!res.ok) {
            // Backend'den gelen özel hatayı göster
            throw new Error(data.detail || "Mail gönderilemedi. Lütfen adresi kontrol edin.");
        }

        // Başarılıysa OTP moduna geç
        setOtpMode(true); 
        setSuccess(`Doğrulama kodu ${formData.email} adresine gönderildi.`);
     } catch (err: any) {
        console.error("Mail Hatası:", err);
        setError(err.message || "Sunucuyla bağlantı kurulamadı.");
     } finally {
        setLoading(false);
     }
  };

  // --- ADIM 2: KODU DOĞRULA (GERÇEK API) ---
  const handleVerifyCode = async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);
      setError("");
      
      try {
          // Kod doğrulama isteği
          const res = await fetch('http://localhost:8000/auth/verify-otp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: formData.email, code: formData.otpCode })
          });

          const data = await res.json();

          if (!res.ok) {
              throw new Error(data.detail || "Hatalı kod veya süre dolmuş.");
          }

          setSuccess("Kod doğrulandı! Yeni şifreniz e-posta adresinize gönderildi.");
          
          // 4 saniye sonra giriş ekranına döndür
          setTimeout(() => {
              setOtpMode(false); 
              setIsLogin(true);
              setFormData({...formData, otpCode: ""}); // Kodu temizle
              setSuccess("");
          }, 4000);

      } catch (err: any) {
          setError(err.message || "Doğrulama işlemi başarısız.");
      } finally {
          setLoading(false);
      }
  };

  // --- NORMAL GİRİŞ / KAYIT İŞLEMLERİ ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      if (isLogin) {
        // --- LOGIN İŞLEMİ ---
        const formBody = new URLSearchParams();
        formBody.append('username', formData.email);
        formBody.append('password', formData.password);

        const res = await fetch('http://localhost:8000/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: formBody
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || "Giriş başarısız. Bilgilerinizi kontrol edin.");
        
        localStorage.setItem('nexus_token', data.access_token);
        setSuccess("Giriş Başarılı! Kokpite yönlendiriliyorsunuz...");
        setTimeout(() => router.push('/'), 1500); 
      } else {
        // --- KAYIT İŞLEMİ ---
        const res = await fetch('http://localhost:8000/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || "Kayıt başarısız.");
        
        setSuccess("Hesap başarıyla oluşturuldu! Giriş yapabilirsiniz.");
        setTimeout(() => setIsLogin(true), 2500);
      }
    } catch (err: any) {
      setError(err.message || "Sunucuya bağlanılamadı.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-full bg-[#020202] text-white font-sans overflow-hidden selection:bg-indigo-500/30">
      
      {/* ================= SOL TARAF (AKILLI FORM PANELİ) ================= */}
      <div className="w-full lg:w-[35%] flex flex-col px-8 lg:px-16 relative z-50 bg-[#050505] border-r border-zinc-800 shadow-2xl h-full overflow-y-auto custom-scrollbar">
        
        <div className="my-auto max-w-sm mx-auto w-full animate-in slide-in-from-left-8 duration-700 fade-in py-12">
          
          {/* Logo & Başlık */}
          <div className="flex items-center gap-3 mb-8 group cursor-default">
            <div className="w-12 h-12 bg-gradient-to-tr from-indigo-600 to-violet-600 rounded-2xl flex items-center justify-center rotate-3 group-hover:rotate-0 transition-all duration-500 shadow-lg shadow-indigo-500/20">
              <Scale className="text-white" size={24}/>
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tighter leading-none bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-400">NEXUS</h1>
              <span className="text-[10px] font-bold text-indigo-500 tracking-[0.3em] uppercase">V5.1 Ultimate</span>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-black tracking-tight mb-2 text-white">
              {otpMode ? 'Kodu Doğrula' : (isLogin ? 'Hoş Geldiniz' : 'Hesap Oluştur')}
            </h2>
            <p className="text-zinc-500 text-xs leading-relaxed">
              {otpMode 
                ? 'Lütfen e-posta adresinize gönderilen 6 haneli kodu girin.' 
                : (isLogin ? 'Nexus yönetim kokpitine erişmek için kimliğinizi doğrulayın.' : '1500+ Hukuk bürosunun kullandığı teknolojiye adım atın.')
              }
            </p>
          </div>

          {/* Toggle Switch (Sadece OTP modu kapalıysa göster) */}
          {!otpMode && (
            <div className="flex bg-zinc-900/50 p-1.5 rounded-xl mb-6 border border-zinc-800">
              <button onClick={() => setIsLogin(true)} className={`flex-1 py-2.5 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all duration-300 ${isLogin ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800'}`}>Giriş Yap</button>
              <button onClick={() => setIsLogin(false)} className={`flex-1 py-2.5 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all duration-300 ${!isLogin ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800'}`}>Kayıt Ol</button>
            </div>
          )}

          {/* Bildirim Alanı */}
          {error && <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400 text-xs font-bold animate-shake"><AlertTriangle size={16}/> {error}</div>}
          {success && <div className="mb-4 p-4 bg-green-500/10 border border-green-500/20 rounded-xl flex items-center gap-3 text-green-400 text-xs font-bold animate-in fade-in"><CheckCircle size={16}/> {success}</div>}

          {/* --- DİNAMİK FORM ALANI --- */}
          <form onSubmit={otpMode ? handleVerifyCode : handleSubmit} className="space-y-4">
            
            {/* SENARYO A: OTP (KOD GİRİŞ) MODU */}
            {otpMode ? (
               <div className="space-y-4 animate-in slide-in-from-right-8 fade-in duration-500">
                  <div className="relative group">
                    <KeyRound className="absolute left-4 top-3.5 text-zinc-600 group-focus-within:text-indigo-500 transition-colors" size={18}/>
                    <input 
                      name="otpCode" 
                      type="text" 
                      placeholder="6 Haneli Doğrulama Kodu" 
                      className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl py-3.5 pl-12 pr-4 text-xs text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all tracking-[0.5em] font-bold text-center placeholder:tracking-normal placeholder:font-normal placeholder:text-zinc-600" 
                      value={formData.otpCode} 
                      onChange={handleChange} 
                      maxLength={6}
                      required 
                    />
                  </div>
                  
                  <button disabled={loading} className="w-full bg-white text-black hover:bg-zinc-200 py-4 rounded-xl font-black text-xs uppercase tracking-widest shadow-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2 mt-4 group">
                    {loading ? <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin"/> : <>Kodu Onayla <CheckCircle size={16}/></>}
                  </button>
                  
                  <button type="button" onClick={() => {setOtpMode(false); setError(""); setSuccess("");}} className="w-full text-zinc-500 hover:text-white text-[10px] font-bold uppercase tracking-widest py-2 flex items-center justify-center gap-2 transition-colors">
                     <ArrowLeft size={12}/> Giriş Ekranına Dön
                  </button>
               </div>
            ) : (
               
            /* SENARYO B: NORMAL GİRİŞ MODU */
               <>
                {!isLogin && (
                  <div className="relative group animate-in slide-in-from-top-4 fade-in">
                    <User className="absolute left-4 top-3.5 text-zinc-600 group-focus-within:text-indigo-500 transition-colors" size={18}/>
                    <input name="full_name" type="text" placeholder="Ad Soyad" className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl py-3.5 pl-12 pr-4 text-xs text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all placeholder:text-zinc-600" onChange={handleChange} required={!isLogin} />
                  </div>
                )}
                <div className="relative group">
                  <Mail className="absolute left-4 top-3.5 text-zinc-600 group-focus-within:text-indigo-500 transition-colors" size={18}/>
                  <input name="email" type="email" placeholder="E-Posta Adresi" className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl py-3.5 pl-12 pr-4 text-xs text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all placeholder:text-zinc-600" value={formData.email} onChange={handleChange} required />
                </div>
                <div className="relative group">
                  <Lock className="absolute left-4 top-3.5 text-zinc-600 group-focus-within:text-indigo-500 transition-colors" size={18}/>
                  <input name="password" type="password" placeholder="Güvenlik Anahtarı" className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl py-3.5 pl-12 pr-4 text-xs text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all placeholder:text-zinc-600" onChange={handleChange} required />
                </div>
                
                {/* ŞİFREMİ UNUTTUM BUTONU */}
                {isLogin && (
                   <div className="flex justify-end">
                      <button onClick={handleSendResetCode} className="text-[10px] font-bold text-zinc-500 hover:text-indigo-400 transition-colors flex items-center gap-1">
                        {loading ? 'İşleniyor...' : 'Şifremi Unuttum?'}
                      </button>
                   </div>
                )}

                <button disabled={loading} className="w-full bg-white text-black hover:bg-zinc-200 py-4 rounded-xl font-black text-xs uppercase tracking-widest shadow-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2 mt-4 group">
                  {loading ? <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin"/> : <>{isLogin ? 'Sisteme Bağlan' : 'Hesabı Oluştur'} <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform"/></>}
                </button>

                <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-zinc-800"></div></div>
                    <div className="relative flex justify-center text-[10px] uppercase font-bold"><span className="bg-[#050505] px-2 text-zinc-600">veya</span></div>
                </div>

                {/* GOOGLE BUTONU */}
                <button type="button" onClick={() => googleLogin()} className="w-full bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-white py-3.5 rounded-xl font-bold text-xs flex items-center justify-center gap-3 transition-all group">
                   <Chrome size={18} className="text-zinc-400 group-hover:text-white transition-colors"/> Google ile Devam Et
                </button>
               </>
            )}
          </form>
          
          <div className="mt-8 flex justify-center gap-6 text-[10px] text-zinc-600 font-bold uppercase tracking-widest">
            <span className="flex items-center gap-1 cursor-pointer hover:text-indigo-400 transition-colors"><ShieldCheck size={12}/> Güvenli</span>
            <span className="flex items-center gap-1 cursor-pointer hover:text-indigo-400 transition-colors"><Globe size={12}/> Cloud</span>
          </div>

          {/* MOBİL ÖZELLİK ÖZETİ (LG altında görünür) */}
          <div className="lg:hidden mt-12 pt-8 border-t border-zinc-900">
             <h3 className="text-center text-zinc-500 text-[10px] uppercase font-bold tracking-widest mb-6">Nexus Özellikleri</h3>
             <div className="grid grid-cols-2 gap-3">
                <div className="bg-zinc-900/50 p-4 rounded-xl border border-zinc-800 text-center">
                   <BrainCircuit size={24} className="text-indigo-500 mx-auto mb-2"/>
                   <div className="text-[10px] font-bold text-zinc-400">AI Asistan</div>
                </div>
                <div className="bg-zinc-900/50 p-4 rounded-xl border border-zinc-800 text-center">
                   <Wallet size={24} className="text-green-500 mx-auto mb-2"/>
                   <div className="text-[10px] font-bold text-zinc-400">Finans</div>
                </div>
                <div className="bg-zinc-900/50 p-4 rounded-xl border border-zinc-800 text-center">
                   <Files size={24} className="text-blue-500 mx-auto mb-2"/>
                   <div className="text-[10px] font-bold text-zinc-400">Belge</div>
                </div>
                <div className="bg-zinc-900/50 p-4 rounded-xl border border-zinc-800 text-center">
                   <Database size={24} className="text-orange-500 mx-auto mb-2"/>
                   <div className="text-[10px] font-bold text-zinc-400">Kütüphane</div>
                </div>
             </div>
          </div>
        </div>
      </div>

      {/* ================= SAĞ TARAF (SNAP SCROLL VİTRİN) - EKSİKSİZ TAM LİSTE ================= */}
      <div 
        ref={scrollContainerRef}
        className="hidden lg:block lg:w-[65%] h-full bg-[#020202] relative overflow-y-auto snap-y snap-mandatory scroll-smooth no-scrollbar"
      >
         
         {/* --- SLIDE 1: HERO --- */}
         <section className="h-screen w-full snap-start flex flex-col justify-center items-center relative p-12 text-center border-b border-zinc-900 bg-[#020202]">
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[120px] animate-pulse pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none"></div>
            
            <div className="relative z-10 max-w-3xl space-y-8 animate-in slide-in-from-bottom-10 duration-1000">
               <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-400 text-[10px] font-black tracking-widest uppercase mb-4 shadow-lg shadow-indigo-500/20 backdrop-blur-md">
                 <Zap size={12}/> Nexus Ultimate V5.1
               </div>
               <h1 className="text-7xl font-black text-white leading-[1] tracking-tighter drop-shadow-2xl">
                 Hukuk Dünyasının <br/>
                 <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 animate-gradient">Dijital İşletim Sistemi</span>
               </h1>
               <p className="text-zinc-400 text-xl leading-relaxed max-w-2xl mx-auto">
                 Nexus; sadece bir asistan değil, hukuk büronuzun <strong>beyni, kasası ve arşividir.</strong> Tüm operasyonunuz tek sayfada, parmaklarınızın ucunda.
               </p>
               <div className="pt-16 flex flex-col items-center gap-2 text-zinc-600 animate-bounce opacity-70">
                  <span className="text-[10px] uppercase font-bold tracking-widest">Keşfetmek İçin Kaydır</span>
                  <ChevronDown size={24}/>
               </div>
            </div>
         </section>

         {/* --- SLIDE 2: YAPAY ZEKA (AI) --- */}
         <section className="h-screen w-full snap-start flex items-center justify-center p-16 bg-[#050505] border-b border-zinc-900 relative overflow-hidden">
             <div className="absolute left-[-10%] top-[20%] w-[600px] h-[600px] bg-indigo-500/5 rounded-full blur-[100px]"></div>
             <div className="max-w-6xl w-full grid grid-cols-2 gap-20 items-center z-10">
                <div className="space-y-8">
                    <div className="inline-flex items-center gap-2 text-indigo-400 font-bold uppercase tracking-widest text-xs mb-2">
                        <BrainCircuit size={16}/> Akıllı Asistan
                    </div>
                    <h2 className="text-5xl font-black text-white leading-tight">Groq Destekli <br/>Hukuk Dehası.</h2>
                    <p className="text-zinc-400 text-lg">
                        Sıradan sohbet botlarını unutun. Nexus; yüklediğiniz sözleşmeleri analiz eder, dilekçelerinizi hukuki dille yazar ve riskli maddeleri kırmızıyla işaretler.
                    </p>
                    <ul className="space-y-4 text-zinc-400 text-sm font-medium">
                        <li className="flex items-center gap-3 p-3 bg-zinc-900/30 rounded-xl border border-zinc-800"><CheckCircle size={18} className="text-indigo-500"/> Dilekçe & Sözleşme Taslağı Hazırlama</li>
                        <li className="flex items-center gap-3 p-3 bg-zinc-900/30 rounded-xl border border-zinc-800"><CheckCircle size={18} className="text-indigo-500"/> Sözleşme Risk Analizi (Risk Avcısı)</li>
                        <li className="flex items-center gap-3 p-3 bg-zinc-900/30 rounded-xl border border-zinc-800"><CheckCircle size={18} className="text-indigo-500"/> İçtihat Tabanlı Soru - Cevap</li>
                    </ul>
                </div>
                <div className="bg-zinc-900/80 backdrop-blur-xl border border-zinc-700/50 p-6 rounded-3xl relative shadow-2xl transform rotate-1 hover:rotate-0 transition-all duration-500">
                    <div className="absolute top-4 left-6 flex gap-2">
                       <div className="w-3 h-3 rounded-full bg-red-500/50"></div>
                       <div className="w-3 h-3 rounded-full bg-yellow-500/50"></div>
                       <div className="w-3 h-3 rounded-full bg-green-500/50"></div>
                    </div>
                    <div className="mt-8 space-y-6">
                        <div className="flex justify-end">
                           <div className="bg-indigo-600 text-white p-4 rounded-2xl rounded-tr-none text-xs max-w-[80%] shadow-lg shadow-indigo-900/20">
                              Bu kira sözleşmesindeki riskleri analiz et ve madde 4'ü incele.
                           </div>
                        </div>
                        <div className="flex justify-start gap-3">
                           <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center shrink-0"><BrainCircuit size={16} className="text-indigo-400"/></div>
                           <div className="bg-zinc-800 text-zinc-300 p-4 rounded-2xl rounded-tl-none text-xs max-w-[90%] border border-zinc-700 leading-relaxed shadow-lg">
                              <span className="text-indigo-400 font-bold block mb-2">Nexus AI:</span>
                              Madde 4.2'de yer alan <strong>"Kiracı, hiçbir sebep göstermeksizin tahliye edilebilir"</strong> ibaresi Türk Borçlar Kanunu'na (TBK) aykırıdır. Müvekkiliniz için <span className="text-red-400 font-bold underline decoration-red-500/50">YÜKSEK RİSK</span> taşımaktadır.
                           </div>
                        </div>
                    </div>
                </div>
             </div>
         </section>

         {/* --- SLIDE 3: FİNANS & MUHASEBE --- */}
         <section className="h-screen w-full snap-start flex items-center justify-center p-16 bg-[#020202] border-b border-zinc-900 relative">
             <div className="absolute right-[-10%] bottom-[20%] w-[600px] h-[600px] bg-green-500/5 rounded-full blur-[100px]"></div>
             <div className="max-w-6xl w-full grid grid-cols-2 gap-20 items-center z-10">
                
                {/* Sol Taraf (Kartlar) */}
                <div className="grid grid-cols-2 gap-5">
                    <div className="bg-zinc-900/30 backdrop-blur-sm border border-zinc-800 p-8 rounded-3xl text-center hover:bg-zinc-900/50 hover:border-green-500/30 transition-all duration-300 cursor-default group">
                        <div className="w-14 h-14 bg-green-500/10 rounded-2xl flex items-center justify-center text-green-500 mx-auto mb-4 group-hover:scale-110 transition-transform"><TrendingUp size={28}/></div>
                        <div className="text-3xl font-black text-white mb-1">₺450K</div>
                        <div className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold">Aylık Gelir</div>
                    </div>
                    <div className="bg-zinc-900/30 backdrop-blur-sm border border-zinc-800 p-8 rounded-3xl text-center hover:bg-zinc-900/50 hover:border-blue-500/30 transition-all duration-300 cursor-default group">
                        <div className="w-14 h-14 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-500 mx-auto mb-4 group-hover:scale-110 transition-transform"><Wallet size={28}/></div>
                        <div className="text-3xl font-black text-white mb-1">₺1.2M</div>
                        <div className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold">Kasa Bakiyesi</div>
                    </div>
                    <div className="col-span-2 bg-gradient-to-r from-zinc-900/50 to-zinc-900/30 border border-zinc-800 p-6 rounded-3xl flex items-center justify-between px-10 hover:border-zinc-700 transition-colors">
                        <div>
                           <div className="text-zinc-500 text-xs font-bold uppercase tracking-wider mb-1">Beklenen Tahsilat</div>
                           <div className="text-white font-black text-2xl">₺85.000</div>
                        </div>
                        <div className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center text-green-500 animate-pulse"><ArrowRight size={24} className="-rotate-45"/></div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="inline-flex items-center gap-2 text-green-400 font-bold uppercase tracking-widest text-xs mb-2">
                        <Wallet size={16}/> Finans Kokpiti
                    </div>
                    <h2 className="text-5xl font-black text-white leading-tight">Paranızın Kontrolü <br/><span className="text-green-500">Tamamen Sizde.</span></h2>
                    <p className="text-zinc-400 text-lg">
                        Excel tabloları ile uğraşmayın. Nexus, her dava dosyasının gelirini, giderini ve kalan bakiyesini otomatik hesaplar. Ofisinizin karlılığını tek ekranda, anlık olarak görün.
                    </p>
                    <ul className="space-y-4 text-zinc-400 text-sm font-medium">
                        <li className="flex items-center gap-3"><CheckCircle size={18} className="text-green-500"/> Dava Bazlı Bakiye & Karlılık Takibi</li>
                        <li className="flex items-center gap-3"><CheckCircle size={18} className="text-green-500"/> Masrafları Otomatik Giderleştirme</li>
                        <li className="flex items-center gap-3"><CheckCircle size={18} className="text-green-500"/> Müvekkil Cari Hesap Ekstresi</li>
                    </ul>
                </div>
             </div>
         </section>

         {/* --- SLIDE 4: DAVA YÖNETİMİ & TAKVİM (EKSİKSİZ) --- */}
         <section className="h-screen w-full snap-start flex items-center justify-center p-16 bg-[#050505] border-b border-zinc-900 relative">
             <div className="max-w-6xl w-full grid grid-cols-2 gap-20 items-center">
                 <div className="space-y-6 order-2 lg:order-1">
                     <div className="inline-flex items-center gap-2 text-purple-400 font-bold uppercase tracking-widest text-xs mb-2">
                         <Briefcase size={16}/> Operasyon Merkezi
                     </div>
                     <h2 className="text-5xl font-black text-white leading-tight">Zamanı Yönetin, <br/>Davayı Kazanın.</h2>
                     <p className="text-zinc-400 text-lg">
                         Tüm duruşmalarınız, kritik süreleriniz ve yapılacak görevler "Global Takvim" üzerinde birleşir. Hiçbir süreyi kaçırmazsınız.
                     </p>
                     <div className="grid grid-cols-2 gap-4 pt-4">
                        <div className="p-4 bg-zinc-900/50 rounded-xl border border-zinc-800 flex items-center gap-3">
                           <CalendarClock className="text-purple-500" size={24}/>
                           <div className="text-xs text-zinc-300 font-bold">Akıllı Hatırlatıcı</div>
                        </div>
                        <div className="p-4 bg-zinc-900/50 rounded-xl border border-zinc-800 flex items-center gap-3">
                           <Clock className="text-purple-500" size={24}/>
                           <div className="text-xs text-zinc-300 font-bold">Süre Takibi</div>
                        </div>
                        <div className="p-4 bg-zinc-900/50 rounded-xl border border-zinc-800 flex items-center gap-3">
                           <CheckCircle className="text-purple-500" size={24}/>
                           <div className="text-xs text-zinc-300 font-bold">Görev Atama</div>
                        </div>
                        <div className="p-4 bg-zinc-900/50 rounded-xl border border-zinc-800 flex items-center gap-3">
                           <Landmark className="text-purple-500" size={24}/>
                           <div className="text-xs text-zinc-300 font-bold">Duruşma Kaydı</div>
                        </div>
                     </div>
                 </div>
                 {/* Calendar UI Mockup */}
                 <div className="order-1 lg:order-2 bg-zinc-900/30 border border-zinc-800 p-8 rounded-3xl relative overflow-hidden group hover:bg-zinc-900/50 transition-colors">
                     <div className="grid grid-cols-7 gap-2 mb-4 text-center text-zinc-500 text-xs font-bold uppercase">
                        <div>Pzt</div><div>Sal</div><div>Çar</div><div>Per</div><div>Cum</div><div>Cmt</div><div>Paz</div>
                     </div>
                     <div className="grid grid-cols-7 gap-2 text-sm font-medium text-zinc-400">
                        <div className="p-3 text-center opacity-30">28</div>
                        <div className="p-3 text-center opacity-30">29</div>
                        <div className="p-3 text-center bg-indigo-600/20 text-indigo-400 rounded-lg border border-indigo-500/30 relative">
                           30
                           <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-indigo-500 rounded-full"></div>
                        </div>
                        <div className="p-3 text-center">1</div>
                        <div className="p-3 text-center bg-red-600/20 text-red-400 rounded-lg border border-red-500/30 relative">
                           2
                           <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-red-500 rounded-full"></div>
                        </div>
                        <div className="p-3 text-center">3</div>
                        <div className="p-3 text-center">4</div>
                     </div>
                     <div className="mt-6 space-y-3">
                        <div className="flex items-center gap-3 p-3 bg-zinc-950 rounded-xl border-l-4 border-indigo-500">
                           <div className="text-xs font-bold text-zinc-500">09:30</div>
                           <div className="text-sm font-bold text-white">Ağır Ceza Duruşması</div>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-zinc-950 rounded-xl border-l-4 border-red-500">
                           <div className="text-xs font-bold text-zinc-500">14:00</div>
                           <div className="text-sm font-bold text-white">İstinaf Başvuru Son Gün</div>
                        </div>
                     </div>
                 </div>
             </div>
         </section>

         {/* --- SLIDE 5: BELGE FABRİKASI --- */}
         <section className="h-screen w-full snap-start flex items-center justify-center p-16 bg-[#020202] border-b border-zinc-900 relative">
             <div className="max-w-4xl mx-auto text-center space-y-10">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-600/10 rounded-3xl mb-4 text-blue-500 border border-blue-500/20 shadow-lg shadow-blue-500/10">
                    <Files size={40}/>
                </div>
                <div>
                   <h2 className="text-6xl font-black text-white mb-4">Belge Fabrikası</h2>
                   <p className="text-zinc-400 text-xl max-w-2xl mx-auto leading-relaxed">
                      Tekrar eden işleri otomatiğe bağlayın. "Müvekkil Raporu", "Duruşma Özeti" veya "İhtarname" gibi belgeleri tek tıkla üretin.
                   </p>
                </div>
                
                <div className="grid grid-cols-3 gap-6 pt-4 text-left">
                    <div className="p-8 border border-zinc-800 bg-zinc-900/30 rounded-3xl hover:border-blue-500/50 hover:bg-zinc-900/60 transition-all duration-300 group cursor-pointer hover:-translate-y-2">
                        <FileText size={32} className="text-blue-500 mb-6 group-hover:scale-110 transition-transform"/>
                        <h4 className="text-xl font-bold text-white mb-2">Müvekkil Raporu</h4>
                        <p className="text-xs text-zinc-500">Davanın son durumunu özetleyen, logolu profesyonel PDF.</p>
                    </div>
                    <div className="p-8 border border-zinc-800 bg-zinc-900/30 rounded-3xl hover:border-blue-500/50 hover:bg-zinc-900/60 transition-all duration-300 group cursor-pointer hover:-translate-y-2">
                        <Layers size={32} className="text-blue-500 mb-6 group-hover:scale-110 transition-transform"/>
                        <h4 className="text-xl font-bold text-white mb-2">Dilekçe Taslağı</h4>
                        <p className="text-xs text-zinc-500">Konuyu söyleyin, AI size hukuki formatta taslak hazırlasın.</p>
                    </div>
                    <div className="p-8 border border-zinc-800 bg-zinc-900/30 rounded-3xl hover:border-blue-500/50 hover:bg-zinc-900/60 transition-all duration-300 group cursor-pointer hover:-translate-y-2">
                        <Gavel size={32} className="text-blue-500 mb-6 group-hover:scale-110 transition-transform"/>
                        <h4 className="text-xl font-bold text-white mb-2">Duruşma Tutanağı</h4>
                        <p className="text-xs text-zinc-500">Duruşma notlarını anında dijital arşive ve rapora dönüştürür.</p>
                    </div>
                </div>
             </div>
         </section>

         {/* --- SLIDE 6: KÜTÜPHANE & EMSAL --- */}
         <section className="h-screen w-full snap-start flex items-center justify-center p-16 bg-[#050505] border-b border-zinc-900 relative">
             <div className="max-w-6xl w-full grid grid-cols-2 gap-20 items-center">
                 <div className="space-y-6">
                     <div className="inline-flex items-center gap-2 text-orange-400 font-bold uppercase tracking-widest text-xs mb-2">
                         <Database size={16}/> Dijital Kütüphane
                     </div>
                     <h2 className="text-5xl font-black text-white leading-tight">Milyonlarca Karar <br/>Elinizin Altında.</h2>
                     <p className="text-zinc-400 text-lg">
                         Başka sitelere üye olmanıza gerek yok. Nexus'un entegre "Emsal Karar Arama" motoru ile Yargıtay, Danıştay ve BAM kararlarına anında ulaşın.
                     </p>
                     <div className="flex flex-wrap gap-3 pt-4">
                         <div className="px-5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-xs font-bold text-zinc-400 hover:text-white hover:border-orange-500/50 transition-colors cursor-default">Yargıtay</div>
                         <div className="px-5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-xs font-bold text-zinc-400 hover:text-white hover:border-orange-500/50 transition-colors cursor-default">Danıştay</div>
                         <div className="px-5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-xs font-bold text-zinc-400 hover:text-white hover:border-orange-500/50 transition-colors cursor-default">Bölge Adliye (BAM)</div>
                         <div className="px-5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-xs font-bold text-zinc-400 hover:text-white hover:border-orange-500/50 transition-colors cursor-default">Mevzuat</div>
                     </div>
                 </div>
                 <div className="bg-gradient-to-tr from-orange-600/10 to-red-600/10 border border-orange-500/20 p-12 rounded-3xl flex items-center justify-center relative overflow-hidden group">
                     <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
                     <Search size={140} className="text-orange-500 opacity-20 absolute right-[-30px] bottom-[-30px] group-hover:scale-110 transition-transform duration-700"/>
                     <div className="w-full space-y-4 z-10">
                         <div className="h-3 w-3/4 bg-orange-500/20 rounded animate-pulse"></div>
                         <div className="h-3 w-1/2 bg-orange-500/20 rounded animate-pulse delay-75"></div>
                         <div className="h-14 w-full bg-black/60 backdrop-blur-md border border-orange-500/30 rounded-xl flex items-center px-5 text-orange-400/70 text-sm shadow-xl">
                            <Search size={18} className="mr-3"/> "İş kazası manevi tazminat..."
                         </div>
                         <div className="h-3 w-2/3 bg-orange-500/20 rounded animate-pulse delay-150"></div>
                     </div>
                 </div>
             </div>
         </section>

         {/* --- SLIDE 7: FİNAL & LOOP --- */}
         <section className="h-screen w-full snap-start flex flex-col justify-center items-center relative p-12 bg-black text-center">
             <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-900/20 via-black to-black"></div>
             <div className="space-y-10 max-w-3xl z-10 animate-in zoom-in-50 duration-1000">
                 <Cpu size={80} className="text-white mx-auto animate-pulse drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]"/>
                 <div>
                    <h2 className="text-6xl font-black text-white mb-4">Geleceğe Geçiş Yapın.</h2>
                    <p className="text-zinc-500 text-xl max-w-xl mx-auto">
                        Nexus Ultimate ile ofisinizi dijitalleştirin, hız kazanın ve sadece hukukla ilgilenin. Gerisini yapay zekaya bırakın.
                    </p>
                 </div>
                 
                 <div className="pt-16">
                    <button 
                      onClick={scrollToTop}
                      className="group flex flex-col items-center gap-4 text-zinc-600 hover:text-white transition-colors cursor-pointer"
                    >
                       <div className="w-16 h-16 rounded-full border border-zinc-800 flex items-center justify-center group-hover:border-indigo-500 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500 shadow-2xl">
                          <ChevronDown size={28} className="rotate-180 group-hover:-translate-y-1 transition-transform"/>
                       </div>
                       <span className="text-[10px] font-bold uppercase tracking-widest group-hover:text-indigo-400 transition-colors">Başa Dön (Loop)</span>
                    </button>
                 </div>
             </div>
             
             {/* Footer Info */}
             <div className="absolute bottom-8 w-full text-center border-t border-zinc-900/50 pt-8 flex justify-center items-center gap-8 text-zinc-800">
                 <span className="text-[10px] font-bold tracking-widest uppercase flex items-center gap-2"><ShieldCheck size={12}/> Secure 256-Bit</span>
                 <span className="text-[10px] font-bold tracking-widest uppercase">© 2026 Nexus Ultimate Inc.</span>
                 <span className="text-[10px] font-bold tracking-widest uppercase flex items-center gap-2"><Globe size={12}/> Cloud V5.1</span>
             </div>
         </section>

      </div>
    </div>
  );
}

// --- ANA BİLEŞEN (GOOGLE SARMALAYICI) ---
export default function NexusLogin() {
  return (
    // !!! CLIENT ID'Nİ KORUDUK !!!
    <GoogleOAuthProvider clientId="116304547013-0tp1801ut9gdr97sun7j0fjn4k0pj3nh.apps.googleusercontent.com">
      <LoginForm />
    </GoogleOAuthProvider>
  );
}