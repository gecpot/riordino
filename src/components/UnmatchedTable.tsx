import React, { useState, useMemo } from 'react';
import { CheckSquare, Square, Plus, Minus, Shirt, Info, Filter, CheckCheck, XCircle } from 'lucide-react';
import { UnmatchedOrderItem } from '../types';

interface UnmatchedTableProps {
  items: UnmatchedOrderItem[];
  onToggleExclude: (id: string) => void;
  onUpdateQuantity: (id: string, newQta: number) => void;
  onBulkExclude?: (ids: string[], escluso: boolean) => void;
  searchQuery: string;
}

function getMacroCollanaUnmatched(item: UnmatchedOrderItem): string {
  const coll = (item.collana || '').toUpperCase();
  const cod = (item.codiceBonelli || '').toUpperCase();

  if (cod.startsWith('TE') || coll.includes('TEX')) return 'Tex';
  if (cod.startsWith('DD') || cod.startsWith('BT') || coll.includes('DYLAN') || coll.includes('PAURA')) return 'Dylan Dog';
  if (cod.startsWith('ZE') || coll.includes('ZAGOR') || coll.includes('ZENITH')) return 'Zagor';
  if (cod.startsWith('DN') || coll.includes('DRAGON')) return 'Dragonero';
  if (cod.startsWith('JU') || coll.includes('JULIA')) return 'Julia';
  if (cod.startsWith('NN') || coll.includes('NATHAN')) return 'Nathan Never';
  if (cod.startsWith('MM') || coll.includes('MYSTERE')) return 'Martin Mystère';
  if (cod.startsWith('DA') || coll.includes('DAMPYR')) return 'Dampyr';
  if (cod.startsWith('NO') || coll.includes('MISTER NO')) return 'Mister No';
  if (
    cod.startsWith('VA02') ||
    (item.misura && item.misura !== '-') ||
    coll.includes('TSHIRT') ||
    coll.includes('MAGLIET') ||
    cod.startsWith('PO')
  ) {
    return 'Magliette & Gadget';
  }

  return item.collana ? item.collana.trim() : 'Altre Collane';
}

export const UnmatchedTable: React.FC<UnmatchedTableProps> = ({
  items,
  onToggleExclude,
  onUpdateQuantity,
  onBulkExclude,
  searchQuery
}) => {
  const [selectedCollana, setSelectedCollana] = useState<string | null>(null);

  const collanaStats = useMemo(() => {
    const counts: Record<string, { total: number; attivi: number; qta: number }> = {};
    for (const item of items) {
      const macro = getMacroCollanaUnmatched(item);
      if (!counts[macro]) {
        counts[macro] = { total: 0, attivi: 0, qta: 0 };
      }
      counts[macro].total += 1;
      if (!item.escluso && item.qtaOrdine > 0) {
        counts[macro].attivi += 1;
        counts[macro].qta += item.qtaOrdine;
      }
    }
    return Object.entries(counts).sort((a, b) => b[1].total - a[1].total);
  }, [items]);

  const filtered = useMemo(() => {
    return items.filter(it => {
      if (selectedCollana !== null && getMacroCollanaUnmatched(it) !== selectedCollana) {
        return false;
      }
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        it.titolo.toLowerCase().includes(q) ||
        it.collana.toLowerCase().includes(q) ||
        it.codice.toLowerCase().includes(q) ||
        it.codiceBonelli.toLowerCase().includes(q) ||
        it.misura.toLowerCase().includes(q)
      );
    });
  }, [items, selectedCollana, searchQuery]);

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
      {/* FILTRI PER COLLANA */}
      {items.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center space-x-1.5 text-xs font-semibold text-slate-700">
              <Filter className="w-3.5 h-3.5 text-amber-600" />
              <span>Filtra Ordine Mail per Collana:</span>
            </div>

            {selectedCollana && onBulkExclude && (
              <div className="flex items-center space-x-2 text-xs">
                <span className="text-slate-500 text-[11px] hidden sm:inline">
                  Azioni su <strong>{selectedCollana}</strong> ({filtered.length}):
                </span>
                <button
                  onClick={handleIncludeFiltered}
                  className="inline-flex items-center px-2 py-1 rounded bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 text-[11px] font-semibold"
                >
                  <CheckCheck className="w-3 h-3 mr-1" />
                  Ordina {selectedCollana}
                </button>
                <button
                  onClick={handleExcludeFiltered}
                  className="inline-flex items-center px-2 py-1 rounded bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 text-[11px] font-semibold"
                >
                  <XCircle className="w-3 h-3 mr-1" />
                  Escludi {selectedCollana}
                </button>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
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
      )}

      {/* TABELLA ARTICOLI ORDINE MAIL */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-3.5 bg-amber-50/80 border-b border-amber-200 text-amber-900 text-xs flex items-start space-x-2.5">
          <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold">Ordine via Mail (Fuori Catalogo CSV): </span>
            Questi fumetti non sono presenti nel file <span className="font-mono">Sato.csv</span> ma sono stati codificati automaticamente (es. <span className="font-mono font-bold">DD01-039</span>, <span className="font-mono font-bold">TE01-512</span>).
            Puoi usare la <strong>spunta ORDINA / ESCLUSO</strong> e i tasti <strong>+ / -</strong> per decidere cosa e quanto allegare alla mail di riordino!
          </div>
        </div>

        <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-100 text-slate-700 sticky top-0 z-10 border-b border-slate-200 uppercase font-semibold tracking-wider text-[11px]">
              <tr>
                <th className="py-2.5 px-3 text-center w-28">Stato Mail</th>
                <th className="py-2.5 px-3 text-center w-28">Q.tà Ordine</th>
                <th className="py-2.5 px-2 text-center w-16">Venduti</th>
                <th className="py-2.5 px-3 font-mono">Codice Ordine</th>
                <th className="py-2.5 px-3">Titolo Albo</th>
                <th className="py-2.5 px-2 text-center">Taglia</th>
                <th className="py-2.5 px-3">Var / Colore</th>
                <th className="py-2.5 px-3 text-right">Prezzo</th>
                <th className="py-2.5 px-3">Collana PDF</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-500">
                    {items.length === 0
                      ? 'Nessun albo fuori catalogo CSV! Tutti i titoli sono presenti nel file Sato.csv.'
                      : `Nessun risultato per i filtri selezionati.`}
                  </td>
                </tr>
              ) : (
                filtered.map((item) => {
                  const isExcluded = item.escluso;
                  const hasTaglia = !!item.misura && item.misura !== '-';

                  return (
                    <tr
                      key={item.id}
                      className={`transition-colors ${
                        isExcluded
                          ? 'bg-slate-50/70 text-slate-400 opacity-60'
                          : 'hover:bg-amber-50/40'
                      }`}
                    >
                      {/* STATO ORDINE MAIL TOGGLE */}
                      <td className="py-2 px-3 text-center">
                        <button
                          onClick={() => onToggleExclude(item.id)}
                          className={`inline-flex items-center px-2 py-1 rounded-md font-semibold transition-all select-none ${
                            isExcluded
                              ? 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                              : 'bg-amber-100 text-amber-900 hover:bg-amber-200 border border-amber-300/60'
                          }`}
                          title={
                            isExcluded
                              ? "Clicca per includere nell'ordine via Mail"
                              : "Clicca per escludere dall'ordine via Mail (QTA = 0)"
                          }
                        >
                          {isExcluded ? (
                            <>
                              <Square className="w-3.5 h-3.5 mr-1" />
                              ESCLUSO
                            </>
                          ) : (
                            <>
                              <CheckSquare className="w-3.5 h-3.5 mr-1 text-amber-800" />
                              ORDINA
                            </>
                          )}
                        </button>
                      </td>

                      {/* QTA ORDINE MAIL EDITABILE */}
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
                                : 'bg-white border-amber-300 text-amber-900 focus:ring-1 focus:ring-amber-500'
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

                      {/* CODICE BONELLI (ES. DD01-039) */}
                      <td className="py-2 px-3 whitespace-nowrap">
                        <span
                          className={`inline-block font-mono font-bold px-2 py-0.5 rounded text-xs ${
                            isExcluded
                              ? 'bg-slate-100 text-slate-400'
                              : item.prefissoSato
                              ? 'bg-amber-100/80 text-amber-900 border border-amber-200'
                              : 'bg-slate-100 text-slate-700 border border-slate-200'
                          }`}
                        >
                          {item.codiceBonelli}
                        </span>
                      </td>

                      {/* TITOLO */}
                      <td className={`py-2 px-3 font-medium ${isExcluded ? 'line-through' : 'text-slate-900'}`}>
                        {item.titolo}
                      </td>

                      {/* TAGLIA */}
                      <td className="py-2 px-2 text-center whitespace-nowrap">
                        {hasTaglia ? (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-bold text-[10px]">
                            <Shirt className="w-2.5 h-2.5 mr-0.5" />
                            {item.misura}
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>

                      {/* VAR / COLORE */}
                      <td className="py-2 px-3 text-slate-600 whitespace-nowrap">
                        {item.colore || '-'}
                      </td>

                      {/* PREZZO */}
                      <td className="py-2 px-3 text-right font-medium text-slate-700 whitespace-nowrap">
                        {item.prezzoVendita ? `${item.prezzoVendita} €` : '-'}
                      </td>

                      {/* COLLANA PDF */}
                      <td className="py-2 px-3 text-slate-500 text-[11px] whitespace-nowrap">
                        {item.collana}
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
            Mostrati {filtered.length} di {items.length} articoli fuori CSV{' '}
            {selectedCollana && `(Filtro: ${selectedCollana})`}
          </span>
          <span>Gli articoli con spunta "ORDINA" verranno inclusi nell'allegato e nel testo Mail</span>
        </div>
      </div>
    </div>
  );
};
