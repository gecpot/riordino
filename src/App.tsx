import React, { useState, useEffect, useMemo } from 'react';
import Papa from 'papaparse';
import { Header } from './components/Header';
import { Dropzone } from './components/Dropzone';
import { StatsCards } from './components/StatsCards';
import { ExportBar } from './components/ExportBar';
import { OrdersTable } from './components/OrdersTable';
import { UnmatchedTable } from './components/UnmatchedTable';
import { PaniniTable } from './components/PaniniTable';
import { MapConfigModal } from './components/MapConfigModal';
import { parsePdfVenduto } from './utils/pdfParser';
import { prepareSatoRows, abbinaArticoli, PreparedSatoRow } from './utils/matcher';
import { generaCsvAggiornato, downloadBlob } from './utils/csvExporter';
import { generaReportNonTrovatiTxt } from './utils/txtExporter';
import { MAPPA_PREDEFINITA } from './constants/defaultMap';
import { PdfRow, SatoRow, MatchedItem, MatchResult } from './types';
import { Sparkles, AlertCircle, CheckCircle, HelpCircle } from 'lucide-react';

const STORAGE_MAP_KEY = 'riordino_mappa_collane_v1';

export function App() {
  const [mappaCollane, setMappaCollane] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_MAP_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // Fallback
    }
    return { ...MAPPA_PREDEFINITA };
  });

  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [pdfRows, setPdfRows] = useState<PdfRow[]>([]);
  const [rawCsvRows, setRawCsvRows] = useState<SatoRow[]>([]);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [matchResult, setMatchResult] = useState<MatchResult | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'matched' | 'unmatched' | 'panini'>('matched');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Prepara righe Sato indicizzate
  const preparedSatoRows: PreparedSatoRow[] = useMemo(() => {
    return prepareSatoRows(rawCsvRows);
  }, [rawCsvRows]);

  // Esegue l'abbinamento quando abbiamo sia PDF che CSV o quando cambia la mappa
  useEffect(() => {
    if (pdfRows.length > 0 && preparedSatoRows.length > 0) {
      try {
        const result = abbinaArticoli(pdfRows, preparedSatoRows, mappaCollane);
        setMatchResult(result);
      } catch (err: any) {
        setErrorMsg('Errore durante l\'abbinamento dei dati: ' + (err.message || String(err)));
      }
    } else {
      setMatchResult(null);
    }
  }, [pdfRows, preparedSatoRows, mappaCollane]);

  // Gestione caricamento PDF
  const handlePdfSelect = async (file: File) => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      setPdfFile(file);
      const rows = await parsePdfVenduto(file);
      if (rows.length === 0) {
        throw new Error('Nessun dato di vendita trovato nel PDF. Verifica che sia il file vendite di cassa Trend.');
      }
      setPdfRows(rows);
    } catch (err: any) {
      setErrorMsg('Errore nella lettura del PDF: ' + (err.message || String(err)));
      setPdfFile(null);
      setPdfRows([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Gestione caricamento CSV Sato
  const handleCsvSelect = async (file: File) => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      setCsvFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          Papa.parse<Record<string, string>>(text, {
            delimiter: ';',
            header: true,
            skipEmptyLines: 'greedy',
            complete: (results) => {
              if (results.errors && results.errors.length > 0) {
                console.warn('Avvisi lettura CSV:', results.errors);
              }

              const fields = results.meta.fields || [];
              const parsedRows: SatoRow[] = results.data.map((row, idx) => ({
                rowIndex: idx,
                barcode: String(row['BARCODE'] || '').trim(),
                uscita: String(row['USCITA'] || '').trim(),
                articolo: String(row['ARTICOLO'] || '').trim(),
                modello: String(row['MODELLO'] || '').trim(),
                colore: String(row['COLORE'] || '').trim(),
                taglia: String(row['TAGLIA'] || '').trim(),
                prezzo: String(row['PREZZO'] || '').trim(),
                qta: String(row['QTA'] || '0').trim(),
                rawRecord: row
              }));

              if (parsedRows.length === 0) {
                throw new Error('Il file CSV sembra vuoto o non formattato correttamente.');
              }

              setCsvHeaders(fields);
              setRawCsvRows(parsedRows);
              setIsLoading(false);
            }
          });
        } catch (err: any) {
          setErrorMsg('Errore parsing CSV Sato: ' + (err.message || String(err)));
          setCsvFile(null);
          setRawCsvRows([]);
          setIsLoading(false);
        }
      };

      reader.onerror = () => {
        setErrorMsg('Impossibile leggere il file CSV.');
        setCsvFile(null);
        setRawCsvRows([]);
        setIsLoading(false);
      };

      // Legge con codifica Windows-1252 per garantire corretta lettura caratteri italiani
      reader.readAsText(file, 'windows-1252');
    } catch (err: any) {
      setErrorMsg('Errore apertura CSV: ' + (err.message || String(err)));
      setCsvFile(null);
      setRawCsvRows([]);
      setIsLoading(false);
    }
  };

  // Azzeramento completo / Pulisci Schermo (User Request #6)
  const handleReset = () => {
    if (confirm('Vuoi azzerare la vista e rimuovere tutti i file caricati?')) {
      setPdfFile(null);
      setCsvFile(null);
      setPdfRows([]);
      setRawCsvRows([]);
      setCsvHeaders([]);
      setMatchResult(null);
      setSearchQuery('');
      setErrorMsg(null);
    }
  };

  // Toggle inclusione/esclusione singolo articolo (User Request #4)
  const handleToggleExclude = (id: string) => {
    if (!matchResult) return;
    const updatedMatched = matchResult.matched.map(item => {
      if (item.id === id) {
        return { ...item, escluso: !item.escluso };
      }
      return item;
    });

    const newTotalDaOrdinare = updatedMatched
      .filter(m => !m.escluso)
      .reduce((acc, m) => acc + m.qtaOrdine, 0);

    setMatchResult({
      ...matchResult,
      matched: updatedMatched,
      totalDaOrdinare: newTotalDaOrdinare
    });
  };

  // Modifica quantita da ordinare
  const handleUpdateQuantity = (id: string, newQta: number) => {
    if (!matchResult) return;
    const updatedMatched = matchResult.matched.map(item => {
      if (item.id === id) {
        return { ...item, qtaOrdine: newQta };
      }
      return item;
    });

    const newTotalDaOrdinare = updatedMatched
      .filter(m => !m.escluso)
      .reduce((acc, m) => acc + m.qtaOrdine, 0);

    setMatchResult({
      ...matchResult,
      matched: updatedMatched,
      totalDaOrdinare: newTotalDaOrdinare
    });
  };

  // Includi tutti
  const handleSelectAll = () => {
    if (!matchResult) return;
    const updatedMatched = matchResult.matched.map(m => ({ ...m, escluso: false }));
    const newTotal = updatedMatched.reduce((acc, m) => acc + m.qtaOrdine, 0);
    setMatchResult({ ...matchResult, matched: updatedMatched, totalDaOrdinare: newTotal });
  };

  // Esclusione o inclusione di un gruppo di ID (es. per collana)
  const handleBulkExclude = (ids: string[], escluso: boolean) => {
    if (!matchResult) return;
    const idSet = new Set(ids);
    const updatedMatched = matchResult.matched.map(item => {
      if (idSet.has(item.id)) {
        return { ...item, escluso };
      }
      return item;
    });

    const newTotalDaOrdinare = updatedMatched
      .filter(m => !m.escluso)
      .reduce((acc, m) => acc + m.qtaOrdine, 0);

    setMatchResult({
      ...matchResult,
      matched: updatedMatched,
      totalDaOrdinare: newTotalDaOrdinare
    });
  };

  // Escludi tutti (QTA = 0)
  const handleDeselectAll = () => {
    if (!matchResult) return;
    const updatedMatched = matchResult.matched.map(m => ({ ...m, escluso: true }));
    setMatchResult({ ...matchResult, matched: updatedMatched, totalDaOrdinare: 0 });
  };

  // Download CSV aggiornato Sato
  const handleDownloadCsv = () => {
    if (!matchResult || rawCsvRows.length === 0) return;
    try {
      const bytes = generaCsvAggiornato(rawCsvRows, csvHeaders, matchResult.matched);
      downloadBlob(bytes, 'Sato_ordine_AGGIORNATO.csv', 'text/csv;charset=windows-1252');
    } catch (err: any) {
      alert('Errore generazione CSV: ' + err.message);
    }
  };

  // Download Report Non Trovati TXT
  const handleDownloadTxt = () => {
    if (!matchResult) return;
    try {
      const txt = generaReportNonTrovatiTxt(matchResult.unmatched);
      downloadBlob(txt, 'albi_non_trovati.txt', 'text/plain;charset=utf-8');
    } catch (err: any) {
      alert('Errore generazione report TXT: ' + err.message);
    }
  };

  // Salvataggio mappa collane personalizzata
  const handleSaveMap = (newMap: Record<string, string>) => {
    setMappaCollane(newMap);
    try {
      localStorage.setItem(STORAGE_MAP_KEY, JSON.stringify(newMap));
    } catch (e) {
      console.warn('Errore salvataggio localStorage', e);
    }
  };

  const hasData = !!pdfFile || !!csvFile;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 pb-16">
      <Header
        onReset={handleReset}
        onOpenSettings={() => setIsSettingsOpen(true)}
        hasData={hasData}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex-1 w-full">
        {/* MESSAGGIO ERRORE */}
        {errorMsg && (
          <div className="my-4 p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
            <button
              onClick={() => setErrorMsg(null)}
              className="text-xs font-semibold underline hover:text-red-900"
            >
              Chiudi
            </button>
          </div>
        )}

        {/* ZONA DRAG & DROP DEI 2 FILE */}
        <Dropzone
          pdfFile={pdfFile}
          csvFile={csvFile}
          pdfInfo={pdfRows.length > 0 ? { rowCount: pdfRows.length, pages: Math.max(...pdfRows.map(r => r.page), 1) } : null}
          csvInfo={rawCsvRows.length > 0 ? { rowCount: rawCsvRows.length } : null}
          isLoading={isLoading}
          onPdfSelect={handlePdfSelect}
          onCsvSelect={handleCsvSelect}
          onClearPdf={() => { setPdfFile(null); setPdfRows([]); }}
          onClearCsv={() => { setCsvFile(null); setRawCsvRows([]); setCsvHeaders([]); }}
        />

        {/* GUIDA RAPIDA SE NESSUN FILE E' CARICATO */}
        {!pdfFile && !csvFile && (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-8 shadow-sm text-center max-w-2xl mx-auto my-8">
            <div className="w-12 h-12 bg-amber-100 text-amber-700 rounded-2xl mx-auto flex items-center justify-center mb-4">
              <Sparkles className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Come Funziona il Riordino Web</h2>
            <p className="text-sm text-slate-600 mt-2 leading-relaxed">
              Puoi usare questa web app su qualsiasi PC, tablet o telefono. Non richiede installazione ed elabora tutto istantaneamente nel tuo browser.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 text-left">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                <span className="font-bold text-slate-800 text-xs block mb-1">1. Trascina i file</span>
                <p className="text-xs text-slate-500">
                  Rilascia il PDF delle vendite Trend e il file Sato.csv nei riquadri sopra.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                <span className="font-bold text-slate-800 text-xs block mb-1">2. Spunta ed escludi</span>
                <p className="text-xs text-slate-500">
                  Togli la spunta ai titoli che hai già in abbondanza o modifica le quantità.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                <span className="font-bold text-slate-800 text-xs block mb-1">3. Scarica l'ordine</span>
                <p className="text-xs text-slate-500">
                  Scarica subito <span className="font-mono font-semibold">Sato_ordine_AGGIORNATO.csv</span> pronto per l'invio.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* RISULTATI & TABELLE */}
        {matchResult && (
          <div className="animate-in fade-in duration-300">
            {/* SCHEDE STATISTICHE */}
            <StatsCards
              result={matchResult}
              activeTab={activeTab}
              onTabChange={setActiveTab}
            />

            {/* BARRA AZIONI, DOWNLOAD E RICERCA */}
            <ExportBar
              onDownloadCsv={handleDownloadCsv}
              onDownloadTxt={handleDownloadTxt}
              onSelectAll={handleSelectAll}
              onDeselectAll={handleDeselectAll}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              activeTab={activeTab}
              onTabChange={setActiveTab}
              result={matchResult}
            />

            {/* TABELLA ATTIVA */}
            {activeTab === 'matched' && (
              <OrdersTable
                items={matchResult.matched}
                onToggleExclude={handleToggleExclude}
                onUpdateQuantity={handleUpdateQuantity}
                onBulkExclude={handleBulkExclude}
                searchQuery={searchQuery}
              />
            )}

            {activeTab === 'unmatched' && (
              <UnmatchedTable
                items={matchResult.unmatched}
                searchQuery={searchQuery}
              />
            )}

            {activeTab === 'panini' && (
              <PaniniTable
                items={matchResult.panini}
                searchQuery={searchQuery}
              />
            )}
          </div>
        )}
      </main>

      {/* MODAL CONFIGURAZIONE MAPPA COLLANE */}
      <MapConfigModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        mapData={mappaCollane}
        onSaveMap={handleSaveMap}
      />
    </div>
  );
}

export default App;
