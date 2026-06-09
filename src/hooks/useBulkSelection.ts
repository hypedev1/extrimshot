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
}

export function useBulkSelection<T>({
  items,
  getId,
  toRow,
  toTextBlock,
  fileBaseName = 'selected',
  enableShortcuts = true,
}: Options<T>) {
  const { toast } = useToast();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const itemIds = useMemo(() => items.map(getId), [items, getId]);
  const allSelected = itemIds.length > 0 && itemIds.every((id) => selectedIds.has(id));
  const someSelected = !allSelected && itemIds.some((id) => selectedIds.has(id));

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

  const selectedItems = useMemo(
    () =>
      items
        .filter((i) => selectedIds.has(getId(i)))
        .slice()
        .sort((a, b) => {
          const ax = (a as any)?.created_at ? new Date((a as any).created_at).getTime() : 0;
          const bx = (b as any)?.created_at ? new Date((b as any).created_at).getTime() : 0;
          return ax - bx;
        }),
    [items, selectedIds, getId]
  );

  const copySelected = useCallback(async () => {
    if (selectedItems.length === 0) {
      toast({ variant: 'destructive', title: 'Nothing selected', description: 'Select at least one row' });
      return;
    }
    // If a text-block formatter is provided, use it directly (expected to be tab-separated);
    // otherwise fall back to a simple TSV derived from toRow.
    const textBlock = toTextBlock
      ? selectedItems.map((item, i) => toTextBlock(item, i)).join('\n')
      : (() => {
          const rows = selectedItems.map(toRow);
          const headers = Object.keys(rows[0] ?? {});
          return [headers.join('\t'), ...rows.map((r) => headers.map((h) => String(r[h] ?? '')).join('\t'))].join('\n');
        })();

    try {
      await navigator.clipboard.writeText(textBlock);
      toast({ title: 'Copied', description: `${selectedItems.length} order(s) copied` });
    } catch {
      toast({ variant: 'destructive', title: 'Error', description: 'Clipboard blocked' });
    }
  }, [selectedItems, toRow, toTextBlock, toast]);

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
  };
}
