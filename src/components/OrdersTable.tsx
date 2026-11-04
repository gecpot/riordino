import React, { useState, useMemo } from 'react';
import { CheckSquare, Square, Plus, Minus, Shirt, Filter, CheckCheck, XCircle } from 'lucide-react';
import { MatchedItem } from '../types';

interface OrdersTableProps {
  items: MatchedItem[];
  onToggleExclude: (id: string) => void;
  onUpdateQuantity: (id: string, newQta: number) => void;
  onBulkExclude?: (ids: string[], escluso: boolean) => void;
  searchQuery: string;
}

export function getMacroCollana(item: MatchedItem): string {
  const coll = (item.collanaPdf || '').toUpperCase();
  const usc = (item.uscita || '').toUpperCase();

  if (usc.startsWith('TE') || coll.includes('TEX')) return 'Tex';
  if (usc.startsWith('DD') || usc.startsWith('BT') || coll.includes('DYLAN')) return 'Dylan Dog';
  if (usc.startsWith('ZE') || coll.includes('ZAGOR') || coll.includes('ZENITH')) return 'Zagor';
  if (usc.startsWith('DN') || coll.includes('DRAGON')) return 'Dragonero';
  if (usc.startsWith('JU') || coll.includes('JULIA')) return 'Julia';
  if (usc.startsWith('NN') || coll.includes('NATHAN')) return 'Nathan Never';
  if (usc.startsWith('MM') || coll.includes('MYSTERE')) return 'Martin Mystère';
  if (usc.startsWith('DA') || coll.includes('DAMPYR')) return 'Dampyr';
  if (usc.startsWith('NO') || coll.includes('MISTER NO')) return 'Mister No';
  if (usc.startsWith('VA02') || (item.taglia && item.taglia !== '-') || coll.includes('TSHIRT') || coll.includes('MAGLIET') || usc.startsWith('PO')) {
    return 'Magliette & Gadget';
  }

  return item.collanaPdf ? item.collanaPdf.trim() : 'Altre Collane';
}

export const OrdersTable: React.FC<OrdersTableProps> = ({
  items,
  onToggleExclude,
  onUpdateQuantity,
  onBulkExclude,
  searchQuery
}) => {
  const [selectedCollana, setSelectedCollana] = useState<string | null>(null);

  // Calcola le categorie e i relativi conteggi
  const collanaStats = useMemo(() => {
    const counts: Record<string, { total: number; attivi: number; qta: number }> = {};
    for (const item of items) {
      const macro = getMacroCollana(item);
      if (!counts[macro]) {
        counts[macro] = { total: 0, attivi: 0, qta: 0 };
      }
      counts[macro].total += 1;
      if (!item.escluso) {
        counts[macro].attivi += 1;
        counts[macro].qta += item.qtaOrdine;
      }
    }

    // Ordina mettendo prima le collane più numerose
    return Object.entries(counts).sort((a, b) => b[1].total - a[1].total);
  }, [items]);

  // Filtra per testo e per collana selezionata
  const filtered = useMemo(() => {
    return items.filter(it => {
      // Filtro per macro-collana
      if (selectedCollana !== null && getMacroCollana(it) !== selectedCollana) {
        return false;
      }

      // Filtro per testo di ricerca
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        it.articolo.toLowerCase().includes(q) ||
        it.uscita.toLowerCase().includes(q) ||
        it.barcode.toLowerCase().includes(q) ||
        it.collanaPdf.toLowerCase().includes(q) ||
        it.taglia.toLowerCase().includes(q)
      );
    });
  }, [items, selectedCollana, searchQuery]);

  if (items.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-500">
        Nessun articolo abbinato. Carica il PDF e il CSV per generare l'ordine.
      </div>
    );
  }

  // Azioni rapide su filtro attivo
  const handleIncludeFiltered = () => {
    if (onBulkExclude) {
      onBulkExclude(filtered.map(f => f.id), false);
    }
  };

  const handleExcludeFiltered = () => {
    if (onBulkExclude) {
      onBulkExclude(filtered.map(f => f.id), true);
    }
  };

  return (
    <div className="space-y-3">
      {/* BARRA FILTRI RAPIDI PER COLLANA */}
      <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm">
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center space-x-1.5 text-xs font-semibold text-slate-700">
            <Filter className="w-3.5 h-3.5 text-amber-600" />
            <span>Filtra per Collana:</span>
          </div>

          {selectedCollana && onBulkExclude && (
            <div className="flex items-center space-x-2 text-xs">
              <span className="text-slate-500 text-[11px] hidden sm:inline">
                Azioni rapide su <strong>{selectedCollana}</strong> ({filtered.length}):
              </span>
              <button
                onClick={handleIncludeFiltered}
                className="inline-flex items-center px-2 py-1 rounded bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 text-[11px] font-semibold"
                title={`Spunta e ordina tutti i titoli di ${selectedCollana}`}
              >
                <CheckCheck className="w-3 h-3 mr-1" />
                Ordina {selectedCollana}
              </button>
              <button
                onClick={handleExcludeFiltered}
                className="inline-flex items-center px-2 py-1 rounded bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 text-[11px] font-semibold"
                title={`Escludi tutti i titoli di ${selectedCollana} (QTA 0)`}
              >
                <XCircle className="w-3 h-3 mr-1" />
                Escludi {selectedCollana}
              </button>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {/* TASTO TUTTE */}
          <button
            onClick={() => setSelectedCollana(null)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              selectedCollana === null
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            TUTTE ({items.length})
          </button>

          {/* PULSANTI DELLE SINGOLE COLLANE */}
          {collanaStats.map(([nomeCollana, stats]) => {
            const isSelected = selectedCollana === nomeCollana;
            return (
              <button
                key={nomeCollana}
                onClick={() => setSelectedCollana(isSelected ? null : nomeCollana)}
                className={`inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs transition-all ${
                  isSelected
                    ? 'bg-amber-600 text-white font-bold shadow-sm'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 font-medium'
                }`}
              >
                <span>{nomeCollana}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    isSelected ? 'bg-amber-700 text-white' : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {stats.total}
                </span>
                {stats.attivi < stats.total && (
                  <span
                    className={`text-[9px] px-1 rounded ${
                      isSelected ? 'bg-amber-800 text-amber-100' : 'bg-red-100 text-red-700'
                    }`}
                    title={`${stats.total - stats.attivi} titoli esclusi`}
                  >
                    -{stats.total - stats.attivi}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* TABELLA ORDINI */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-100 text-slate-700 sticky top-0 z-10 border-b border-slate-200 uppercase font-semibold tracking-wider text-[11px]">
              <tr>
                <th className="py-2.5 px-3 text-center w-28">Stato Ordine</th>
                <th className="py-2.5 px-3 text-center w-28">Q.tà Ordine</th>
                <th className="py-2.5 px-2 text-center w-16">Venduti</th>
                <th className="py-2.5 px-3 font-mono">Uscita Sato</th>
                <th className="py-2.5 px-3">Titolo / Articolo Sato</th>
                <th className="py-2.5 px-2 text-center">Taglia</th>
                <th className="py-2.5 px-3">Var / Col</th>
                <th className="py-2.5 px-3 text-right">Prezzo</th>
                <th className="py-2.5 px-3 font-mono text-slate-500">Barcode</th>
                <th className="py-2.5 px-3 text-slate-500">Collana PDF</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-500">
                    Nessun articolo corrisponde ai filtri selezionati.
                  </td>
                </tr>
              ) : (
                filtered.map((item) => {
                  const isExcluded = item.escluso;
                  const hasTaglia = !!item.taglia && item.taglia !== '-';

                  return (
                    <tr
                      key={item.id}
                      className={`transition-colors ${
                        isExcluded
                          ? 'bg-slate-50/70 text-slate-400 opacity-60'
                          : 'hover:bg-emerald-50/40'
                      }`}
                    >
                      {/* STATO ORDINE TOGGLE */}
                      <td className="py-2 px-3 text-center">
                        <button
                          onClick={() => onToggleExclude(item.id)}
                          className={`inline-flex items-center px-2 py-1 rounded-md font-semibold transition-all select-none ${
                            isExcluded
                              ? 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                              : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                          }`}
                          title={
                            isExcluded
                              ? "Clicca per includere nell'ordine"
                              : "Clicca per escludere dall'ordine (QTA = 0)"
                          }
                        >
                          {isExcluded ? (
                            <>
                              <Square className="w-3.5 h-3.5 mr-1" />
                              ESCLUSO
                            </>
                          ) : (
                            <>
                              <CheckSquare className="w-3.5 h-3.5 mr-1 text-emerald-700" />
                              ORDINA
                            </>
                          )}
                        </button>
                      </td>

                      {/* QTA ORDINE EDITABILE */}
                      <td className="py-2 px-3 text-center">
                        <div className="inline-flex items-center space-x-1">
                          <button
                            disabled={isExcluded || item.qtaOrdine <= 0}
                            onClick={() => onUpdateQuantity(item.id, Math.max(0, item.qtaOrdine - 1))}
                            className="w-6 h-6 rounded flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <input
                            type="number"
                            min="0"
                            disabled={isExcluded}
                            value={isExcluded ? 0 : item.qtaOrdine}
                            onChange={(e) => {
                              const val = parseInt(e.target.value, 10);
                              onUpdateQuantity(item.id, isNaN(val) ? 0 : Math.max(0, val));
                            }}
                            className={`w-12 text-center py-0.5 rounded border text-xs font-bold ${
                              isExcluded
                                ? 'bg-slate-100 border-slate-200 text-slate-400'
                                : 'bg-white border-slate-300 text-emerald-700 focus:ring-1 focus:ring-emerald-500'
                            }`}
                          />
                          <button
                            disabled={isExcluded}
                            onClick={() => onUpdateQuantity(item.id, item.qtaOrdine + 1)}
                            className="w-6 h-6 rounded flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </td>

                      {/* VENDUTI */}
                      <td className="py-2 px-2 text-center font-semibold text-slate-700">
                        {item.qtaVenduta}
                      </td>

                      {/* USCITA SATO */}
                      <td className="py-2 px-3 font-mono font-medium text-slate-900 whitespace-nowrap">
                        {item.uscita}
                      </td>

                      {/* ARTICOLO */}
                      <td className={`py-2 px-3 font-medium ${isExcluded ? 'line-through' : 'text-slate-900'}`}>
                        {item.articolo}
                      </td>

                      {/* TAGLIA */}
                      <td className="py-2 px-2 text-center whitespace-nowrap">
                        {hasTaglia ? (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-bold text-[10px]">
                            <Shirt className="w-2.5 h-2.5 mr-0.5" />
                            {item.taglia}
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>

                      {/* VAR / COL */}
                      <td className="py-2 px-3 text-slate-600 whitespace-nowrap">
                        {item.colore || '-'}
                      </td>

                      {/* PREZZO */}
                      <td className="py-2 px-3 text-right font-medium text-slate-700 whitespace-nowrap">
                        {item.prezzo ? `${item.prezzo} €` : '-'}
                      </td>

                      {/* BARCODE */}
                      <td className="py-2 px-3 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                        {item.barcode}
                      </td>

                      {/* COLLANA PDF */}
                      <td className="py-2 px-3 text-slate-500 text-[11px] whitespace-nowrap">
                        {item.collanaPdf}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="bg-slate-50 px-4 py-2 border-t border-slate-200 text-xs text-slate-500 flex justify-between items-center">
          <span>
            Mostrati {filtered.length} di {items.length} articoli {selectedCollana && `(Filtro: ${selectedCollana})`}
          </span>
          <span>Click sul pulsante "ORDINA / ESCLUSO" per escludere o modificare quantità</span>
        </div>
      </div>
    </div>
  );
};
