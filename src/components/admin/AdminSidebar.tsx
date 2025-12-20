import { LayoutDashboard, Package, LogOut, Home, Menu, X, Settings, BarChart3, Users, AlertCircle, ShieldAlert, UserX } from 'lucide-react';
import { NavLink as RouterNavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

const menuItems = [
  { title: 'Dashboard', icon: LayoutDashboard, path: '/admin' },
  { title: 'Orders', icon: Package, path: '/admin/orders' },
  { title: 'Incomplete Orders', icon: AlertCircle, path: '/admin/incomplete-orders' },
  { title: 'Fraud Prevention', icon: ShieldAlert, path: '/admin/fraud-attempts' },
  { title: 'Blocked Attempts', icon: UserX, path: '/admin/blocked-attempts' },
  { title: 'Analytics', icon: BarChart3, path: '/admin/analytics' },
  { title: 'Settings', icon: Settings, path: '/admin/settings' },
];

interface AdminSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminSidebar = ({ isOpen, onClose }: AdminSidebarProps) => {
  const { signOut, user } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/admin/auth');
  };

  const handleNavClick = () => {
    onClose();
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed lg:static inset-y-0 left-0 z-50 w-64 bg-card border-r border-border flex flex-col transform transition-transform duration-300 ease-in-out",
        isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        <div className="p-4 lg:p-6 border-b border-border flex items-center justify-between">
          <div>
            <h1 className="text-lg lg:text-xl font-bold text-gradient">Admin Panel</h1>
            <p className="text-xs text-muted-foreground mt-1">Extrimshot</p>
          </div>
          <button 
            onClick={onClose}
            className="lg:hidden p-2 hover:bg-secondary rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User info */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">Admin</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {menuItems.map((item) => (
            <RouterNavLink
              key={item.path}
              to={item.path}
              end={item.path === '/admin'}
              onClick={handleNavClick}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200',
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25'
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
            onClick={handleNavClick}
            className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
          >
            <Home className="w-5 h-5" />
            <span>Main Site</span>
          </RouterNavLink>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-destructive/10 text-destructive w-full transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span>Log Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export const MobileMenuButton = ({ onClick }: { onClick: () => void }) => (
  <button
    onClick={onClick}
    className="lg:hidden p-2 hover:bg-secondary rounded-lg"
  >
    <Menu className="w-6 h-6" />
  </button>
);