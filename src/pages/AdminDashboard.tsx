import { useEffect, useState } from 'react';
import { Package, DollarSign, Clock, CheckCircle } from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { supabase } from '@/integrations/supabase/client';

interface DashboardStats {
  totalOrders: number;
  pendingOrders: number;
  confirmedOrders: number;
  totalSales: number;
}

const AdminDashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalOrders: 0,
    pendingOrders: 0,
    confirmedOrders: 0,
    totalSales: 0,
  });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    const { data: orders } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (orders) {
      const pending = orders.filter(o => o.status === 'pending').length;
      const confirmed = orders.filter(o => o.status === 'confirmed' || o.status === 'delivered').length;
      const totalSales = orders.reduce((sum, o) => sum + o.total_amount, 0);

      setStats({
        totalOrders: orders.length,
        pendingOrders: pending,
        confirmedOrders: confirmed,
        totalSales,
      });
      setRecentOrders(orders.slice(0, 5));
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchStats();

    const channel = supabase
      .channel('orders-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, fetchStats)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const statCards = [
    { label: 'Total Orders', value: stats.totalOrders, icon: Package, color: 'text-blue-500' },
    { label: 'Pending', value: stats.pendingOrders, icon: Clock, color: 'text-yellow-500' },
    { label: 'Completed', value: stats.confirmedOrders, icon: CheckCircle, color: 'text-green-500' },
    { label: 'Total Sales', value: `৳${stats.totalSales.toLocaleString()}`, icon: DollarSign, color: 'text-primary' },
  ];

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-yellow-500/20 text-yellow-500',
      confirmed: 'bg-blue-500/20 text-blue-500',
      delivered: 'bg-green-500/20 text-green-500',
      cancelled: 'bg-red-500/20 text-red-500',
    };
    const labels: Record<string, string> = {
      pending: 'Pending',
      confirmed: 'Confirmed',
      delivered: 'Delivered',
      cancelled: 'Cancelled',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || styles.pending}`}>
        {labels[status] || status}
      </span>
    );
  };

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground text-sm lg:text-base">Overview of your store</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {statCards.map((stat) => (
                <div key={stat.label} className="card-glass p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-muted-foreground text-sm">{stat.label}</p>
                      <p className="text-3xl font-bold mt-1">{stat.value}</p>
                    </div>
                    <div className={`p-3 rounded-xl bg-secondary ${stat.color}`}>
                      <stat.icon className="w-6 h-6" />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="card-glass p-6">
              <h2 className="text-xl font-bold mb-4">Recent Orders</h2>
              {recentOrders.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No orders yet</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-4 text-muted-foreground font-medium">Name</th>
                        <th className="text-left py-3 px-4 text-muted-foreground font-medium">Phone</th>
                        <th className="text-left py-3 px-4 text-muted-foreground font-medium">Amount</th>
                        <th className="text-left py-3 px-4 text-muted-foreground font-medium">Status</th>
                        <th className="text-left py-3 px-4 text-muted-foreground font-medium">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentOrders.map((order) => (
                        <tr key={order.id} className="border-b border-border/50 hover:bg-secondary/50">
                          <td className="py-3 px-4">{order.customer_name}</td>
                          <td className="py-3 px-4">{order.phone}</td>
                          <td className="py-3 px-4">৳{order.total_amount}</td>
                          <td className="py-3 px-4">{getStatusBadge(order.status)}</td>
                          <td className="py-3 px-4 text-muted-foreground text-sm">
                            {new Date(order.created_at).toLocaleDateString('en-US')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;