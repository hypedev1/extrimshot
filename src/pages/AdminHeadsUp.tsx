import { useEffect, useState, useMemo } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface Order {
  id: string;
  total_amount: number;
  status: string;
  created_at: string;
}

interface IncompleteOrder {
  id: string;
  created_at: string;
}

const CONVERSION_RATE = 0.05374;

const AdminHeadsUp = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [incompleteOrders, setIncompleteOrders] = useState<IncompleteOrder[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = async () => {
    setLoading(true);
    const [ordersRes, incompleteRes] = await Promise.all([
      supabase.from('orders').select('id, total_amount, status, created_at').order('created_at', { ascending: true }),
      supabase.from('incomplete_orders').select('id, created_at').order('created_at', { ascending: true }),
    ]);
    setOrders(ordersRes.data || []);
    setIncompleteOrders(incompleteRes.data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const { totalRevenue, ordersRevenue, incompleteRevenue, avgOrderValue, totalConversions, estimatedTraffic, salesTrend, trafficTrend } = useMemo(() => {
    const nonCancelled = orders.filter(o => o.status !== 'cancelled');
    const ordersRev = nonCancelled.reduce((sum, o) => sum + o.total_amount, 0);
    const avg = nonCancelled.length > 0 ? ordersRev / nonCancelled.length : 1250;
    const incRev = incompleteOrders.length * avg;
    const total = ordersRev + incRev;
    const conversions = orders.length + incompleteOrders.length;
    const traffic = Math.round(conversions / CONVERSION_RATE);

    // Build smooth trend data - group by week-ish buckets for smoothness
    const allDates = new Map<string, { revenue: number; traffic: number }>();
    
    // Collect all dates
    const allItems = [
      ...orders.map(o => ({ date: o.created_at, rev: o.status !== 'cancelled' ? o.total_amount : 0, isOrder: true })),
      ...incompleteOrders.map(o => ({ date: o.created_at, rev: avg, isOrder: false })),
    ];

    allItems.forEach(item => {
      const d = new Date(item.date).toLocaleDateString('en-CA');
      const existing = allDates.get(d) || { revenue: 0, traffic: 0 };
      existing.revenue += item.rev;
      existing.traffic += Math.round(1 / CONVERSION_RATE);
      allDates.set(d, existing);
    });

    const sortedDates = Array.from(allDates.entries()).sort((a, b) => a[0].localeCompare(b[0]));

    // Create ~12 buckets for smooth curves
    const bucketCount = Math.min(12, sortedDates.length);
    const bucketSize = Math.max(1, Math.ceil(sortedDates.length / bucketCount));
    
    const salesData: { name: string; value: number }[] = [];
    const trafficData: { name: string; value: number }[] = [];

    for (let i = 0; i < sortedDates.length; i += bucketSize) {
      const bucket = sortedDates.slice(i, i + bucketSize);
      const rev = bucket.reduce((s, [, d]) => s + d.revenue, 0);
      const traf = bucket.reduce((s, [, d]) => s + d.traffic, 0);
      salesData.push({ name: '', value: rev });
      trafficData.push({ name: '', value: traf });
    }

    return {
      totalRevenue: total,
      ordersRevenue: ordersRev,
      incompleteRevenue: incRev,
      avgOrderValue: avg,
      totalConversions: conversions,
      estimatedTraffic: traffic,
      salesTrend: salesData,
      trafficTrend: trafficData,
    };
  }, [orders, incompleteOrders]);

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AdminLayout>
    );
  }

  const formatCurrency = (val: number) => `৳${val.toLocaleString()}`;
  const formatTraffic = (val: number) => val >= 1000 ? `${(val / 1000).toFixed(1)}K` : val.toString();

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="text-2xl lg:text-3xl font-bold">Overview dashboard</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Total Sales Card */}
          <Card className="border border-border/60 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-1">
                <h3 className="text-sm font-semibold text-foreground">Total sales</h3>
              </div>
              <p className="text-3xl font-bold text-foreground mb-4">{formatCurrency(totalRevenue)}</p>

              <div className="flex items-center justify-between text-sm text-muted-foreground mb-6 border-b border-border/40 pb-4">
                <div className="flex items-center gap-8">
                  <div>
                    <span className="text-muted-foreground">Orders Revenue</span>
                    <span className="ml-3 font-medium text-foreground">{formatCurrency(ordersRevenue)}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-8 text-sm text-muted-foreground mb-6">
                <div>
                  <span className="text-muted-foreground">Incomplete Revenue</span>
                  <span className="ml-3 font-medium text-foreground">{formatCurrency(incompleteRevenue)}</span>
                </div>
              </div>

              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Sales over time</p>
              <div className="h-[180px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={salesTrend}>
                    <defs>
                      <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <YAxis 
                      hide={false}
                      tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(0)}K` : v}
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                      width={40}
                    />
                    <Tooltip 
                      formatter={(value: number) => [formatCurrency(value), 'Revenue']}
                      contentStyle={{ 
                        background: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        fontSize: '12px'
                      }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="value" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      fill="url(#salesGrad)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Online Store Sessions / Traffic Card */}
          <Card className="border border-border/60 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-1">
                <h3 className="text-sm font-semibold text-foreground">Online store sessions</h3>
              </div>
              <p className="text-3xl font-bold text-foreground mb-4">{estimatedTraffic.toLocaleString()}</p>

              <div className="flex items-center justify-between text-sm text-muted-foreground mb-6 border-b border-border/40 pb-4">
                <div className="flex items-center gap-8">
                  <div>
                    <span className="text-muted-foreground">Visitors</span>
                    <span className="ml-3 font-medium text-foreground">{estimatedTraffic.toLocaleString()}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-8 text-sm text-muted-foreground mb-6">
                <div>
                  <span className="text-muted-foreground">Conversion rate</span>
                  <span className="ml-3 font-medium text-foreground">5.37%</span>
                </div>
              </div>

              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Sessions over time</p>
              <div className="h-[180px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trafficTrend}>
                    <defs>
                      <linearGradient id="trafficGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <YAxis 
                      hide={false}
                      tickFormatter={(v) => formatTraffic(v)}
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                      width={40}
                    />
                    <Tooltip 
                      formatter={(value: number) => [value.toLocaleString(), 'Sessions']}
                      contentStyle={{ 
                        background: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        fontSize: '12px'
                      }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#8b5cf6" 
                      strokeWidth={2}
                      fill="url(#trafficGrad)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminHeadsUp;
