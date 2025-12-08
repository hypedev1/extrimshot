import { useState, useEffect } from 'react';
import { ShieldAlert, Trash2, Search, RefreshCw, Phone, Monitor, Globe, Clock } from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { bn } from 'date-fns/locale';

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
        title: 'ত্রুটি',
        description: 'ডেটা লোড করতে সমস্যা হয়েছে'
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
        title: 'সফল',
        description: 'রেকর্ড মুছে ফেলা হয়েছে'
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'ত্রুটি',
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
        title: 'সফল',
        description: '২৪ ঘণ্টার পুরনো রেকর্ড মুছে ফেলা হয়েছে'
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'ত্রুটি',
        description: error.message
      });
    }
  };

  const filteredAttempts = attempts.filter(attempt =>
    attempt.phone.toLowerCase().includes(searchQuery.toLowerCase()) ||
    attempt.fingerprint.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (attempt.ip_address && attempt.ip_address.includes(searchQuery))
  );

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
    return format(new Date(dateStr), 'dd MMM yyyy, hh:mm a', { locale: bn });
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
                <p className="text-xs text-muted-foreground">মোট রেকর্ড</p>
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
                <p className="text-xs text-muted-foreground">গত ২৪ ঘণ্টায়</p>
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
                <p className="text-xs text-muted-foreground">ইউনিক ডিভাইস</p>
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
                <p className="text-xs text-muted-foreground">সন্দেহজনক ডিভাইস</p>
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
              placeholder="ফোন, আইপি বা ফিঙ্গারপ্রিন্ট দিয়ে খুঁজুন..."
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
              <span className="hidden sm:inline">রিফ্রেশ</span>
            </button>
            <button
              onClick={handleClearOld}
              className="flex items-center gap-2 px-4 py-2 bg-destructive/10 hover:bg-destructive/20 text-destructive rounded-xl transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              <span className="hidden sm:inline">পুরনো মুছুন</span>
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="card-glass overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">
              লোড হচ্ছে...
            </div>
          ) : filteredAttempts.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              কোনো রেকর্ড পাওয়া যায়নি
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-secondary/50">
                  <tr>
                    <th className="text-left px-4 py-3 text-sm font-medium">ফোন</th>
                    <th className="text-left px-4 py-3 text-sm font-medium hidden md:table-cell">আইপি</th>
                    <th className="text-left px-4 py-3 text-sm font-medium hidden lg:table-cell">ডিভাইস</th>
                    <th className="text-left px-4 py-3 text-sm font-medium">সময়</th>
                    <th className="text-left px-4 py-3 text-sm font-medium">স্ট্যাটাস</th>
                    <th className="text-right px-4 py-3 text-sm font-medium">অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredAttempts.map((attempt) => {
                    const isRepeatDevice = fingerprintCounts[attempt.fingerprint] > 1;
                    const isRepeatIP = attempt.ip_address && ipCounts[attempt.ip_address] > 1;
                    
                    return (
                      <tr 
                        key={attempt.id} 
                        className="hover:bg-secondary/30 cursor-pointer"
                        onClick={() => setSelectedAttempt(attempt)}
                      >
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
                              সন্দেহজনক
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-accent/20 text-accent rounded-full text-xs font-medium">
                              স্বাভাবিক
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(attempt.id);
                            }}
                            className="p-2 hover:bg-destructive/10 text-destructive rounded-lg transition-colors"
                            title="মুছুন"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
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
                <h3 className="text-lg font-bold">রেকর্ড বিস্তারিত</h3>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">ফোন নম্বর</p>
                  <p className="font-medium">{selectedAttempt.phone}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">আইপি এড্রেস</p>
                  <p className="font-medium">{selectedAttempt.ip_address || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">ফিঙ্গারপ্রিন্ট</p>
                  <p className="font-mono text-sm break-all">{selectedAttempt.fingerprint}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">স্ক্রিন রেজোলিউশন</p>
                  <p className="font-medium">{selectedAttempt.screen_resolution || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">টাইমজোন</p>
                  <p className="font-medium">{selectedAttempt.timezone || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">ভাষা</p>
                  <p className="font-medium">{selectedAttempt.language || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">ইউজার এজেন্ট</p>
                  <p className="text-xs font-mono break-all text-muted-foreground">{selectedAttempt.user_agent || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">সময়</p>
                  <p className="font-medium">{formatDate(selectedAttempt.created_at)}</p>
                </div>
              </div>
              <div className="p-6 border-t border-border flex gap-3">
                <button
                  onClick={() => handleDelete(selectedAttempt.id)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-destructive text-destructive-foreground rounded-xl hover:bg-destructive/90 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  মুছে ফেলুন
                </button>
                <button
                  onClick={() => setSelectedAttempt(null)}
                  className="flex-1 px-4 py-2 bg-secondary hover:bg-secondary/80 rounded-xl transition-colors"
                >
                  বন্ধ করুন
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
