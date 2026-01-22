import { Layout } from "@/components/Layout";
import { useGifts } from "@/hooks/useGifts";
import { useCart } from "@/hooks/useCart";
import { Gift, Check, ShoppingCart, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Link } from "react-router-dom";

const Presentes = () => {
  const { data: gifts, isLoading } = useGifts();
  const { addItem, items } = useCart();
  const { toast } = useToast();

  const handleAddToCart = (gift: typeof gifts[0]) => {
    addItem({
      id: crypto.randomUUID(),
      giftId: gift.id,
      name: gift.name,
      price: Number(gift.price),
      imageUrl: gift.image_url,
    });
    
    toast({
      title: "Adicionado ao carrinho!",
      description: `${gift.name} foi adicionado à sua cesta de presentes.`,
    });
  };

  const isInCart = (giftId: string) => {
    return items.some((item) => item.giftId === giftId);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(price);
  };

  // Filter gifts based on purchase count
  const availableGifts = gifts?.filter((g) => {
    const purchaseCount = (g as any).purchase_count || 0;
    const limit = (g as any).purchase_limit || 1;
    return purchaseCount < limit;
  }) || [];
  
  const soldOutGifts = gifts?.filter((g) => {
    const purchaseCount = (g as any).purchase_count || 0;
    const limit = (g as any).purchase_limit || 1;
    return purchaseCount >= limit;
  }) || [];

  const cartItemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <Layout>
      <div className="py-20 bg-gradient-to-b from-champagne/30 to-background min-h-screen">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h1 className="font-serif text-4xl md:text-6xl mb-4 text-foreground">
              Lista de Presentes
            </h1>
            <div className="h-px w-24 bg-gold mx-auto mb-6" />
            <p className="text-muted-foreground max-w-2xl mx-auto mb-8">
              Sua presença é nosso maior presente! Mas se deseja nos presentear,
              aqui estão algumas sugestões que nos ajudarão nesta nova fase.
            </p>
            
            {/* Cart Summary */}
            {cartItemCount > 0 && (
              <div className="inline-flex items-center gap-4 bg-gold/10 border border-gold/20 rounded-lg px-6 py-3">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-gold" />
                  <span className="font-medium">
                    {cartItemCount} {cartItemCount === 1 ? "item" : "itens"} no carrinho
                  </span>
                </div>
                <Button asChild className="bg-gold hover:bg-gold-dark">
                  <Link to="/checkout">
                    Finalizar Compra
                  </Link>
                </Button>
              </div>
            )}
          </div>

          {isLoading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Carregando presentes...</p>
            </div>
          ) : availableGifts.length === 0 && soldOutGifts.length === 0 ? (
            <div className="text-center py-12">
              <Gift className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground text-lg">
                A lista de presentes será adicionada em breve!
              </p>
            </div>
          ) : (
            <>
              {/* Available Gifts */}
              {availableGifts.length > 0 && (
                <div className="mb-16">
                  <h2 className="font-serif text-2xl mb-8 text-center">
                    Presentes Disponíveis ({availableGifts.length})
                  </h2>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {availableGifts.map((gift) => {
                      const purchaseCount = (gift as any).purchase_count || 0;
                      const limit = (gift as any).purchase_limit || 1;
                      const progress = (purchaseCount / limit) * 100;
                      const inCart = isInCart(gift.id);
                      
                      return (
                        <Card key={gift.id} className="elegant-shadow hover:shadow-lg transition-shadow group">
                          {gift.image_url && (
                            <div className="aspect-square bg-muted rounded-t-lg overflow-hidden">
                              <img
                                src={gift.image_url}
                                alt={gift.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                            </div>
                          )}
                          <CardHeader className="pb-2">
                            <div className="flex items-start justify-between gap-2">
                              <CardTitle className="font-serif text-lg leading-tight">
                                {gift.name}
                              </CardTitle>
                              {gift.category && (
                                <Badge variant="secondary" className="text-xs shrink-0">
                                  {gift.category}
                                </Badge>
                              )}
                            </div>
                          </CardHeader>
                          <CardContent className="pb-2">
                            {gift.description && (
                              <p className="text-sm text-muted-foreground mb-2">
                                {gift.description}
                              </p>
                            )}
                            <p className="font-serif text-2xl text-gold">
                              {formatPrice(Number(gift.price))}
                            </p>
                            {limit > 1 && (
                              <div className="mt-3">
                                <Progress value={progress} className="h-1.5" />
                                <p className="text-xs text-muted-foreground mt-1">
                                  {limit - purchaseCount} disponíveis
                                </p>
                              </div>
                            )}
                          </CardContent>
                          <CardFooter>
                            <Button
                              onClick={() => handleAddToCart(gift)}
                              className={`w-full ${inCart ? "bg-success hover:bg-success/90" : "bg-gold hover:bg-gold-dark"} text-primary-foreground`}
                              variant={inCart ? "default" : "default"}
                            >
                              {inCart ? (
                                <>
                                  <Check className="w-4 h-4 mr-2" />
                                  No Carrinho
                                </>
                              ) : (
                                <>
                                  <Plus className="w-4 h-4 mr-2" />
                                  Adicionar
                                </>
                              )}
                            </Button>
                          </CardFooter>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Sold Out Gifts */}
              {soldOutGifts.length > 0 && (
                <div>
                  <h2 className="font-serif text-2xl mb-8 text-center text-muted-foreground">
                    Presentes já escolhidos ({soldOutGifts.length})
                  </h2>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 opacity-60">
                    {soldOutGifts.map((gift) => (
                      <Card key={gift.id} className="relative">
                        <div className="absolute inset-0 bg-background/60 rounded-lg z-10 flex items-center justify-center">
                          <div className="text-center">
                            <Check className="w-12 h-12 text-success mx-auto mb-2" />
                            <p className="font-medium text-success">Esgotado</p>
                          </div>
                        </div>
                        {gift.image_url && (
                          <div className="aspect-square bg-muted rounded-t-lg overflow-hidden">
                            <img
                              src={gift.image_url}
                              alt={gift.name}
                              className="w-full h-full object-cover grayscale"
                            />
                          </div>
                        )}
                        <CardHeader className="pb-2">
                          <CardTitle className="font-serif text-lg">{gift.name}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="font-serif text-xl text-muted-foreground">
                            {formatPrice(Number(gift.price))}
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Presentes;