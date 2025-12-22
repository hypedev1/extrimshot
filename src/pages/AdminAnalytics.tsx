import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, TrendingDown, Calendar } from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { supabase } from '@/integrations/supabase/client';

interface DailyData {
  date: string;
  orders: number;
  sales: number;
}

interface StatusData {
  name: string;
  value: number;
  color: string;
}

const AdminAnalytics = () => {
  const [dailyData, setDailyData] = useState<DailyData[]>([]);
  const [statusData, setStatusData] = useState<StatusData[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('7');

  const fetchAnalytics = async () => {
    const days = parseInt(dateRange);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data: orders } = await supabase
      .from('orders')
      .select('*')
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true });

    if (orders) {
      // Group by date
      const grouped = orders.reduce((acc: Record<string, { orders: number; sales: number }>, order) => {
        const date = new Date(order.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        if (!acc[date]) {
          acc[date] = { orders: 0, sales: 0 };
        }
        acc[date].orders += 1;
        if (order.status === 'confirmed' || order.status === 'delivered') {
          acc[date].sales += order.total_amount;
        }
        return acc;
      }, {});

      const dailyArray = Object.entries(grouped).map(([date, data]) => ({
        date,
        ...data,
      }));
      setDailyData(dailyArray);

      // Status distribution
      const statusCounts = orders.reduce((acc: Record<string, number>, order) => {
        acc[order.status] = (acc[order.status] || 0) + 1;
        return acc;
      }, {});

      const statusColors: Record<string, string> = {
        pending: '#eab308',
        confirmed: '#3b82f6',
        delivered: '#22c55e',
        cancelled: '#ef4444',
      };

      const statusLabels: Record<string, string> = {
        pending: 'Pending',
        confirmed: 'Confirmed',
        delivered: 'Delivered',
        cancelled: 'Cancelled',
      };

      setStatusData(
        Object.entries(statusCounts).map(([status, count]) => ({
          name: statusLabels[status] || status,
          value: count,
          color: statusColors[status] || '#6b7280',
        }))
      );
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  const totalOrders = dailyData.reduce((sum, d) => sum + d.orders, 0);
  const totalSales = dailyData.reduce((sum, d) => sum + d.sales, 0);
  const avgOrderValue = totalOrders > 0 ? Math.round(totalSales / totalOrders) : 0;

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold">Analytics</h1>
            <p className="text-muted-foreground text-sm lg:text-base">Sales and order analysis</p>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-muted-foreground" />
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="bg-secondary border border-border rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="7">Last 7 Days</option>
              <option value="30">Last 30 Days</option>
              <option value="90">Last 90 Days</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="card-glass p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground text-sm">Total Orders</p>
                    <p className="text-3xl font-bold mt-1">{totalOrders}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-blue-500/20 text-blue-500">
                    <TrendingUp className="w-6 h-6" />
                  </div>
                </div>
              </div>
              <div className="card-glass p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground text-sm">Total Sales</p>
                    <p className="text-3xl font-bold mt-1">৳{totalSales.toLocaleString()}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-green-500/20 text-green-500">
                    <TrendingUp className="w-6 h-6" />
                  </div>
                </div>
              </div>
              <div className="card-glass p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground text-sm">Avg Order Value</p>
                    <p className="text-3xl font-bold mt-1">৳{avgOrderValue.toLocaleString()}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-primary/20 text-primary">
                    <TrendingUp className="w-6 h-6" />
                  </div>
                </div>
              </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Orders Chart */}
              <div className="card-glass p-6">
                <h3 className="text-lg font-semibold mb-4">Daily Orders</h3>
                {dailyData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={dailyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                      />
                      <Bar dataKey="orders" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    No data
                  </div>
                )}
              </div>

              {/* Sales Chart */}
              <div className="card-glass p-6">
                <h3 className="text-lg font-semibold mb-4">Daily Sales</h3>
                {dailyData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={dailyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                        formatter={(value: number) => [`৳${value.toLocaleString()}`, 'Sales']}
                      />
                      <Line type="monotone" dataKey="sales" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ fill: 'hsl(var(--primary))' }} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    No data
                  </div>
                )}
              </div>

              {/* Status Distribution */}
              <div className="card-glass p-6 lg:col-span-2">
                <h3 className="text-lg font-semibold mb-4">Order Status Distribution</h3>
                {statusData.length > 0 ? (
                  <div className="flex flex-col lg:flex-row items-center justify-center gap-8">
                    <ResponsiveContainer width={250} height={250}>
                      <PieChart>
                        <Pie
                          data={statusData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {statusData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--card))', 
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px'
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="flex flex-wrap gap-4 justify-center">
                      {statusData.map((item) => (
                        <div key={item.name} className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded-full" style={{ backgroundColor: item.color }} />
                          <span className="text-sm">{item.name}: {item.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                    No data
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminAnalytics;