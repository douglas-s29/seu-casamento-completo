import { useState } from "react";
import { Layout } from "@/components/Layout";
import { useGifts } from "@/hooks/useGifts";
import { useAddGiftPurchase } from "@/hooks/useGiftPurchases";
import { Gift, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Progress } from "@/components/ui/progress";

const Presentes = () => {
  const { data: gifts, isLoading } = useGifts();
  const addPurchase = useAddGiftPurchase();
  const { toast } = useToast();

  const [selectedGift, setSelectedGift] = useState<typeof gifts[0] | null>(null);
  const [purchaserName, setPurchaserName] = useState("");
  const [purchaserEmail, setPurchaserEmail] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePayment = async () => {
    if (!selectedGift || !purchaserName.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, informe seu nome.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    try {
      // Get the current URL for return/completion URLs
      const baseUrl = window.location.origin;
      const returnUrl = `${baseUrl}/presentes`;
      const completionUrl = `${baseUrl}/agradecimento?gift=${encodeURIComponent(selectedGift.name)}&name=${encodeURIComponent(purchaserName.trim())}&amount=${selectedGift.price}`;

      const { data, error } = await supabase.functions.invoke("abacatepay-payment", {
        body: {
          giftId: selectedGift.id,
          giftName: selectedGift.name,
          value: Number(selectedGift.price),
          customerName: purchaserName.trim(),
          customerEmail: purchaserEmail.trim() || undefined,
          returnUrl,
          completionUrl,
        },
      });

      if (error) throw error;

      if (data.success && data.paymentUrl) {
        // Record the purchase before redirecting
        await addPurchase.mutateAsync({
          giftId: selectedGift.id,
          purchaserName: purchaserName.trim(),
          purchaserEmail: purchaserEmail.trim() || undefined,
          amount: Number(selectedGift.price),
        });

        // Redirect to AbacatePay payment page
        window.location.href = data.paymentUrl;
      } else {
        throw new Error(data.error || "Erro ao criar cobrança");
      }
    } catch (error: any) {
      console.error("Payment error:", error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao processar pagamento. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const closeDialog = () => {
    setSelectedGift(null);
    setPurchaserName("");
    setPurchaserEmail("");
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

  return (
    <Layout>
      <div className="py-20 bg-gradient-to-b from-champagne/30 to-background min-h-screen">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h1 className="font-serif text-4xl md:text-6xl mb-4 text-foreground">
              Lista de Presentes
            </h1>
            <div className="h-px w-24 bg-gold mx-auto mb-6" />
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Sua presença é nosso maior presente! Mas se deseja nos presentear,
              aqui estão algumas sugestões que nos ajudarão nesta nova fase.
            </p>
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
                      
                      return (
                        <Card key={gift.id} className="elegant-shadow hover:shadow-lg transition-shadow">
                          {gift.image_url && (
                            <div className="aspect-square bg-muted rounded-t-lg overflow-hidden">
                              <img
                                src={gift.image_url}
                                alt={gift.name}
                                className="w-full h-full object-cover"
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
                              </div>
                            )}
                          </CardContent>
                          <CardFooter>
                            <Button
                              onClick={() => setSelectedGift(gift)}
                              className="w-full bg-gold hover:bg-gold-dark text-primary-foreground"
                            >
                              <Gift className="w-4 h-4 mr-2" />
                              Presentear
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

      {/* Purchase Dialog */}
      <Dialog open={!!selectedGift} onOpenChange={() => closeDialog()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl">
              Presentear com {selectedGift?.name}
            </DialogTitle>
            <DialogDescription>
              Valor: {selectedGift && formatPrice(Number(selectedGift.price))}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Seu nome *</Label>
              <Input
                id="name"
                value={purchaserName}
                onChange={(e) => setPurchaserName(e.target.value)}
                placeholder="Digite seu nome"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Seu e-mail (opcional)</Label>
              <Input
                id="email"
                type="email"
                value={purchaserEmail}
                onChange={(e) => setPurchaserEmail(e.target.value)}
                placeholder="seu@email.com"
              />
            </div>

            <p className="text-sm text-muted-foreground">
              Você será redirecionado para a página de pagamento PIX.
            </p>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={closeDialog}>
              Cancelar
            </Button>
            <Button
              onClick={handlePayment}
              disabled={isProcessing || !purchaserName.trim()}
              className="bg-gold hover:bg-gold-dark text-primary-foreground"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processando...
                </>
              ) : (
                "Pagar com PIX"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default Presentes;
