import { useState } from 'react';
import { Copy, ListChecks } from 'lucide-react';

interface Props {
  totalLoaded: number;
  onSelectRange: (from: number, to: number) => number;
  onSelectAndCopy: (from: number, to: number) => void | Promise<void>;
}

export const SerialRangeSelector = ({ totalLoaded, onSelectRange, onSelectAndCopy }: Props) => {
  const [from, setFrom] = useState<string>('');
  const [to, setTo] = useState<string>('');

  const parse = (): [number, number] | null => {
    const f = parseInt(from, 10);
    const t = parseInt(to, 10);
    if (isNaN(f) || isNaN(t) || f < 1 || t < 1) return null;
    return [f, t];
  };

  return (
    <div className="card-glass p-3 flex flex-wrap items-center gap-2 border border-border">
      <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
        <ListChecks className="w-3.5 h-3.5" /> SL Range
      </span>
      <div className="flex items-center gap-1">
        <input
          type="number"
          min={1}
          placeholder="From"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          className="w-20 bg-secondary border border-border rounded-lg px-2 py-1.5 text-xs"
        />
        <span className="text-muted-foreground text-xs">–</span>
        <input
          type="number"
          min={1}
          placeholder="To"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          className="w-20 bg-secondary border border-border rounded-lg px-2 py-1.5 text-xs"
        />
      </div>
      <button
        onClick={() => {
          const r = parse();
          if (r) onSelectRange(r[0], r[1]);
        }}
        className="text-xs px-3 py-1.5 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors"
      >
        Select
      </button>
      <button
        onClick={() => {
          const r = parse();
          if (r) void onSelectAndCopy(r[0], r[1]);
        }}
        className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
      >
        <Copy className="w-3.5 h-3.5" /> Select &amp; Copy
      </button>
      <span className="text-[10px] text-muted-foreground ml-auto">
        {totalLoaded} loaded · enter e.g. 1–50
      </span>
    </div>
  );
};
