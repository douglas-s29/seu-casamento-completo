import { Heart } from "lucide-react";

export function Footer() {
  return (
    <footer className="py-8 border-t border-border bg-champagne/30">
      <div className="container mx-auto px-4 text-center">
        <div className="flex items-center justify-center gap-2 text-muted-foreground">
          <span className="font-serif text-lg">Feito com</span>
          <Heart className="w-4 h-4 text-gold fill-gold" />
          <span className="font-serif text-lg">para nosso grande dia</span>
        </div>
      </div>
    </footer>
  );
}
