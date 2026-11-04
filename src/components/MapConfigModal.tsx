import React, { useState } from 'react';
import { X, Plus, Trash2, RotateCcw, Save, Check } from 'lucide-react';
import { MAPPA_PREDEFINITA } from '../constants/defaultMap';

interface MapConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  mapData: Record<string, string>;
  onSaveMap: (newMap: Record<string, string>) => void;
}

export const MapConfigModal: React.FC<MapConfigModalProps> = ({
  isOpen,
  onClose,
  mapData,
  onSaveMap
}) => {
  const [currentMap, setCurrentMap] = useState<Record<string, string>>({ ...mapData });
  const [newKey, setNewKey] = useState('');
  const [newVal, setNewVal] = useState('');
  const [search, setSearch] = useState('');
  const [savedMessage, setSavedMessage] = useState(false);

  if (!isOpen) return null;

  const handleAdd = () => {
    const k = newKey.trim().toUpperCase();
    const v = newVal.trim().toUpperCase();
    if (!k || !v) return;
    setCurrentMap(prev => ({ ...prev, [k]: v }));
    setNewKey('');
    setNewVal('');
  };

  const handleDelete = (key: string) => {
    setCurrentMap(prev => {
      const copy = { ...prev };
      delete copy[key];
      return copy;
    });
  };

  const handleResetDefaults = () => {
    if (confirm('Vuoi ripristinare tutti i prefissi alle impostazioni predefinite?')) {
      setCurrentMap({ ...MAPPA_PREDEFINITA });
    }
  };

  const handleSave = () => {
    onSaveMap(currentMap);
    setSavedMessage(true);
    setTimeout(() => {
      setSavedMessage(false);
      onClose();
    }, 800);
  };

  const filteredEntries = Object.entries(currentMap)
    .filter(([k, v]) => {
      const q = search.toLowerCase();
      return k.toLowerCase().includes(q) || v.toLowerCase().includes(q);
    })
    .sort(([a], [b]) => a.localeCompare(b));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden border border-slate-200">
        {/* HEADER */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Mappa Prefissi Collane Bonelli</h2>
            <p className="text-xs text-slate-500">
              Associazione tra nome collana nel PDF Trend e prefisso codice Sato (es. TEX NUOVA RISTAMPA → TE04)
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* AGGIUNTA NUOVO PREFISSO */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center gap-2">
          <input
            type="text"
            placeholder="Nome Collana PDF (es. TEX)"
            value={newKey}
            onChange={(e) => setNewKey(e.target.value)}
            className="flex-1 min-w-[180px] px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-amber-500"
          />
          <input
            type="text"
            placeholder="Prefisso Sato (es. TE01)"
            value={newVal}
            onChange={(e) => setNewVal(e.target.value)}
            className="w-36 px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-amber-500 uppercase font-mono"
          />
          <button
            onClick={handleAdd}
            disabled={!newKey.trim() || !newVal.trim()}
            className="inline-flex items-center px-3 py-1.5 text-xs font-semibold rounded-lg bg-amber-600 hover:bg-amber-700 text-white disabled:opacity-50 transition-colors"
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            Aggiungi
          </button>
        </div>

        {/* CERCA NEI PREFISSI */}
        <div className="px-6 py-2.5 border-b border-slate-100">
          <input
            type="text"
            placeholder="Filtra mappature esistenti..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-3 py-1 text-xs rounded border border-slate-200 focus:outline-none"
          />
        </div>

        {/* LISTA MAPPATURE */}
        <div className="flex-1 overflow-y-auto p-6 space-y-1.5">
          {filteredEntries.map(([k, v]) => (
            <div
              key={k}
              className="flex items-center justify-between px-3 py-2 rounded-lg bg-slate-50 hover:bg-slate-100 text-xs border border-slate-100"
            >
              <span className="font-semibold text-slate-800">{k}</span>
              <div className="flex items-center space-x-3">
                <span className="font-mono bg-white px-2 py-0.5 rounded border border-slate-300 text-amber-700 font-bold">
                  {v}
                </span>
                <button
                  onClick={() => handleDelete(k)}
                  className="text-slate-400 hover:text-red-600 p-1"
                  title="Elimina associazione"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* FOOTER */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <button
            onClick={handleResetDefaults}
            className="inline-flex items-center text-xs text-slate-600 hover:text-slate-900 font-medium"
          >
            <RotateCcw className="w-3.5 h-3.5 mr-1" />
            Ripristina Predefiniti
          </button>

          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-200"
            >
              Annulla
            </button>
            <button
              onClick={handleSave}
              className="inline-flex items-center px-4 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
            >
              {savedMessage ? (
                <>
                  <Check className="w-3.5 h-3.5 mr-1" /> Salvato!
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5 mr-1" /> Salva Mappature
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
