import { useState } from 'react';
import { Calendar, Copy, Loader2, FileSpreadsheet } from 'lucide-react';
import * as XLSX from 'xlsx';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface BulkColumn {
  /** DB column name to SELECT */
  field: string;
  /** Header label used in Excel export */
  header: string;
}

interface Props {
  table: 'orders' | 'incomplete_orders' | 'blocked_order_attempts' | 'order_fingerprints';
  label?: string;
  fileBaseName?: string;
  /** Which columns to copy/export. Defaults to Customer Name, Phone, Address. */
  columns?: BulkColumn[];
}

const DEFAULT_COLUMNS: BulkColumn[] = [
  { field: 'customer_name', header: 'Customer Name' },
  { field: 'phone', header: 'Phone Number' },
  { field: 'address', header: 'Address' },
];

/**
 * Date/time range bulk tool.
 * One click fetches all matching rows (bypassing pagination),
 * sorts ascending by created_at, and copies/exports as TSV ready for Excel/Sheets.
 */
export const DateRangeBulkSelector = ({
  table,
  label = 'Range select',
  fileBaseName = 'orders-range',
  columns = DEFAULT_COLUMNS,
}: Props) => {
  const { toast } = useToast();
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [loading, setLoading] = useState(false);

  const selectClause = ['id', 'created_at', ...columns.map((c) => c.field)]
    .filter((v, i, arr) => arr.indexOf(v) === i)
    .join(', ');

  const fetchRange = async (): Promise<Record<string, any>[]> => {
    const startISO = start ? new Date(start).toISOString() : null;
    const endISO = end ? new Date(end).toISOString() : null;
    if (!startISO && !endISO) {
      toast({ variant: 'destructive', title: 'Pick a date range', description: 'Choose a start and/or end date/time' });
      return [];
    }
    const all: Record<string, any>[] = [];
    const pageSize = 1000;
    let from = 0;
    while (true) {
      let q = supabase
        .from(table)
        .select(selectClause)
        .order('created_at', { ascending: true })
        .range(from, from + pageSize - 1);
      if (startISO) q = q.gte('created_at', startISO);
      if (endISO) q = q.lte('created_at', endISO);
      const { data, error } = await q;
      if (error) throw error;
      const batch = (data ?? []) as Record<string, any>[];
      all.push(...batch);
      if (batch.length < pageSize) break;
      from += pageSize;
    }
    return all;
  };

  const copyInRange = async () => {
    setLoading(true);
    try {
      const rows = await fetchRange();
      if (rows.length === 0) {
        toast({ title: 'No records found', description: 'No records match the selected date range' });
        return;
      }
      const tsv = rows
        .map((r) => columns.map((c) => String(r[c.field] ?? '')).join('\t'))
        .join('\n');
      await navigator.clipboard.writeText(tsv);
      toast({ title: 'Copied to clipboard', description: `${rows.length} record(s) copied (oldest first)` });
    } catch (err: any) {
      console.error(err);
      toast({ variant: 'destructive', title: 'Error', description: err.message || 'Failed to copy' });
    } finally {
      setLoading(false);
    }
  };

  const exportInRange = async () => {
    setLoading(true);
    try {
      const rows = await fetchRange();
      if (rows.length === 0) {
        toast({ title: 'No records found', description: 'No records match the selected date range' });
        return;
      }
      const sheetRows = rows.map((r) => {
        const o: Record<string, string> = {};
        columns.forEach((c) => {
          o[c.header] = String(r[c.field] ?? '');
        });
        return o;
      });
      const ws = XLSX.utils.json_to_sheet(sheetRows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Records');
      const dateStr = new Date().toISOString().split('T')[0];
      XLSX.writeFile(wb, `${fileBaseName}-${dateStr}.xlsx`);
      toast({ title: 'Exported', description: `${rows.length} record(s) downloaded (oldest first)` });
    } catch (err: any) {
      console.error(err);
      toast({ variant: 'destructive', title: 'Error', description: err.message || 'Failed to export' });
    } finally {
      setLoading(false);
    }
  };

  const tsvFormat = columns.map((c) => c.header).join(' [TAB] ');

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
          onClick={copyInRange}
          disabled={loading}
          style={{ backgroundColor: '#16a34a', color: '#ffffff' }}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 font-semibold shadow-sm"
        >
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Copy className="w-3.5 h-3.5" />}
          Copy in Range
        </button>
        <button
          onClick={exportInRange}
          disabled={loading}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileSpreadsheet className="w-3.5 h-3.5" />}
          Export Excel
        </button>
      </div>
      <p className="text-xs text-muted-foreground">
        Sorts oldest → newest · format: {tsvFormat}
      </p>
    </div>
  );
};
