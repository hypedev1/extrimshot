import { useState } from 'react';
import { Calendar, Copy, Loader2, X, FileSpreadsheet } from 'lucide-react';
import * as XLSX from 'xlsx';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface RowLite {
  id: string;
  customer_name: string | null;
  phone: string;
  address: string | null;
  created_at: string;
}

interface Props {
  table: 'orders' | 'incomplete_orders';
  label?: string;
  fileBaseName?: string;
}

/**
 * Date/time range bulk selector that queries the ENTIRE database table
 * (bypassing pagination), sorts ascending by created_at, and copies/exports
 * a TSV with Customer Name, Phone, Address — ready to paste into Excel/Sheets.
 */
export const DateRangeBulkSelector = ({ table, label = 'Range select', fileBaseName = 'orders-range' }: Props) => {
  const { toast } = useToast();
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<RowLite[]>([]);

  const fetchRange = async (): Promise<RowLite[]> => {
    const startISO = start ? new Date(start).toISOString() : null;
    const endISO = end ? new Date(end).toISOString() : null;
    if (!startISO && !endISO) {
      toast({ variant: 'destructive', title: 'Pick a date range', description: 'Choose a start and/or end date/time' });
      return [];
    }
    const all: RowLite[] = [];
    const pageSize = 1000;
    let from = 0;
    while (true) {
      let q = supabase
        .from(table)
        .select('id, customer_name, phone, address, created_at')
        .order('created_at', { ascending: true })
        .range(from, from + pageSize - 1);
      if (startISO) q = q.gte('created_at', startISO);
      if (endISO) q = q.lte('created_at', endISO);
      const { data, error } = await q;
      if (error) throw error;
      const batch = (data ?? []) as RowLite[];
      all.push(...batch);
      if (batch.length < pageSize) break;
      from += pageSize;
    }
    return all;
  };

  const selectAllFiltered = async () => {
    setLoading(true);
    try {
      const rows = await fetchRange();
      setSelected(rows);
      if (rows.length > 0) {
        toast({ title: 'Selected', description: `${rows.length} order(s) selected in range` });
      } else {
        toast({ title: 'No matches', description: 'No orders in the chosen range' });
      }
    } catch (err: any) {
      console.error(err);
      toast({ variant: 'destructive', title: 'Error', description: err.message || 'Failed to fetch range' });
    } finally {
      setLoading(false);
    }
  };

  const sortedAsc = () => [...selected].sort((a, b) => a.created_at.localeCompare(b.created_at));

  const copySelected = async () => {
    if (selected.length === 0) {
      toast({ variant: 'destructive', title: 'Nothing selected', description: 'Run "Select All in Range" first' });
      return;
    }
    const tsv = sortedAsc()
      .map((o) => `${o.customer_name ?? ''}\t${o.phone}\t${o.address ?? ''}`)
      .join('\n');
    try {
      await navigator.clipboard.writeText(tsv);
      toast({ title: 'Copied for Excel', description: `${selected.length} order(s) copied (oldest first)` });
    } catch {
      toast({ variant: 'destructive', title: 'Error', description: 'Clipboard blocked' });
    }
  };

  const exportXlsx = () => {
    if (selected.length === 0) {
      toast({ variant: 'destructive', title: 'Nothing selected', description: 'Run "Select All in Range" first' });
      return;
    }
    const rows = sortedAsc().map((o) => ({
      'Customer Name': o.customer_name ?? '',
      'Phone Number': o.phone,
      'Address': o.address ?? '',
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Selected');
    const dateStr = new Date().toISOString().split('T')[0];
    XLSX.writeFile(wb, `${fileBaseName}-${dateStr}.xlsx`);
    toast({ title: 'Exported', description: `${rows.length} order(s) downloaded` });
  };

  const clear = () => setSelected([]);

  return (
    <div className="card-glass p-3 space-y-2 border border-primary/30">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1.5 text-sm font-semibold">
          <Calendar className="w-4 h-4 text-primary" /> {label}
        </div>
        <input
          type="datetime-local"
          value={start}
          onChange={(e) => setStart(e.target.value)}
          className="bg-secondary border border-border rounded-lg px-2 py-1.5 text-xs"
          title="Start date/time"
        />
        <span className="text-muted-foreground text-xs">to</span>
        <input
          type="datetime-local"
          value={end}
          onChange={(e) => setEnd(e.target.value)}
          className="bg-secondary border border-border rounded-lg px-2 py-1.5 text-xs"
          title="End date/time"
        />
        <button
          onClick={selectAllFiltered}
          disabled={loading}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
          Select All Filtered
        </button>
        {selected.length > 0 && (
          <>
            <button
              onClick={copySelected}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-green-600 hover:bg-green-700 text-white transition-colors"
            >
              <Copy className="w-3.5 h-3.5" /> Copy Selected for Excel
            </button>
            <button
              onClick={exportXlsx}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" /> Export Excel
            </button>
            <button
              onClick={clear}
              className="ml-auto p-1.5 rounded-lg hover:bg-secondary text-muted-foreground"
              title="Clear selection"
            >
              <X className="w-4 h-4" />
            </button>
          </>
        )}
      </div>
      {selected.length > 0 && (
        <p className="text-xs text-muted-foreground">
          {selected.length} order(s) selected · sorted oldest → newest · format: Name [TAB] Phone [TAB] Address
        </p>
      )}
    </div>
  );
};
