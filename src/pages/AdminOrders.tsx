import { useEffect, useState } from 'react';
import { Search, ChevronDown, Eye, Phone, Copy } from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { OrderDetailModal } from '@/components/admin/OrderDetailModal';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Order {
  id: string;
  customer_name: string;
  phone: string;
  address: string;
  status: string;
  total_amount: number;
  package_type: string;
  created_at: string;
  updated_at: string;
}

const packageLabels: Record<string, string> = {
  regular: 'রেগুলার (৯০গ্রাম)',
  permanent: 'পার্মানেন্ট (১৮০গ্রাম)'
};

const statusOptions = [
  { value: 'pending', label: 'পেন্ডিং', color: 'bg-yellow-500/20 text-yellow-500' },
  { value: 'confirmed', label: 'কনফার্মড', color: 'bg-blue-500/20 text-blue-500' },
  { value: 'delivered', label: 'ডেলিভারড', color: 'bg-green-500/20 text-green-500' },
  { value: 'cancelled', label: 'বাতিল', color: 'bg-red-500/20 text-red-500' },
];

const AdminOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { toast } = useToast();

  const fetchOrders = async () => {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast({ variant: 'destructive', title: 'ত্রুটি', description: error.message });
    } else {
      setOrders(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchOrders();

    const channel = supabase
      .channel('orders-list')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, fetchOrders)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const updateStatus = async (orderId: string, newStatus: string) => {
    const { error } = await supabase
      .from('orders')
      .update({ status: newStatus })
      .eq('id', orderId);

    if (error) {
      toast({ variant: 'destructive', title: 'ত্রুটি', description: error.message });
    } else {
      toast({ title: 'সফল', description: 'অর্ডার স্ট্যাটাস আপডেট হয়েছে' });
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.phone.includes(searchTerm);
    const matchesFilter = filterStatus === 'all' || order.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const getStatusStyle = (status: string) => {
    return statusOptions.find(s => s.value === status)?.color || 'bg-gray-500/20 text-gray-500';
  };

  const copyOrderToClipboard = async (order: Order) => {
    // Tab-separated format for Google Sheets (Name, Phone, Address, Package)
    const packageName = packageLabels[order.package_type] || order.package_type;
    const copyText = `${order.customer_name}\t${order.phone}\t${order.address}\t${packageName}`;
    
    try {
      await navigator.clipboard.writeText(copyText);
      toast({ title: 'কপি হয়েছে', description: 'অর্ডার তথ্য ক্লিপবোর্ডে কপি হয়েছে' });
    } catch (err) {
      toast({ variant: 'destructive', title: 'ত্রুটি', description: 'কপি করতে সমস্যা হয়েছে' });
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold">অর্ডার সমূহ</h1>
          <p className="text-muted-foreground text-sm lg:text-base">সকল অর্ডার দেখুন এবং ম্যানেজ করুন</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="নাম বা ফোন নম্বর দিয়ে খুঁজুন..."
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
            <option value="all">সকল স্ট্যাটাস</option>
            {statusOptions.map(s => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="card-glass p-12 text-center">
            <p className="text-muted-foreground">কোনো অর্ডার পাওয়া যায়নি</p>
          </div>
        ) : (
          <div className="card-glass overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-secondary/50">
                    <th className="text-left py-4 px-4 font-medium">নাম</th>
                    <th className="text-left py-4 px-4 font-medium">ফোন</th>
                    <th className="text-left py-4 px-4 font-medium hidden lg:table-cell">ঠিকানা</th>
                    <th className="text-left py-4 px-4 font-medium">প্যাকেজ</th>
                    <th className="text-left py-4 px-4 font-medium">মূল্য</th>
                    <th className="text-left py-4 px-4 font-medium">স্ট্যাটাস</th>
                    <th className="text-left py-4 px-4 font-medium hidden sm:table-cell">তারিখ</th>
                    <th className="text-left py-4 px-4 font-medium">অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((order) => (
                    <tr key={order.id} className="border-t border-border hover:bg-secondary/30">
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
                        {new Date(order.created_at).toLocaleDateString('bn-BD')}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => copyOrderToClipboard(order)}
                            className="p-2 hover:bg-secondary rounded-lg transition-colors text-primary"
                            title="কপি করুন"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedOrder(order);
                              setIsModalOpen(true);
                            }}
                            className="p-2 hover:bg-secondary rounded-lg transition-colors"
                            title="বিস্তারিত দেখুন"
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
    </AdminLayout>
  );
};

export default AdminOrders;
