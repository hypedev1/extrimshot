import { useEffect, useState, useMemo } from 'react';
import { Package, DollarSign, Clock, CheckCircle, TrendingUp, TrendingDown, Users, ShoppingCart, XCircle, Truck, BarChart3, Calendar, Timer } from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';

// Bangladesh Standard Time offset: UTC+6
const BST_OFFSET = 6;

const getBSTHour = (date: Date): number => {
  const utcHours = date.getUTCHours();
  const bstHours = (utcHours + BST_OFFSET) % 24;
  return bstHours === 0 ? 24 : bstHours; // Use 1-24 format
};

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

interface IncompleteOrder {
  id: string;
  created_at: string;
}

interface HourlyData {
  hour: number;
  label: string;
  orders: number;
  incomplete: number;
  revenue: number;
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
  hourlyData: HourlyData[];
}

type DatePreset =
  | 'last1h' | 'last6h' | 'last12h' | 'last24h'
  | 'today' | 'yesterday' | 'last3days' | 'last7days' | 'last15days' | 'last30days'
  | 'thisMonth' | 'lastMonth' | 'custom' | 'all';
type HourFilter = 'all' | string; // 'all' or '1' to '24'

const pad = (n: number) => String(n).padStart(2, '0');

// Local datetime string in `YYYY-MM-DDTHH:mm:ss` format (suitable for datetime-local input with step=1)
const formatDateTimeInput = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;

// Parse `YYYY-MM-DDTHH:mm[:ss]` as local time
const parseLocalDateTime = (s: string): Date => {
  const [datePart, timePart = '00:00:00'] = s.split('T');
  const [y, m, d] = datePart.split('-').map(Number);
  const [hh, mm, ss = 0] = timePart.split(':').map(Number);
  return new Date(y, m - 1, d, hh, mm, ss, 0);
};

const formatDateDisplay = (d: Date) =>
  d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

const formatDateTimeDisplay = (d: Date) =>
  `${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;

interface TimeRangeComparison {
  todayOrders: number;
  yesterdayOrders: number;
  todayIncomplete: number;
  yesterdayIncomplete: number;
  todayRevenue: number;
  yesterdayRevenue: number;
}

const AdminDashboard = () => {
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [allIncompleteOrders, setAllIncompleteOrders] = useState<IncompleteOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [datePreset, setDatePreset] = useState<DatePreset>('all');
  const [hourFilter, setHourFilter] = useState<HourFilter>('all');
  const [startHour, setStartHour] = useState<string>('19'); // Default 7 PM
  const [endHour, setEndHour] = useState<string>('23'); // Default 11 PM
  const today = new Date();
  const [customStart, setCustomStart] = useState<string>(formatDateTimeInput(new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0)));
  const [customEnd, setCustomEnd] = useState<string>(formatDateTimeInput(today));
  const [appliedCustom, setAppliedCustom] = useState<{ start: string; end: string } | null>(null);
  const [customError, setCustomError] = useState<string>('');

  const getDateRange = (preset: DatePreset): { start: Date; end: Date } => {
    const now = new Date();
    let end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    let start: Date;

    switch (preset) {
      case 'last1h':
        start = new Date(now.getTime() - 1 * 60 * 60 * 1000);
        end = new Date(now);
        break;
      case 'last6h':
        start = new Date(now.getTime() - 6 * 60 * 60 * 1000);
        end = new Date(now);
        break;
      case 'last12h':
        start = new Date(now.getTime() - 12 * 60 * 60 * 1000);
        end = new Date(now);
        break;
      case 'last24h':
        start = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        end = new Date(now);
        break;
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
      case 'thisMonth':
        start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
        break;
      case 'lastMonth': {
        start = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
        const lastDayPrev = new Date(now.getFullYear(), now.getMonth(), 0).getDate();
        end = new Date(start.getFullYear(), start.getMonth(), lastDayPrev, 23, 59, 59, 999);
        break;
      }
      case 'custom': {
        if (appliedCustom) {
          start = parseLocalDateTime(appliedCustom.start);
          end = parseLocalDateTime(appliedCustom.end);
        } else {
          start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
        }
        break;
      }
      case 'all':
      default:
        start = new Date(2020, 0, 1);
        break;
    }

    return { start, end };
  };

  const dateFilteredOrders = useMemo(() => {
    if (datePreset === 'all') return allOrders;
    if (datePreset === 'custom' && !appliedCustom) return allOrders;
    
    const { start, end } = getDateRange(datePreset);
    return allOrders.filter(order => {
      const orderDate = new Date(order.created_at);
      return orderDate >= start && orderDate <= end;
    });
  }, [allOrders, datePreset, appliedCustom]);

  const dateFilteredIncompleteOrders = useMemo(() => {
    if (datePreset === 'all') return allIncompleteOrders;
    if (datePreset === 'custom' && !appliedCustom) return allIncompleteOrders;
    
    const { start, end } = getDateRange(datePreset);
    return allIncompleteOrders.filter(order => {
      const orderDate = new Date(order.created_at);
      return orderDate >= start && orderDate <= end;
    });
  }, [allIncompleteOrders, datePreset, appliedCustom]);

  const filteredOrders = useMemo(() => {
    if (hourFilter === 'all') return dateFilteredOrders;
    
    const targetHour = parseInt(hourFilter);
    return dateFilteredOrders.filter(order => {
      const orderDate = new Date(order.created_at);
      const bstHour = getBSTHour(orderDate);
      return bstHour === targetHour;
    });
  }, [dateFilteredOrders, hourFilter]);

  const filteredIncompleteOrdersCount = useMemo(() => {
    if (hourFilter === 'all') return dateFilteredIncompleteOrders.length;
    
    const targetHour = parseInt(hourFilter);
    return dateFilteredIncompleteOrders.filter(order => {
      const orderDate = new Date(order.created_at);
      const bstHour = getBSTHour(orderDate);
      return bstHour === targetHour;
    }).length;
  }, [dateFilteredIncompleteOrders, hourFilter]);

  const analytics: AnalyticsData = useMemo(() => {
    const orders = filteredOrders;
    const incompleteCount = filteredIncompleteOrdersCount;
    
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

    // Hourly breakdown (using date-filtered orders, not hour-filtered)
    const hourlyMap: Record<number, { orders: number; incomplete: number; revenue: number }> = {};
    for (let i = 1; i <= 24; i++) {
      hourlyMap[i] = { orders: 0, incomplete: 0, revenue: 0 };
    }
    
    dateFilteredOrders.forEach(order => {
      const orderDate = new Date(order.created_at);
      const bstHour = getBSTHour(orderDate);
      hourlyMap[bstHour].orders++;
      if (order.status !== 'cancelled') {
        hourlyMap[bstHour].revenue += order.total_amount;
      }
    });

    dateFilteredIncompleteOrders.forEach(order => {
      const orderDate = new Date(order.created_at);
      const bstHour = getBSTHour(orderDate);
      hourlyMap[bstHour].incomplete++;
    });

    const hourlyData: HourlyData[] = Object.entries(hourlyMap).map(([hour, data]) => {
      const h = parseInt(hour);
      const displayHour = h === 24 ? 12 : h > 12 ? h - 12 : h;
      const ampm = h < 12 || h === 24 ? 'AM' : 'PM';
      const label = h === 12 ? '12 PM' : h === 24 ? '12 AM' : `${displayHour} ${ampm}`;
      return {
        hour: h,
        label,
        ...data
      };
    }).sort((a, b) => a.hour - b.hour);

    // Conversion rate
    const totalAttempts = orders.length + incompleteCount;
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
      incompleteOrders: incompleteCount,
      ordersByPackage,
      ordersByStatus,
      dailyOrders,
      topPackages,
      hourlyData
    };
  }, [filteredOrders, filteredIncompleteOrdersCount, dateFilteredOrders, dateFilteredIncompleteOrders]);

  // Time range comparison for today vs yesterday
  const timeRangeComparison: TimeRangeComparison = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const yesterdayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 0, 0, 0, 0);
    const yesterdayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59, 999);

    const startH = parseInt(startHour);
    const endH = parseInt(endHour);

    // Filter orders for today within the time range
    const todayOrders = allOrders.filter(order => {
      const orderDate = new Date(order.created_at);
      if (orderDate < todayStart) return false;
      const bstHour = getBSTHour(orderDate);
      return bstHour >= startH && bstHour <= endH;
    });

    // Filter orders for yesterday within the time range
    const yesterdayOrders = allOrders.filter(order => {
      const orderDate = new Date(order.created_at);
      if (orderDate < yesterdayStart || orderDate > yesterdayEnd) return false;
      const bstHour = getBSTHour(orderDate);
      return bstHour >= startH && bstHour <= endH;
    });

    // Filter incomplete orders for today within the time range
    const todayIncomplete = allIncompleteOrders.filter(order => {
      const orderDate = new Date(order.created_at);
      if (orderDate < todayStart) return false;
      const bstHour = getBSTHour(orderDate);
      return bstHour >= startH && bstHour <= endH;
    });

    // Filter incomplete orders for yesterday within the time range
    const yesterdayIncomplete = allIncompleteOrders.filter(order => {
      const orderDate = new Date(order.created_at);
      if (orderDate < yesterdayStart || orderDate > yesterdayEnd) return false;
      const bstHour = getBSTHour(orderDate);
      return bstHour >= startH && bstHour <= endH;
    });

    return {
      todayOrders: todayOrders.length,
      yesterdayOrders: yesterdayOrders.length,
      todayIncomplete: todayIncomplete.length,
      yesterdayIncomplete: yesterdayIncomplete.length,
      todayRevenue: todayOrders.filter(o => o.status !== 'cancelled').reduce((sum, o) => sum + o.total_amount, 0),
      yesterdayRevenue: yesterdayOrders.filter(o => o.status !== 'cancelled').reduce((sum, o) => sum + o.total_amount, 0),
    };
  }, [allOrders, allIncompleteOrders, startHour, endHour]);

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

  const fetchAllIncompleteOrders = async () => {
    const incompleteOrders: IncompleteOrder[] = [];
    let from = 0;
    const batchSize = 1000;
    
    while (true) {
      const { data, error } = await supabase
        .from('incomplete_orders')
        .select('id, created_at')
        .order('created_at', { ascending: false })
        .range(from, from + batchSize - 1);
      
      if (error) break;
      if (!data || data.length === 0) break;
      
      incompleteOrders.push(...data);
      
      if (data.length < batchSize) break;
      from += batchSize;
    }
    
    return incompleteOrders;
  };

  const fetchData = async () => {
    setLoading(true);
    const [orders, incomplete] = await Promise.all([
      fetchAllOrders(),
      fetchAllIncompleteOrders()
    ]);
    
    setAllOrders(orders);
    setAllIncompleteOrders(incomplete);
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
    { value: 'thisMonth', label: 'This Month' },
    { value: 'lastMonth', label: 'Last Month' },
    { value: 'custom', label: 'Custom Date Range' },
    { value: 'all', label: 'All Time' },
  ];

  const handleApplyCustom = () => {
    if (!customStart || !customEnd) {
      setCustomError('Please select both start and end dates.');
      return;
    }
    if (customEnd < customStart) {
      setCustomError('End date cannot be earlier than start date.');
      return;
    }
    setCustomError('');
    setAppliedCustom({ start: customStart, end: customEnd });
  };

  const selectedRangeLabel = (() => {
    if (datePreset === 'all') return 'All Time';
    if (datePreset === 'custom') {
      if (!appliedCustom) return 'Custom Date Range (not applied)';
      const s = new Date(appliedCustom.start + 'T00:00:00');
      const e = new Date(appliedCustom.end + 'T00:00:00');
      return `${formatDateDisplay(s)} – ${formatDateDisplay(e)}`;
    }
    const preset = datePresets.find(p => p.value === datePreset);
    const { start, end } = getDateRange(datePreset);
    return `${preset?.label ?? ''} (${formatDateDisplay(start)} – ${formatDateDisplay(end)})`;
  })();

  const hourOptions = [
    { value: 'all', label: 'All Hours' },
    ...Array.from({ length: 24 }, (_, i) => {
      const hour = i + 1;
      const displayHour = hour === 24 ? 12 : hour > 12 ? hour - 12 : hour;
      const ampm = hour < 12 || hour === 24 ? 'AM' : 'PM';
      const label = hour === 12 ? '12 PM' : hour === 24 ? '12 AM' : `${displayHour} ${ampm}`;
      return { value: String(hour), label: `${label} (Hour ${hour})` };
    })
  ];

  const timeRangeHourOptions = Array.from({ length: 24 }, (_, i) => {
    const hour = i + 1;
    const displayHour = hour === 24 ? 12 : hour > 12 ? hour - 12 : hour;
    const ampm = hour < 12 || hour === 24 ? 'AM' : 'PM';
    const label = hour === 12 ? '12 PM' : hour === 24 ? '12 AM' : `${displayHour} ${ampm}`;
    return { value: String(hour), label };
  });

  const getTimeRangeLabel = (hour: string) => {
    const h = parseInt(hour);
    const displayHour = h === 24 ? 12 : h > 12 ? h - 12 : h;
    const ampm = h < 12 || h === 24 ? 'AM' : 'PM';
    return h === 12 ? '12 PM' : h === 24 ? '12 AM' : `${displayHour} ${ampm}`;
  };

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
    { label: 'Total Revenue', value: `৳${(analytics.totalSales + (analytics.incompleteOrders * (analytics.avgOrderValue || 1250))).toLocaleString()}`, icon: DollarSign, color: 'text-primary', bgColor: 'bg-primary/10' },
    { label: 'Avg Order Value', value: `৳${Math.round(analytics.avgOrderValue).toLocaleString()}`, icon: TrendingUp, color: 'text-purple-500', bgColor: 'bg-purple-500/10' },
    { label: 'Incomplete Orders', value: analytics.incompleteOrders, icon: Users, color: 'text-orange-500', bgColor: 'bg-orange-500/10' },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header with Date Filter */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold">Analytics Dashboard</h1>
              <p className="text-muted-foreground text-sm lg:text-base">Campaign performance & insights</p>
              <p className="mt-1 text-xs lg:text-sm font-medium text-primary">
                Showing: {selectedRangeLabel}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <Select value={datePreset} onValueChange={(v) => setDatePreset(v as DatePreset)}>
                  <SelectTrigger className="w-[180px]">
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
              <div className="flex items-center gap-2">
                <Timer className="w-4 h-4 text-muted-foreground" />
                <Select value={hourFilter} onValueChange={(v) => setHourFilter(v as HourFilter)}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Select hour" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    {hourOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <span className="text-xs text-muted-foreground">(BST +6)</span>
            </div>
          </div>

          {datePreset === 'custom' && (
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="flex flex-col md:flex-row md:items-end gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-muted-foreground">From</label>
                  <input
                    type="date"
                    value={customStart}
                    max={customEnd || undefined}
                    onChange={(e) => setCustomStart(e.target.value)}
                    className="h-10 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-muted-foreground">To</label>
                  <input
                    type="date"
                    value={customEnd}
                    min={customStart || undefined}
                    onChange={(e) => setCustomEnd(e.target.value)}
                    className="h-10 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <Button onClick={handleApplyCustom} className="h-10">
                  Apply Filter
                </Button>
                {customError && (
                  <span className="text-xs text-destructive md:ml-2">{customError}</span>
                )}
              </div>
            </div>
          )}
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

            {/* Revenue Overview - Shopify Style */}
            <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
              {/* Header */}
              <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <h2 className="text-base font-semibold text-foreground">Revenue Overview</h2>
                </div>
                <span className="text-xs text-muted-foreground">{selectedRangeLabel}</span>
              </div>

              {/* Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-border">
                {/* Orders Revenue */}
                <div className="px-5 py-5">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Orders Revenue</p>
                  <p className="text-3xl font-bold text-foreground tracking-tight">৳{analytics.totalSales.toLocaleString()}</p>
                  <div className="flex items-center gap-1.5 mt-2">
                    <span className="inline-flex items-center gap-0.5 text-xs font-medium text-emerald-600 bg-emerald-500/10 px-1.5 py-0.5 rounded-full">
                      <TrendingUp className="w-3 h-3" />
                      {analytics.totalOrders}
                    </span>
                    <span className="text-xs text-muted-foreground">confirmed orders</span>
                  </div>
                </div>

                {/* Incomplete Orders Revenue */}
                <div className="px-5 py-5">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Incomplete Orders Revenue</p>
                  <p className="text-3xl font-bold text-foreground tracking-tight">৳{(analytics.incompleteOrders * (analytics.avgOrderValue || 1250)).toLocaleString()}</p>
                  <div className="flex items-center gap-1.5 mt-2">
                    <span className="inline-flex items-center gap-0.5 text-xs font-medium text-orange-600 bg-orange-500/10 px-1.5 py-0.5 rounded-full">
                      {analytics.incompleteOrders}
                    </span>
                    <span className="text-xs text-muted-foreground">incomplete orders</span>
                  </div>
                </div>

                {/* Combined Revenue */}
                <div className="px-5 py-5 bg-muted/30">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Combined Revenue</p>
                  <p className="text-3xl font-bold text-primary tracking-tight">৳{(analytics.totalSales + (analytics.incompleteOrders * (analytics.avgOrderValue || 1250))).toLocaleString()}</p>
                  <div className="flex items-center gap-1.5 mt-2">
                    <span className="inline-flex items-center gap-0.5 text-xs font-medium text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">
                      {analytics.totalOrders + analytics.incompleteOrders}
                    </span>
                    <span className="text-xs text-muted-foreground">total orders</span>
                  </div>
                </div>
              </div>
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

            {/* Time Range Comparison - Today vs Yesterday */}
            <div className="card-glass p-4 lg:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <Timer className="w-5 h-5" />
                  Time Range Comparison (Today vs Yesterday)
                </h2>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm text-muted-foreground">From</span>
                  <Select value={startHour} onValueChange={setStartHour}>
                    <SelectTrigger className="w-[100px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                      {timeRangeHourOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <span className="text-sm text-muted-foreground">to</span>
                  <Select value={endHour} onValueChange={setEndHour}>
                    <SelectTrigger className="w-[100px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                      {timeRangeHourOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <span className="text-xs text-muted-foreground">(BST +6)</span>
                </div>
              </div>

              <p className="text-sm text-muted-foreground mb-4">
                Comparing orders between {getTimeRangeLabel(startHour)} and {getTimeRangeLabel(endHour)}
              </p>

              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Today Orders */}
                <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                  <p className="text-sm text-muted-foreground">Today Orders</p>
                  <p className="text-2xl font-bold text-primary">{timeRangeComparison.todayOrders}</p>
                  <div className="flex items-center gap-1 mt-1">
                    {timeRangeComparison.todayOrders > timeRangeComparison.yesterdayOrders ? (
                      <>
                        <TrendingUp className="w-4 h-4 text-green-500" />
                        <span className="text-xs text-green-500">
                          +{timeRangeComparison.todayOrders - timeRangeComparison.yesterdayOrders} from yesterday
                        </span>
                      </>
                    ) : timeRangeComparison.todayOrders < timeRangeComparison.yesterdayOrders ? (
                      <>
                        <TrendingDown className="w-4 h-4 text-red-500" />
                        <span className="text-xs text-red-500">
                          {timeRangeComparison.todayOrders - timeRangeComparison.yesterdayOrders} from yesterday
                        </span>
                      </>
                    ) : (
                      <span className="text-xs text-muted-foreground">Same as yesterday</span>
                    )}
                  </div>
                </div>

                {/* Yesterday Orders */}
                <div className="p-4 rounded-lg bg-muted/50 border border-border">
                  <p className="text-sm text-muted-foreground">Yesterday Orders</p>
                  <p className="text-2xl font-bold">{timeRangeComparison.yesterdayOrders}</p>
                  <p className="text-xs text-muted-foreground mt-1">Same time range</p>
                </div>

                {/* Today Revenue */}
                <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                  <p className="text-sm text-muted-foreground">Today Revenue</p>
                  <p className="text-2xl font-bold text-emerald-500">৳{timeRangeComparison.todayRevenue.toLocaleString()}</p>
                  <div className="flex items-center gap-1 mt-1">
                    {timeRangeComparison.todayRevenue > timeRangeComparison.yesterdayRevenue ? (
                      <>
                        <TrendingUp className="w-4 h-4 text-green-500" />
                        <span className="text-xs text-green-500">
                          +৳{(timeRangeComparison.todayRevenue - timeRangeComparison.yesterdayRevenue).toLocaleString()}
                        </span>
                      </>
                    ) : timeRangeComparison.todayRevenue < timeRangeComparison.yesterdayRevenue ? (
                      <>
                        <TrendingDown className="w-4 h-4 text-red-500" />
                        <span className="text-xs text-red-500">
                          -৳{(timeRangeComparison.yesterdayRevenue - timeRangeComparison.todayRevenue).toLocaleString()}
                        </span>
                      </>
                    ) : (
                      <span className="text-xs text-muted-foreground">Same as yesterday</span>
                    )}
                  </div>
                </div>

                {/* Yesterday Revenue */}
                <div className="p-4 rounded-lg bg-muted/50 border border-border">
                  <p className="text-sm text-muted-foreground">Yesterday Revenue</p>
                  <p className="text-2xl font-bold">৳{timeRangeComparison.yesterdayRevenue.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground mt-1">Same time range</p>
                </div>

                {/* Today Incomplete */}
                <div className="p-4 rounded-lg bg-orange-500/10 border border-orange-500/20">
                  <p className="text-sm text-muted-foreground">Today Incomplete</p>
                  <p className="text-2xl font-bold text-orange-500">{timeRangeComparison.todayIncomplete}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Yesterday: {timeRangeComparison.yesterdayIncomplete}
                  </p>
                </div>

                {/* Comparison Summary */}
                <div className="p-4 rounded-lg bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20">
                  <p className="text-sm text-muted-foreground">Performance</p>
                  {timeRangeComparison.yesterdayOrders > 0 ? (
                    <>
                      <p className="text-2xl font-bold">
                        {timeRangeComparison.todayOrders >= timeRangeComparison.yesterdayOrders ? (
                          <span className="text-green-500">
                            {((timeRangeComparison.todayOrders / timeRangeComparison.yesterdayOrders) * 100).toFixed(0)}%
                          </span>
                        ) : (
                          <span className="text-red-500">
                            {((timeRangeComparison.todayOrders / timeRangeComparison.yesterdayOrders) * 100).toFixed(0)}%
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">of yesterday's orders</p>
                    </>
                  ) : (
                    <>
                      <p className="text-2xl font-bold text-primary">{timeRangeComparison.todayOrders}</p>
                      <p className="text-xs text-muted-foreground mt-1">No orders yesterday</p>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
              {/* Orders Trend Chart */}
              <div className="card-glass p-4 lg:p-6">
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Orders Trend
                </h2>
                {analytics.dailyOrders.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No data for selected period</p>
                ) : (
                  <div className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={analytics.dailyOrders}>
                        <defs>
                          <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis 
                          dataKey="date" 
                          tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                          tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          stroke="hsl(var(--border))"
                        />
                        <YAxis 
                          tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                          stroke="hsl(var(--border))"
                        />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--card))', 
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                            color: 'hsl(var(--foreground))'
                          }}
                          labelFormatter={(value) => new Date(value).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                          formatter={(value: number) => [value, 'Orders']}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="count" 
                          stroke="hsl(var(--primary))" 
                          strokeWidth={2}
                          fillOpacity={1} 
                          fill="url(#colorOrders)" 
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              {/* Revenue Trend Chart */}
              <div className="card-glass p-4 lg:p-6">
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Revenue Trend
                </h2>
                {analytics.dailyOrders.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No data for selected period</p>
                ) : (
                  <div className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={analytics.dailyOrders}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis 
                          dataKey="date" 
                          tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                          tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          stroke="hsl(var(--border))"
                        />
                        <YAxis 
                          tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                          stroke="hsl(var(--border))"
                          tickFormatter={(value) => `৳${(value / 1000).toFixed(0)}k`}
                        />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--card))', 
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                            color: 'hsl(var(--foreground))'
                          }}
                          labelFormatter={(value) => new Date(value).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                          formatter={(value: number) => [`৳${value.toLocaleString()}`, 'Revenue']}
                        />
                        <Bar 
                          dataKey="revenue" 
                          fill="hsl(var(--primary))" 
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </div>

            {/* Hourly Breakdown Section */}
            <div className="card-glass p-4 lg:p-6">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Timer className="w-5 h-5" />
                Hourly Breakdown (BST +6)
              </h2>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.hourlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="label" 
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                      stroke="hsl(var(--border))"
                      interval={0}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis 
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                      stroke="hsl(var(--border))"
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        color: 'hsl(var(--foreground))'
                      }}
                      formatter={(value: number, name: string) => {
                        if (name === 'orders') return [value, 'Orders'];
                        if (name === 'incomplete') return [value, 'Incomplete'];
                        if (name === 'revenue') return [`৳${value.toLocaleString()}`, 'Revenue'];
                        return [value, name];
                      }}
                    />
                    <Legend />
                    <Bar 
                      dataKey="orders" 
                      fill="hsl(var(--primary))" 
                      name="Orders"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar 
                      dataKey="incomplete" 
                      fill="hsl(25, 95%, 53%)" 
                      name="Incomplete"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Hourly Performance Table */}
            <div className="card-glass p-4 lg:p-6">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Timer className="w-5 h-5" />
                Hourly Performance Table
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-2 text-muted-foreground font-medium text-sm">Hour (BST)</th>
                      <th className="text-right py-3 px-2 text-muted-foreground font-medium text-sm">Orders</th>
                      <th className="text-right py-3 px-2 text-muted-foreground font-medium text-sm">Incomplete</th>
                      <th className="text-right py-3 px-2 text-muted-foreground font-medium text-sm">Revenue</th>
                      <th className="text-right py-3 px-2 text-muted-foreground font-medium text-sm">Conv. Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.hourlyData.map((hourData) => {
                      const total = hourData.orders + hourData.incomplete;
                      const convRate = total > 0 ? ((hourData.orders / total) * 100).toFixed(1) : '0.0';
                      return (
                        <tr key={hourData.hour} className="border-b border-border/50 hover:bg-secondary/50">
                          <td className="py-2 px-2 font-medium text-sm">
                            {hourData.label}
                          </td>
                          <td className="py-2 px-2 text-right text-sm">{hourData.orders}</td>
                          <td className="py-2 px-2 text-right text-sm text-orange-500">{hourData.incomplete}</td>
                          <td className="py-2 px-2 text-right text-sm text-primary font-medium">৳{hourData.revenue.toLocaleString()}</td>
                          <td className="py-2 px-2 text-right text-sm">
                            <span className={hourData.orders > 0 ? 'text-green-500' : 'text-muted-foreground'}>
                              {convRate}%
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="bg-secondary/50 font-bold">
                      <td className="py-3 px-2 text-sm">Total</td>
                      <td className="py-3 px-2 text-right text-sm">{analytics.hourlyData.reduce((sum, h) => sum + h.orders, 0)}</td>
                      <td className="py-3 px-2 text-right text-sm text-orange-500">{analytics.hourlyData.reduce((sum, h) => sum + h.incomplete, 0)}</td>
                      <td className="py-3 px-2 text-right text-sm text-primary">৳{analytics.hourlyData.reduce((sum, h) => sum + h.revenue, 0).toLocaleString()}</td>
                      <td className="py-3 px-2 text-right text-sm">{analytics.conversionRate.toFixed(1)}%</td>
                    </tr>
                  </tfoot>
                </table>
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
