import { useState } from 'react';
import { Calendar, Copy, Loader2, FileSpreadsheet } from 'lucide-react';
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
 * Date/time range bulk tool.
 * One click fetches all matching orders (bypassing pagination),
 * sorts ascending by created_at, and copies/exports
 * Name [TAB] Phone [TAB] Address — ready for Excel/Sheets.
 */
export const DateRangeBulkSelector = ({ table, label = 'Range select', fileBaseName = 'orders-range' }: Props) => {
  const { toast } = useToast();
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [loading, setLoading] = useState(false);

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

  const copyOrdersInRange = async () => {
    setLoading(true);
    try {
      const rows = await fetchRange();
      if (rows.length === 0) {
        toast({ title: 'No orders found', description: 'No orders match the selected date range' });
        return;
      }
      const tsv = rows
        .map((o) => `${o.customer_name ?? ''}\t${o.phone}\t${o.address ?? ''}`)
        .join('\n');
      await navigator.clipboard.writeText(tsv);
      toast({ title: 'Copied to clipboard', description: `${rows.length} order(s) copied (oldest first)` });
    } catch (err: any) {
      console.error(err);
      toast({ variant: 'destructive', title: 'Error', description: err.message || 'Failed to copy orders' });
    } finally {
      setLoading(false);
    }
  };

  const exportOrdersInRange = async () => {
    setLoading(true);
    try {
      const rows = await fetchRange();
      if (rows.length === 0) {
        toast({ title: 'No orders found', description: 'No orders match the selected date range' });
        return;
      }
      const sheetRows = rows.map((o) => ({
        'Customer Name': o.customer_name ?? '',
        'Phone Number': o.phone,
        'Address': o.address ?? '',
      }));
      const ws = XLSX.utils.json_to_sheet(sheetRows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Orders');
      const dateStr = new Date().toISOString().split('T')[0];
      XLSX.writeFile(wb, `${fileBaseName}-${dateStr}.xlsx`);
      toast({ title: 'Exported', description: `${rows.length} order(s) downloaded (oldest first)` });
    } catch (err: any) {
      console.error(err);
      toast({ variant: 'destructive', title: 'Error', description: err.message || 'Failed to export orders' });
    } finally {
      setLoading(false);
    }
  };

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
          onClick={copyOrdersInRange}
          disabled={loading}
          style={{ backgroundColor: '#16a34a', color: '#ffffff' }}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 font-semibold shadow-sm"
        >
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Copy className="w-3.5 h-3.5" />}
          Copy Orders in Range
        </button>
        <button
          onClick={exportOrdersInRange}
          disabled={loading}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileSpreadsheet className="w-3.5 h-3.5" />}
          Export Excel
        </button>
      </div>
      <p className="text-xs text-muted-foreground">
        Sorts oldest → newest · format: Name [TAB] Phone [TAB] Address
      </p>
    </div>
  );
};
