import { X, Phone, Truck, Loader2, Save } from 'lucide-react';
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { PathaoLocationSelector } from '../PathaoLocationSelector';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface CreateOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderCreated: () => void;
}

export const CreateOrderModal = ({ isOpen, onClose, onOrderCreated }: CreateOrderModalProps) => {
  const [phone, setPhone] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [address, setAddress] = useState('');
  const [packageType, setPackageType] = useState<'regular' | 'permanent'>('regular');
  const [pathaoLocation, setPathaoLocation] = useState<{
    cityId: number | null;
    zoneId: number | null;
    areaId: number | null;
  }>({ cityId: null, zoneId: null, areaId: null });
  const [creating, setCreating] = useState(false);
  const [sendingToPathao, setSendingToPathao] = useState(false);
  const { toast } = useToast();

  const handleLocationChange = useCallback((location: { cityId: number | null; zoneId: number | null; areaId: number | null }) => {
    setPathaoLocation(location);
  }, []);

  const resetForm = () => {
    setPhone('');
    setCustomerName('');
    setAddress('');
    setPackageType('regular');
    setPathaoLocation({ cityId: null, zoneId: null, areaId: null });
  };

  if (!isOpen) return null;

  const hasLocation = pathaoLocation.cityId && pathaoLocation.zoneId;
  const canCreateOrder = customerName.trim() && address.trim() && phone.trim();

  const createOrder = async (sendToPathao: boolean) => {
    if (!canCreateOrder) {
      toast({
        variant: 'destructive',
        title: 'ত্রুটি',
        description: 'সব তথ্য পূরণ করুন',
      });
      return;
    }

    if (sendToPathao && !hasLocation) {
      toast({
        variant: 'destructive',
        title: 'ত্রুটি',
        description: 'পাঠাও-তে পাঠাতে শহর এবং জোন নির্বাচন করুন',
      });
      return;
    }

    setCreating(true);
    if (sendToPathao) setSendingToPathao(true);

    try {
      const totalAmount = packageType === 'regular' ? 1250 : 2100;

      // Create the order
      const { data: newOrder, error: orderError } = await supabase
        .from('orders')
        .insert({
          customer_name: customerName.trim(),
          phone: phone.trim(),
          address: address.trim(),
          package_type: packageType,
          total_amount: totalAmount,
          status: 'pending',
          pathao_city_id: pathaoLocation.cityId,
          pathao_zone_id: pathaoLocation.zoneId,
          pathao_area_id: pathaoLocation.areaId,
        })
        .select()
        .single();

      if (orderError) throw orderError;

      if (sendToPathao && newOrder) {
        // Send to Pathao
        const { data, error } = await supabase.functions.invoke('pathao-courier', {
          body: {
            action: 'create_order',
            orderId: newOrder.id,
          },
        });

        if (error) throw error;

        if (data.success) {
          // Update order status to confirmed
          await supabase
            .from('orders')
            .update({ status: 'confirmed' })
            .eq('id', newOrder.id);

          toast({
            title: 'সফল!',
            description: `অর্ডার তৈরি এবং পাঠাও-তে পাঠানো হয়েছে। Consignment ID: ${data.consignment_id}`,
          });
        } else {
          throw new Error(data.error || 'পাঠাও-তে পাঠাতে সমস্যা');
        }
      } else {
        toast({
          title: 'সফল!',
          description: 'অর্ডার তৈরি হয়েছে',
        });
      }

      resetForm();
      onOrderCreated();
      onClose();
    } catch (error: any) {
      console.error('Create order error:', error);
      toast({
        variant: 'destructive',
        title: 'ত্রুটি',
        description: error.message || 'অর্ডার তৈরি করতে সমস্যা হয়েছে',
      });
    } finally {
      setCreating(false);
      setSendingToPathao(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-card border border-border rounded-2xl w-full max-w-lg max-h-[90vh] overflow-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-card border-b border-border p-4 flex items-center justify-between z-10">
          <h2 className="text-lg font-bold">নতুন অর্ডার তৈরি করুন</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-secondary rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Phone */}
          <div className="space-y-2">
            <Label htmlFor="phone">ফোন নম্বর *</Label>
            <Input
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="01XXXXXXXXX"
              className="bg-secondary/50"
            />
          </div>

          {/* Customer Name */}
          <div className="space-y-2">
            <Label htmlFor="customerName">কাস্টমারের নাম *</Label>
            <Input
              id="customerName"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="নাম লিখুন"
              className="bg-secondary/50"
            />
          </div>

          {/* Address */}
          <div className="space-y-2">
            <Label htmlFor="address">ঠিকানা *</Label>
            <Input
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="সম্পূর্ণ ঠিকানা লিখুন"
              className="bg-secondary/50"
            />
          </div>

          {/* Package Type */}
          <div className="space-y-2">
            <Label>প্যাকেজ</Label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setPackageType('regular')}
                className={`p-3 rounded-xl border text-sm font-medium transition-all ${
                  packageType === 'regular'
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-secondary/50 border-border hover:bg-secondary'
                }`}
              >
                রেগুলার - ৳১২৫০
              </button>
              <button
                onClick={() => setPackageType('permanent')}
                className={`p-3 rounded-xl border text-sm font-medium transition-all ${
                  packageType === 'permanent'
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-secondary/50 border-border hover:bg-secondary'
                }`}
              >
                পার্মানেন্ট - ৳২১০০
              </button>
            </div>
          </div>

          {/* Pathao Location */}
          <div className="space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Truck className="w-4 h-4" />
              কুরিয়ার লোকেশন (পাঠাও)
            </h3>
            <div className="bg-secondary/50 rounded-xl p-4">
              <PathaoLocationSelector onLocationChange={handleLocationChange} />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3 pt-4">
            <button
              onClick={() => createOrder(true)}
              disabled={creating || !canCreateOrder || !hasLocation}
              className="w-full py-3 px-4 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {sendingToPathao ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  পাঠানো হচ্ছে...
                </>
              ) : (
                <>
                  <Truck className="w-5 h-5" />
                  অর্ডার তৈরি করুন ও পাঠাও-তে পাঠান
                </>
              )}
            </button>

            <button
              onClick={() => createOrder(false)}
              disabled={creating || !canCreateOrder}
              className="w-full py-3 px-4 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {creating && !sendingToPathao ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  তৈরি হচ্ছে...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  শুধু অর্ডার তৈরি করুন
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};