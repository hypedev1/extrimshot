import { Copy, Download, X, FileSpreadsheet } from 'lucide-react';

interface Props {
  count: number;
  onCopy: () => void;
  onExportXlsx: () => void;
  onExportCsv: () => void;
  onClear: () => void;
  onSelectAll: () => void;
  allSelected: boolean;
}

export const BulkActionsToolbar = ({
  count,
  onCopy,
  onExportXlsx,
  onExportCsv,
  onClear,
  onSelectAll,
  allSelected,
}: Props) => {
  if (count === 0) return null;
  return (
    <div className="sticky top-0 z-20 card-glass p-3 flex flex-wrap items-center gap-2 border border-primary/40">
      <span className="font-semibold text-sm px-2">
        {count} selected
      </span>
      <button
        onClick={onSelectAll}
        className="text-xs px-3 py-1.5 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors"
      >
        {allSelected ? 'Deselect all (loaded)' : 'Select all (loaded)'}
      </button>
      <button
        onClick={onCopy}
        className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
        title="Copy selected (Ctrl+C)"
      >
        <Copy className="w-3.5 h-3.5" /> Copy Selected
      </button>
      <button
        onClick={onExportXlsx}
        className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-green-600 hover:bg-green-700 text-white transition-colors"
      >
        <FileSpreadsheet className="w-3.5 h-3.5" /> Export Excel
      </button>
      <button
        onClick={onExportCsv}
        className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors"
      >
        <Download className="w-3.5 h-3.5" /> Export CSV
      </button>
      <button
        onClick={onClear}
        className="ml-auto p-1.5 rounded-lg hover:bg-secondary text-muted-foreground"
        title="Clear selection"
      >
        <X className="w-4 h-4" />
      </button>
      <span className="text-[10px] text-muted-foreground w-full sm:w-auto">
        Shortcuts: Ctrl+A select all · Ctrl+C copy
      </span>
    </div>
  );
};
