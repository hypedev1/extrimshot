import { useEffect, useState, useCallback } from 'react';
import { Search, ChevronDown, Eye, Phone, Copy, Truck, Loader2, CheckCircle, RefreshCw, Plus, Check, Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { OrderDetailModal } from '@/components/admin/OrderDetailModal';
import { CreateOrderModal } from '@/components/admin/CreateOrderModal';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Order {
  id: string;
  serial_number: number;
  customer_name: string;
  phone: string;
  address: string;
  status: string;
  total_amount: number;
  package_type: string;
  created_at: string;
  updated_at: string;
  pathao_consignment_id: string | null;
  pathao_city_id: number | null;
  pathao_zone_id: number | null;
  pathao_area_id: number | null;
}

const packageLabels: Record<string, string> = {
  regular: 'Regular (90g)',
  permanent: 'Permanent (180g)'
};

const statusOptions = [
  { value: 'pending', label: 'Pending', color: 'bg-yellow-500/20 text-yellow-500' },
  { value: 'confirmed', label: 'Confirmed', color: 'bg-blue-500/20 text-blue-500' },
  { value: 'delivered', label: 'Delivered', color: 'bg-green-500/20 text-green-500' },
  { value: 'cancelled', label: 'Cancelled', color: 'bg-red-500/20 text-red-500' },
];

const ACKNOWLEDGED_ORDER_KEY = 'admin_acknowledged_order_id';
const ORDERS_PAGE_SIZE = 250;

const AdminOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [totalOrdersCount, setTotalOrdersCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [sendingToPathao, setSendingToPathao] = useState<string | null>(null);
  const [syncingStatus, setSyncingStatus] = useState<string | null>(null);
  const [bulkSyncing, setBulkSyncing] = useState(false);
  const [acknowledgedOrderId, setAcknowledgedOrderId] = useState<string | null>(() => {
    return localStorage.getItem(ACKNOWLEDGED_ORDER_KEY);
  });
  const { toast } = useToast();

  const acknowledgeOrder = (orderId: string) => {
    setAcknowledgedOrderId(orderId);
    localStorage.setItem(ACKNOWLEDGED_ORDER_KEY, orderId);
    toast({ title: 'Acknowledged', description: 'Order marked as last confirmed' });
  };

  const fetchOrders = useCallback(async (page = 0, append = false, search = '', status = 'all') => {
    if (append) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }

    try {
      const from = page * ORDERS_PAGE_SIZE;
      const to = from + ORDERS_PAGE_SIZE - 1;

      const trimmed = search.trim();
      let q = supabase.from('orders').select('*', { count: 'exact' });
      if (status !== 'all') q = q.eq('status', status);
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
        setTotalOrdersCount(count);
      }

      setCurrentPage(page);
      setHasMore(pageData.length === ORDERS_PAGE_SIZE);
    } catch (error: any) {
      console.error('Failed to fetch orders:', error);
      toast({ variant: 'destructive', title: 'Error', description: error.message || 'Failed to load orders' });
      if (!append) setOrders([]);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [toast]);

  // Debounced server-side search + status refetch
  useEffect(() => {
    const handle = setTimeout(() => {
      fetchOrders(0, false, searchTerm, filterStatus);
    }, searchTerm ? 300 : 0);
    return () => clearTimeout(handle);
  }, [searchTerm, filterStatus, fetchOrders]);

  useEffect(() => {
    const channel = supabase
      .channel('orders-list')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        fetchOrders(0, false, searchTerm, filterStatus);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchOrders, searchTerm, filterStatus]);

  const updateStatus = async (orderId: string, newStatus: string) => {
    const { error } = await supabase
      .from('orders')
      .update({ status: newStatus })
      .eq('id', orderId);

    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } else {
      toast({ title: 'Success', description: 'Order status updated' });
    }
  };

  const sendToPathao = async (order: Order) => {
    setSendingToPathao(order.id);
    try {
      const { data, error } = await supabase.functions.invoke('pathao-courier', {
        body: {
          action: 'create_order',
          orderId: order.id,
        },
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: 'Success!',
          description: `Order sent to Pathao`,
        });
        // Update order status to confirmed
        await updateStatus(order.id, 'confirmed');
      } else {
        throw new Error(data.error || 'Unknown error');
      }
    } catch (error: any) {
      console.error('Pathao error:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to send order to Pathao',
      });
    } finally {
      setSendingToPathao(null);
    }
  };

  const syncPathaoStatus = async (order: Order) => {
    if (!order.pathao_consignment_id) return;
    
    setSyncingStatus(order.id);
    try {
      const { data, error } = await supabase.functions.invoke('pathao-courier', {
        body: {
          action: 'check_status',
          orderId: order.id,
          consignmentId: order.pathao_consignment_id,
        },
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: 'Status Updated',
          description: `Pathao status: ${data.pathao_status}`,
        });
        fetchOrders(0, false, searchTerm, filterStatus);
      } else {
        throw new Error(data.error || 'Unknown error');
      }
    } catch (error: any) {
      console.error('Pathao sync error:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to sync status',
      });
    } finally {
      setSyncingStatus(null);
    }
  };

  const bulkSyncPathaoStatus = async () => {
    const pathaoOrders = orders.filter(o => o.pathao_consignment_id && o.status !== 'delivered' && o.status !== 'cancelled');
    
    if (pathaoOrders.length === 0) {
      toast({ title: 'No Orders', description: 'No Pathao orders to sync' });
      return;
    }

    setBulkSyncing(true);
    let successCount = 0;
    let errorCount = 0;

    for (const order of pathaoOrders) {
      try {
        const { data, error } = await supabase.functions.invoke('pathao-courier', {
          body: {
            action: 'check_status',
            orderId: order.id,
            consignmentId: order.pathao_consignment_id,
          },
        });

        if (error) throw error;
        if (data.success) {
          successCount++;
        } else {
          errorCount++;
        }
      } catch (err) {
        console.error('Bulk sync error for order:', order.id, err);
        errorCount++;
      }
    }

    setBulkSyncing(false);
    fetchOrders(0, false, searchTerm, filterStatus);
    
    toast({
      title: 'Bulk Sync Complete',
      description: `${successCount} succeeded, ${errorCount} failed`,
    });
  };

  const loadMoreOrders = async () => {
    if (loadingMore || !hasMore) return;
    await fetchOrders(currentPage + 1, true, searchTerm, filterStatus);
  };

  const pathaoOrderCount = orders.filter(o => o.pathao_consignment_id && o.status !== 'delivered' && o.status !== 'cancelled').length;

  // Server-side search & status filter handled in fetchOrders; render all loaded orders.
  const filteredOrders = orders;

  const getStatusStyle = (status: string) => {
    return statusOptions.find(s => s.value === status)?.color || 'bg-gray-500/20 text-gray-500';
  };

  const copyOrderToClipboard = async (order: Order) => {
    // Tab-separated format for Google Sheets (Name, Phone, Address, Package)
    const packageName = packageLabels[order.package_type] || order.package_type;
    const copyText = `${order.customer_name}\t${order.phone}\t${order.address}\t${packageName}`;
    
    try {
      await navigator.clipboard.writeText(copyText);
      toast({ title: 'Copied', description: 'Order info copied to clipboard' });
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to copy' });
    }
  };

  const [exporting, setExporting] = useState<null | 'xlsx' | 'csv'>(null);
  const [exportStart, setExportStart] = useState('');
  const [exportEnd, setExportEnd] = useState('');
  const downloadExport = async (format: 'xlsx' | 'csv') => {
    setExporting(format);
    try {
      const all: Order[] = [];
      const pageSize = 1000;
      let from = 0;
      const startISO = exportStart ? new Date(exportStart).toISOString() : null;
      const endISO = exportEnd ? new Date(exportEnd).toISOString() : null;
      while (true) {
        let q = supabase
          .from('orders')
          .select('*')
          .order('serial_number', { ascending: true })
          .range(from, from + pageSize - 1);
        if (startISO) q = q.gte('created_at', startISO);
        if (endISO) q = q.lte('created_at', endISO);
        const { data, error } = await q;
        if (error) throw error;
        const batch = data ?? [];
        all.push(...batch as Order[]);
        if (batch.length < pageSize) break;
        from += pageSize;
      }
      const rows = all.map(o => ({
        'SL': o.serial_number,
        'Name': o.customer_name,
        'Phone Number': o.phone,
        'Address': o.address,
      }));
      const ws = XLSX.utils.json_to_sheet(rows);
      const dateStr = new Date().toISOString().split('T')[0];
      if (format === 'csv') {
        const csv = XLSX.utils.sheet_to_csv(ws);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `orders-${dateStr}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Orders');
        XLSX.writeFile(wb, `orders-${dateStr}.xlsx`);
      }
      toast({ title: 'Exported', description: `${rows.length} orders downloaded` });
    } catch (err: any) {
      console.error('Export error:', err);
      toast({ variant: 'destructive', title: 'Export failed', description: err.message || 'Could not export orders' });
    } finally {
      setExporting(null);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold">Orders</h1>
            <p className="text-muted-foreground text-sm lg:text-base">View and manage all orders</p>
          </div>
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
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-xl hover:bg-primary/90 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">New Order</span>
            </button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by name or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-secondary border border-border rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-secondary border border-border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">All Status</option>
            {statusOptions.map(s => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
          {pathaoOrderCount > 0 && (
            <button
              onClick={bulkSyncPathaoStatus}
              disabled={bulkSyncing}
              className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-3 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {bulkSyncing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              <span className="hidden sm:inline">Pathao Sync ({pathaoOrderCount})</span>
              <span className="sm:hidden">Sync</span>
            </button>
          )}
        </div>

        <p className="text-sm text-muted-foreground">
          Showing {orders.length} order{orders.length !== 1 ? 's' : ''}{totalOrdersCount > 0 ? ` of ${totalOrdersCount}` : ''}
        </p>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="card-glass p-12 text-center">
            <p className="text-muted-foreground">No orders found</p>
          </div>
        ) : (
          <div className="card-glass overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-secondary/50">
                    <th className="text-left py-4 px-4 font-medium">SL</th>
                    <th className="text-left py-4 px-4 font-medium">Name</th>
                    <th className="text-left py-4 px-4 font-medium">Phone</th>
                    <th className="text-left py-4 px-4 font-medium hidden lg:table-cell">Address</th>
                    <th className="text-left py-4 px-4 font-medium">Package</th>
                    <th className="text-left py-4 px-4 font-medium">Amount</th>
                    <th className="text-left py-4 px-4 font-medium">Status</th>
                    <th className="text-left py-4 px-4 font-medium hidden sm:table-cell">Date</th>
                    <th className="text-left py-4 px-4 font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((order) => (
                    <tr 
                      key={order.id} 
                      className={`border-t border-border hover:bg-secondary/30 transition-colors ${
                        acknowledgedOrderId === order.id ? 'bg-green-500/20' : ''
                      }`}
                    >
                      <td className="py-4 px-4 font-mono text-sm text-muted-foreground">#{order.serial_number}</td>
                      <td className="py-4 px-4 font-medium">{order.customer_name}</td>
                      <td className="py-4 px-4">
                        <a href={`tel:${order.phone}`} className="flex items-center gap-1 text-primary hover:underline">
                          <Phone className="w-3 h-3" />
                          {order.phone}
                        </a>
                      </td>
                      <td className="py-4 px-4 hidden lg:table-cell max-w-xs truncate">{order.address}</td>
                      <td className="py-4 px-4">
                        <span className={`text-xs px-2 py-1 rounded-full ${order.package_type === 'permanent' ? 'bg-accent/20 text-accent' : 'bg-secondary text-foreground'}`}>
                          {packageLabels[order.package_type] || order.package_type}
                        </span>
                      </td>
                      <td className="py-4 px-4">৳{order.total_amount}</td>
                      <td className="py-4 px-4">
                        <div className="relative inline-block">
                          <select
                            value={order.status}
                            onChange={(e) => updateStatus(order.id, e.target.value)}
                            className={`appearance-none cursor-pointer px-3 py-1 pr-8 rounded-full text-xs font-medium ${getStatusStyle(order.status)} bg-opacity-100 border-0 focus:outline-none focus:ring-2 focus:ring-primary`}
                          >
                            {statusOptions.map(s => (
                              <option key={s.value} value={s.value}>{s.label}</option>
                            ))}
                          </select>
                          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none" />
                        </div>
                      </td>
                      <td className="py-4 px-4 text-muted-foreground text-sm hidden sm:table-cell">
                        <div>{new Date(order.created_at).toLocaleDateString('en-US')}</div>
                        <div className="text-xs">{new Date(order.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => acknowledgeOrder(order.id)}
                            className={`p-1.5 rounded-lg transition-colors ${
                              acknowledgedOrderId === order.id 
                                ? 'bg-green-500 text-white' 
                                : 'hover:bg-green-500/20 text-green-500'
                            }`}
                            title="Mark as last confirmed"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          {order.pathao_consignment_id ? (
                            <div className="flex items-center gap-1">
                              <div className="flex items-center gap-1 text-green-500" title={`Pathao ID: ${order.pathao_consignment_id}`}>
                                <CheckCircle className="w-4 h-4" />
                                <span className="text-xs hidden md:inline">{order.pathao_consignment_id}</span>
                              </div>
                              <button
                                onClick={() => syncPathaoStatus(order)}
                                disabled={syncingStatus === order.id}
                                className="p-1 hover:bg-blue-500/20 rounded transition-colors text-blue-500 disabled:opacity-50"
                                title="Sync Pathao status"
                              >
                                {syncingStatus === order.id ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  <RefreshCw className="w-3 h-3" />
                                )}
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => sendToPathao(order)}
                              disabled={sendingToPathao === order.id}
                              className="p-2 hover:bg-orange-500/20 rounded-lg transition-colors text-orange-500 disabled:opacity-50"
                              title="Send to Pathao"
                            >
                              {sendingToPathao === order.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Truck className="w-4 h-4" />
                              )}
                            </button>
                          )}
                          <button
                            onClick={() => copyOrderToClipboard(order)}
                            className="p-2 hover:bg-secondary rounded-lg transition-colors text-primary"
                            title="Copy"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedOrder(order);
                              setIsModalOpen(true);
                            }}
                            className="p-2 hover:bg-secondary rounded-lg transition-colors"
                            title="View details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {hasMore && (
              <div className="p-4 border-t border-border flex justify-center">
                <button
                  onClick={loadMoreOrders}
                  disabled={loadingMore}
                  className="px-4 py-2 rounded-xl border border-border bg-secondary hover:bg-secondary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {loadingMore && <Loader2 className="w-4 h-4 animate-spin" />}
                  {loadingMore ? 'Loading more...' : 'Load more orders'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <OrderDetailModal
        order={selectedOrder}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedOrder(null);
        }}
        onStatusChange={updateStatus}
      />

      <CreateOrderModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onOrderCreated={() => fetchOrders(0, false, searchTerm, filterStatus)}
      />
    </AdminLayout>
  );
};

export default AdminOrders;