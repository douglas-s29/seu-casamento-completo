import { Link, useLocation } from "react-router-dom";
import { Menu, X, Heart, Gift, MessageCircle, MapPin, LogIn } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navItems = [
  { path: "/", label: "Início", icon: Heart },
  { path: "/evento", label: "Evento", icon: MapPin },
  { path: "/presentes", label: "Presentes", icon: Gift },
  { path: "/confirmar", label: "Confirmar Presença", icon: MessageCircle },
  { path: "/recados", label: "Recados", icon: MessageCircle },
];

export function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="font-serif text-2xl text-gold">
            Nosso Casamento
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "px-4 py-2 text-sm font-medium transition-colors rounded-md",
                  location.pathname === item.path
                    ? "text-gold bg-accent"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                )}
              >
                {item.label}
              </Link>
            ))}
            <Link to="/admin">
              <Button variant="outline" size="sm" className="ml-2">
                <LogIn className="w-4 h-4 mr-2" />
                Admin
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 text-foreground"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden py-4 border-t border-border animate-fade-in">
            <div className="flex flex-col gap-2">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-md transition-colors",
                    location.pathname === item.path
                      ? "text-gold bg-accent"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </Link>
              ))}
              <Link
                to="/admin"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent/50"
              >
                <LogIn className="w-5 h-5" />
                Área Admin
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
