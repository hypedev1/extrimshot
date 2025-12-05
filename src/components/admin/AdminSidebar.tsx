import { LayoutDashboard, Package, LogOut, Home } from 'lucide-react';
import { NavLink as RouterNavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

const menuItems = [
  { title: 'ড্যাশবোর্ড', icon: LayoutDashboard, path: '/admin' },
  { title: 'অর্ডার সমূহ', icon: Package, path: '/admin/orders' },
];

export const AdminSidebar = () => {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/admin/auth');
  };

  return (
    <aside className="w-64 min-h-screen bg-card border-r border-border flex flex-col">
      <div className="p-6 border-b border-border">
        <h1 className="text-xl font-bold text-gradient">Nobosokti Admin</h1>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => (
          <RouterNavLink
            key={item.path}
            to={item.path}
            end={item.path === '/admin'}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-4 py-3 rounded-xl transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-secondary text-muted-foreground hover:text-foreground'
              )
            }
          >
            <item.icon className="w-5 h-5" />
            <span>{item.title}</span>
          </RouterNavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-border space-y-2">
        <RouterNavLink
          to="/"
          className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
        >
          <Home className="w-5 h-5" />
          <span>মূল সাইট</span>
        </RouterNavLink>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-destructive/10 text-destructive w-full transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span>লগ আউট</span>
        </button>
      </div>
    </aside>
  );
};
