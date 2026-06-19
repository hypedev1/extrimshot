import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { BulkActionsToolbar } from '@/components/admin/BulkActionsToolbar';
import { SerialRangeSelector } from '@/components/admin/SerialRangeSelector';
import { useBulkSelection } from '@/hooks/useBulkSelection';
import { UserX, Plus, Upload, Search, Edit, Trash2, ShieldOff, ShieldCheck } from 'lucide-react';

interface BlockedNumber {
  id: string;
  phone: string;
  reason: string | null;
  is_active: boolean;
  blocked_at: string;
  unblocked_at: string | null;
}

const AdminBlockedNumbers = () => {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [rows, setRows] = useState<BlockedNumber[]>([]);
  const [search, setSearch] = useState('');
  const [busy, setBusy] = useState(false);

  // Add/Edit dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<BlockedNumber | null>(null);
  const [formPhone, setFormPhone] = useState('');
  const [formReason, setFormReason] = useState('');

  // Confirm dialog state
  const [confirm, setConfirm] = useState<{
    open: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
  }>({ open: false, title: '', description: '', onConfirm: () => {} });

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) navigate('/admin/auth');
  }, [user, isAdmin, loading, navigate]);

  const fetchRows = async () => {
    const { data, error } = await supabase
      .from('blocked_phone_numbers')
      .select('*')
      .order('blocked_at', { ascending: false });
    if (error) {
      toast({ variant: 'destructive', title: 'Failed to load', description: error.message });
      return;
    }
    setRows((data || []) as BlockedNumber[]);
  };

  useEffect(() => {
    if (isAdmin) fetchRows();
  }, [isAdmin]);

  const logAction = async (phone: string, action: string, reason?: string | null) => {
    await supabase.from('blocked_phone_audit_log').insert({
      phone,
      action,
      reason: reason ?? null,
      performed_by: user?.id ?? null,
      performed_by_email: user?.email ?? null,
    });
  };

  const openAdd = () => {
    setEditing(null);
    setFormPhone('');
    setFormReason('');
    setDialogOpen(true);
  };

  const openEdit = (row: BlockedNumber) => {
    setEditing(row);
    setFormPhone(row.phone);
    setFormReason(row.reason ?? '');
    setDialogOpen(true);
  };

  const saveBlock = async () => {
    const phone = formPhone.trim();
    if (!phone) {
      toast({ variant: 'destructive', title: 'Phone required' });
      return;
    }
    setBusy(true);
    try {
      if (editing) {
        const { error } = await supabase
          .from('blocked_phone_numbers')
          .update({ phone, reason: formReason.trim() || null })
          .eq('id', editing.id);
        if (error) throw error;
        await logAction(phone, 'edit', formReason.trim());
        toast({ title: 'Updated' });
      } else {
        const doInsert = async () => {
          const { error } = await supabase.from('blocked_phone_numbers').insert({
            phone,
            reason: formReason.trim() || null,
            is_active: true,
            created_by: user?.id ?? null,
          });
          if (error) throw error;
          await logAction(phone, 'block', formReason.trim());
          toast({ title: 'Number blocked' });
        };
        setConfirm({
          open: true,
          title: 'Block this number?',
          description: `Block ${phone} from logging in, registering, or submitting any forms.`,
          onConfirm: async () => {
            try {
              await doInsert();
              setDialogOpen(false);
              fetchRows();
            } catch (e: any) {
              toast({ variant: 'destructive', title: 'Failed', description: e.message });
            }
          },
        });
        setBusy(false);
        return;
      }
      setDialogOpen(false);
      fetchRows();
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Failed', description: e.message });
    } finally {
      setBusy(false);
    }
  };

  const toggleActive = (row: BlockedNumber) => {
    const next = !row.is_active;
    setConfirm({
      open: true,
      title: next ? 'Re-block this number?' : 'Unblock this number?',
      description: `${row.phone} will be ${next ? 're-blocked' : 'unblocked'}.`,
      onConfirm: async () => {
        const { error } = await supabase
          .from('blocked_phone_numbers')
          .update({
            is_active: next,
            unblocked_at: next ? null : new Date().toISOString(),
          })
          .eq('id', row.id);
        if (error) {
          toast({ variant: 'destructive', title: 'Failed', description: error.message });
          return;
        }
        await logAction(row.phone, next ? 'block' : 'unblock');
        toast({ title: next ? 'Re-blocked' : 'Unblocked' });
        fetchRows();
      },
    });
  };

  const deleteRow = (row: BlockedNumber) => {
    setConfirm({
      open: true,
      title: 'Delete this entry?',
      description: `Permanently remove ${row.phone} from the blocklist.`,
      onConfirm: async () => {
        const { error } = await supabase.from('blocked_phone_numbers').delete().eq('id', row.id);
        if (error) {
          toast({ variant: 'destructive', title: 'Failed', description: error.message });
          return;
        }
        await logAction(row.phone, 'delete');
        toast({ title: 'Deleted' });
        fetchRows();
      },
    });
  };

  const handleCsvUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    // Skip header if first line contains "phone"
    const start = /phone/i.test(lines[0] ?? '') ? 1 : 0;
    const entries: { phone: string; reason: string | null }[] = [];
    for (let i = start; i < lines.length; i++) {
      const [phoneRaw, ...rest] = lines[i].split(',');
      const phone = phoneRaw?.trim().replace(/^"|"$/g, '');
      if (!phone) continue;
      const reason = rest.join(',').trim().replace(/^"|"$/g, '') || null;
      entries.push({ phone, reason });
    }
    if (entries.length === 0) {
      toast({ variant: 'destructive', title: 'No valid rows in CSV' });
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }
    const payload = entries.map(e => ({
      phone: e.phone,
      reason: e.reason,
      is_active: true,
      created_by: user?.id ?? null,
    }));
    const { error } = await supabase
      .from('blocked_phone_numbers')
      .upsert(payload, { onConflict: 'phone' });
    if (error) {
      toast({ variant: 'destructive', title: 'Import failed', description: error.message });
    } else {
      for (const en of entries) await logAction(en.phone, 'bulk_block', en.reason);
      toast({ title: `Imported ${entries.length} numbers` });
      fetchRows();
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const filtered = rows.filter(r => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return r.phone.toLowerCase().includes(q) || (r.reason ?? '').toLowerCase().includes(q);
  });

  const bulk = useBulkSelection<BlockedNumber>({
    items: filtered,
    getId: (r) => r.id,
    getOrderKey: (r) => r.blocked_at,
    fileBaseName: 'blocked-numbers-selected',
    toRow: (r) => ({
      Phone: r.phone,
      Reason: r.reason || '',
      Status: r.is_active ? 'Active' : 'Unblocked',
      'Blocked At': new Date(r.blocked_at).toLocaleString(),
    }),
    toTextBlock: (r) => `${r.phone}\t${r.reason || ''}\t${r.is_active ? 'Active' : 'Unblocked'}`,
  });

  if (loading) return null;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
              <UserX className="w-7 h-7 text-destructive" /> Blocked Numbers
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage phone numbers blocked from ordering or interacting with the site.
            </p>
          </div>
          <div className="flex gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={handleCsvUpload}
            />
            <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
              <Upload className="w-4 h-4" /> Import CSV
            </Button>
            <Button onClick={openAdd}>
              <Plus className="w-4 h-4" /> Add Number
            </Button>
          </div>
        </div>

        <div className="relative max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search phone or reason..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">SL</TableHead>
                <TableHead>Phone Number</TableHead>
                <TableHead>Block Date</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No blocked numbers found.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((row, idx) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-mono text-sm text-muted-foreground">#{filtered.length - idx}</TableCell>
                    <TableCell className="font-medium">{row.phone}</TableCell>
                    <TableCell>{new Date(row.blocked_at).toLocaleString()}</TableCell>
                    <TableCell className="max-w-xs truncate">{row.reason || '—'}</TableCell>
                    <TableCell>
                      {row.is_active ? (
                        <Badge variant="destructive">Active</Badge>
                      ) : (
                        <Badge variant="secondary">Unblocked</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button size="icon" variant="ghost" onClick={() => openEdit(row)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => toggleActive(row)}>
                          {row.is_active ? <ShieldOff className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => deleteRow(row)}>
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Blocked Number' : 'Add Blocked Number'}</DialogTitle>
            <DialogDescription>
              {editing ? 'Update phone or reason.' : 'Block a phone number from interacting with the site.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Phone Number</label>
              <Input
                value={formPhone}
                onChange={e => setFormPhone(e.target.value)}
                placeholder="01XXXXXXXXX"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Reason (optional)</label>
              <Textarea
                value={formReason}
                onChange={e => setFormReason(e.target.value)}
                placeholder="Why is this number blocked?"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={saveBlock} disabled={busy}>
              {editing ? 'Save' : 'Block'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation */}
      <AlertDialog open={confirm.open} onOpenChange={(o) => setConfirm({ ...confirm, open: o })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirm.title}</AlertDialogTitle>
            <AlertDialogDescription>{confirm.description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                confirm.onConfirm();
                setConfirm({ ...confirm, open: false });
              }}
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
};

export default AdminBlockedNumbers;
