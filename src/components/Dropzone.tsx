import React, { useRef, useState } from 'react';
import { FileUp, FileText, FileSpreadsheet, CheckCircle2, X, AlertCircle } from 'lucide-react';

interface DropzoneProps {
  pdfFile: File | null;
  csvFile: File | null;
  pdfInfo: { rowCount: number; pages: number } | null;
  csvInfo: { rowCount: number } | null;
  isLoading: boolean;
  onPdfSelect: (file: File) => void;
  onCsvSelect: (file: File) => void;
  onClearPdf: () => void;
  onClearCsv: () => void;
}

export const Dropzone: React.FC<DropzoneProps> = ({
  pdfFile,
  csvFile,
  pdfInfo,
  csvInfo,
  isLoading,
  onPdfSelect,
  onCsvSelect,
  onClearPdf,
  onClearCsv
}) => {
  const [isPdfDragOver, setIsPdfDragOver] = useState(false);
  const [isCsvDragOver, setIsCsvDragOver] = useState(false);

  const pdfInputRef = useRef<HTMLInputElement>(null);
  const csvInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const handlePdfDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsPdfDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.name.toLowerCase().endsWith('.pdf')) {
        onPdfSelect(file);
      } else {
        alert('Seleziona un file con estensione .pdf (es. vendneg.pdf)');
      }
    }
  };

  const handleCsvDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsCsvDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.name.toLowerCase().endsWith('.csv') || file.name.toLowerCase().endsWith('.txt')) {
        onCsvSelect(file);
      } else {
        alert('Seleziona un file CSV (es. Sato.csv)');
      }
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-6">
      {/* 1. SCHEDA PDF VENDITE */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsPdfDragOver(true); }}
        onDragLeave={() => setIsPdfDragOver(false)}
        onDrop={handlePdfDrop}
        onClick={() => !pdfFile && pdfInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl p-6 transition-all duration-200 cursor-pointer ${
          pdfFile
            ? 'border-emerald-400 bg-emerald-50/40 shadow-sm cursor-default'
            : isPdfDragOver
            ? 'border-red-500 bg-red-50 scale-[1.01] shadow-md'
            : 'border-slate-300 bg-white hover:border-slate-400 hover:bg-slate-50/60 shadow-sm'
        }`}
      >
        <input
          ref={pdfInputRef}
          type="file"
          accept=".pdf"
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              onPdfSelect(e.target.files[0]);
            }
          }}
        />

        {pdfFile ? (
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3.5">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-semibold text-slate-900 truncate max-w-[200px] sm:max-w-xs">
                    {pdfFile.name}
                  </span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                </div>
                <div className="text-xs text-slate-500 mt-0.5 space-x-2">
                  <span>{formatFileSize(pdfFile.size)}</span>
                  {pdfInfo && (
                    <>
                      <span>•</span>
                      <span className="text-emerald-700 font-medium">
                        {pdfInfo.rowCount} articoli estratti ({pdfInfo.pages} pag.)
                      </span>
                    </>
                  )}
                </div>
                <p className="text-xs text-emerald-800 bg-emerald-100/70 inline-block px-2 py-0.5 rounded mt-2">
                  PDF Vendite Trend caricato
                </p>
              </div>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClearPdf();
              }}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-white transition-colors"
              title="Rimuovi file PDF"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <div className="text-center py-4">
            <div className="w-12 h-12 mx-auto rounded-xl bg-red-100 text-red-600 flex items-center justify-center mb-3">
              <FileUp className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-slate-900">
              1. Trascina qui il file <span className="text-red-600 font-mono">vendneg.pdf</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Il PDF generato dal registratore di cassa Trend con le vendite della settimana. Oppure clicca per sfogliare.
            </p>
            <div className="mt-3 inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
              Formato: .pdf
            </div>
          </div>
        )}
      </div>

      {/* 2. SCHEDA CSV SATO */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsCsvDragOver(true); }}
        onDragLeave={() => setIsCsvDragOver(false)}
        onDrop={handleCsvDrop}
        onClick={() => !csvFile && csvInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl p-6 transition-all duration-200 cursor-pointer ${
          csvFile
            ? 'border-emerald-400 bg-emerald-50/40 shadow-sm cursor-default'
            : isCsvDragOver
            ? 'border-emerald-500 bg-emerald-50 scale-[1.01] shadow-md'
            : 'border-slate-300 bg-white hover:border-slate-400 hover:bg-slate-50/60 shadow-sm'
        }`}
      >
        <input
          ref={csvInputRef}
          type="file"
          accept=".csv,.txt"
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              onCsvSelect(e.target.files[0]);
            }
          }}
        />

        {csvFile ? (
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3.5">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-semibold text-slate-900 truncate max-w-[200px] sm:max-w-xs">
                    {csvFile.name}
                  </span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                </div>
                <div className="text-xs text-slate-500 mt-0.5 space-x-2">
                  <span>{formatFileSize(csvFile.size)}</span>
                  {csvInfo && (
                    <>
                      <span>•</span>
                      <span className="text-emerald-700 font-medium">
                        {csvInfo.rowCount} articoli a catalogo
                      </span>
                    </>
                  )}
                </div>
                <p className="text-xs text-emerald-800 bg-emerald-100/70 inline-block px-2 py-0.5 rounded mt-2">
                  Catalogo Sato caricato
                </p>
              </div>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClearCsv();
              }}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-white transition-colors"
              title="Rimuovi file CSV"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <div className="text-center py-4">
            <div className="w-12 h-12 mx-auto rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-3">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-slate-900">
              2. Trascina qui il file <span className="text-emerald-600 font-mono">Sato.csv</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Il listino d'ordine Bonelli fornito da Sato per compilare le quantità da riordinare. Oppure clicca per sfogliare.
            </p>
            <div className="mt-3 inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
              Formato: .csv (separatore punto e virgola)
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
