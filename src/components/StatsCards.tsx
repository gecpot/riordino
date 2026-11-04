import React from 'react';
import { PackageCheck, CheckSquare, AlertTriangle, Layers, Euro } from 'lucide-react';
import { MatchResult } from '../types';

interface StatsCardsProps {
  result: MatchResult;
  activeTab: 'matched' | 'unmatched' | 'panini';
  onTabChange: (tab: 'matched' | 'unmatched' | 'panini') => void;
}

export const StatsCards: React.FC<StatsCardsProps> = ({ result, activeTab, onTabChange }) => {
  const activeMatchedCount = result.matched.filter(m => !m.escluso).length;
  const excludedCount = result.matched.filter(m => m.escluso).length;

  // Calcolo valore totale stimato di copertina
  const totalValore = result.matched
    .filter(m => !m.escluso)
    .reduce((acc, m) => {
      const p = parseFloat((m.prezzo || '').replace(',', '.'));
      return acc + (isNaN(p) ? 0 : p * m.qtaOrdine);
    }, 0);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      {/* 1. COPIE DA ORDINARE */}
      <div 
        onClick={() => onTabChange('matched')}
        className={`p-4 rounded-xl border transition-all cursor-pointer ${
          activeTab === 'matched' 
            ? 'bg-emerald-500 text-white border-emerald-600 shadow-md shadow-emerald-500/20' 
            : 'bg-white border-slate-200 hover:border-emerald-300 hover:shadow-sm'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className={`text-xs font-semibold uppercase tracking-wider ${activeTab === 'matched' ? 'text-emerald-100' : 'text-slate-500'}`}>
            Copie da Ordinare
          </span>
          <PackageCheck className={`w-5 h-5 ${activeTab === 'matched' ? 'text-emerald-100' : 'text-emerald-600'}`} />
        </div>
        <div className="mt-2 text-3xl font-extrabold tracking-tight">
          {result.totalDaOrdinare}
        </div>
        <p className={`text-xs mt-1 ${activeTab === 'matched' ? 'text-emerald-100' : 'text-slate-500'}`}>
          {activeMatchedCount} titoli attivi {excludedCount > 0 && `(${excludedCount} esclusi)`}
        </p>
      </div>

      {/* 2. TITOLI MATCHATI */}
      <div 
        onClick={() => onTabChange('matched')}
        className={`p-4 rounded-xl border transition-all cursor-pointer ${
          activeTab === 'matched' 
            ? 'bg-white border-blue-500 shadow-sm' 
            : 'bg-white border-slate-200 hover:border-blue-300 hover:shadow-sm'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Titoli Bonelli Sato
          </span>
          <CheckSquare className="w-5 h-5 text-blue-600" />
        </div>
        <div className="mt-2 text-3xl font-extrabold text-slate-900 tracking-tight">
          {result.matched.length}
        </div>
        <p className="text-xs text-slate-500 mt-1">
          100% precisione catalogo
        </p>
      </div>

      {/* 3. NON A CATALOGO / ESAURITI */}
      <div 
        onClick={() => onTabChange('unmatched')}
        className={`p-4 rounded-xl border transition-all cursor-pointer ${
          activeTab === 'unmatched' 
            ? 'bg-amber-500 text-white border-amber-600 shadow-md shadow-amber-500/20' 
            : 'bg-white border-slate-200 hover:border-amber-300 hover:shadow-sm'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className={`text-xs font-semibold uppercase tracking-wider ${activeTab === 'unmatched' ? 'text-amber-100' : 'text-slate-500'}`}>
            Non a Catalogo / Esauriti
          </span>
          <AlertTriangle className={`w-5 h-5 ${activeTab === 'unmatched' ? 'text-amber-100' : 'text-amber-600'}`} />
        </div>
        <div className="mt-2 text-3xl font-extrabold tracking-tight">
          {result.unmatched.length}
        </div>
        <p className={`text-xs mt-1 ${activeTab === 'unmatched' ? 'text-amber-100' : 'text-slate-500'}`}>
          Salvati nel report TXT
        </p>
      </div>

      {/* 4. PANINI / ALTRI */}
      <div 
        onClick={() => onTabChange('panini')}
        className={`p-4 rounded-xl border transition-all cursor-pointer ${
          activeTab === 'panini' 
            ? 'bg-purple-600 text-white border-purple-700 shadow-md shadow-purple-500/20' 
            : 'bg-white border-slate-200 hover:border-purple-300 hover:shadow-sm'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className={`text-xs font-semibold uppercase tracking-wider ${activeTab === 'panini' ? 'text-purple-200' : 'text-slate-500'}`}>
            Panini / Marvel / Manga
          </span>
          <Layers className={`w-5 h-5 ${activeTab === 'panini' ? 'text-purple-200' : 'text-purple-600'}`} />
        </div>
        <div className="mt-2 text-3xl font-extrabold tracking-tight">
          {result.panini.length}
        </div>
        <p className={`text-xs mt-1 ${activeTab === 'panini' ? 'text-purple-200' : 'text-slate-500'}`}>
          Filtrati (non Bonelli)
        </p>
      </div>
    </div>
  );
};
