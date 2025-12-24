import { useEffect, useState, useMemo } from 'react';
import { Package, DollarSign, Clock, CheckCircle, TrendingUp, TrendingDown, Users, ShoppingCart, XCircle, Truck, BarChart3, Calendar } from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Order {
  id: string;
  customer_name: string;
  phone: string;
  address: string;
  package_type: string;
  total_amount: number;
  status: string;
  created_at: string;
}

interface AnalyticsData {
  totalOrders: number;
  pendingOrders: number;
  confirmedOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  totalSales: number;
  avgOrderValue: number;
  conversionRate: number;
  incompleteOrders: number;
  ordersByPackage: Record<string, number>;
  ordersByStatus: Record<string, number>;
  dailyOrders: { date: string; count: number; revenue: number }[];
  topPackages: { name: string; count: number; revenue: number }[];
}

type DatePreset = 'today' | 'yesterday' | 'last3days' | 'last7days' | 'last15days' | 'last30days' | 'all';

const AdminDashboard = () => {
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [incompleteOrdersCount, setIncompleteOrdersCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [datePreset, setDatePreset] = useState<DatePreset>('last7days');

  const getDateRange = (preset: DatePreset): { start: Date; end: Date } => {
    const now = new Date();
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    let start: Date;

    switch (preset) {
      case 'today':
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
        break;
      case 'yesterday':
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 0, 0, 0, 0);
        end.setDate(end.getDate() - 1);
        break;
      case 'last3days':
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 2, 0, 0, 0, 0);
        break;
      case 'last7days':
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6, 0, 0, 0, 0);
        break;
      case 'last15days':
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 14, 0, 0, 0, 0);
        break;
      case 'last30days':
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29, 0, 0, 0, 0);
        break;
      case 'all':
      default:
        start = new Date(2020, 0, 1);
        break;
    }

    return { start, end };
  };

  const filteredOrders = useMemo(() => {
    if (datePreset === 'all') return allOrders;
    
    const { start, end } = getDateRange(datePreset);
    return allOrders.filter(order => {
      const orderDate = new Date(order.created_at);
      return orderDate >= start && orderDate <= end;
    });
  }, [allOrders, datePreset]);

  const analytics: AnalyticsData = useMemo(() => {
    const orders = filteredOrders;
    
    const pending = orders.filter(o => o.status === 'pending').length;
    const confirmed = orders.filter(o => o.status === 'confirmed').length;
    const delivered = orders.filter(o => o.status === 'delivered').length;
    const cancelled = orders.filter(o => o.status === 'cancelled').length;
    const totalSales = orders.filter(o => o.status !== 'cancelled').reduce((sum, o) => sum + o.total_amount, 0);
    const avgOrderValue = orders.length > 0 ? totalSales / orders.filter(o => o.status !== 'cancelled').length : 0;

    // Orders by package type
    const ordersByPackage: Record<string, number> = {};
    const revenueByPackage: Record<string, number> = {};
    orders.forEach(order => {
      const pkg = order.package_type || 'unknown';
      ordersByPackage[pkg] = (ordersByPackage[pkg] || 0) + 1;
      if (order.status !== 'cancelled') {
        revenueByPackage[pkg] = (revenueByPackage[pkg] || 0) + order.total_amount;
      }
    });

    // Orders by status
    const ordersByStatus: Record<string, number> = {
      pending,
      confirmed,
      delivered,
      cancelled
    };

    // Daily orders breakdown
    const dailyMap: Record<string, { count: number; revenue: number }> = {};
    orders.forEach(order => {
      const date = new Date(order.created_at).toLocaleDateString('en-CA');
      if (!dailyMap[date]) {
        dailyMap[date] = { count: 0, revenue: 0 };
      }
      dailyMap[date].count++;
      if (order.status !== 'cancelled') {
        dailyMap[date].revenue += order.total_amount;
      }
    });

    const dailyOrders = Object.entries(dailyMap)
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Top packages
    const topPackages = Object.entries(ordersByPackage)
      .map(([name, count]) => ({ name, count, revenue: revenueByPackage[name] || 0 }))
      .sort((a, b) => b.count - a.count);

    // Conversion rate (orders / incomplete orders * 100)
    const totalAttempts = orders.length + incompleteOrdersCount;
    const conversionRate = totalAttempts > 0 ? (orders.length / totalAttempts) * 100 : 0;

    return {
      totalOrders: orders.length,
      pendingOrders: pending,
      confirmedOrders: confirmed,
      deliveredOrders: delivered,
      cancelledOrders: cancelled,
      totalSales,
      avgOrderValue: isNaN(avgOrderValue) ? 0 : avgOrderValue,
      conversionRate,
      incompleteOrders: incompleteOrdersCount,
      ordersByPackage,
      ordersByStatus,
      dailyOrders,
      topPackages
    };
  }, [filteredOrders, incompleteOrdersCount]);

  const fetchAllOrders = async () => {
    const orders: Order[] = [];
    let from = 0;
    const batchSize = 1000;
    
    while (true) {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })
        .range(from, from + batchSize - 1);
      
      if (error) break;
      if (!data || data.length === 0) break;
      
      orders.push(...data);
      
      if (data.length < batchSize) break;
      from += batchSize;
    }
    
    return orders;
  };

  const fetchIncompleteOrders = async () => {
    const { count } = await supabase
      .from('incomplete_orders')
      .select('*', { count: 'exact', head: true });
    
    return count || 0;
  };

  const fetchData = async () => {
    setLoading(true);
    const [orders, incomplete] = await Promise.all([
      fetchAllOrders(),
      fetchIncompleteOrders()
    ]);
    
    setAllOrders(orders);
    setIncompleteOrdersCount(incomplete);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();

    const channel = supabase
      .channel('dashboard-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'incomplete_orders' }, fetchData)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const datePresets = [
    { value: 'today', label: 'Today' },
    { value: 'yesterday', label: 'Yesterday' },
    { value: 'last3days', label: 'Last 3 Days' },
    { value: 'last7days', label: 'Last 7 Days' },
    { value: 'last15days', label: 'Last 15 Days' },
    { value: 'last30days', label: 'Last 30 Days' },
    { value: 'all', label: 'All Time' },
  ];

  const getPackageLabel = (pkg: string) => {
    const labels: Record<string, string> = {
      'powerbooster-1pack': '1 Pack (৳1,250)',
      'powerbooster-2pack': '2 Pack (৳2,100)',
      'powerbooster-3pack': '3 Pack (৳2,800)',
      'diabetes-1pack': 'Diabetes 1 Pack',
      'diabetes-2pack': 'Diabetes 2 Pack',
    };
    return labels[pkg] || pkg;
  };

  const statCards = [
    { label: 'Total Orders', value: analytics.totalOrders, icon: Package, color: 'text-blue-500', bgColor: 'bg-blue-500/10' },
    { label: 'Pending', value: analytics.pendingOrders, icon: Clock, color: 'text-yellow-500', bgColor: 'bg-yellow-500/10' },
    { label: 'Confirmed', value: analytics.confirmedOrders, icon: CheckCircle, color: 'text-emerald-500', bgColor: 'bg-emerald-500/10' },
    { label: 'Delivered', value: analytics.deliveredOrders, icon: Truck, color: 'text-green-500', bgColor: 'bg-green-500/10' },
    { label: 'Cancelled', value: analytics.cancelledOrders, icon: XCircle, color: 'text-red-500', bgColor: 'bg-red-500/10' },
    { label: 'Total Revenue', value: `৳${analytics.totalSales.toLocaleString()}`, icon: DollarSign, color: 'text-primary', bgColor: 'bg-primary/10' },
    { label: 'Avg Order Value', value: `৳${Math.round(analytics.avgOrderValue).toLocaleString()}`, icon: TrendingUp, color: 'text-purple-500', bgColor: 'bg-purple-500/10' },
    { label: 'Incomplete Orders', value: analytics.incompleteOrders, icon: Users, color: 'text-orange-500', bgColor: 'bg-orange-500/10' },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header with Date Filter */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold">Analytics Dashboard</h1>
            <p className="text-muted-foreground text-sm lg:text-base">Campaign performance & insights</p>
          </div>
          
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <Select value={datePreset} onValueChange={(v) => setDatePreset(v as DatePreset)}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent>
                {datePresets.map((preset) => (
                  <SelectItem key={preset.value} value={preset.value}>
                    {preset.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <>
            {/* Main Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 lg:gap-4">
              {statCards.map((stat) => (
                <div key={stat.label} className="card-glass p-4 lg:p-6">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0">
                      <p className="text-muted-foreground text-xs lg:text-sm truncate">{stat.label}</p>
                      <p className="text-xl lg:text-2xl font-bold mt-1 truncate">{stat.value}</p>
                    </div>
                    <div className={`p-2 lg:p-3 rounded-xl ${stat.bgColor} ${stat.color} shrink-0`}>
                      <stat.icon className="w-4 h-4 lg:w-5 lg:h-5" />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Conversion Rate Banner */}
            <div className="card-glass p-4 lg:p-6 bg-gradient-to-r from-primary/10 to-primary/5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm">Conversion Rate</p>
                  <p className="text-3xl lg:text-4xl font-bold text-primary">{analytics.conversionRate.toFixed(1)}%</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {analytics.totalOrders} orders from {analytics.totalOrders + analytics.incompleteOrders} attempts
                  </p>
                </div>
                <div className="p-4 rounded-full bg-primary/20">
                  <TrendingUp className="w-8 h-8 text-primary" />
                </div>
              </div>
            </div>

            {/* Two Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
              {/* Package Performance */}
              <div className="card-glass p-4 lg:p-6">
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5" />
                  Package Performance
                </h2>
                <div className="space-y-3">
                  {analytics.topPackages.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">No orders yet</p>
                  ) : (
                    analytics.topPackages.map((pkg, index) => (
                      <div key={pkg.name} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                        <div className="flex items-center gap-3">
                          <span className="w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-bold flex items-center justify-center">
                            {index + 1}
                          </span>
                          <div>
                            <p className="font-medium text-sm">{getPackageLabel(pkg.name)}</p>
                            <p className="text-xs text-muted-foreground">{pkg.count} orders</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-primary">৳{pkg.revenue.toLocaleString()}</p>
                          <p className="text-xs text-muted-foreground">
                            {analytics.totalOrders > 0 ? ((pkg.count / analytics.totalOrders) * 100).toFixed(1) : 0}%
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Order Status Breakdown */}
              <div className="card-glass p-4 lg:p-6">
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Order Status Breakdown
                </h2>
                <div className="space-y-3">
                  {[
                    { status: 'pending', label: 'Pending', color: 'bg-yellow-500', textColor: 'text-yellow-500' },
                    { status: 'confirmed', label: 'Confirmed', color: 'bg-blue-500', textColor: 'text-blue-500' },
                    { status: 'delivered', label: 'Delivered', color: 'bg-green-500', textColor: 'text-green-500' },
                    { status: 'cancelled', label: 'Cancelled', color: 'bg-red-500', textColor: 'text-red-500' },
                  ].map((item) => {
                    const count = analytics.ordersByStatus[item.status] || 0;
                    const percentage = analytics.totalOrders > 0 ? (count / analytics.totalOrders) * 100 : 0;
                    return (
                      <div key={item.status} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className={item.textColor}>{item.label}</span>
                          <span className="text-muted-foreground">{count} ({percentage.toFixed(1)}%)</span>
                        </div>
                        <div className="h-2 rounded-full bg-secondary overflow-hidden">
                          <div 
                            className={`h-full ${item.color} transition-all duration-500`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Daily Performance Table */}
            <div className="card-glass p-4 lg:p-6">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Daily Performance
              </h2>
              {analytics.dailyOrders.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No data for selected period</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-4 text-muted-foreground font-medium text-sm">Date</th>
                        <th className="text-right py-3 px-4 text-muted-foreground font-medium text-sm">Orders</th>
                        <th className="text-right py-3 px-4 text-muted-foreground font-medium text-sm">Revenue</th>
                        <th className="text-right py-3 px-4 text-muted-foreground font-medium text-sm">Avg/Order</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analytics.dailyOrders.slice().reverse().map((day) => (
                        <tr key={day.date} className="border-b border-border/50 hover:bg-secondary/50">
                          <td className="py-3 px-4 font-medium">
                            {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                          </td>
                          <td className="py-3 px-4 text-right">{day.count}</td>
                          <td className="py-3 px-4 text-right text-primary font-medium">৳{day.revenue.toLocaleString()}</td>
                          <td className="py-3 px-4 text-right text-muted-foreground">
                            ৳{day.count > 0 ? Math.round(day.revenue / day.count).toLocaleString() : 0}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-secondary/50 font-bold">
                        <td className="py-3 px-4">Total</td>
                        <td className="py-3 px-4 text-right">{analytics.totalOrders}</td>
                        <td className="py-3 px-4 text-right text-primary">৳{analytics.totalSales.toLocaleString()}</td>
                        <td className="py-3 px-4 text-right">৳{Math.round(analytics.avgOrderValue).toLocaleString()}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>

            {/* Campaign Insights */}
            <div className="card-glass p-4 lg:p-6">
              <h2 className="text-lg font-bold mb-4">Campaign Insights</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                  <p className="text-green-500 text-sm font-medium">Success Rate</p>
                  <p className="text-2xl font-bold text-green-500">
                    {analytics.totalOrders > 0 
                      ? ((analytics.deliveredOrders / analytics.totalOrders) * 100).toFixed(1) 
                      : 0}%
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Delivered orders</p>
                </div>
                <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                  <p className="text-red-500 text-sm font-medium">Cancellation Rate</p>
                  <p className="text-2xl font-bold text-red-500">
                    {analytics.totalOrders > 0 
                      ? ((analytics.cancelledOrders / analytics.totalOrders) * 100).toFixed(1) 
                      : 0}%
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Cancelled orders</p>
                </div>
                <div className="p-4 rounded-lg bg-orange-500/10 border border-orange-500/20">
                  <p className="text-orange-500 text-sm font-medium">Abandoned Rate</p>
                  <p className="text-2xl font-bold text-orange-500">
                    {(analytics.totalOrders + analytics.incompleteOrders) > 0 
                      ? ((analytics.incompleteOrders / (analytics.totalOrders + analytics.incompleteOrders)) * 100).toFixed(1) 
                      : 0}%
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Didn't complete order</p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
