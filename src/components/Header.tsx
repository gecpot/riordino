import React, { useRef } from 'react';
import { BookOpen, RefreshCw, Settings, Sparkles, HardDriveDownload, HardDriveUpload, ShieldCheck } from 'lucide-react';

interface HeaderProps {
  onReset: () => void;
  onOpenSettings: () => void;
  onExportBackup: () => void;
  onImportBackup: (file: File) => void;
  hasData: boolean;
  pdfCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  onReset,
  onOpenSettings,
  onExportBackup,
  onImportBackup,
  hasData,
  pdfCount
}) => {
  const backupInputRef = useRef<HTMLInputElement>(null);

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-red-600 flex items-center justify-center text-white shadow-md shadow-amber-500/20">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">Riordino Fumetti</h1>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                <Sparkles className="w-3 h-3 mr-1" /> Sato & Bonelli
              </span>
              {hasData && (
                <span
                  className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800"
                  title="Tutti i PDF caricati, le somme e le spunte sono salvati automaticamente nella memoria di questo PC"
                >
                  <ShieldCheck className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                  Salvataggio Auto Attivo ({pdfCount} PDF)
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500">
              Accumulo giornaliero vendite PDF Trend + generazione ordine CSV Sato e Ordine Mail
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={backupInputRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                onImportBackup(e.target.files[0]);
                e.target.value = '';
              }
            }}
          />

          {hasData && (
            <button
              onClick={onExportBackup}
              className="inline-flex items-center px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition-colors"
              title="Scarica un file di backup della settimana sul PC"
            >
              <HardDriveDownload className="w-3.5 h-3.5 mr-1.5 text-slate-600" />
              Salva Backup
            </button>
          )}

          <button
            onClick={() => backupInputRef.current?.click()}
            className="inline-flex items-center px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition-colors"
            title="Ripristina un file di backup salvato in precedenza"
          >
            <HardDriveUpload className="w-3.5 h-3.5 mr-1.5 text-slate-600" />
            Carica Backup
          </button>

          {hasData && (
            <button
              onClick={onReset}
              className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold text-red-700 hover:text-white bg-red-50 hover:bg-red-600 border border-red-200 transition-colors"
              title="Svuota la memoria della settimana e riparti da zero"
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
