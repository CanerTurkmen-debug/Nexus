"use client";
import React from 'react';
import { AlertTriangle, Zap, Activity, TrendingUp, Shield, BarChart3 } from 'lucide-react';

export default function DashboardStats({ analysis }: { analysis: any }) {
  
  // 1. DURUM: Henüz analiz yapılmadıysa (Placeholder)
  if (!analysis) return (
    <div className="flex flex-col items-center justify-center h-full text-zinc-600 space-y-4 select-none">
        <div className="relative">
            <Activity size={48} className="text-zinc-800 animate-pulse"/>
            <div className="absolute inset-0 bg-indigo-500/20 blur-xl rounded-full"></div>
        </div>
        <div className="text-center">
            <h3 className="text-sm font-bold text-zinc-500">Analiz Bekleniyor</h3>
            <p className="text-[10px] text-zinc-600 max-w-[200px] mt-1">
                Bir dosya yükleyin veya Chat üzerinden hukuki bir soru sorun.
            </p>
        </div>
    </div>
  );

  // 2. DURUM: Analiz verisi geldiyse (Dashboard)
  return (
    <div className="flex flex-col gap-4 h-full overflow-y-auto custom-scrollbar pr-1">
        
        {/* Üst İstatistikler (Grid) */}
        {analysis.istatistikler && (
        <div className="grid grid-cols-2 gap-3 shrink-0">
            {/* Kazanma İhtimali */}
            <div className="bg-zinc-900/60 p-4 rounded-2xl border border-zinc-800/50 hover:border-green-500/30 transition-colors group">
                <div className="flex justify-between items-start mb-2">
                    <div className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest">Başarı Şansı</div>
                    <TrendingUp size={14} className="text-green-500 group-hover:scale-110 transition-transform"/>
                </div>
                <div className="text-2xl font-black text-white group-hover:text-green-400 transition-colors">
                    {analysis.istatistikler.kazanma_ihtimali || "Belirsiz"}
                </div>
            </div>

            {/* Mevzuat Uyumu */}
            <div className="bg-zinc-900/60 p-4 rounded-2xl border border-zinc-800/50 hover:border-indigo-500/30 transition-colors group">
                <div className="flex justify-between items-start mb-2">
                    <div className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest">Uyum Skoru</div>
                    <Shield size={14} className="text-indigo-500 group-hover:scale-110 transition-transform"/>
                </div>
                <div className="text-2xl font-black text-white group-hover:text-indigo-400 transition-colors">
                    %{analysis.istatistikler.uyum || 0}
                </div>
                {/* Mini Progress Bar */}
                <div className="w-full h-1 bg-zinc-800 rounded-full mt-2 overflow-hidden">
                    <div 
                        className="h-full bg-indigo-500 rounded-full" 
                        style={{ width: `${analysis.istatistikler.uyum || 0}%` }}
                    ></div>
                </div>
            </div>
        </div>
        )}

        {/* Risk Analizi Kartı */}
        {analysis.riskler && analysis.riskler.length > 0 && (
            <div className="bg-red-500/[0.03] border border-red-500/10 p-4 rounded-2xl shrink-0">
                <h3 className="text-red-400 font-bold text-xs mb-3 flex items-center gap-2">
                    <AlertTriangle size={14}/> TESPİT EDİLEN RİSKLER
                </h3>
                <ul className="space-y-2">
                    {analysis.riskler.map((risk: string, i: number) => (
                        <li key={i} className="text-[11px] text-zinc-400 flex gap-2 items-start leading-tight">
                            <span className="mt-1 w-1.5 h-1.5 bg-red-500 rounded-full shrink-0 shadow-[0_0_5px_red]"></span>
                            {risk}
                        </li>
                    ))}
                </ul>
            </div>
        )}

        {/* Strateji Kartı */}
        {analysis.strateji && (
            <div className="bg-gradient-to-br from-indigo-900/10 to-zinc-900 border border-indigo-500/10 p-4 rounded-2xl shrink-0 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-20 h-20 bg-indigo-500/5 blur-2xl rounded-full"></div>
                <h3 className="text-indigo-400 font-bold text-xs mb-3 flex items-center gap-2 relative z-10">
                    <Zap size={14}/> ÖNERİLEN STRATEJİ
                </h3>
                <p className="text-[11px] text-zinc-300 leading-relaxed font-light relative z-10">
                    {analysis.strateji}
                </p>
            </div>
        )}
        
        {/* İstatistik Yoksa Gösterilecek Bilgi */}
        {(!analysis.riskler && !analysis.strateji) && (
             <div className="p-4 rounded-xl border border-dashed border-zinc-800 text-center">
                <p className="text-[10px] text-zinc-600">Detaylı veri analiz ediliyor...</p>
             </div>
        )}
    </div>
  );
}