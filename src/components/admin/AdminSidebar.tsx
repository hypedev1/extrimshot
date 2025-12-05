import { LayoutDashboard, Package, LogOut, Home, Menu, X } from 'lucide-react';
import { NavLink as RouterNavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

const menuItems = [
  { title: 'ড্যাশবোর্ড', icon: LayoutDashboard, path: '/admin' },
  { title: 'অর্ডার সমূহ', icon: Package, path: '/admin/orders' },
];

interface AdminSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminSidebar = ({ isOpen, onClose }: AdminSidebarProps) => {
  const { signOut } = useAuth();
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
          <h1 className="text-lg lg:text-xl font-bold text-gradient">Nobosokti Admin</h1>
          <button 
            onClick={onClose}
            className="lg:hidden p-2 hover:bg-secondary rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
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
            onClick={handleNavClick}
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
