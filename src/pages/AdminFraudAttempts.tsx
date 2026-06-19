import { useState, useEffect } from 'react';
import { ShieldAlert, Trash2, Search, RefreshCw, Phone, Monitor, Globe, Clock, Copy } from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { DateRangeBulkSelector } from '@/components/admin/DateRangeBulkSelector';
import { BulkActionsToolbar } from '@/components/admin/BulkActionsToolbar';
import { SerialRangeSelector } from '@/components/admin/SerialRangeSelector';
import { useBulkSelection } from '@/hooks/useBulkSelection';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface FraudAttempt {
  id: string;
  fingerprint: string;
  ip_address: string | null;
  phone: string;
  user_agent: string | null;
  screen_resolution: string | null;
  timezone: string | null;
  language: string | null;
  created_at: string;
}

const AdminFraudAttempts = () => {
  const { toast } = useToast();
  const [attempts, setAttempts] = useState<FraudAttempt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAttempt, setSelectedAttempt] = useState<FraudAttempt | null>(null);

  const fetchAttempts = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('order_fingerprints')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAttempts(data || []);
    } catch (error: any) {
      console.error('Error fetching fraud attempts:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load data'
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAttempts();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('fraud-attempts-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'order_fingerprints' },
        () => {
          fetchAttempts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('order_fingerprints')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setAttempts(prev => prev.filter(a => a.id !== id));
      setSelectedAttempt(null);
      toast({
        title: 'Success',
        description: 'Record deleted'
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message
      });
    }
  };

  const handleClearOld = async () => {
    const cutoff = new Date();
    cutoff.setHours(cutoff.getHours() - 24);

    try {
      const { error } = await supabase
        .from('order_fingerprints')
        .delete()
        .lt('created_at', cutoff.toISOString());

      if (error) throw error;

      fetchAttempts();
      toast({
        title: 'Success',
        description: 'Records older than 24 hours deleted'
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message
      });
    }
  };

  const filteredAttempts = attempts.filter(attempt =>
    attempt.phone.toLowerCase().includes(searchQuery.toLowerCase()) ||
    attempt.fingerprint.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (attempt.ip_address && attempt.ip_address.includes(searchQuery))
  );

  const bulk = useBulkSelection<FraudAttempt>({
    items: filteredAttempts,
    getId: (a) => a.id,
    fileBaseName: 'fraud-attempts-selected',
    toRow: (a) => ({
      Phone: a.phone,
      IP: a.ip_address || '',
      Fingerprint: a.fingerprint,
      Date: new Date(a.created_at).toLocaleString('en-US'),
    }),
    toTextBlock: (a) => `${a.phone}\t${a.ip_address || ''}\t${a.fingerprint}`,
  });

  // Group by fingerprint to identify repeat attempts
  const fingerprintCounts = attempts.reduce((acc, a) => {
    acc[a.fingerprint] = (acc[a.fingerprint] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const ipCounts = attempts.reduce((acc, a) => {
    if (a.ip_address) {
      acc[a.ip_address] = (acc[a.ip_address] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  const stats = {
    total: attempts.length,
    last24h: attempts.filter(a => {
      const created = new Date(a.created_at);
      const now = new Date();
      return (now.getTime() - created.getTime()) < 24 * 60 * 60 * 1000;
    }).length,
    uniqueDevices: Object.keys(fingerprintCounts).length,
    suspiciousDevices: Object.values(fingerprintCounts).filter(c => c > 1).length
  };

  const formatDate = (dateStr: string) => {
    return format(new Date(dateStr), 'dd MMM yyyy, hh:mm a');
  };

  const truncate = (str: string, len: number) => {
    if (str.length <= len) return str;
    return str.substring(0, len) + '...';
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="card-glass p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                <ShieldAlert className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Total Records</p>
              </div>
            </div>
          </div>

          <div className="card-glass p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center">
                <Clock className="w-5 h-5 text-accent" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.last24h}</p>
                <p className="text-xs text-muted-foreground">Last 24 Hours</p>
              </div>
            </div>
          </div>

          <div className="card-glass p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                <Monitor className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.uniqueDevices}</p>
                <p className="text-xs text-muted-foreground">Unique Devices</p>
              </div>
            </div>
          </div>

          <div className="card-glass p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-destructive/20 flex items-center justify-center">
                <ShieldAlert className="w-5 h-5 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.suspiciousDevices}</p>
                <p className="text-xs text-muted-foreground">Suspicious Devices</p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="relative flex-1 max-w-md w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by phone, IP or fingerprint..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-secondary border border-border rounded-xl pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={fetchAttempts}
              className="flex items-center gap-2 px-4 py-2 bg-secondary hover:bg-secondary/80 rounded-xl transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <button
              onClick={handleClearOld}
              className="flex items-center gap-2 px-4 py-2 bg-destructive/10 hover:bg-destructive/20 text-destructive rounded-xl transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              <span className="hidden sm:inline">Delete Old</span>
            </button>
          </div>
        </div>

        <DateRangeBulkSelector
          table="order_fingerprints"
          label="Bulk select fraud attempts by date range"
          fileBaseName="fraud-attempts"
          columns={[
            { field: 'phone', header: 'Phone Number' },
            { field: 'ip_address', header: 'IP Address' },
            { field: 'fingerprint', header: 'Fingerprint' },
          ]}
        />

        <SerialRangeSelector
          totalLoaded={bulk.totalLoaded}
          onSelectRange={bulk.selectSerialRange}
          onSelectAndCopy={bulk.selectSerialRangeAndCopy}
        />

        <BulkActionsToolbar
          count={bulk.selectedCount}
          allSelected={bulk.allSelected}
          onCopy={bulk.copySelected}
          onExportXlsx={() => bulk.exportSelected('xlsx')}
          onExportCsv={() => bulk.exportSelected('csv')}
          onClear={bulk.clear}
          onSelectAll={bulk.allSelected ? bulk.clear : bulk.selectAll}
        />

        {/* Table */}
        <div className="card-glass overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">
              Loading...
            </div>
          ) : filteredAttempts.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              No records found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-secondary/50">
                  <tr>
                    <th className="px-3 py-3 w-10">
                      <Checkbox
                        checked={bulk.allSelected ? true : bulk.someSelected ? 'indeterminate' : false}
                        onCheckedChange={() => bulk.toggleAll()}
                        aria-label="Select all"
                      />
                    </th>
                    <th className="text-left px-4 py-3 text-sm font-medium w-12">SL</th>
                    <th className="text-left px-4 py-3 text-sm font-medium">Phone</th>
                    <th className="text-left px-4 py-3 text-sm font-medium hidden md:table-cell">IP</th>
                    <th className="text-left px-4 py-3 text-sm font-medium hidden lg:table-cell">Device</th>
                    <th className="text-left px-4 py-3 text-sm font-medium">Time</th>
                    <th className="text-left px-4 py-3 text-sm font-medium">Status</th>
                    <th className="text-right px-4 py-3 text-sm font-medium">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredAttempts.map((attempt, idx) => {
                    const isRepeatDevice = fingerprintCounts[attempt.fingerprint] > 1;
                    const isRepeatIP = attempt.ip_address && ipCounts[attempt.ip_address] > 1;
                    const selected = bulk.isSelected(attempt.id);

                    return (
                      <tr
                        key={attempt.id}
                        className={`hover:bg-secondary/30 cursor-pointer ${selected ? 'bg-primary/10' : ''}`}
                        onClick={() => setSelectedAttempt(attempt)}
                      >
                        <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            checked={selected}
                            onCheckedChange={() => bulk.toggleOne(attempt.id)}
                            aria-label={`Select row ${idx + 1}`}
                          />
                        </td>
                        <td className="px-4 py-3 font-mono text-sm text-muted-foreground">#{idx + 1}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4 text-muted-foreground" />
                            <span className="font-medium">{attempt.phone}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          <div className="flex items-center gap-2">
                            <Globe className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm">{attempt.ip_address || 'N/A'}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell">
                          <span className="text-xs font-mono text-muted-foreground">
                            {truncate(attempt.fingerprint, 12)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          {formatDate(attempt.created_at)}
                        </td>
                        <td className="px-4 py-3">
                          {isRepeatDevice || isRepeatIP ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-destructive/20 text-destructive rounded-full text-xs font-medium">
                              <ShieldAlert className="w-3 h-3" />
                              Suspicious
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-accent/20 text-accent rounded-full text-xs font-medium">
                              Normal
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                const tsv = `${attempt.phone}\t${attempt.ip_address || ''}\t${attempt.fingerprint}`;
                                navigator.clipboard.writeText(tsv);
                                toast({ title: 'Copied', description: 'Info copied to clipboard' });
                              }}
                              className="p-2 hover:bg-primary/10 text-primary rounded-lg transition-colors"
                              title="Copy (Phone, IP, Fingerprint)"
                            >
                              <Copy className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(attempt.id);
                              }}
                              className="p-2 hover:bg-destructive/10 text-destructive rounded-lg transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Detail Modal */}
        {selectedAttempt && (
          <div 
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedAttempt(null)}
          >
            <div 
              className="bg-card border border-border rounded-2xl max-w-lg w-full max-h-[90vh] overflow-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-border">
                <h3 className="text-lg font-bold">Record Details</h3>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Phone Number</p>
                  <p className="font-medium">{selectedAttempt.phone}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">IP Address</p>
                  <p className="font-medium">{selectedAttempt.ip_address || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Fingerprint</p>
                  <p className="font-mono text-sm break-all">{selectedAttempt.fingerprint}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Screen Resolution</p>
                  <p className="font-medium">{selectedAttempt.screen_resolution || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Timezone</p>
                  <p className="font-medium">{selectedAttempt.timezone || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Language</p>
                  <p className="font-medium">{selectedAttempt.language || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">User Agent</p>
                  <p className="text-xs font-mono break-all text-muted-foreground">{selectedAttempt.user_agent || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Time</p>
                  <p className="font-medium">{formatDate(selectedAttempt.created_at)}</p>
                </div>
              </div>
              <div className="p-6 border-t border-border flex gap-3">
                <button
                  onClick={() => handleDelete(selectedAttempt.id)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-destructive text-destructive-foreground rounded-xl hover:bg-destructive/90 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
                <button
                  onClick={() => setSelectedAttempt(null)}
                  className="flex-1 px-4 py-2 bg-secondary hover:bg-secondary/80 rounded-xl transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminFraudAttempts;