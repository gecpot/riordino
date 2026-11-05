import React, { useRef, useState } from 'react';
import { FileUp, FileText, FileSpreadsheet, CheckCircle2, X, Trash2, Plus, Calendar } from 'lucide-react';
import { PdfBatch, SavedCsvData } from '../types';

interface DropzoneProps {
  pdfBatches: PdfBatch[];
  csvData: SavedCsvData | null;
  isLoading: boolean;
  onPdfFilesSelect: (files: File[]) => void;
  onRemovePdfBatch: (batchId: string) => void;
  onCsvSelect: (file: File) => void;
  onClearCsv: () => void;
}

export const Dropzone: React.FC<DropzoneProps> = ({
  pdfBatches,
  csvData,
  isLoading,
  onPdfFilesSelect,
  onRemovePdfBatch,
  onCsvSelect,
  onClearCsv
}) => {
  const [isPdfDragOver, setIsPdfDragOver] = useState(false);
  const [isCsvDragOver, setIsCsvDragOver] = useState(false);

  const pdfInputRef = useRef<HTMLInputElement>(null);
  const csvInputRef = useRef<HTMLInputElement>(null);

  const handlePdfDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsPdfDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const validFiles = Array.from(e.dataTransfer.files).filter(f =>
        f.name.toLowerCase().endsWith('.pdf')
      );
      if (validFiles.length > 0) {
        onPdfFilesSelect(validFiles);
      } else {
        alert('Seleziona uno o più file con estensione .pdf (es. vendneg.pdf)');
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

  const totalRighePdf = pdfBatches.reduce((acc, b) => acc + b.rows.length, 0);
  const totalCopiePdf = pdfBatches.reduce(
    (acc, b) => acc + b.rows.reduce((s, r) => s + r.venditeNette, 0),
    0
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-6">
      {/* 1. SCHEDA PDF VENDITE (MULTI-FILE GIORNO PER GIORNO) */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsPdfDragOver(true);
        }}
        onDragLeave={() => setIsPdfDragOver(false)}
        onDrop={handlePdfDrop}
        className={`relative border-2 border-dashed rounded-2xl p-5 transition-all duration-200 ${
          isPdfDragOver
            ? 'border-red-500 bg-red-50 scale-[1.01] shadow-md'
            : pdfBatches.length > 0
            ? 'border-emerald-400 bg-emerald-50/30 shadow-sm'
            : 'border-slate-300 bg-white hover:border-slate-400 hover:bg-slate-50/60 shadow-sm'
        }`}
      >
        <input
          ref={pdfInputRef}
          type="file"
          accept=".pdf"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              onPdfFilesSelect(Array.from(e.target.files));
              e.target.value = '';
            }
          }}
        />

        {pdfBatches.length > 0 ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center space-x-1.5">
                    <span className="font-bold text-slate-900 text-sm">
                      {pdfBatches.length} {pdfBatches.length === 1 ? 'PDF Caricato' : 'PDF Giornalieri Sommati'}
                    </span>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  </div>
                  <p className="text-xs text-emerald-700 font-medium">
                    Totale accumulato: {totalCopiePdf} copie vendute ({totalRighePdf} righe)
                  </p>
                </div>
              </div>

              <button
                onClick={() => pdfInputRef.current?.click()}
                className="inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-semibold bg-red-600 hover:bg-red-700 text-white shadow-sm transition-colors"
                title="Aggiungi e somma un nuovo PDF giornaliero"
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                Aggiungi PDF
              </button>
            </div>

            {/* ELENCO DEI PDF GIORNALIERI NELLA MEMORIA SETTIMANALE */}
            <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1 border-t border-emerald-200/60 pt-2.5">
              {pdfBatches.map((batch, idx) => {
                const copieBatch = batch.rows.reduce((s, r) => s + r.venditeNette, 0);
                return (
                  <div
                    key={batch.id}
                    className="flex items-center justify-between bg-white/90 px-3 py-1.5 rounded-lg border border-slate-200 text-xs"
                  >
                    <div className="min-w-0 flex-1 pr-2">
                      <div className="flex items-center space-x-1.5">
                        <span className="font-bold text-slate-700">#{idx + 1}</span>
                        <span className="font-semibold text-slate-900 truncate">{batch.fileName}</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-2 text-[11px] text-slate-500">
                        {batch.periodo && (
                          <span className="inline-flex items-center text-amber-700 font-medium">
                            <Calendar className="w-3 h-3 mr-0.5" />
                            {batch.periodo}
                          </span>
                        )}
                        <span>• {copieBatch} copie ({batch.rows.length} righe)</span>
                        <span>• Caricato: {batch.uploadedAt}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => onRemovePdfBatch(batch.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors shrink-0"
                      title="Rimuovi questo PDF dal totale della settimana"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>

            <div
              onClick={() => pdfInputRef.current?.click()}
              className="text-center py-1.5 rounded-lg border border-dashed border-emerald-300 bg-white/60 hover:bg-white text-[11px] text-slate-600 cursor-pointer transition-colors"
            >
              Trascina qui un altro PDF giornaliero per sommarlo alla settimana
            </div>
          </div>
        ) : (
          <div onClick={() => pdfInputRef.current?.click()} className="text-center py-4 cursor-pointer">
            <div className="w-12 h-12 mx-auto rounded-xl bg-red-100 text-red-600 flex items-center justify-center mb-3">
              <FileUp className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-slate-900">
              1. Trascina qui i PDF <span className="text-red-600 font-mono">vendneg.pdf</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Puoi trascinare il PDF ogni sera: resta in memoria e si somma giorno per giorno fino al weekend!
            </p>
            <div className="mt-3 inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
              Supporta caricamento multiplo e accumulo settimanale
            </div>
          </div>
        )}
      </div>

      {/* 2. SCHEDA CSV SATO */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsCsvDragOver(true);
        }}
        onDragLeave={() => setIsCsvDragOver(false)}
        onDrop={handleCsvDrop}
        onClick={() => !csvData && csvInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl p-5 transition-all duration-200 flex flex-col justify-center ${
          csvData
            ? 'border-emerald-400 bg-emerald-50/30 shadow-sm cursor-default'
            : isCsvDragOver
            ? 'border-emerald-500 bg-emerald-50 scale-[1.01] shadow-md cursor-pointer'
            : 'border-slate-300 bg-white hover:border-slate-400 hover:bg-slate-50/60 shadow-sm cursor-pointer'
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
              e.target.value = '';
            }
          }}
        />

        {csvData ? (
          <div className="space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3.5">
                <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <FileSpreadsheet className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-slate-900 truncate max-w-[200px] sm:max-w-xs">
                      {csvData.fileName}
                    </span>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5 space-x-2">
                    <span className="text-emerald-700 font-semibold">
                      {csvData.rows.length} articoli a catalogo Sato
                    </span>
                    <span>•</span>
                    <span>Caricato: {csvData.uploadedAt}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-2.5">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        csvInputRef.current?.click();
                      }}
                      className="text-xs font-semibold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 px-2.5 py-1 rounded-lg transition-colors"
                    >
                      Aggiorna / Sostituisci CSV
                    </button>
                  </div>
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
            <p className="text-[11px] text-slate-500 bg-white/70 px-3 py-1.5 rounded-lg border border-emerald-200/60">
              💡 Il catalogo Sato resta memorizzato. Se nel weekend ricevi il file nuovo, clicca su <strong>Aggiorna CSV</strong> (o trascinalo qui) senza perdere i PDF e le spunte della settimana!
            </p>
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
              Il listino d'ordine Bonelli fornito da Sato. Separa in automatico gli articoli a catalogo CSV da quelli da ordinare via Mail (con codice DD01, TE01, ecc.).
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
