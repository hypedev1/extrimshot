import { X, Phone, MapPin, Calendar, Package, User, Truck, Loader2, Save, CheckCircle, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { PathaoLocationSelector } from '../PathaoLocationSelector';
import { Textarea } from '@/components/ui/textarea';

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
  pathao_consignment_id?: string | null;
  pathao_city_id?: number | null;
  pathao_zone_id?: number | null;
  pathao_area_id?: number | null;
  notes?: string | null;
}

const packageLabels: Record<string, string> = {
  regular: 'Regular Course (90g) - 15 Days',
  permanent: 'Permanent Course (180g) - 30 Days'
};

interface OrderDetailModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  onStatusChange: (orderId: string, status: string) => void;
}

const statusOptions = [
  { value: 'pending', label: 'Pending', color: 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30' },
  { value: 'confirmed', label: 'Confirmed', color: 'bg-blue-500/20 text-blue-500 border-blue-500/30' },
  { value: 'delivered', label: 'Delivered', color: 'bg-green-500/20 text-green-500 border-green-500/30' },
  { value: 'cancelled', label: 'Cancelled', color: 'bg-red-500/20 text-red-500 border-red-500/30' },
];

export const OrderDetailModal = ({ order, isOpen, onClose, onStatusChange }: OrderDetailModalProps) => {
  const [sendingToPathao, setSendingToPathao] = useState(false);
  const [savingLocation, setSavingLocation] = useState(false);
  const [pathaoLocation, setPathaoLocation] = useState<{
    cityId: number | null;
    zoneId: number | null;
    areaId: number | null;
  }>({ cityId: null, zoneId: null, areaId: null });
  const [locationSaved, setLocationSaved] = useState(false);
  const [notes, setNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);
  const { toast } = useToast();

  // Reset state when order changes
  useEffect(() => {
    if (order) {
      setPathaoLocation({
        cityId: order.pathao_city_id || null,
        zoneId: order.pathao_zone_id || null,
        areaId: order.pathao_area_id || null,
      });
      setLocationSaved(false);
      setNotes(order.notes || '');
    }
  }, [order?.id]);

  const handleLocationChange = useCallback((location: { cityId: number | null; zoneId: number | null; areaId: number | null }) => {
    setPathaoLocation(location);
    setLocationSaved(false);
  }, []);

  const saveNotes = async () => {
    if (!order) return;
    setSavingNotes(true);
    try {
      const { error } = await supabase
        .from('orders')
        .update({ notes })
        .eq('id', order.id);

      if (error) throw error;

      toast({
        title: 'Success!',
        description: 'Notes saved',
      });
    } catch (error: any) {
      console.error('Save notes error:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to save notes',
      });
    } finally {
      setSavingNotes(false);
    }
  };

  if (!isOpen || !order) return null;

  const getStatusStyle = (status: string) => {
    return statusOptions.find(s => s.value === status)?.color || 'bg-gray-500/20 text-gray-500';
  };

  const saveLocation = async () => {
    if (!pathaoLocation.cityId || !pathaoLocation.zoneId) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please select city and zone',
      });
      return;
    }

    setSavingLocation(true);
    try {
      const { error } = await supabase
        .from('orders')
        .update({
          pathao_city_id: pathaoLocation.cityId,
          pathao_zone_id: pathaoLocation.zoneId,
          pathao_area_id: pathaoLocation.areaId,
        })
        .eq('id', order.id);

      if (error) throw error;

      setLocationSaved(true);
      toast({
        title: 'Success!',
        description: 'Location saved',
      });
    } catch (error: any) {
      console.error('Save location error:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to save location',
      });
    } finally {
      setSavingLocation(false);
    }
  };

  const sendToPathao = async () => {
    // Check if location is set
    if (!pathaoLocation.cityId || !pathaoLocation.zoneId) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please select city and zone first',
      });
      return;
    }

    // Save location first if not saved
    if (!locationSaved && !order.pathao_city_id) {
      await saveLocation();
    }

    setSendingToPathao(true);
    try {
      const { data, error } = await supabase.functions.invoke('pathao-courier', {
        body: {
          action: 'create_order',
          orderId: order.id,
        },
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: 'Success!',
          description: `Order sent to Pathao. Consignment ID: ${data.consignment_id}`,
        });
        // Update order status to confirmed
        onStatusChange(order.id, 'confirmed');
        onClose();
      } else {
        throw new Error(data.error || 'Unknown error');
      }
    } catch (error: any) {
      console.error('Pathao error:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to send order to Pathao',
      });
    } finally {
      setSendingToPathao(false);
    }
  };

  const hasLocation = pathaoLocation.cityId && pathaoLocation.zoneId;
  const isAlreadySentToPathao = !!order.pathao_consignment_id;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-card border border-border rounded-2xl w-full max-w-lg max-h-[90vh] overflow-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-card border-b border-border p-4 flex items-center justify-between z-10">
          <h2 className="text-lg font-bold">Order Details</h2>
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
              <p className="text-xs text-muted-foreground">Order ID</p>
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
              Customer Info
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
              Order Info
            </h3>
            <div className="bg-secondary/50 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Package</span>
                <span className="font-semibold">{order.package_type ? packageLabels[order.package_type] || order.package_type : 'Regular'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Product Price</span>
                <span className="font-semibold">৳{order.total_amount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Delivery Charge</span>
                <span className="font-semibold text-green-500">Free</span>
              </div>
              <div className="border-t border-border pt-3 flex items-center justify-between">
                <span className="font-medium">Total</span>
                <span className="text-xl font-bold text-primary">৳{order.total_amount}</span>
              </div>
            </div>
          </div>

          {/* Dates */}
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <Calendar className="w-4 h-4" />
            <span>Ordered: {new Date(order.created_at).toLocaleString('en-US')}</span>
          </div>

          {/* Pathao Integration */}
          <div className="space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Truck className="w-4 h-4" />
              Courier (Pathao)
            </h3>
            
            {isAlreadySentToPathao ? (
              <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4">
                <div className="flex items-center gap-2 text-green-500">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-medium">Sent to Pathao</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Consignment ID: <span className="font-mono">{order.pathao_consignment_id}</span>
                </p>
              </div>
            ) : (
              <>
                <div className="bg-secondary/50 rounded-xl p-4 space-y-4">
                  <p className="text-sm text-muted-foreground">Select delivery location:</p>
                  <PathaoLocationSelector onLocationChange={handleLocationChange} />
                  
                  <button
                    onClick={saveLocation}
                    disabled={savingLocation || !hasLocation}
                    className="w-full py-2 px-4 bg-secondary hover:bg-secondary/80 border border-border rounded-xl font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {savingLocation ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Saving...
                      </>
                    ) : locationSaved ? (
                      <>
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        Location Saved
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        Save Location
                      </>
                    )}
                  </button>
                </div>

                <button
                  onClick={sendToPathao}
                  disabled={sendingToPathao || !hasLocation}
                  className="w-full py-3 px-4 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {sendingToPathao ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Truck className="w-5 h-5" />
                      Send to Pathao
                    </>
                  )}
                </button>
                {!hasLocation && (
                  <p className="text-xs text-muted-foreground text-center">
                    * City and zone selection required for Pathao
                  </p>
                )}
              </>
            )}
          </div>

          {/* Admin Notes */}
          <div className="space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Admin Notes
            </h3>
            <div className="space-y-2">
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Write notes about this order..."
                className="min-h-[80px] resize-none"
              />
              <button
                onClick={saveNotes}
                disabled={savingNotes}
                className="w-full py-2 px-4 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {savingNotes ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save Notes
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Status Update */}
          <div className="space-y-3">
            <h3 className="font-semibold">Update Status</h3>
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