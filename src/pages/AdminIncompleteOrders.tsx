import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { Search, Phone, User, MapPin, Clock, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface IncompleteOrder {
  id: string;
  phone: string;
  customer_name: string | null;
  address: string | null;
  created_at: string;
  updated_at: string;
}

const AdminIncompleteOrders = () => {
  const [orders, setOrders] = useState<IncompleteOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('incomplete_orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error: any) {
      console.error('Error fetching incomplete orders:', error);
      toast({
        variant: 'destructive',
        title: 'ত্রুটি',
        description: 'অসম্পূর্ণ অর্ডার লোড করতে সমস্যা হয়েছে'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();

    // Subscribe to realtime changes
    const channel = supabase
      .channel('incomplete-orders-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'incomplete_orders' },
        () => fetchOrders()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const deleteOrder = async (id: string) => {
    try {
      const { error } = await supabase
        .from('incomplete_orders')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'সফল',
        description: 'অসম্পূর্ণ অর্ডার মুছে ফেলা হয়েছে'
      });
    } catch (error: any) {
      console.error('Error deleting incomplete order:', error);
      toast({
        variant: 'destructive',
        title: 'ত্রুটি',
        description: 'মুছে ফেলতে সমস্যা হয়েছে'
      });
    }
  };

  const filteredOrders = orders.filter(order =>
    order.phone.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (order.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">অসম্পূর্ণ অর্ডার</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="card-glass p-4">
            <p className="text-muted-foreground text-sm">মোট অসম্পূর্ণ</p>
            <p className="text-2xl font-bold">{orders.length}</p>
          </div>
          <div className="card-glass p-4">
            <p className="text-muted-foreground text-sm">শুধু ফোন নম্বর</p>
            <p className="text-2xl font-bold">
              {orders.filter(o => !o.customer_name && !o.address).length}
            </p>
          </div>
          <div className="card-glass p-4">
            <p className="text-muted-foreground text-sm">আংশিক তথ্য</p>
            <p className="text-2xl font-bold">
              {orders.filter(o => o.customer_name || o.address).length}
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="ফোন নম্বর বা নাম দিয়ে খুঁজুন..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-secondary border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* Orders List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto" />
            <p className="mt-4 text-muted-foreground">লোড হচ্ছে...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-12 card-glass">
            <p className="text-muted-foreground">কোনো অসম্পূর্ণ অর্ডার নেই</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredOrders.map(order => (
              <div key={order.id} className="card-glass p-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
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
                    <a
                      href={`tel:${order.phone}`}
                      className="btn-primary px-4 py-2 text-sm"
                    >
                      কল করুন
                    </a>
                    <button
                      onClick={() => deleteOrder(order.id)}
                      className="p-2 hover:bg-destructive/10 text-destructive rounded-lg transition-colors"
                      title="মুছে ফেলুন"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminIncompleteOrders;