import React, { useState, useMemo } from 'react';
import { RotateCcw, Ban, Shirt, Filter, Trash2 } from 'lucide-react';
import { NonOrdinabileItem } from '../types';
import { isArticoloLibro } from '../constants/defaultMap';

interface NonOrdinabiliTableProps {
  items: NonOrdinabileItem[];
  blockedInWeek?: Record<string, number>;
  onRestoreItem: (key: string) => void;
  onClearAllBlocked?: () => void;
  searchQuery: string;
}

function getMacroCollanaBlocked(item: NonOrdinabileItem): string {
  const coll = (item.collana || '').toUpperCase();
  const cod = (item.codiceBonelli || '').toUpperCase();

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

export const NonOrdinabiliTable: React.FC<NonOrdinabiliTableProps> = ({
  items,
  blockedInWeek = {},
  onRestoreItem,
  onClearAllBlocked,
  searchQuery
}) => {
  const [selectedCollana, setSelectedCollana] = useState<string | null>(null);

  const collanaStats = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const item of items) {
      const macro = getMacroCollanaBlocked(item);
      counts[macro] = (counts[macro] || 0) + 1;
    }
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [items]);

  const filtered = useMemo(() => {
    return items.filter(it => {
      if (selectedCollana !== null && getMacroCollanaBlocked(it) !== selectedCollana) {
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

  const filteredOutThisWeekCount = Object.keys(blockedInWeek).length;

  return (
    <div className="space-y-3">
      {/* BARRA FILTRI PER COLLANA */}
      {items.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center space-x-1.5 text-xs font-semibold text-slate-700">
              <Filter className="w-3.5 h-3.5 text-rose-600" />
              <span>Filtra Archivio Non Ordinabili per Collana:</span>
            </div>

            {onClearAllBlocked && items.length > 0 && (
              <button
                onClick={onClearAllBlocked}
                className="inline-flex items-center px-2 py-1 rounded bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 text-[11px] font-semibold"
                title="Svuota completamente l'archivio dei Non Ordinabili"
              >
                <Trash2 className="w-3 h-3 mr-1" />
                Svuota Archivio ({items.length})
              </button>
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

            {collanaStats.map(([nomeCollana, total]) => {
              const isSelected = selectedCollana === nomeCollana;
              return (
                <button
                  key={nomeCollana}
                  onClick={() => setSelectedCollana(isSelected ? null : nomeCollana)}
                  className={`inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs transition-all ${
                    isSelected
                      ? 'bg-rose-600 text-white font-bold shadow-sm'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 font-medium'
                  }`}
                >
                  <span>{nomeCollana}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                      isSelected ? 'bg-rose-700 text-white' : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {total}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* TABELLA ARCHIVIO NON ORDINABILI */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-3 py-2 bg-rose-50/80 border-b border-rose-200 text-rose-900 text-xs flex items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <Ban className="w-3.5 h-3.5 text-rose-700 shrink-0" />
            <div>
              <span className="font-semibold">Database Permanente Non Ordinabili / Esauriti: </span>
              Questi titoli restano salvati anche quando clicchi <strong>Nuova Settimana</strong> e non ti vengono più proposti nella scheda Mail. Usa <strong>Ripristina</strong> per rimetterli nell'elenco ordinabile.
            </div>
          </div>
          {filteredOutThisWeekCount > 0 && (
            <span className="shrink-0 inline-flex items-center px-2 py-0.5 rounded-full bg-rose-200/80 text-rose-900 font-bold text-[11px]">
              {filteredOutThisWeekCount} filtrati questa settimana
            </span>
          )}
        </div>

        <div className="overflow-x-auto max-h-[650px] overflow-y-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-100 text-slate-700 sticky top-0 z-10 border-b border-slate-200 uppercase font-semibold tracking-tight text-[10px]">
              <tr>
                <th className="py-1.5 px-2 text-center w-24 whitespace-nowrap">Azione</th>
                <th className="py-1.5 px-2 text-center w-20 whitespace-nowrap">Settimana</th>
                <th className="py-1.5 px-2 font-mono w-28 whitespace-nowrap">Codice</th>
                <th className="py-1.5 px-2">Titolo Albo</th>
                <th className="py-1.5 px-2 text-right w-16 whitespace-nowrap">Prezzo</th>
                <th className="py-1.5 px-2 w-40 whitespace-nowrap">Collana PDF</th>
                <th className="py-1.5 px-2 text-right w-28 whitespace-nowrap">Salvato il</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-slate-500">
                    {items.length === 0
                      ? 'Nessun titolo salvato nei Non Ordinabili. Nella scheda "2. Ordine Mail con Codici" clicca su "Non ord." accanto ai titoli esauriti.'
                      : 'Nessun risultato corrisponde ai filtri selezionati.'}
                  </td>
                </tr>
              ) : (
                filtered.map((item) => {
                  const soldThisWeek = blockedInWeek[item.key] || 0;
                  const hasTaglia = !!item.misura && item.misura !== '-';
                  const hasColore = !!item.colore && item.colore !== '-';

                  return (
                    <tr key={item.key} className="hover:bg-rose-50/30 transition-colors">
                      {/* PULSANTE RIPRISTINA */}
                      <td className="py-1 px-1.5 text-center whitespace-nowrap">
                        <button
                          onClick={() => onRestoreItem(item.key)}
                          className="inline-flex items-center px-2 py-0.5 rounded font-semibold text-[11px] bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-colors"
                          title="Rimuovi dai Non Ordinabili e rimetti nella lista Ordine Mail"
                        >
                          <RotateCcw className="w-3 h-3 mr-1" />
                          Ripristina
                        </button>
                      </td>

                      {/* VENDUTI NELLA SETTIMANA CORRENTE */}
                      <td className="py-1 px-1.5 text-center whitespace-nowrap">
                        {soldThisWeek > 0 ? (
                          <span
                            className="inline-flex items-center px-1.5 py-0 rounded bg-rose-100 text-rose-800 font-bold text-[10px]"
                            title={`Vendute ${soldThisWeek} copie nei PDF caricati questa settimana (nascoste automaticamente dall'ordine Mail)`}
                          >
                            {soldThisWeek} vend.
                          </span>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>

                      {/* CODICE BONELLI */}
                      <td className="py-1 px-2 whitespace-nowrap">
                        <span className="inline-block font-mono font-bold px-1.5 py-0 rounded text-xs bg-slate-100 text-slate-700 border border-slate-200">
                          {item.codiceBonelli}
                        </span>
                      </td>

                      {/* TITOLO */}
                      <td className="py-1 px-2 font-medium text-slate-800">
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
                      <td className="py-1 px-2 text-right font-medium text-slate-600 whitespace-nowrap">
                        {item.prezzoVendita ? `${item.prezzoVendita} €` : '-'}
                      </td>

                      {/* COLLANA */}
                      <td className="py-1 px-2 text-slate-500 text-[11px] whitespace-nowrap">
                        {item.collana}
                      </td>

                      {/* DATA ARCHIVIAZIONE */}
                      <td className="py-1 px-2 text-right text-slate-400 text-[10px] whitespace-nowrap">
                        {item.addedAt}
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
            Mostrati {filtered.length} di {items.length} titoli in archivio{' '}
            {selectedCollana && `(Filtro: ${selectedCollana})`}
          </span>
          <span>Archivio permanente salvato nel browser e incluso nei file Backup</span>
        </div>
      </div>
    </div>
  );
};
