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
import { parsePdfBatch } from './utils/pdfParser';
import { prepareSatoRows, abbinaArticoli, PreparedSatoRow } from './utils/matcher';
import { generaCsvAggiornato, downloadBlob } from './utils/csvExporter';
import { generaReportNonTrovatiTxt, generaCsvOrdineMail } from './utils/txtExporter';
import {
  loadPdfBatches,
  savePdfBatches,
  loadCsvData,
  saveCsvData,
  loadOverrides,
  saveOverrides,
  clearAllSessionStorage
} from './utils/storage';
import { MAPPA_PREDEFINITA } from './constants/defaultMap';
import { PdfBatch, SavedCsvData, SatoRow, ItemOverride, MatchResult } from './types';
import { Sparkles, AlertCircle, Info } from 'lucide-react';

const STORAGE_MAP_KEY = 'riordino_mappa_collane_v1';

export function App() {
  const [mappaCollane, setMappaCollane] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_MAP_KEY);
      if (saved) {
        return { ...MAPPA_PREDEFINITA, ...JSON.parse(saved) };
      }
    } catch {
      // Fallback
    }
    return { ...MAPPA_PREDEFINITA };
  });

  const [pdfBatches, setPdfBatches] = useState<PdfBatch[]>([]);
  const [csvData, setCsvData] = useState<SavedCsvData | null>(null);
  const [overrides, setOverrides] = useState<Record<string, ItemOverride>>({});
  const [isRestoring, setIsRestoring] = useState(true);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'matched' | 'unmatched' | 'panini'>('matched');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Ripristina automaticamente la sessione settimanale da IndexedDB all'avvio
  useEffect(() => {
    let mounted = true;
    async function restoreSession() {
      try {
        const [savedBatches, savedCsv, savedOverrides] = await Promise.all([
          loadPdfBatches(),
          loadCsvData(),
          loadOverrides()
        ]);
        if (!mounted) return;
        setPdfBatches(savedBatches);
        setCsvData(savedCsv);
        setOverrides(savedOverrides);
        if (savedBatches.length > 0 && !savedCsv) {
          setActiveTab('unmatched');
        }
      } catch (e) {
        console.warn('Errore ripristino sessione:', e);
      } finally {
        if (mounted) setIsRestoring(false);
      }
    }
    restoreSession();
    return () => {
      mounted = false;
    };
  }, []);

  // Concatena tutte le righe di tutti i PDF giornalieri caricati nella settimana
  const allPdfRows = useMemo(() => {
    return pdfBatches.flatMap(b => b.rows);
  }, [pdfBatches]);

  // Prepara righe Sato indicizzate
  const preparedSatoRows: PreparedSatoRow[] = useMemo(() => {
    return prepareSatoRows(csvData?.rows || []);
  }, [csvData]);

  // Calcola il risultato dell'abbinamento e delle somme
  const matchResult: MatchResult | null = useMemo(() => {
    if (allPdfRows.length === 0) return null;
    try {
      return abbinaArticoli(allPdfRows, preparedSatoRows, mappaCollane, overrides);
    } catch (err: any) {
      console.error('Errore calcolo abbinamenti:', err);
      return null;
    }
  }, [allPdfRows, preparedSatoRows, mappaCollane, overrides]);

  // Gestione aggiunta di uno o più PDF giornalieri
  const handlePdfFilesSelect = async (files: File[]) => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const addedBatches: PdfBatch[] = [];
      for (const file of files) {
        const parsed = await parsePdfBatch(file);
        if (parsed.rows.length === 0) {
          throw new Error(
            `Nessun dato di vendita trovato nel file "${file.name}". Verifica che sia il PDF delle vendite cassa Trend.`
          );
        }

        // Controllo anti-duplicati
        const alreadyExists = [...pdfBatches, ...addedBatches].some(
          b => b.fingerprint === parsed.fingerprint
        );
        if (alreadyExists) {
          const proceed = confirm(
            `Attenzione: il PDF "${file.name}" (${parsed.periodo || parsed.rows.length + ' righe'}) sembra identico a un PDF già caricato in questa settimana.\n\nVuoi aggiungerlo comunque e sommare di nuovo le quantità?`
          );
          if (!proceed) continue;
        }

        const now = new Date();
        const uploadedAt =
          now.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' }) +
          ' ' +
          now.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });

        addedBatches.push({
          id: `pdf_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          fileName: file.name,
          uploadedAt,
          periodo: parsed.periodo,
          pages: parsed.pages,
          rows: parsed.rows,
          fingerprint: parsed.fingerprint
        });
      }

      if (addedBatches.length > 0) {
        const nextBatches = [...pdfBatches, ...addedBatches];
        setPdfBatches(nextBatches);
        await savePdfBatches(nextBatches);
        if (!csvData) {
          setActiveTab('unmatched');
        }
      }
    } catch (err: any) {
      setErrorMsg('Errore nella lettura del PDF: ' + (err.message || String(err)));
    } finally {
      setIsLoading(false);
    }
  };

  // Rimozione di un singolo PDF giornaliero
  const handleRemovePdfBatch = async (batchId: string) => {
    const target = pdfBatches.find(b => b.id === batchId);
    if (!target) return;
    if (confirm(`Vuoi rimuovere "${target.fileName}" dal totale della settimana?`)) {
      const nextBatches = pdfBatches.filter(b => b.id !== batchId);
      setPdfBatches(nextBatches);
      await savePdfBatches(nextBatches);
    }
  };

  // Gestione caricamento CSV Sato
  const handleCsvSelect = async (file: File) => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const text = e.target?.result as string;
          Papa.parse<Record<string, string>>(text, {
            delimiter: ';',
            header: true,
            skipEmptyLines: 'greedy',
            complete: async (results) => {
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
                setErrorMsg('Il file CSV sembra vuoto o non formattato correttamente.');
                setIsLoading(false);
                return;
              }

              const now = new Date();
              const uploadedAt =
                now.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' }) +
                ' ' +
                now.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });

              const newCsvData: SavedCsvData = {
                fileName: file.name,
                fileSize: file.size,
                uploadedAt,
                headers: fields,
                rows: parsedRows
              };

              setCsvData(newCsvData);
              await saveCsvData(newCsvData);
              setActiveTab('matched');
              setIsLoading(false);
            }
          });
        } catch (err: any) {
          setErrorMsg('Errore parsing CSV Sato: ' + (err.message || String(err)));
          setIsLoading(false);
        }
      };

      reader.onerror = () => {
        setErrorMsg('Impossibile leggere il file CSV.');
        setIsLoading(false);
      };

      reader.readAsText(file, 'windows-1252');
    } catch (err: any) {
      setErrorMsg('Errore apertura CSV: ' + (err.message || String(err)));
      setIsLoading(false);
    }
  };

  // Rimozione CSV Sato
  const handleClearCsv = async () => {
    if (confirm('Vuoi rimuovere il file Sato.csv caricato? (I PDF giornalieri resteranno in memoria)')) {
      setCsvData(null);
      await saveCsvData(null);
      setActiveTab('unmatched');
    }
  };

  // Azzeramento completo di fine settimana
  const handleReset = async () => {
    if (
      confirm(
        'Vuoi azzerare tutta la settimana e rimuovere dalla memoria tutti i PDF caricati, il CSV e le spunte?'
      )
    ) {
      setPdfBatches([]);
      setCsvData(null);
      setOverrides({});
      setSearchQuery('');
      setErrorMsg(null);
      await clearAllSessionStorage();
    }
  };

  // Toggle inclusione/esclusione singolo articolo (sia per Catalogo CSV che per Ordine Mail)
  const handleToggleExclude = async (id: string) => {
    if (!matchResult) return;
    const targetItem =
      matchResult.matched.find(m => m.id === id) ||
      matchResult.unmatched.find(u => u.id === id);
    if (!targetItem) return;

    const nextOverrides: Record<string, ItemOverride> = {
      ...overrides,
      [id]: {
        ...overrides[id],
        escluso: !targetItem.escluso
      }
    };
    setOverrides(nextOverrides);
    await saveOverrides(nextOverrides);
  };

  // Modifica quantità da ordinare (sia per Catalogo CSV che per Ordine Mail)
  const handleUpdateQuantity = async (id: string, newQta: number) => {
    if (!matchResult) return;
    const targetItem =
      matchResult.matched.find(m => m.id === id) ||
      matchResult.unmatched.find(u => u.id === id);
    if (!targetItem) return;

    const cleanQta = Math.max(0, newQta);
    const qtaDelta = cleanQta - targetItem.qtaVenduta;

    const nextOverrides: Record<string, ItemOverride> = {
      ...overrides,
      [id]: {
        ...overrides[id],
        qtaDelta
      }
    };
    setOverrides(nextOverrides);
    await saveOverrides(nextOverrides);
  };

  // Esclusione o inclusione di un gruppo di ID (es. per singola collana)
  const handleBulkExclude = async (ids: string[], escluso: boolean) => {
    const nextOverrides: Record<string, ItemOverride> = { ...overrides };
    for (const id of ids) {
      nextOverrides[id] = {
        ...nextOverrides[id],
        escluso
      };
    }
    setOverrides(nextOverrides);
    await saveOverrides(nextOverrides);
  };

  // Includi tutti nella tab attiva
  const handleSelectAll = () => {
    if (!matchResult) return;
    if (activeTab === 'matched') {
      handleBulkExclude(
        matchResult.matched.map(m => m.id),
        false
      );
    } else if (activeTab === 'unmatched') {
      handleBulkExclude(
        matchResult.unmatched.map(u => u.id),
        false
      );
    }
  };

  // Escludi tutti nella tab attiva (QTA = 0)
  const handleDeselectAll = () => {
    if (!matchResult) return;
    if (activeTab === 'matched') {
      handleBulkExclude(
        matchResult.matched.map(m => m.id),
        true
      );
    } else if (activeTab === 'unmatched') {
      handleBulkExclude(
        matchResult.unmatched.map(u => u.id),
        true
      );
    }
  };

  // Download CSV aggiornato Sato
  const handleDownloadCsv = () => {
    if (!matchResult || !csvData || csvData.rows.length === 0) return;
    try {
      const bytes = generaCsvAggiornato(csvData.rows, csvData.headers, matchResult.matched);
      downloadBlob(bytes, 'Sato_ordine_AGGIORNATO.csv', 'text/csv;charset=windows-1252');
    } catch (err: any) {
      alert('Errore generazione CSV: ' + err.message);
    }
  };

  // Download Allegato Mail TXT (con codici DD01, TE01, ecc. e quantità scelte)
  const handleDownloadTxt = () => {
    if (!matchResult) return;
    try {
      const txt = generaReportNonTrovatiTxt(matchResult.unmatched);
      downloadBlob(txt, 'Ordine_Mail_Codici.txt', 'text/plain;charset=utf-8');
    } catch (err: any) {
      alert('Errore generazione allegato TXT: ' + err.message);
    }
  };

  // Download Allegato Mail CSV (Excel)
  const handleDownloadMailCsv = () => {
    if (!matchResult) return;
    try {
      const bytes = generaCsvOrdineMail(matchResult.unmatched);
      downloadBlob(bytes, 'Ordine_Mail_Codici.csv', 'text/csv;charset=windows-1252');
    } catch (err: any) {
      alert('Errore generazione allegato CSV: ' + err.message);
    }
  };

  // Esporta Backup Settimanale su file .json
  const handleExportBackup = () => {
    const backupObj = {
      version: 1,
      exportedAt: new Date().toISOString(),
      pdfBatches,
      csvData,
      overrides,
      mappaCollane
    };
    const jsonStr = JSON.stringify(backupObj);
    const dateTag = new Date().toISOString().slice(0, 10);
    downloadBlob(jsonStr, `Backup_Riordino_${dateTag}.json`, 'application/json;charset=utf-8');
  };

  // Importa Backup Settimanale da file .json
  const handleImportBackup = (file: File) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const parsed = JSON.parse(e.target?.result as string);
        if (!parsed || !Array.isArray(parsed.pdfBatches)) {
          throw new Error('File di backup non valido.');
        }
        setPdfBatches(parsed.pdfBatches || []);
        setCsvData(parsed.csvData || null);
        setOverrides(parsed.overrides || {});
        if (parsed.mappaCollane) {
          setMappaCollane({ ...MAPPA_PREDEFINITA, ...parsed.mappaCollane });
          localStorage.setItem(STORAGE_MAP_KEY, JSON.stringify(parsed.mappaCollane));
        }
        await Promise.all([
          savePdfBatches(parsed.pdfBatches || []),
          saveCsvData(parsed.csvData || null),
          saveOverrides(parsed.overrides || {})
        ]);
        alert('Backup settimanale ripristinato con successo!');
      } catch (err: any) {
        alert('Errore nel caricamento del backup: ' + (err.message || String(err)));
      }
    };
    reader.readAsText(file, 'utf-8');
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

  const hasData = pdfBatches.length > 0 || !!csvData;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 pb-16">
      <Header
        onReset={handleReset}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onExportBackup={handleExportBackup}
        onImportBackup={handleImportBackup}
        hasData={hasData}
        pdfCount={pdfBatches.length}
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

        {/* ZONA DRAG & DROP DEI FILE */}
        <Dropzone
          pdfBatches={pdfBatches}
          csvData={csvData}
          isLoading={isLoading || isRestoring}
          onPdfFilesSelect={handlePdfFilesSelect}
          onRemovePdfBatch={handleRemovePdfBatch}
          onCsvSelect={handleCsvSelect}
          onClearCsv={handleClearCsv}
        />

        {/* AVVISO SE CI SONO PDF CARICATI MA NON ANCORA IL CSV SATO */}
        {pdfBatches.length > 0 && !csvData && (
          <div className="mb-6 p-4 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs flex items-center space-x-3 shadow-sm">
            <Info className="w-5 h-5 text-blue-600 shrink-0" />
            <div>
              <span className="font-bold">Modalità Accumulo Giornaliero attiva: </span>
              I tuoi PDF sono salvati in memoria e trovi già tutti gli articoli codificati (es.{' '}
              <span className="font-mono font-bold">DD01</span>, <span className="font-mono font-bold">TE01</span>) qui sotto. Quando caricherai anche il file{' '}
              <span className="font-mono font-bold">Sato.csv</span>, il programma separerà automaticamente gli articoli a catalogo CSV da quelli da ordinare via Mail!
            </div>
          </div>
        )}

        {/* GUIDA RAPIDA SE NESSUN FILE E' CARICATO */}
        {!isRestoring && pdfBatches.length === 0 && !csvData && (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-8 shadow-sm text-center max-w-2xl mx-auto my-8">
            <div className="w-12 h-12 bg-amber-100 text-amber-700 rounded-2xl mx-auto flex items-center justify-center mb-4">
              <Sparkles className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Riordino Giorno per Giorno & Weekend</h2>
            <p className="text-sm text-slate-600 mt-2 leading-relaxed">
              Carica ogni giorno il PDF delle vendite: il sito lo tiene in memoria anche se spegni il PC e somma le copie per generare l'ordine completo nel weekend.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 text-left">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                <span className="font-bold text-slate-800 text-xs block mb-1">1. Accumula i PDF</span>
                <p className="text-xs text-slate-500">
                  Trascina i PDF giornalieri di Trend. Si sommano in automatico e restano salvati nel browser.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                <span className="font-bold text-slate-800 text-xs block mb-1">2. Spunta e Modifica</span>
                <p className="text-xs text-slate-500">
                  Scegli cosa ordinare e regola le quantità sia per il catalogo CSV sia per l'ordine via Mail.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                <span className="font-bold text-slate-800 text-xs block mb-1">3. CSV + Allegato Mail</span>
                <p className="text-xs text-slate-500">
                  Scarica <span className="font-mono font-semibold">Sato.csv</span> e l'allegato Mail con i codici <span className="font-mono font-semibold">DD01, TE01...</span>
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
              onDownloadMailCsv={handleDownloadMailCsv}
              onSelectAll={handleSelectAll}
              onDeselectAll={handleDeselectAll}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              activeTab={activeTab}
              onTabChange={setActiveTab}
              result={matchResult}
            />

            {/* TABELLA 1: ARTICOLI A CATALOGO SATO CSV */}
            {activeTab === 'matched' && (
              <OrdersTable
                items={matchResult.matched}
                onToggleExclude={handleToggleExclude}
                onUpdateQuantity={handleUpdateQuantity}
                onBulkExclude={handleBulkExclude}
                searchQuery={searchQuery}
              />
            )}

            {/* TABELLA 2: ORDINE MAIL CON CODICI (NON A CATALOGO CSV) */}
            {activeTab === 'unmatched' && (
              <UnmatchedTable
                items={matchResult.unmatched}
                onToggleExclude={handleToggleExclude}
                onUpdateQuantity={handleUpdateQuantity}
                onBulkExclude={handleBulkExclude}
                searchQuery={searchQuery}
              />
            )}

            {/* TABELLA 3: PANINI / MANGA */}
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
