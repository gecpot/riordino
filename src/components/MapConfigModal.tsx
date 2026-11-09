import React, { useState, useEffect, useMemo } from 'react';
import { X, Plus, Trash2, RotateCcw, Search, Check } from 'lucide-react';
import { MAPPA_PREDEFINITA } from '../constants/defaultMap';
import { ricavaPrefissoBonelli } from '../utils/matcher';

interface MapConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  mapData: Record<string, string>;
  pdfCollane?: string[];
  onSaveMap: (newMap: Record<string, string>) => void;
}

export const MapConfigModal: React.FC<MapConfigModalProps> = ({
  isOpen,
  onClose,
  mapData,
  pdfCollane = [],
  onSaveMap
}) => {
  const [currentMap, setCurrentMap] = useState<Record<string, string>>({ ...mapData });
  const [search, setSearch] = useState('');
  const [newKey, setNewKey] = useState('');
  const [newVal, setNewVal] = useState('');
  const [justSavedKey, setJustSavedKey] = useState<string | null>(null);

  const pdfCollaneSet = useMemo(() => {
    return new Set(pdfCollane.map(c => c.trim().toUpperCase()).filter(Boolean));
  }, [pdfCollane]);

  // Allinea sempre la mappa quando si apre la finestra e include automaticamente tutte le collane presenti nei PDF caricati
  useEffect(() => {
    if (isOpen) {
      const merged: Record<string, string> = { ...mapData };
      for (const coll of pdfCollaneSet) {
        if (coll && coll !== 'PANINI' && !(coll in merged)) {
          merged[coll] = ricavaPrefissoBonelli(coll, mapData);
        }
      }
      setCurrentMap(merged);
    }
  }, [isOpen, mapData, pdfCollaneSet]);

  if (!isOpen) return null;

  const handleUpdateCode = (collanaKey: string, newCode: string) => {
    const cleanCode = newCode.toUpperCase().replace(/[^A-Z0-9 ]/g, '');
    const updated = { ...currentMap, [collanaKey]: cleanCode };
    setCurrentMap(updated);
    onSaveMap(updated);
    setJustSavedKey(collanaKey);
    setTimeout(() => {
      setJustSavedKey(prev => (prev === collanaKey ? null : prev));
    }, 1200);
  };

  const handleAdd = () => {
    const k = newKey.trim().toUpperCase();
    const v = newVal.trim().toUpperCase();
    if (!k || !v) return;
    const updated = { ...currentMap, [k]: v };
    setCurrentMap(updated);
    onSaveMap(updated);
    setNewKey('');
    setNewVal('');
    setSearch(k);
  };

  const handleDelete = (key: string) => {
    const copy = { ...currentMap };
    delete copy[key];
    setCurrentMap(copy);
    onSaveMap(copy);
  };

  const handleResetDefaults = () => {
    if (confirm('Vuoi ripristinare tutti i prefissi alle impostazioni predefinite?')) {
      const def = { ...MAPPA_PREDEFINITA };
      setCurrentMap(def);
      onSaveMap(def);
    }
  };

  const filteredEntries = Object.entries(currentMap)
    .filter(([k, v]) => {
      if (!search.trim()) return true;
      const q = search.trim().toLowerCase();
      return k.toLowerCase().includes(q) || (v || '').toLowerCase().includes(q);
    })
    .sort(([a], [b]) => {
      // Mette in cima le collane presenti nei PDF caricati della settimana
      const aInPdf = pdfCollaneSet.has(a) ? 0 : 1;
      const bInPdf = pdfCollaneSet.has(b) ? 0 : 1;
      if (aInPdf !== bInPdf) return aInPdf - bInPdf;
      return a.localeCompare(b);
    });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[88vh] flex flex-col overflow-hidden border border-slate-200">
        {/* HEADER */}
        <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Mappa Codici Collane</h2>
            <p className="text-xs text-slate-500">
              Scrivi per cercare una collana (es. <strong>tex</strong> o <strong>dylan</strong>) e modifica direttamente il codice a destra: si salva da solo!
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* BARRA DI RICERCA UNICA ED EVIDENTE */}
        <div className="p-3.5 bg-amber-50/70 border-b border-amber-200/80">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-amber-700" />
            <input
              type="text"
              autoFocus
              placeholder='Cerca collana o codice (es. scrivi "tex", "dylan", "40 anni", "dd50")...'
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-8 py-2 text-sm rounded-xl border border-amber-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-sm"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* LISTA COLLANE CON CASELLA CODICE DIRETTAMENTE MODIFICABILE */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-1.5">
          {filteredEntries.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500 space-y-2">
              <p>Nessuna collana trovata con "{search}".</p>
              <button
                onClick={() => {
                  setNewKey(search.toUpperCase());
                  setSearch('');
                }}
                className="inline-flex items-center px-3 py-1.5 rounded-lg bg-amber-100 text-amber-900 font-semibold hover:bg-amber-200"
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                Aggiungi "{search.toUpperCase()}" come nuova collana
              </button>
            </div>
          ) : (
            filteredEntries.map(([k, v]) => {
              const isInPdf = pdfCollaneSet.has(k);
              const isSaved = justSavedKey === k;

              return (
                <div
                  key={k}
                  className={`flex items-center justify-between px-3 py-1.5 rounded-xl text-xs border transition-colors ${
                    isInPdf
                      ? 'bg-emerald-50/50 border-emerald-200/80 hover:bg-emerald-50'
                      : 'bg-slate-50 border-slate-100 hover:bg-slate-100/80'
                  }`}
                >
                  <div className="flex items-center flex-wrap gap-1.5 pr-2">
                    <span className="font-semibold text-slate-800">{k}</span>
                    {isInPdf && (
                      <span className="px-1.5 py-0.2 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                        Nel PDF
                      </span>
                    )}
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    {isSaved && (
                      <span className="inline-flex items-center text-[10px] text-emerald-600 font-semibold">
                        <Check className="w-3 h-3 mr-0.5" /> Salvato
                      </span>
                    )}
                    <input
                      type="text"
                      value={v}
                      placeholder="Codice..."
                      onChange={(e) => handleUpdateCode(k, e.target.value)}
                      className="w-20 text-center font-mono font-bold text-xs px-2 py-1 rounded-lg border border-slate-300 bg-white text-amber-800 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 uppercase"
                      title={`Scrivi qui il prefisso per "${k}" (es. DD50, TE01)`}
                    />
                    <button
                      onClick={() => handleDelete(k)}
                      className="text-slate-300 hover:text-red-600 p-1 transition-colors"
                      title="Elimina questa voce"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* AGGIUNTA RAPIDA NUOVA COLLANA (OPZIONALE IN BASSO) */}
        <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-semibold text-slate-500">Nuova collana:</span>
          <input
            type="text"
            placeholder="Nome Collana (es. DYLAN DOG 40 ANNI...)"
            value={newKey}
            onChange={(e) => setNewKey(e.target.value)}
            className="flex-1 min-w-[160px] px-2.5 py-1 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-amber-500"
          />
          <input
            type="text"
            placeholder="Codice (es. DD50)"
            value={newVal}
            onChange={(e) => setNewVal(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAdd();
            }}
            className="w-28 px-2.5 py-1 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-amber-500 uppercase font-mono font-bold"
          />
          <button
            onClick={handleAdd}
            disabled={!newKey.trim() || !newVal.trim()}
            className="inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-lg bg-amber-600 hover:bg-amber-700 text-white disabled:opacity-40 transition-colors"
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            Aggiungi
          </button>
        </div>

        {/* FOOTER */}
        <div className="px-5 py-2.5 border-t border-slate-200 bg-white flex items-center justify-between">
          <button
            onClick={handleResetDefaults}
            className="inline-flex items-center text-xs text-slate-500 hover:text-slate-800 font-medium"
          >
            <RotateCcw className="w-3.5 h-3.5 mr-1" />
            Ripristina Predefiniti
          </button>

          <button
            onClick={onClose}
            className="inline-flex items-center px-4 py-1.5 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white shadow-sm"
          >
            Chiudi
          </button>
        </div>
      </div>
    </div>
  );
};
