import React from 'react';
import { AlertTriangle, Shirt, Info } from 'lucide-react';
import { PdfRow } from '../types';

interface UnmatchedTableProps {
  items: PdfRow[];
  searchQuery: string;
}

export const UnmatchedTable: React.FC<UnmatchedTableProps> = ({ items, searchQuery }) => {
  const filtered = items.filter(it => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      it.titolo.toLowerCase().includes(q) ||
      it.collana.toLowerCase().includes(q) ||
      it.codice.toLowerCase().includes(q) ||
      it.misura.toLowerCase().includes(q)
    );
  });

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-4 bg-amber-50/70 border-b border-amber-200 text-amber-900 text-xs flex items-start space-x-2.5">
        <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold">Nota di controllo: </span>
          Questi articoli risultano venduti nel file cassa Trend (PDF) ma non sono presenti nel listino attivo Sato.
          Possono essere albi vintage, esauriti, o serie speciali/allegati (es. Corriere della Sera/Gazzetta).
          Vengono inclusi automaticamente nel file di testo <span className="font-mono font-semibold">albi_non_trovati.txt</span>.
        </div>
      </div>

      <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead className="bg-slate-100 text-slate-700 sticky top-0 z-10 border-b border-slate-200 uppercase font-semibold tracking-wider text-[11px]">
            <tr>
              <th className="py-2.5 px-3">Collana Trend</th>
              <th className="py-2.5 px-3 font-mono">Num / Codice</th>
              <th className="py-2.5 px-2 text-center">Taglia</th>
              <th className="py-2.5 px-3">Var / Colore</th>
              <th className="py-2.5 px-3">Titolo Albo</th>
              <th className="py-2.5 px-3 text-center">Vendite Nette</th>
              <th className="py-2.5 px-3 text-right">Prezzo</th>
              <th className="py-2.5 px-3 text-slate-400 text-center">Pagina PDF</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-slate-500">
                  {items.length === 0 ? 'Nessun albo non trovato! Tutti i titoli sono stati abbinati con successo.' : `Nessun risultato per "${searchQuery}".`}
                </td>
              </tr>
            ) : (
              filtered.map((item, idx) => {
                const hasTaglia = !!item.misura && item.misura !== '-';
                return (
                  <tr key={idx} className="hover:bg-amber-50/30 transition-colors">
                    <td className="py-2 px-3 font-medium text-slate-800">
                      {item.collana || 'SENZA COLLANA'}
                    </td>
                    <td className="py-2 px-3 font-mono font-semibold text-slate-900">
                      {item.codice}
                    </td>
                    <td className="py-2 px-2 text-center">
                      {hasTaglia ? (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-bold text-[10px]">
                          <Shirt className="w-2.5 h-2.5 mr-0.5" />
                          {item.misura}
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="py-2 px-3 text-slate-600">
                      {item.colore || '-'}
                    </td>
                    <td className="py-2 px-3 font-medium text-slate-900">
                      {item.titolo}
                    </td>
                    <td className="py-2 px-3 text-center font-bold text-amber-700">
                      {item.venditeNette}
                    </td>
                    <td className="py-2 px-3 text-right font-medium text-slate-700">
                      {item.prezzoVendita ? `${item.prezzoVendita} €` : '-'}
                    </td>
                    <td className="py-2 px-3 text-center text-slate-400">
                      pag. {item.page}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      <div className="bg-slate-50 px-4 py-2 border-t border-slate-200 text-xs text-slate-500">
        Totale: {items.length} articoli non a catalogo Sato
      </div>
    </div>
  );
};
