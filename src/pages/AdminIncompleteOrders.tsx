import { useEffect, useState, useCallback } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { Search, Phone, User, MapPin, Clock, Trash2, Truck, Copy, Check, Download, Loader2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { IncompleteOrderModal } from '@/components/admin/IncompleteOrderModal';

const ACKNOWLEDGED_INCOMPLETE_ORDER_KEY = 'admin_acknowledged_incomplete_order_id';
const INCOMPLETE_PAGE_SIZE = 250;

interface IncompleteOrder {
  id: string;
  serial_number: number;
  phone: string;
  customer_name: string | null;
  address: string | null;
  created_at: string;
  updated_at: string;
}

const AdminIncompleteOrders = () => {
  const [orders, setOrders] = useState<IncompleteOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [totalIncompleteCount, setTotalIncompleteCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<IncompleteOrder | null>(null);
  const [acknowledgedOrderId, setAcknowledgedOrderId] = useState<string | null>(() => {
    return localStorage.getItem(ACKNOWLEDGED_INCOMPLETE_ORDER_KEY);
  });
  const { toast } = useToast();

  const acknowledgeOrder = (orderId: string) => {
    setAcknowledgedOrderId(orderId);
    localStorage.setItem(ACKNOWLEDGED_INCOMPLETE_ORDER_KEY, orderId);
    toast({ title: 'Acknowledged', description: 'Order marked as last confirmed' });
  };

  const fetchOrders = useCallback(async (page = 0, append = false, search = '') => {
    if (append) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }

    try {
      const from = page * INCOMPLETE_PAGE_SIZE;
      const to = from + INCOMPLETE_PAGE_SIZE - 1;

      const trimmed = search.trim();
      let q = supabase.from('incomplete_orders').select('*', { count: 'exact' });
      if (trimmed) {
        const esc = trimmed.replace(/[%,()]/g, '\\$&');
        const pattern = `%${esc}%`;
        q = q.or(`customer_name.ilike.${pattern},phone.ilike.${pattern},address.ilike.${pattern}`);
      }

      const { data, error, count } = await q
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;

      const pageData = data ?? [];

      if (append) {
        setOrders((prev) => {
          const map = new Map(prev.map((order) => [order.id, order]));
          pageData.forEach((order) => map.set(order.id, order));
          return Array.from(map.values());
        });
      } else {
        setOrders(pageData);
      }

      if (typeof count === 'number') {
        setTotalIncompleteCount(count);
      }

      setCurrentPage(page);
      setHasMore(pageData.length === INCOMPLETE_PAGE_SIZE);
    } catch (error: any) {
      console.error('Error fetching incomplete orders:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load incomplete orders'
      });
      if (!append) setOrders([]);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [toast]);

  // Debounced server-side search refetch
  useEffect(() => {
    const handle = setTimeout(() => {
      fetchOrders(0, false, searchTerm);
    }, searchTerm ? 300 : 0);
    return () => clearTimeout(handle);
  }, [searchTerm, fetchOrders]);

  useEffect(() => {
    const channel = supabase
      .channel('incomplete-orders-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'incomplete_orders' },
        () => fetchOrders(0, false, searchTerm)
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchOrders, searchTerm]);

  const deleteOrder = async (id: string) => {
    try {
      const { error } = await supabase
        .from('incomplete_orders')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Incomplete order deleted'
      });
      fetchOrders(0, false, searchTerm);
    } catch (error: any) {
      console.error('Error deleting incomplete order:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete'
      });
    }
  };

  const loadMoreOrders = async () => {
    if (loadingMore || !hasMore) return;
    await fetchOrders(currentPage + 1, true);
  };

  const [exporting, setExporting] = useState<null | 'xlsx' | 'csv'>(null);
  const [exportStart, setExportStart] = useState('');
  const [exportEnd, setExportEnd] = useState('');
  const downloadExport = async (format: 'xlsx' | 'csv') => {
    setExporting(format);
    try {
      const all: IncompleteOrder[] = [];
      const pageSize = 1000;
      let from = 0;
      const startISO = exportStart ? new Date(exportStart).toISOString() : null;
      const endISO = exportEnd ? new Date(exportEnd).toISOString() : null;
      while (true) {
        let q = supabase
          .from('incomplete_orders')
          .select('*')
          .order('serial_number', { ascending: true })
          .range(from, from + pageSize - 1);
        if (startISO) q = q.gte('created_at', startISO);
        if (endISO) q = q.lte('created_at', endISO);
        const { data, error } = await q;
        if (error) throw error;
        const batch = (data ?? []) as IncompleteOrder[];
        all.push(...batch);
        if (batch.length < pageSize) break;
        from += pageSize;
      }
      const rows = all.map(o => ({
        'SL': o.serial_number,
        'Name': o.customer_name || '',
        'Phone Number': o.phone,
        'Address': o.address || '',
      }));
      const ws = XLSX.utils.json_to_sheet(rows);
      const dateStr = new Date().toISOString().split('T')[0];
      if (format === 'csv') {
        const csv = XLSX.utils.sheet_to_csv(ws);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `incomplete-orders-${dateStr}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Incomplete Orders');
        XLSX.writeFile(wb, `incomplete-orders-${dateStr}.xlsx`);
      }
      toast({ title: 'Exported', description: `${rows.length} incomplete orders downloaded` });
    } catch (err: any) {
      console.error('Export error:', err);
      toast({ variant: 'destructive', title: 'Export failed', description: err.message || 'Could not export' });
    } finally {
      setExporting(null);
    }
  };

  // Server-side search handled in fetchOrders; render all loaded orders.
  const filteredOrders = orders;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-2xl font-bold">Incomplete Orders</h1>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1">
              <input
                type="datetime-local"
                value={exportStart}
                onChange={(e) => setExportStart(e.target.value)}
                className="bg-secondary border border-border rounded-lg px-2 py-2 text-xs"
                title="Export from"
              />
              <span className="text-muted-foreground text-xs">to</span>
              <input
                type="datetime-local"
                value={exportEnd}
                onChange={(e) => setExportEnd(e.target.value)}
                className="bg-secondary border border-border rounded-lg px-2 py-2 text-xs"
                title="Export to"
              />
            </div>
            <button
              onClick={() => downloadExport('xlsx')}
              disabled={!!exporting}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl transition-colors disabled:opacity-50"
            >
              {exporting === 'xlsx' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              <span className="hidden sm:inline">Excel</span>
            </button>
            <button
              onClick={() => downloadExport('csv')}
              disabled={!!exporting}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl transition-colors disabled:opacity-50"
            >
              {exporting === 'csv' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              <span className="hidden sm:inline">CSV</span>
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="card-glass p-4">
            <p className="text-muted-foreground text-sm">Total Incomplete</p>
            <p className="text-2xl font-bold">{totalIncompleteCount || orders.length}</p>
          </div>
          <div className="card-glass p-4">
            <p className="text-muted-foreground text-sm">Loaded Rows</p>
            <p className="text-2xl font-bold">{orders.length}</p>
          </div>
          <div className="card-glass p-4">
            <p className="text-muted-foreground text-sm">Phone Only (Loaded)</p>
            <p className="text-2xl font-bold">
              {orders.filter(o => !o.customer_name && !o.address).length}
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by phone or name..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-secondary border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <p className="text-sm text-muted-foreground">
          Showing {orders.length} incomplete order{orders.length !== 1 ? 's' : ''}{totalIncompleteCount > 0 ? ` of ${totalIncompleteCount}` : ''}
        </p>

        {/* Orders List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto" />
            <p className="mt-4 text-muted-foreground">Loading...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-12 card-glass">
            <p className="text-muted-foreground">No incomplete orders</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid gap-4">
              {filteredOrders.map(order => (
                <div 
                  key={order.id} 
                  className={`card-glass p-4 transition-colors ${
                    acknowledgedOrderId === order.id ? 'bg-green-500/20 border-green-500/30' : ''
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono px-2 py-0.5 rounded bg-primary/10 text-primary">#{order.serial_number}</span>
                        <Phone className="w-4 h-4 text-primary" />
                        <span className="font-semibold">{order.phone}</span>
                      </div>
                      {order.customer_name && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <User className="w-4 h-4" />
                          <span>{order.customer_name}</span>
                        </div>
                      )}
                      {order.address && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin className="w-4 h-4" />
                          <span className="line-clamp-1">{order.address}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        <span>{format(new Date(order.created_at), 'dd/MM/yyyy hh:mm a')}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => acknowledgeOrder(order.id)}
                        className={`p-2 rounded-lg transition-colors ${
                          acknowledgedOrderId === order.id 
                            ? 'bg-green-500 text-white' 
                            : 'hover:bg-green-500/20 text-green-500'
                        }`}
                        title="Mark as last confirmed"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="btn-primary px-4 py-2 text-sm flex items-center gap-2"
                      >
                        <Truck className="w-4 h-4" />
                        Create Order
                      </button>
                      <button
                        onClick={() => {
                          const name = order.customer_name || '';
                          const phone = order.phone || '';
                          const address = order.address || '';
                          const tsvData = `${name}\t${phone}\t${address}`;
                          navigator.clipboard.writeText(tsvData);
                          toast({
                            title: 'Copied',
                            description: 'Info copied to clipboard'
                          });
                        }}
                        className="p-2 hover:bg-primary/10 text-primary rounded-lg transition-colors"
                        title="Copy"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <a
                        href={`tel:${order.phone}`}
                        className="px-4 py-2 text-sm bg-secondary hover:bg-secondary/80 rounded-lg transition-colors"
                      >
                        Call
                      </a>
                      <button
                        onClick={() => deleteOrder(order.id)}
                        className="p-2 hover:bg-destructive/10 text-destructive rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {hasMore && (
              <div className="flex justify-center">
                <button
                  onClick={loadMoreOrders}
                  disabled={loadingMore}
                  className="px-4 py-2 rounded-xl border border-border bg-secondary hover:bg-secondary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loadingMore ? 'Loading more...' : 'Load more incomplete orders'}
                </button>
              </div>
            )}
          </div>
        )}

        <IncompleteOrderModal
          order={selectedOrder}
          isOpen={!!selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onOrderCreated={() => fetchOrders(0, false)}
        />
      </div>
    </AdminLayout>
  );
};

export default AdminIncompleteOrders;