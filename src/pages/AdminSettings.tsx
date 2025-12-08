import { useState } from 'react';
import { Save, Bell, Shield, Store } from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useToast } from '@/hooks/use-toast';

const AdminSettings = () => {
  const { toast } = useToast();
  const [settings, setSettings] = useState({
    storeName: 'Extrimshot',
    storePhone: '01XXXXXXXXX',
    productPrice: 1250,
    deliveryCharge: 0,
    enableNotifications: true,
  });

  const handleSave = () => {
    // In a real app, this would save to database
    localStorage.setItem('storeSettings', JSON.stringify(settings));
    toast({ title: 'সফল', description: 'সেটিংস সেভ হয়েছে' });
  };

  return (
    <AdminLayout>
      <div className="space-y-8 max-w-3xl">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold">সেটিংস</h1>
          <p className="text-muted-foreground text-sm lg:text-base">স্টোর কনফিগারেশন ম্যানেজ করুন</p>
        </div>

        {/* Store Settings */}
        <div className="card-glass p-6 space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-border">
            <div className="p-2 rounded-lg bg-primary/20">
              <Store className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-lg font-semibold">স্টোর তথ্য</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2">স্টোরের নাম</label>
              <input
                type="text"
                value={settings.storeName}
                onChange={(e) => setSettings({ ...settings, storeName: e.target.value })}
                className="w-full bg-secondary border border-border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">যোগাযোগ নম্বর</label>
              <input
                type="text"
                value={settings.storePhone}
                onChange={(e) => setSettings({ ...settings, storePhone: e.target.value })}
                className="w-full bg-secondary border border-border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
        </div>

        {/* Pricing Settings */}
        <div className="card-glass p-6 space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-border">
            <div className="p-2 rounded-lg bg-green-500/20">
              <Shield className="w-5 h-5 text-green-500" />
            </div>
            <h2 className="text-lg font-semibold">মূল্য নির্ধারণ</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2">পণ্যের মূল্য (৳)</label>
              <input
                type="number"
                value={settings.productPrice}
                onChange={(e) => setSettings({ ...settings, productPrice: parseInt(e.target.value) || 0 })}
                className="w-full bg-secondary border border-border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">ডেলিভারি চার্জ (৳)</label>
              <input
                type="number"
                value={settings.deliveryCharge}
                onChange={(e) => setSettings({ ...settings, deliveryCharge: parseInt(e.target.value) || 0 })}
                className="w-full bg-secondary border border-border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="card-glass p-6 space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-border">
            <div className="p-2 rounded-lg bg-blue-500/20">
              <Bell className="w-5 h-5 text-blue-500" />
            </div>
            <h2 className="text-lg font-semibold">নোটিফিকেশন</h2>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">নতুন অর্ডার নোটিফিকেশন</p>
              <p className="text-sm text-muted-foreground">নতুন অর্ডার আসলে নোটিফিকেশন পান</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.enableNotifications}
                onChange={(e) => setSettings({ ...settings, enableNotifications: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-secondary rounded-full peer peer-checked:bg-primary peer-focus:ring-4 peer-focus:ring-primary/25 after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
            </label>
          </div>
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          className="btn-primary flex items-center gap-2"
        >
          <Save className="w-5 h-5" />
          সেটিংস সেভ করুন
        </button>
      </div>
    </AdminLayout>
  );
};

export default AdminSettings;