import React from 'react';
import { Layers, Info } from 'lucide-react';
import { PdfRow } from '../types';

interface PaniniTableProps {
  items: PdfRow[];
  searchQuery: string;
}

export const PaniniTable: React.FC<PaniniTableProps> = ({ items, searchQuery }) => {
  const filtered = items.filter(it => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      it.titolo.toLowerCase().includes(q) ||
      it.collana.toLowerCase().includes(q) ||
      it.codice.toLowerCase().includes(q)
    );
  });

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-4 bg-purple-50/70 border-b border-purple-200 text-purple-900 text-xs flex items-start space-x-2.5">
        <Info className="w-4 h-4 text-purple-700 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold">Articoli Panini Comics / Disney / Marvel: </span>
          Questi articoli appartengono al distributore Panini e sono stati automaticamente separati dall'ordine Sato/Bonelli per evitare errori.
        </div>
      </div>

      <div className="overflow-x-auto max-h-[650px] overflow-y-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead className="bg-slate-100 text-slate-700 sticky top-0 z-10 border-b border-slate-200 uppercase font-semibold tracking-tight text-[10px]">
            <tr>
              <th className="py-1.5 px-2 w-40 whitespace-nowrap">Collana</th>
              <th className="py-1.5 px-2 font-mono w-20 whitespace-nowrap">Codice</th>
              <th className="py-1.5 px-2">Titolo</th>
              <th className="py-1.5 px-2 text-center w-20 whitespace-nowrap">Venduti</th>
              <th className="py-1.5 px-2 text-right w-16 whitespace-nowrap">Prezzo</th>
              <th className="py-1.5 px-2 text-slate-400 text-center w-16 whitespace-nowrap">Pag.</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-6 text-center text-slate-500">
                  {items.length === 0 ? 'Nessun articolo Panini presente nel PDF venduto.' : `Nessun risultato per "${searchQuery}".`}
                </td>
              </tr>
            ) : (
              filtered.map((item, idx) => (
                <tr key={idx} className="hover:bg-purple-50/30 transition-colors">
                  <td className="py-1 px-2 font-medium text-purple-900 whitespace-nowrap">
                    {item.collana}
                  </td>
                  <td className="py-1 px-2 font-mono font-semibold text-slate-900 whitespace-nowrap">
                    {item.codice}
                  </td>
                  <td className="py-1 px-2 font-medium text-slate-900">
                    {item.titolo}
                  </td>
                  <td className="py-1 px-2 text-center font-bold text-purple-700 whitespace-nowrap">
                    {item.venditeNette}
                  </td>
                  <td className="py-1 px-2 text-right font-medium text-slate-700 whitespace-nowrap">
                    {item.prezzoVendita ? `${item.prezzoVendita} €` : '-'}
                  </td>
                  <td className="py-1 px-2 text-center text-slate-400 whitespace-nowrap">
                    p.{item.page}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div className="bg-slate-50 px-4 py-2 border-t border-slate-200 text-xs text-slate-500">
        Totale: {items.length} articoli Panini
      </div>
    </div>
  );
};
