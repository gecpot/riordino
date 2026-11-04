import React from 'react';
import { BookOpen, RefreshCw, Settings, Sparkles } from 'lucide-react';

interface HeaderProps {
  onReset: () => void;
  onOpenSettings: () => void;
  hasData: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onReset, onOpenSettings, hasData }) => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-red-600 flex items-center justify-center text-white shadow-md shadow-amber-500/20">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">Riordino Fumetti</h1>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                <Sparkles className="w-3 h-3 mr-1" /> Sato & Bonelli
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Generatore automatico ordine Sato da report vendite cassa Trend (PDF)
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {hasData && (
            <button
              onClick={onReset}
              className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium text-slate-700 hover:text-red-700 hover:bg-red-50 border border-slate-200 hover:border-red-200 transition-colors"
              title="Azzera e ripulisci tutti i dati caricati"
            >
              <RefreshCw className="w-4 h-4 mr-1.5" />
              Azzera Vista
            </button>
          )}

          <button
            onClick={onOpenSettings}
            className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition-colors"
            title="Configura prefissi collane (TEX -> TE01, ecc.)"
          >
            <Settings className="w-4 h-4 mr-1.5" />
            Mappa Collane
          </button>
        </div>
      </div>
    </header>
  );
};
