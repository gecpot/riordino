import React, { useState, useMemo } from 'react';
import { CheckSquare, Square, Plus, Minus, Shirt, Info, Filter, CheckCheck, XCircle, Ban, Pencil, Check, X } from 'lucide-react';
import { UnmatchedOrderItem } from '../types';
import { isArticoloLibro } from '../constants/defaultMap';

interface UnmatchedTableProps {
  items: UnmatchedOrderItem[];
  onToggleExclude: (id: string) => void;
  onUpdateQuantity: (id: string, newQta: number) => void;
  onMarkNonOrdinabile: (item: UnmatchedOrderItem) => void;
  onBulkMarkNonOrdinabile?: (items: UnmatchedOrderItem[]) => void;
  onBulkExclude?: (ids: string[], escluso: boolean) => void;
  onUpdateCollanaPrefix?: (collanaPdf: string, newPrefix: string) => void;
  searchQuery: string;
}

function getMacroCollanaUnmatched(item: UnmatchedOrderItem): string {
  const coll = (item.collana || '').toUpperCase();
  const cod = (item.codiceBonelli || '').toUpperCase();

  // 1. Tutti i libri (LIBRI TEX, LIBRI DYLAN DOG, LIBRI VARI, ecc.) raggruppati in un unico filtro "Libri"
  if (isArticoloLibro(item.collana, item.codiceBonelli)) {
    return 'Libri';
  }

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
    cod.startsWith('VA01') ||
    (item.misura && item.misura !== '-') ||
    coll.includes('TSHIRT') ||
    coll.includes('MAGLIET') ||
    coll.includes('TAZZ') ||
    coll.includes('PORTACHIAVI') ||
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
  onMarkNonOrdinabile,
  onBulkMarkNonOrdinabile,
  onBulkExclude,
  onUpdateCollanaPrefix,
  searchQuery
}) => {
  const [selectedCollana, setSelectedCollana] = useState<string | null>(null);
  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const [editPrefixValue, setEditPrefixValue] = useState<string>('');

  const handleStartEditPrefix = (item: UnmatchedOrderItem) => {
    setEditingRowId(item.id);
    setEditPrefixValue(item.prefissoSato || '');
  };

  const handleSaveEditPrefix = (collana: string) => {
    const clean = editPrefixValue.trim().toUpperCase();
    if (clean && onUpdateCollanaPrefix) {
      onUpdateCollanaPrefix(collana, clean);
    }
    setEditingRowId(null);
  };

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
                {onBulkMarkNonOrdinabile && filtered.length > 0 && (
                  <button
                    onClick={() => {
                      if (
                        confirm(
                          `Vuoi spostare tutti i ${filtered.length} titoli mostrati di "${selectedCollana}" nell'archivio permanente dei Non Ordinabili?`
                        )
                      ) {
                        onBulkMarkNonOrdinabile(filtered);
                      }
                    }}
                    className="inline-flex items-center px-2 py-1 rounded bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 text-[11px] font-semibold"
                    title="Sposta tutti i titoli filtrati nell'archivio permanente Non Ordinabili"
                  >
                    <Ban className="w-3 h-3 mr-1" />
                    Non Ordinabili ({filtered.length})
                  </button>
                )}
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

      {/* TABELLA ARTICOLI ORDINE MAIL COMPATTA */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-3 py-2 bg-amber-50/80 border-b border-amber-200 text-amber-900 text-xs flex items-center space-x-2">
          <Info className="w-3.5 h-3.5 text-amber-700 shrink-0" />
          <div>
            <span className="font-semibold">Ordine via Mail (Fuori Catalogo CSV): </span>
            Usa <strong>SÌ / NO</strong> e <strong>+ / -</strong> per scegliere cosa ordinare, clicca sul <strong>Codice (✏️)</strong> per correggere la sigla di una collana (es. <span className="font-mono font-bold">DD50</span>), o clicca <strong>Non ord.</strong> per i titoli esauriti.
          </div>
        </div>

        <div className="overflow-x-auto max-h-[650px] overflow-y-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-100 text-slate-700 sticky top-0 z-10 border-b border-slate-200 uppercase font-semibold tracking-tight text-[10px]">
              <tr>
                <th className="py-1.5 px-2 text-center w-20 whitespace-nowrap">Stato</th>
                <th className="py-1.5 px-2 text-center w-24 whitespace-nowrap">Q.tà Ord.</th>
                <th className="py-1.5 px-1.5 text-center w-12 whitespace-nowrap">Vend.</th>
                <th className="py-1.5 px-2 font-mono w-28 whitespace-nowrap">Codice Ordine</th>
                <th className="py-1.5 px-2">Titolo Albo</th>
                <th className="py-1.5 px-2 text-right w-16 whitespace-nowrap">Prezzo</th>
                <th className="py-1.5 px-2 w-36 whitespace-nowrap">Collana PDF</th>
                <th className="py-1.5 px-2 text-center w-24 whitespace-nowrap">Esaurito</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-6 text-center text-slate-500">
                    {items.length === 0
                      ? 'Nessun albo fuori catalogo CSV! Tutti i titoli sono presenti nel file Sato.csv.'
                      : `Nessun risultato per i filtri selezionati.`}
                  </td>
                </tr>
              ) : (
                filtered.map((item) => {
                  const isExcluded = item.escluso;
                  const hasTaglia = !!item.misura && item.misura !== '-';
                  const hasColore = !!item.colore && item.colore !== '-';

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
                      <td className="py-1 px-1.5 text-center whitespace-nowrap">
                        <button
                          onClick={() => onToggleExclude(item.id)}
                          className={`inline-flex items-center px-1.5 py-0.5 rounded font-semibold text-[11px] transition-all select-none ${
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
                              <Square className="w-3 h-3 mr-1" />
                              NO
                            </>
                          ) : (
                            <>
                              <CheckSquare className="w-3 h-3 mr-1 text-amber-800" />
                              SÌ
                            </>
                          )}
                        </button>
                      </td>

                      {/* QTA ORDINE MAIL EDITABILE */}
                      <td className="py-1 px-1.5 text-center whitespace-nowrap">
                        <div className="inline-flex items-center space-x-0.5">
                          <button
                            disabled={isExcluded || item.qtaOrdine <= 0}
                            onClick={() => onUpdateQuantity(item.id, Math.max(0, item.qtaOrdine - 1))}
                            className="w-5 h-5 rounded flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            <Minus className="w-2.5 h-2.5" />
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
                            className={`w-10 text-center py-0 rounded border text-xs font-bold ${
                              isExcluded
                                ? 'bg-slate-100 border-slate-200 text-slate-400'
                                : 'bg-white border-amber-300 text-amber-900 focus:ring-1 focus:ring-amber-500'
                            }`}
                          />
                          <button
                            disabled={isExcluded}
                            onClick={() => onUpdateQuantity(item.id, item.qtaOrdine + 1)}
                            className="w-5 h-5 rounded flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            <Plus className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      </td>

                      {/* VENDUTI */}
                      <td className="py-1 px-1.5 text-center font-semibold text-slate-600 whitespace-nowrap">
                        {item.qtaVenduta}
                      </td>

                      {/* CODICE BONELLI (ES. DD01-039) CLICCABILE PER CAMBIARE PREFISSO COLLANA */}
                      <td className="py-1 px-2 whitespace-nowrap">
                        {editingRowId === item.id ? (
                          <div className="inline-flex items-center space-x-1">
                            <input
                              type="text"
                              autoFocus
                              placeholder="Es. DD50"
                              value={editPrefixValue}
                              onChange={(e) => setEditPrefixValue(e.target.value.toUpperCase())}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveEditPrefix(item.collana);
                                if (e.key === 'Escape') setEditingRowId(null);
                              }}
                              className="w-16 px-1.5 py-0.5 text-xs font-mono font-bold uppercase rounded border border-amber-500 bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                            />
                            <button
                              onClick={() => handleSaveEditPrefix(item.collana)}
                              className="p-1 rounded bg-emerald-600 text-white hover:bg-emerald-700"
                              title={`Salva prefisso per tutta la collana "${item.collana}"`}
                            >
                              <Check className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => setEditingRowId(null)}
                              className="p-1 rounded bg-slate-200 text-slate-600 hover:bg-slate-300"
                              title="Annulla"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleStartEditPrefix(item)}
                            title={`Clicca per cambiare il codice della collana "${item.collana}" (es. DD50)`}
                            className={`group inline-flex items-center space-x-1 font-mono font-bold px-1.5 py-0.5 rounded text-xs transition-colors ${
                              isExcluded
                                ? 'bg-slate-100 text-slate-400'
                                : item.prefissoSato
                                ? 'bg-amber-100/80 text-amber-900 hover:bg-amber-200 border border-amber-200'
                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                            }`}
                          >
                            <span>{item.codiceBonelli}</span>
                            <Pencil className="w-2.5 h-2.5 opacity-40 group-hover:opacity-100 text-amber-800 shrink-0" />
                          </button>
                        )}
                      </td>

                      {/* TITOLO + EVENTUALE TAGLIA/COLORE INLINE */}
                      <td className={`py-1 px-2 font-medium ${isExcluded ? 'line-through' : 'text-slate-900'}`}>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span>{item.titolo}</span>
                          {hasTaglia && (
                            <span className="inline-flex items-center px-1.5 py-0 rounded bg-amber-100 text-amber-800 font-bold text-[10px]">
                              <Shirt className="w-2.5 h-2.5 mr-0.5" />
                              {item.misura}
                            </span>
                          )}
                          {hasColore && (
                            <span className="inline-flex items-center px-1.5 py-0 rounded bg-slate-100 text-slate-600 text-[10px]">
                              {item.colore}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* PREZZO */}
                      <td className="py-1 px-2 text-right font-medium text-slate-700 whitespace-nowrap">
                        {item.prezzoVendita ? `${item.prezzoVendita} €` : '-'}
                      </td>

                      {/* COLLANA PDF */}
                      <td className="py-1 px-2 text-slate-500 text-[11px] whitespace-nowrap">
                        {item.collana}
                      </td>

                      {/* PULSANTE ARCHIVIA COME NON ORDINABILE */}
                      <td className="py-1 px-1.5 text-center whitespace-nowrap">
                        <button
                          onClick={() => onMarkNonOrdinabile(item)}
                          className="inline-flex items-center px-1.5 py-0.5 rounded font-semibold text-[10px] bg-rose-50 text-rose-700 hover:bg-rose-600 hover:text-white border border-rose-200 transition-colors select-none"
                          title="Segna come Non Ordinabile / Esaurito: viene spostato nella lista Non Ordinabili e non ti verrà più proposto nella Mail"
                        >
                          <Ban className="w-2.5 h-2.5 mr-1" />
                          Non ord.
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="bg-slate-50 px-3 py-1.5 border-t border-slate-200 text-[11px] text-slate-500 flex justify-between items-center">
          <span>
            Mostrati {filtered.length} di {items.length} articoli fuori CSV{' '}
            {selectedCollana && `(Filtro: ${selectedCollana})`}
          </span>
          <span>Gli articoli con spunta "SÌ" verranno inclusi nell'allegato e nel testo Mail</span>
        </div>
      </div>
    </div>
  );
};
