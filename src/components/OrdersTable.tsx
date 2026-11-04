import React from 'react';
import { CheckSquare, Square, Plus, Minus, Tag, Shirt } from 'lucide-react';
import { MatchedItem } from '../types';

interface OrdersTableProps {
  items: MatchedItem[];
  onToggleExclude: (id: string) => void;
  onUpdateQuantity: (id: string, newQta: number) => void;
  searchQuery: string;
}

export const OrdersTable: React.FC<OrdersTableProps> = ({
  items,
  onToggleExclude,
  onUpdateQuantity,
  searchQuery
}) => {
  const filtered = items.filter(it => {
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

  if (items.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-500">
        Nessun articolo abbinato. Carica il PDF e il CSV per generare l'ordine.
      </div>
    );
  }

  return (
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
                  Nessun articolo corrisponde alla ricerca "{searchQuery}".
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
                        title={isExcluded ? 'Clicca per includere nell\'ordine' : 'Clicca per escludere dall\'ordine (QTA = 0)'}
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
      <div className="bg-slate-50 px-4 py-2 border-t border-slate-200 text-xs text-slate-500 flex justify-between">
        <span>Mostrati {filtered.length} di {items.length} articoli</span>
        <span>Spazio o click sul pulsante "ORDINA / ESCLUSO" per escludere</span>
      </div>
    </div>
  );
};
