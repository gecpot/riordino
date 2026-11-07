import React, { useState } from 'react';
import { Download, FileText, FileSpreadsheet, CheckCheck, Square, Search, Check, Mail } from 'lucide-react';
import { MatchResult, ActiveTab } from '../types';
import { generaTestoCorpoMail } from '../utils/txtExporter';

interface ExportBarProps {
  onDownloadCsv: () => void;
  onDownloadTxt: () => void;
  onDownloadMailCsv: () => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  result: MatchResult;
  blockedCount: number;
}

export const ExportBar: React.FC<ExportBarProps> = ({
  onDownloadCsv,
  onDownloadTxt,
  onDownloadMailCsv,
  onSelectAll,
  onDeselectAll,
  searchQuery,
  onSearchChange,
  activeTab,
  onTabChange,
  result,
  blockedCount
}) => {
  const [copiedMail, setCopiedMail] = useState(false);

  const activeMailItemsCount = result.unmatched.filter(u => !u.escluso && u.qtaOrdine > 0).length;

  const handleCopyMailText = () => {
    const text = generaTestoCorpoMail(result.unmatched);
    navigator.clipboard.writeText(text);
    setCopiedMail(true);
    setTimeout(() => setCopiedMail(false), 2500);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-3 mb-3 shadow-sm space-y-2.5">
      {/* RIGA 1: PULSANTI DOWNLOAD & AZIONI PRINCIPALI */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {/* 1. SCARICA CSV CATALOGO SATO */}
          <button
            onClick={onDownloadCsv}
            disabled={result.matched.length === 0}
            className="inline-flex items-center px-4 py-2.5 rounded-xl font-semibold text-xs sm:text-sm text-white bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-all"
            title="Scarica il file Sato.csv aggiornato con le quantità degli articoli a catalogo"
          >
            <Download className="w-4 h-4 mr-2" />
            Scarica Sato_ordine_AGGIORNATO.csv ({result.totalDaOrdinare} copie)
          </button>

          {/* 2. SCARICA ALLEGATO MAIL TXT (CON CODICI DD01, TE01, ECC.) */}
          <button
            onClick={onDownloadTxt}
            disabled={activeMailItemsCount === 0}
            className="inline-flex items-center px-3.5 py-2.5 rounded-xl font-semibold text-xs sm:text-sm text-amber-950 bg-amber-400/90 hover:bg-amber-400 active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed shadow-sm transition-all"
            title="Scarica il file TXT con i codici (DD01, TE01, ecc.) e le quantità scelte, pronto da allegare alla mail"
          >
            <FileText className="w-4 h-4 mr-1.5 text-amber-900" />
            Allegato Mail .TXT ({result.totalDaOrdinareMail} copie)
          </button>

          {/* 3. SCARICA ALLEGATO MAIL CSV (EXCEL) */}
          <button
            onClick={onDownloadMailCsv}
            disabled={activeMailItemsCount === 0}
            className="inline-flex items-center px-3 py-2.5 rounded-xl font-semibold text-xs text-amber-900 bg-amber-100 hover:bg-amber-200 border border-amber-300 active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            title="Scarica l'ordine fuori catalogo in formato Excel/CSV da allegare alla mail"
          >
            <FileSpreadsheet className="w-4 h-4 mr-1.5 text-amber-800" />
            Allegato Mail .CSV
          </button>

          {/* 4. COPIA TESTO PER CORPO MAIL */}
          <button
            onClick={handleCopyMailText}
            disabled={activeMailItemsCount === 0}
            className="inline-flex items-center px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 transition-colors"
            title="Copia negli appunti l'elenco con codici DD01/TE01 e quantità da incollare direttamente nel testo della mail"
          >
            {copiedMail ? (
              <>
                <Check className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
                Testo Mail Copiato!
              </>
            ) : (
              <>
                <Mail className="w-3.5 h-3.5 mr-1.5 text-slate-600" />
                Copia Testo per Mail
              </>
            )}
          </button>
        </div>

        {/* BULK ACTIONS PER LA TAB ATTIVA (SIA CATALOGO CHE ORDINE MAIL) */}
        {(activeTab === 'matched' || activeTab === 'unmatched') && (
          <div className="flex items-center space-x-2 text-xs">
            <span className="text-slate-400 font-medium">
              {activeTab === 'matched' ? 'Spunta CSV:' : 'Spunta Mail:'}
            </span>
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
        <div className="flex flex-wrap gap-1 bg-slate-100 p-1 rounded-lg">
          <button
            onClick={() => onTabChange('matched')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              activeTab === 'matched'
                ? 'bg-white text-emerald-800 shadow-sm font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            1. A Catalogo Sato CSV ({result.matched.length})
          </button>
          <button
            onClick={() => onTabChange('unmatched')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              activeTab === 'unmatched'
                ? 'bg-white text-amber-800 shadow-sm font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            2. Ordine Mail con Codici ({result.unmatched.length})
          </button>
          <button
            onClick={() => onTabChange('panini')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              activeTab === 'panini'
                ? 'bg-white text-purple-800 shadow-sm font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            3. Panini / Manga ({result.panini.length})
          </button>
          <button
            onClick={() => onTabChange('blocked')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              activeTab === 'blocked'
                ? 'bg-white text-rose-800 shadow-sm font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            4. Non Ordinabili ({blockedCount})
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cerca titolo, codice (es. DD01), collana..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          />
        </div>
      </div>
    </div>
  );
};
