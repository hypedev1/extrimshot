import { useCallback, useEffect, useMemo, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';

interface Options<T> {
  items: T[];
  getId: (item: T) => string;
  toRow: (item: T) => Record<string, string | number>;
  /** WhatsApp/plain text per row (multi-line block) */
  toTextBlock?: (item: T, index: number) => string;
  fileBaseName?: string;
  enableShortcuts?: boolean;
  /** Optional explicit serial number resolver (e.g. DB column). If not provided,
   *  serial is computed by sorting items chronologically (oldest=1). */
  getSerial?: (item: T) => number;
  /** Optional chronological key (default: item.created_at). Used when getSerial absent. */
  getOrderKey?: (item: T) => string | number | Date | undefined;
}

export function useBulkSelection<T>({
  items,
  getId,
  toRow,
  toTextBlock,
  fileBaseName = 'selected',
  enableShortcuts = true,
  getSerial,
  getOrderKey,
}: Options<T>) {
  const { toast } = useToast();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const itemIds = useMemo(() => items.map(getId), [items, getId]);
  const allSelected = itemIds.length > 0 && itemIds.every((id) => selectedIds.has(id));
  const someSelected = !allSelected && itemIds.some((id) => selectedIds.has(id));

  // Build chronological serial map: oldest = 1
  const serialMap = useMemo(() => {
    const map = new Map<string, number>();
    if (getSerial) {
      items.forEach((it) => map.set(getId(it), getSerial(it)));
      return map;
    }
    const keyOf = (it: T) => {
      const v = getOrderKey ? getOrderKey(it) : (it as any)?.created_at;
      if (!v) return 0;
      const t = v instanceof Date ? v.getTime() : new Date(v as any).getTime();
      return isNaN(t) ? 0 : t;
    };
    const sorted = items.slice().sort((a, b) => keyOf(a) - keyOf(b));
    sorted.forEach((it, i) => map.set(getId(it), i + 1));
    return map;
  }, [items, getId, getSerial, getOrderKey]);

  const serialOf = useCallback((id: string) => serialMap.get(id) ?? 0, [serialMap]);

  const toggleOne = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelectedIds(new Set(itemIds));
  }, [itemIds]);

  const clear = useCallback(() => setSelectedIds(new Set()), []);

  const toggleAll = useCallback(() => {
    if (allSelected) clear();
    else selectAll();
  }, [allSelected, clear, selectAll]);

  /** Replace selection with all loaded items whose serial is within [from, to]. Returns matched count. */
  const selectSerialRange = useCallback(
    (from: number, to: number): number => {
      const lo = Math.min(from, to);
      const hi = Math.max(from, to);
      const matched = new Set<string>();
      items.forEach((it) => {
        const s = serialMap.get(getId(it)) ?? 0;
        if (s >= lo && s <= hi) matched.add(getId(it));
      });
      setSelectedIds(matched);
      return matched.size;
    },
    [items, getId, serialMap]
  );

  const selectedItems = useMemo(
    () =>
      items
        .filter((i) => selectedIds.has(getId(i)))
        .slice()
        .sort((a, b) => (serialMap.get(getId(a)) ?? 0) - (serialMap.get(getId(b)) ?? 0)),
    [items, selectedIds, getId, serialMap]
  );

  const copySelected = useCallback(async () => {
    if (selectedItems.length === 0) {
      toast({ variant: 'destructive', title: 'Nothing selected', description: 'Select at least one row' });
      return;
    }
    const textBlock = toTextBlock
      ? selectedItems.map((item, i) => toTextBlock(item, i)).join('\n')
      : (() => {
          const rows = selectedItems.map(toRow);
          const headers = Object.keys(rows[0] ?? {});
          return [headers.join('\t'), ...rows.map((r) => headers.map((h) => String(r[h] ?? '')).join('\t'))].join('\n');
        })();

    try {
      await navigator.clipboard.writeText(textBlock);
      toast({ title: 'Copied', description: `${selectedItems.length} row(s) copied` });
    } catch {
      toast({ variant: 'destructive', title: 'Error', description: 'Clipboard blocked' });
    }
  }, [selectedItems, toRow, toTextBlock, toast]);

  /** Select by serial range then copy in one click. */
  const selectSerialRangeAndCopy = useCallback(
    async (from: number, to: number) => {
      const lo = Math.min(from, to);
      const hi = Math.max(from, to);
      const matched = items.filter((it) => {
        const s = serialMap.get(getId(it)) ?? 0;
        return s >= lo && s <= hi;
      });
      if (matched.length === 0) {
        toast({ variant: 'destructive', title: 'No rows in range', description: `No records with SL ${lo}-${hi}` });
        return;
      }
      setSelectedIds(new Set(matched.map(getId)));
      const sorted = matched.slice().sort(
        (a, b) => (serialMap.get(getId(a)) ?? 0) - (serialMap.get(getId(b)) ?? 0)
      );
      const textBlock = toTextBlock
        ? sorted.map((item, i) => toTextBlock(item, i)).join('\n')
        : (() => {
            const rows = sorted.map(toRow);
            const headers = Object.keys(rows[0] ?? {});
            return [headers.join('\t'), ...rows.map((r) => headers.map((h) => String(r[h] ?? '')).join('\t'))].join('\n');
          })();
      try {
        await navigator.clipboard.writeText(textBlock);
        toast({ title: 'Copied', description: `${sorted.length} row(s) (SL ${lo}-${hi}) copied` });
      } catch {
        toast({ variant: 'destructive', title: 'Error', description: 'Clipboard blocked' });
      }
    },
    [items, getId, serialMap, toRow, toTextBlock, toast]
  );

  const exportSelected = useCallback((format: 'xlsx' | 'csv') => {
    if (selectedItems.length === 0) {
      toast({ variant: 'destructive', title: 'Nothing selected', description: 'Select at least one row' });
      return;
    }
    const rows = selectedItems.map(toRow);
    const ws = XLSX.utils.json_to_sheet(rows);
    const dateStr = new Date().toISOString().split('T')[0];
    if (format === 'csv') {
      const csv = XLSX.utils.sheet_to_csv(ws);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${fileBaseName}-${dateStr}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Selected');
      XLSX.writeFile(wb, `${fileBaseName}-${dateStr}.xlsx`);
    }
    toast({ title: 'Exported', description: `${rows.length} row(s) downloaded` });
  }, [selectedItems, toRow, fileBaseName, toast]);

  // Keyboard shortcuts: Ctrl/Cmd+A select all, Ctrl/Cmd+C copy selected
  useEffect(() => {
    if (!enableShortcuts) return;
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName;
      const isEditable = tag === 'INPUT' || tag === 'TEXTAREA' || target?.isContentEditable;
      if (isEditable) return;
      const mod = e.ctrlKey || e.metaKey;
      if (!mod) return;
      if (e.key === 'a' || e.key === 'A') {
        e.preventDefault();
        selectAll();
      } else if ((e.key === 'c' || e.key === 'C') && selectedIds.size > 0) {
        e.preventDefault();
        void copySelected();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [enableShortcuts, selectAll, copySelected, selectedIds]);

  return {
    selectedIds,
    selectedItems,
    selectedCount: selectedIds.size,
    isSelected: (id: string) => selectedIds.has(id),
    toggleOne,
    toggleAll,
    selectAll,
    clear,
    allSelected,
    someSelected,
    copySelected,
    exportSelected,
    serialOf,
    selectSerialRange,
    selectSerialRangeAndCopy,
    totalLoaded: items.length,
  };
}
