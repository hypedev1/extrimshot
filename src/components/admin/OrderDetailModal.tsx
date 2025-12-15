import { X, Phone, MapPin, Calendar, Package, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Order {
  id: string;
  customer_name: string;
  phone: string;
  address: string;
  status: string;
  total_amount: number;
  package_type?: string;
  created_at: string;
  updated_at: string;
}

const packageLabels: Record<string, string> = {
  regular: 'রেগুলার কোর্স (৯০ গ্রাম) - ১৫ দিন',
  permanent: 'পার্মানেন্ট কোর্স (১৮০ গ্রাম) - ৩০ দিন'
};

interface OrderDetailModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  onStatusChange: (orderId: string, status: string) => void;
}

const statusOptions = [
  { value: 'pending', label: 'পেন্ডিং', color: 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30' },
  { value: 'confirmed', label: 'কনফার্মড', color: 'bg-blue-500/20 text-blue-500 border-blue-500/30' },
  { value: 'delivered', label: 'ডেলিভারড', color: 'bg-green-500/20 text-green-500 border-green-500/30' },
  { value: 'cancelled', label: 'বাতিল', color: 'bg-red-500/20 text-red-500 border-red-500/30' },
];

export const OrderDetailModal = ({ order, isOpen, onClose, onStatusChange }: OrderDetailModalProps) => {
  if (!isOpen || !order) return null;

  const getStatusStyle = (status: string) => {
    return statusOptions.find(s => s.value === status)?.color || 'bg-gray-500/20 text-gray-500';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-card border border-border rounded-2xl w-full max-w-lg max-h-[90vh] overflow-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-card border-b border-border p-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">অর্ডার বিস্তারিত</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-secondary rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Order ID & Status */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs text-muted-foreground">অর্ডার আইডি</p>
              <p className="font-mono text-sm">{order.id.slice(0, 8)}...</p>
            </div>
            <span className={cn('px-3 py-1 rounded-full text-sm font-medium border', getStatusStyle(order.status))}>
              {statusOptions.find(s => s.value === order.status)?.label || order.status}
            </span>
          </div>

          {/* Customer Info */}
          <div className="space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <User className="w-4 h-4" />
              কাস্টমার তথ্য
            </h3>
            <div className="bg-secondary/50 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-muted-foreground" />
                <span>{order.customer_name}</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-muted-foreground" />
                <a href={`tel:${order.phone}`} className="text-primary hover:underline">{order.phone}</a>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                <span>{order.address}</span>
              </div>
            </div>
          </div>

          {/* Order Info */}
          <div className="space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Package className="w-4 h-4" />
              অর্ডার তথ্য
            </h3>
            <div className="bg-secondary/50 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">প্যাকেজ</span>
                <span className="font-semibold">{order.package_type ? packageLabels[order.package_type] || order.package_type : 'রেগুলার'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">পণ্য মূল্য</span>
                <span className="font-semibold">৳{order.total_amount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">ডেলিভারি চার্জ</span>
                <span className="font-semibold text-green-500">ফ্রি</span>
              </div>
              <div className="border-t border-border pt-3 flex items-center justify-between">
                <span className="font-medium">মোট</span>
                <span className="text-xl font-bold text-primary">৳{order.total_amount}</span>
              </div>
            </div>
          </div>

          {/* Dates */}
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <Calendar className="w-4 h-4" />
            <span>অর্ডার করা হয়েছে: {new Date(order.created_at).toLocaleString('bn-BD')}</span>
          </div>

          {/* Status Update */}
          <div className="space-y-3">
            <h3 className="font-semibold">স্ট্যাটাস আপডেট করুন</h3>
            <div className="grid grid-cols-2 gap-2">
              {statusOptions.map((status) => (
                <button
                  key={status.value}
                  onClick={() => {
                    onStatusChange(order.id, status.value);
                    onClose();
                  }}
                  className={cn(
                    'px-4 py-2 rounded-xl text-sm font-medium border transition-all',
                    order.status === status.value
                      ? status.color
                      : 'border-border hover:bg-secondary'
                  )}
                >
                  {status.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};