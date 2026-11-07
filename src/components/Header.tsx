import React from 'react';
import { BookOpen, RefreshCw, Settings, Sparkles, ShieldCheck, Ban } from 'lucide-react';

interface HeaderProps {
  onReset: () => void;
  onOpenSettings: () => void;
  onOpenBlocked?: () => void;
  hasData: boolean;
  pdfCount: number;
  blockedCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  onReset,
  onOpenSettings,
  onOpenBlocked,
  hasData,
  pdfCount,
  blockedCount
}) => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-red-600 flex items-center justify-center text-white shadow-md shadow-amber-500/20">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-lg font-bold text-slate-900 tracking-tight">Riordino Fumetti</h1>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                <Sparkles className="w-3 h-3 mr-1" /> Sato & Bonelli
              </span>
              {hasData && (
                <span
                  className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800"
                  title="Tutti i PDF caricati, le somme e le spunte sono salvati automaticamente nella memoria di questo PC"
                >
                  <ShieldCheck className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                  Salvataggio Auto ({pdfCount} PDF)
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500">
              Accumulo giornaliero vendite PDF Trend + generazione ordine CSV Sato e Ordine Mail
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {blockedCount > 0 && onOpenBlocked && (
            <button
              onClick={onOpenBlocked}
              className="inline-flex items-center px-2.5 py-1.5 rounded-lg text-xs font-semibold text-rose-700 hover:text-rose-900 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors"
              title="Visualizza l'archivio permanente dei titoli Non Ordinabili / Esauriti"
            >
              <Ban className="w-3.5 h-3.5 mr-1 text-rose-600" />
              Non Ordinabili ({blockedCount})
            </button>
          )}

          {hasData && (
            <button
              onClick={onReset}
              className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold text-red-700 hover:text-white bg-red-50 hover:bg-red-600 border border-red-200 transition-colors"
              title="Svuota i PDF e il CSV della settimana conclusa (mantiene salvati i Non Ordinabili)"
            >
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
              Nuova Settimana / Azzera
            </button>
          )}

          <button
            onClick={onOpenSettings}
            className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition-colors"
            title="Configura prefissi collane (TEX -> TE01, DYLAN DOG -> DD01, ecc.)"
          >
            <Settings className="w-3.5 h-3.5 mr-1.5" />
            Mappa Collane
          </button>
        </div>
      </div>
    </header>
  );
};
