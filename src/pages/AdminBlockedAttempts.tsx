import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Phone, MapPin, User, Clock, Shield, Trash2, RefreshCw } from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface BlockedAttempt {
  id: string;
  customer_name: string | null;
  phone: string;
  address: string | null;
  fingerprint: string | null;
  ip_address: string | null;
  block_reason: string;
  created_at: string;
}

const AdminBlockedAttempts = () => {
  const { toast } = useToast();
  const [attempts, setAttempts] = useState<BlockedAttempt[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAttempts = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('blocked_order_attempts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast({
        variant: 'destructive',
        title: 'ত্রুটি',
        description: 'ডেটা লোড করতে সমস্যা হয়েছে'
      });
    } else {
      setAttempts(data || []);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchAttempts();
  }, []);

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from('blocked_order_attempts')
      .delete()
      .eq('id', id);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'ত্রুটি',
        description: 'মুছতে সমস্যা হয়েছে'
      });
    } else {
      toast({
        title: 'সফল',
        description: 'রেকর্ড মুছে ফেলা হয়েছে'
      });
      fetchAttempts();
    }
  };

  const handleClearAll = async () => {
    const { error } = await supabase
      .from('blocked_order_attempts')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (error) {
      toast({
        variant: 'destructive',
        title: 'ত্রুটি',
        description: 'মুছতে সমস্যা হয়েছে'
      });
    } else {
      toast({
        title: 'সফল',
        description: 'সব রেকর্ড মুছে ফেলা হয়েছে'
      });
      fetchAttempts();
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold">ব্লক হওয়া অর্ডার প্রচেষ্টা</h1>
            <p className="text-muted-foreground">
              যে সব কাস্টমার ডুপ্লিকেট অর্ডার করার চেষ্টা করেছে তাদের তালিকা
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={fetchAttempts} disabled={isLoading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              রিফ্রেশ
            </Button>
            {attempts.length > 0 && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">
                    <Trash2 className="w-4 h-4 mr-2" />
                    সব মুছুন
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>আপনি কি নিশ্চিত?</AlertDialogTitle>
                    <AlertDialogDescription>
                      এই কাজটি পূর্বাবস্থায় ফেরানো যাবে না। সব ব্লক হওয়া প্রচেষ্টার রেকর্ড মুছে যাবে।
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>বাতিল</AlertDialogCancel>
                    <AlertDialogAction onClick={handleClearAll}>মুছে ফেলুন</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">লোড হচ্ছে...</div>
          ) : attempts.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Shield className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>কোনো ব্লক হওয়া প্রচেষ্টা নেই</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>সময়</TableHead>
                    <TableHead>নাম</TableHead>
                    <TableHead>ফোন</TableHead>
                    <TableHead>ঠিকানা</TableHead>
                    <TableHead>ব্লকের কারণ</TableHead>
                    <TableHead>IP</TableHead>
                    <TableHead className="text-right">অ্যাকশন</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {attempts.map((attempt) => (
                    <TableRow key={attempt.id}>
                      <TableCell className="whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-muted-foreground" />
                          {format(new Date(attempt.created_at), 'dd/MM/yyyy HH:mm')}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-muted-foreground" />
                          {attempt.customer_name || 'N/A'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-muted-foreground" />
                          <a href={`tel:${attempt.phone}`} className="text-primary hover:underline">
                            {attempt.phone}
                          </a>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[200px]">
                        <div className="flex items-start gap-2">
                          <MapPin className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                          <span className="truncate">{attempt.address || 'N/A'}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-destructive bg-destructive/10 px-2 py-1 rounded-md">
                          {attempt.block_reason}
                        </span>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {attempt.ip_address || 'N/A'}
                      </TableCell>
                      <TableCell className="text-right">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>মুছে ফেলবেন?</AlertDialogTitle>
                              <AlertDialogDescription>
                                এই রেকর্ডটি মুছে ফেলা হবে।
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>বাতিল</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(attempt.id)}>
                                মুছুন
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        <div className="text-sm text-muted-foreground">
          মোট {attempts.length}টি ব্লক হওয়া প্রচেষ্টা
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminBlockedAttempts;
