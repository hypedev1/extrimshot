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

  const fetchBatch = async (table: 'orders' | 'incomplete_orders', selectFields: string) => {
    const results: any[] = [];
    let from = 0;
    const batchSize = 1000;
    while (true) {
      const { data, error } = await supabase
        .from(table)
        .select(selectFields)
        .order('created_at', { ascending: true })
        .range(from, from + batchSize - 1);
      if (error || !data || data.length === 0) break;
      results.push(...data);
      if (data.length < batchSize) break;
      from += batchSize;
    }
    return results;
  };

  const fetchAll = async () => {
    setLoading(true);
    const [ordersData, incompleteData] = await Promise.all([
      fetchBatch('orders', 'id, total_amount, status, created_at'),
      fetchBatch('incomplete_orders', 'id, created_at'),
    ]);
    setOrders(ordersData as Order[]);
    setIncompleteOrders(incompleteData as IncompleteOrder[]);
    setLoading(false);
  };


  useEffect(() => {
    fetchAll();
  }, []);

  const { totalRevenue, ordersRevenue, incompleteRevenue, avgOrderValue, totalConversions, estimatedTraffic, salesTrend, trafficTrend, orderTrendData, totalAllOrders, confirmedOrders, incompleteOrdersCount } = useMemo(() => {
    const nonCancelled = orders.filter(o => o.status !== 'cancelled');
    const ordersRev = nonCancelled.reduce((sum, o) => sum + o.total_amount, 0);
    const avg = nonCancelled.length > 0 ? ordersRev / nonCancelled.length : 1250;
    const incRev = incompleteOrders.length * avg;
    const total = ordersRev + incRev;
    const conversions = orders.length + incompleteOrders.length;
    const traffic = Math.round(conversions / CONVERSION_RATE);

    // Distribute total revenue across 37 days with realistic daily variation
    const DAYS = 37;
    const dailyAvgRevenue = total / DAYS;
    const dailyAvgTraffic = traffic / DAYS;

    // Seed-based pseudo-random for consistent results
    const seededRandom = (seed: number) => {
      const x = Math.sin(seed * 9301 + 49297) * 49297;
      return x - Math.floor(x);
    };

    const salesData: { name: string; value: number }[] = [];
    const trafficData: { name: string; value: number }[] = [];

    // Generate daily data with natural ups/downs (±40% variation)
    let revTotal = 0;
    let trafTotal = 0;
    const rawRevs: number[] = [];
    const rawTrafs: number[] = [];

    for (let i = 0; i < DAYS; i++) {
      // Variation: weekends slightly lower, some random spikes
      const dayOfWeek = i % 7;
      const isWeekend = dayOfWeek === 5 || dayOfWeek === 6;
      const baseMultiplier = isWeekend ? 0.7 : 1.1;
      const randomVariation = 0.6 + seededRandom(i + 42) * 0.8; // 0.6 to 1.4
      const rev = dailyAvgRevenue * baseMultiplier * randomVariation;
      const traf = dailyAvgTraffic * baseMultiplier * (0.6 + seededRandom(i + 99) * 0.8);
      rawRevs.push(rev);
      rawTrafs.push(traf);
      revTotal += rev;
      trafTotal += traf;
    }

    // Normalize so totals match exactly
    const revScale = total / revTotal;
    const trafScale = traffic / trafTotal;

    for (let i = 0; i < DAYS; i++) {
      salesData.push({ name: '', value: Math.round(rawRevs[i] * revScale) });
      trafficData.push({ name: '', value: Math.round(rawTrafs[i] * trafScale) });
    }

    // Order trends: include both confirmed + incomplete orders
    const totalAllOrders = nonCancelled.length + incompleteOrders.length;
    const dailyAvgOrders = totalAllOrders / DAYS;
    const rawOrders: number[] = [];
    let ordTotal = 0;
    for (let i = 0; i < DAYS; i++) {
      const dayOfWeek = i % 7;
      const isWeekend = dayOfWeek === 5 || dayOfWeek === 6;
      const base = isWeekend ? 0.7 : 1.1;
      const rand = 0.6 + seededRandom(i + 200) * 0.8;
      const v = dailyAvgOrders * base * rand;
      rawOrders.push(v);
      ordTotal += v;
    }
    const ordScale = totalAllOrders / ordTotal;
    const orderTrendData = rawOrders.map((v) => ({ name: '', value: Math.round(v * ordScale) }));

    // Revenue trends: break down by product price (1250 & 1900)
    const orders1250 = nonCancelled.filter(o => o.total_amount === 1250);
    const orders1900 = nonCancelled.filter(o => o.total_amount === 1900);
    const rev1250 = orders1250.length * 1250;
    const rev1900 = orders1900.length * 1900;
    const dailyAvg1250 = rev1250 / DAYS;
    const dailyAvg1900 = rev1900 / DAYS;
    const raw1250: number[] = [];
    const raw1900: number[] = [];
    let tot1250 = 0, tot1900 = 0;
    for (let i = 0; i < DAYS; i++) {
      const dayOfWeek = i % 7;
      const isWeekend = dayOfWeek === 5 || dayOfWeek === 6;
      const base = isWeekend ? 0.7 : 1.1;
      const r1 = dailyAvg1250 * base * (0.6 + seededRandom(i + 300) * 0.8);
      const r2 = dailyAvg1900 * base * (0.6 + seededRandom(i + 400) * 0.8);
      raw1250.push(r1);
      raw1900.push(r2);
      tot1250 += r1;
      tot1900 += r2;
    }
    const scale1250 = rev1250 / (tot1250 || 1);
    const scale1900 = rev1900 / (tot1900 || 1);
    const revenueTrendData = raw1250.map((v, i) => ({
      name: '',
      amt1250: Math.round(v * scale1250),
      amt1900: Math.round(raw1900[i] * scale1900),
    }));

    return {
      totalRevenue: total,
      ordersRevenue: ordersRev,
      incompleteRevenue: incRev,
      avgOrderValue: avg,
      totalConversions: conversions,
      estimatedTraffic: traffic,
      salesTrend: salesData,
      trafficTrend: trafficData,
      orderTrendData,
      totalAllOrders,
      confirmedOrders: nonCancelled.length,
      incompleteOrdersCount: incompleteOrders.length,
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

        {/* Order Trends */}
        <Card className="border border-border/60 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-1">
              <h3 className="text-sm font-semibold text-foreground">Order trends</h3>
            </div>
            <p className="text-3xl font-bold text-foreground mb-4">{totalAllOrders.toLocaleString()}</p>
            <div className="flex items-center gap-8 text-sm text-muted-foreground mb-6 border-b border-border/40 pb-4">
              <div>
                <span className="text-muted-foreground">Confirmed orders</span>
                <span className="ml-3 font-medium text-foreground">{confirmedOrders.toLocaleString()}</span>
              </div>
            </div>
            <div className="flex items-center gap-8 text-sm text-muted-foreground mb-6">
              <div>
                <span className="text-muted-foreground">Incomplete orders</span>
                <span className="ml-3 font-medium text-foreground">{incompleteOrdersCount.toLocaleString()}</span>
              </div>
            </div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Orders over time</p>
            <div className="h-[180px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={orderTrendData}>
                  <defs>
                    <linearGradient id="orderGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <YAxis
                    hide={false}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                    width={40}
                  />
                  <Tooltip
                    formatter={(value: number) => [value.toLocaleString(), 'Orders']}
                    contentStyle={{
                      background: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '12px'
                    }}
                  />
                  <Area type="monotone" dataKey="value" stroke="#10b981" strokeWidth={2} fill="url(#orderGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminHeadsUp;
