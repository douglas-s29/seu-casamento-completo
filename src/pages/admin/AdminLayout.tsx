import { useEffect, useState } from "react";
import { useNavigate, Outlet, Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { LayoutDashboard, Users, Gift, MessageCircle, Settings, LogOut, Home, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

// Secret admin route path - do not share publicly
const ADMIN_BASE = "/x7k9m2p8";

const navItems = [
  { path: `${ADMIN_BASE}/dashboard`, label: "Dashboard", icon: LayoutDashboard },
  { path: `${ADMIN_BASE}/convidados`, label: "Convidados", icon: Users },
  { path: `${ADMIN_BASE}/presentes`, label: "Presentes", icon: Gift },
  { path: `${ADMIN_BASE}/recados`, label: "Recados", icon: MessageCircle },
  { path: `${ADMIN_BASE}/configuracoes`, label: "Configurações", icon: Settings },
];

const AdminLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAdmin, loading, signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      navigate(ADMIN_BASE);
    }
  }, [user, isAdmin, loading, navigate]);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const handleSignOut = async () => {
    await signOut();
    navigate(ADMIN_BASE);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  if (!user || !isAdmin) return null;

  const SidebarContent = () => (
    <>
      <div className="mb-8">
        <h1 className="font-serif text-2xl text-gold">Painel Admin</h1>
        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
      </div>

      <nav className="flex-1 space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors",
              location.pathname === item.path
                ? "bg-gold/10 text-gold font-medium"
                : "text-muted-foreground hover:bg-accent hover:text-foreground"
            )}
          >
            <item.icon className="w-5 h-5" />
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="space-y-2 pt-4 border-t border-border">
        <Link to="/">
          <Button variant="ghost" className="w-full justify-start">
            <Home className="w-4 h-4 mr-2" />
            Ver site
          </Button>
        </Link>
        <Button variant="ghost" className="w-full justify-start text-destructive hover:text-destructive" onClick={handleSignOut}>
          <LogOut className="w-4 h-4 mr-2" />
          Sair
        </Button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background">
      {/* Mobile Header */}
      <header className="md:hidden flex items-center justify-between p-4 border-b border-border bg-card">
        <h1 className="font-serif text-xl text-gold">Painel Admin</h1>
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="w-6 h-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-4 flex flex-col">
            <SidebarContent />
          </SheetContent>
        </Sheet>
      </header>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 bg-card border-r border-border p-4 flex-col shrink-0">
        <SidebarContent />
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
