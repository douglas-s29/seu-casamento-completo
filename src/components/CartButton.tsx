import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/useCart";
import { Link } from "react-router-dom";

export const CartButton = () => {
  const totalItems = useCart((state) => state.getTotalItems());

  return (
    <Button
      variant="outline"
      size="icon"
      className="relative"
      asChild
    >
      <Link to="/checkout">
        <ShoppingCart className="w-5 h-5" />
        {totalItems > 0 && (
          <span className="absolute -top-2 -right-2 bg-gold text-primary-foreground text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
            {totalItems > 9 ? "9+" : totalItems}
          </span>
        )}
      </Link>
    </Button>
  );
};