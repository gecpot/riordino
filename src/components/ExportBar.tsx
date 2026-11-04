import React, { useState } from 'react';
import { Download, FileText, CheckCheck, Square, Search, Copy, Check } from 'lucide-react';
import { MatchedItem, MatchResult } from '../types';

interface ExportBarProps {
  onDownloadCsv: () => void;
  onDownloadTxt: () => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  activeTab: 'matched' | 'unmatched' | 'panini';
  onTabChange: (tab: 'matched' | 'unmatched' | 'panini') => void;
  result: MatchResult;
}

export const ExportBar: React.FC<ExportBarProps> = ({
  onDownloadCsv,
  onDownloadTxt,
  onSelectAll,
  onDeselectAll,
  searchQuery,
  onSearchChange,
  activeTab,
  onTabChange,
  result
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopySummary = () => {
    const activeCount = result.matched.filter(m => !m.escluso).length;
    const text = `RIEPILOGO ORDINE FUMETTI SATO:
- Copie totali da ordinare: ${result.totalDaOrdinare}
- Titoli Bonelli inclusi: ${activeCount}
- Titoli esclusi: ${result.matched.length - activeCount}
- Titoli non a catalogo / esauriti: ${result.unmatched.length}
- Titoli Panini/Manga: ${result.panini.length}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 mb-6 shadow-sm space-y-4">
      {/* RIGA 1: PULSANTI DOWNLOAD & AZIONI PRINCIPALI */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={onDownloadCsv}
            disabled={result.matched.length === 0}
            className="inline-flex items-center px-4 py-2.5 rounded-xl font-semibold text-sm text-white bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-all"
          >
            <Download className="w-4 h-4 mr-2" />
            Scarica Sato_ordine_AGGIORNATO.csv
          </button>

          <button
            onClick={onDownloadTxt}
            disabled={result.unmatched.length === 0}
            className="inline-flex items-center px-3.5 py-2.5 rounded-xl font-medium text-sm text-slate-700 bg-slate-100 hover:bg-slate-200 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            title="Scarica il report degli albi venduti ma non presenti a catalogo Sato"
          >
            <FileText className="w-4 h-4 mr-2 text-slate-500" />
            Scarica albi_non_trovati.txt ({result.unmatched.length})
          </button>

          <button
            onClick={handleCopySummary}
            className="inline-flex items-center px-3 py-2 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                Copiato!
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 mr-1" />
                Copia Riepilogo
              </>
            )}
          </button>
        </div>

        {/* BULK ACTIONS (User Request #4) */}
        {activeTab === 'matched' && (
          <div className="flex items-center space-x-2 text-xs">
            <span className="text-slate-400 font-medium">Spunta rapida:</span>
            <button
              onClick={onSelectAll}
              className="inline-flex items-center px-2.5 py-1.5 rounded-lg font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors"
            >
              <CheckCheck className="w-3.5 h-3.5 mr-1" />
              Tutti (Ordina)
            </button>
            <button
              onClick={onDeselectAll}
              className="inline-flex items-center px-2.5 py-1.5 rounded-lg font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors"
            >
              <Square className="w-3.5 h-3.5 mr-1" />
              Escludi Tutti (QTA 0)
            </button>
          </div>
        )}
      </div>

      {/* RIGA 2: TABS & SEARCH BAR */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2 border-t border-slate-100">
        <div className="flex space-x-1 bg-slate-100 p-1 rounded-lg">
          <button
            onClick={() => onTabChange('matched')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              activeTab === 'matched'
                ? 'bg-white text-slate-900 shadow-sm font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Articoli da Ordinare ({result.matched.length})
          </button>
          <button
            onClick={() => onTabChange('unmatched')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              activeTab === 'unmatched'
                ? 'bg-white text-slate-900 shadow-sm font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Non a Catalogo / Esauriti ({result.unmatched.length})
          </button>
          <button
            onClick={() => onTabChange('panini')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              activeTab === 'panini'
                ? 'bg-white text-slate-900 shadow-sm font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Panini / Manga ({result.panini.length})
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cerca titolo, collana, codice..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          />
        </div>
      </div>
    </div>
  );
};
