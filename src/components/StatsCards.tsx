import React from 'react';
import { PackageCheck, MailPlus, Layers, Ban } from 'lucide-react';
import { MatchResult, ActiveTab } from '../types';

interface StatsCardsProps {
  result: MatchResult;
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  blockedCount: number;
}

export const StatsCards: React.FC<StatsCardsProps> = ({
  result,
  activeTab,
  onTabChange,
  blockedCount
}) => {
  const activeMatchedCount = result.matched.filter(m => !m.escluso && m.qtaOrdine > 0).length;
  const excludedMatchedCount = result.matched.filter(m => m.escluso || m.qtaOrdine === 0).length;

  const activeUnmatchedCount = result.unmatched.filter(u => !u.escluso && u.qtaOrdine > 0).length;
  const excludedUnmatchedCount = result.unmatched.filter(u => u.escluso || u.qtaOrdine === 0).length;

  const blockedThisWeekCount = Object.keys(result.blockedInWeek || {}).length;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
      {/* 1. CATALOGO CSV SATO */}
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
            1. Ordine CSV Sato
          </span>
          <PackageCheck
            className={`w-4 h-4 ${activeTab === 'matched' ? 'text-emerald-100' : 'text-emerald-600'}`}
          />
        </div>
        <div className="mt-1 flex items-baseline space-x-1.5">
          <span className="text-2xl font-extrabold tracking-tight">{result.totalDaOrdinare}</span>
          <span className={`text-[11px] font-semibold ${activeTab === 'matched' ? 'text-emerald-100' : 'text-slate-500'}`}>
            copie ({activeMatchedCount} titoli)
          </span>
        </div>
        <p className={`text-[11px] mt-0.5 ${activeTab === 'matched' ? 'text-emerald-100' : 'text-slate-500'}`}>
          {result.matched.length} a catalogo CSV {excludedMatchedCount > 0 && `(${excludedMatchedCount} escl.)`}
        </p>
      </div>

      {/* 2. ORDINE VIA MAIL (CODICI DD01, TE01, ECC.) */}
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
            2. Ordine Mail (Codici)
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
          {result.unmatched.length} fuori CSV {excludedUnmatchedCount > 0 && `(${excludedUnmatchedCount} escl.)`}
        </p>
      </div>

      {/* 3. PANINI / ALTRI */}
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
            3. Panini / Manga
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

      {/* 4. NON ORDINABILI / ESAURITI */}
      <div
        onClick={() => onTabChange('blocked')}
        className={`p-3 rounded-xl border transition-all cursor-pointer ${
          activeTab === 'blocked'
            ? 'bg-rose-600 text-white border-rose-700 shadow-md shadow-rose-500/20'
            : 'bg-white border-slate-200 hover:border-rose-300 hover:shadow-sm'
        }`}
      >
        <div className="flex items-center justify-between">
          <span
            className={`text-[11px] font-semibold uppercase tracking-wider ${
              activeTab === 'blocked' ? 'text-rose-100' : 'text-slate-500'
            }`}
          >
            4. Non Ordinabili
          </span>
          <Ban
            className={`w-4 h-4 ${activeTab === 'blocked' ? 'text-rose-100' : 'text-rose-600'}`}
          />
        </div>
        <div className="mt-1 flex items-baseline space-x-1.5">
          <span className="text-2xl font-extrabold tracking-tight">{blockedCount}</span>
          <span className={`text-[11px] font-semibold ${activeTab === 'blocked' ? 'text-rose-100' : 'text-slate-500'}`}>
            in archivio
          </span>
        </div>
        <p className={`text-[11px] mt-0.5 ${activeTab === 'blocked' ? 'text-rose-100' : 'text-slate-500'}`}>
          {blockedThisWeekCount > 0
            ? `${blockedThisWeekCount} nascosti questa settimana`
            : 'Nascosti dalla lista Mail'}
        </p>
      </div>
    </div>
  );
};
