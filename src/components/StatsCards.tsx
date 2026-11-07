import React from 'react';
import { PackageCheck, CheckSquare, MailPlus, Layers } from 'lucide-react';
import { MatchResult } from '../types';

interface StatsCardsProps {
  result: MatchResult;
  activeTab: 'matched' | 'unmatched' | 'panini';
  onTabChange: (tab: 'matched' | 'unmatched' | 'panini') => void;
}

export const StatsCards: React.FC<StatsCardsProps> = ({ result, activeTab, onTabChange }) => {
  const activeMatchedCount = result.matched.filter(m => !m.escluso && m.qtaOrdine > 0).length;
  const excludedMatchedCount = result.matched.filter(m => m.escluso || m.qtaOrdine === 0).length;

  const activeUnmatchedCount = result.unmatched.filter(u => !u.escluso && u.qtaOrdine > 0).length;
  const excludedUnmatchedCount = result.unmatched.filter(u => u.escluso || u.qtaOrdine === 0).length;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
      {/* 1. COPIE DA ORDINARE CSV SATO */}
      <div
        onClick={() => onTabChange('matched')}
        className={`p-3 rounded-xl border transition-all cursor-pointer ${
          activeTab === 'matched'
            ? 'bg-emerald-600 text-white border-emerald-700 shadow-md shadow-emerald-500/20'
            : 'bg-white border-slate-200 hover:border-emerald-300 hover:shadow-sm'
        }`}
      >
        <div className="flex items-center justify-between">
          <span
            className={`text-[11px] font-semibold uppercase tracking-wider ${
              activeTab === 'matched' ? 'text-emerald-100' : 'text-slate-500'
            }`}
          >
            Copie Ordine CSV
          </span>
          <PackageCheck
            className={`w-4 h-4 ${activeTab === 'matched' ? 'text-emerald-100' : 'text-emerald-600'}`}
          />
        </div>
        <div className="mt-1 text-2xl font-extrabold tracking-tight">{result.totalDaOrdinare}</div>
        <p className={`text-[11px] mt-0.5 ${activeTab === 'matched' ? 'text-emerald-100' : 'text-slate-500'}`}>
          {activeMatchedCount} titoli attivi {excludedMatchedCount > 0 && `(${excludedMatchedCount} esclusi)`}
        </p>
      </div>

      {/* 2. TITOLI MATCHATI CATALOGO CSV */}
      <div
        onClick={() => onTabChange('matched')}
        className={`p-3 rounded-xl border transition-all cursor-pointer ${
          activeTab === 'matched'
            ? 'bg-white border-emerald-500 shadow-sm'
            : 'bg-white border-slate-200 hover:border-blue-300 hover:shadow-sm'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Titoli a Catalogo CSV
          </span>
          <CheckSquare className="w-4 h-4 text-blue-600" />
        </div>
        <div className="mt-1 text-2xl font-extrabold text-slate-900 tracking-tight">
          {result.matched.length}
        </div>
        <p className="text-[11px] text-slate-500 mt-0.5">Pronti per Sato.csv</p>
      </div>

      {/* 3. ORDINE VIA MAIL (NON A CATALOGO CSV - CODICI DD01, TE01, ECC.) */}
      <div
        onClick={() => onTabChange('unmatched')}
        className={`p-3 rounded-xl border transition-all cursor-pointer ${
          activeTab === 'unmatched'
            ? 'bg-amber-500 text-white border-amber-600 shadow-md shadow-amber-500/20'
            : 'bg-white border-slate-200 hover:border-amber-300 hover:shadow-sm'
        }`}
      >
        <div className="flex items-center justify-between">
          <span
            className={`text-[11px] font-semibold uppercase tracking-wider ${
              activeTab === 'unmatched' ? 'text-amber-100' : 'text-slate-500'
            }`}
          >
            Ordine Mail (Codici)
          </span>
          <MailPlus
            className={`w-4 h-4 ${activeTab === 'unmatched' ? 'text-amber-100' : 'text-amber-600'}`}
          />
        </div>
        <div className="mt-1 flex items-baseline space-x-1.5">
          <span className="text-2xl font-extrabold tracking-tight">{result.totalDaOrdinareMail}</span>
          <span className={`text-[11px] font-semibold ${activeTab === 'unmatched' ? 'text-amber-100' : 'text-slate-500'}`}>
            copie ({activeUnmatchedCount} titoli)
          </span>
        </div>
        <p className={`text-[11px] mt-0.5 ${activeTab === 'unmatched' ? 'text-amber-100' : 'text-slate-500'}`}>
          {result.unmatched.length} totali fuori CSV {excludedUnmatchedCount > 0 && `(${excludedUnmatchedCount} esclusi)`}
        </p>
      </div>

      {/* 4. PANINI / ALTRI */}
      <div
        onClick={() => onTabChange('panini')}
        className={`p-3 rounded-xl border transition-all cursor-pointer ${
          activeTab === 'panini'
            ? 'bg-purple-600 text-white border-purple-700 shadow-md shadow-purple-500/20'
            : 'bg-white border-slate-200 hover:border-purple-300 hover:shadow-sm'
        }`}
      >
        <div className="flex items-center justify-between">
          <span
            className={`text-[11px] font-semibold uppercase tracking-wider ${
              activeTab === 'panini' ? 'text-purple-200' : 'text-slate-500'
            }`}
          >
            Panini / Marvel / Manga
          </span>
          <Layers
            className={`w-4 h-4 ${activeTab === 'panini' ? 'text-purple-200' : 'text-purple-600'}`}
          />
        </div>
        <div className="mt-1 text-2xl font-extrabold tracking-tight">{result.panini.length}</div>
        <p className={`text-[11px] mt-0.5 ${activeTab === 'panini' ? 'text-purple-200' : 'text-slate-500'}`}>
          Filtrati (non Bonelli)
        </p>
      </div>
    </div>
  );
};
