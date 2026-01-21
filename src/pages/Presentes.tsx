import { useState } from "react";
import { Layout } from "@/components/Layout";
import { useGifts, usePurchaseGift } from "@/hooks/useGifts";
import { useWeddingSettings } from "@/hooks/useWeddingSettings";
import { Gift, Check, Copy, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

const Presentes = () => {
  const { data: gifts, isLoading } = useGifts();
  const { data: settings } = useWeddingSettings();
  const purchaseGift = usePurchaseGift();
  const { toast } = useToast();

  const [selectedGift, setSelectedGift] = useState<typeof gifts[0] | null>(null);
  const [purchaserName, setPurchaserName] = useState("");
  const [purchaserEmail, setPurchaserEmail] = useState("");
  const [showPaymentInfo, setShowPaymentInfo] = useState(false);

  const handlePurchase = async () => {
    if (!selectedGift || !purchaserName.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, informe seu nome.",
        variant: "destructive",
      });
      return;
    }

    try {
      await purchaseGift.mutateAsync({
        id: selectedGift.id,
        purchaserName: purchaserName.trim(),
        purchaserEmail: purchaserEmail.trim() || undefined,
      });

      setShowPaymentInfo(true);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Este presente já foi escolhido por outra pessoa.",
        variant: "destructive",
      });
      setSelectedGift(null);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copiado!",
      description: "Chave PIX copiada para a área de transferência.",
    });
  };

  const closeDialog = () => {
    setSelectedGift(null);
    setPurchaserName("");
    setPurchaserEmail("");
    setShowPaymentInfo(false);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(price);
  };

  const availableGifts = gifts?.filter((g) => !g.purchased) || [];
  const purchasedGifts = gifts?.filter((g) => g.purchased) || [];

  const categories = [...new Set(gifts?.map((g) => g.category).filter(Boolean))];

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
          ) : availableGifts.length === 0 && purchasedGifts.length === 0 ? (
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
                    {availableGifts.map((gift) => (
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
                    ))}
                  </div>
                </div>
              )}

              {/* Purchased Gifts */}
              {purchasedGifts.length > 0 && (
                <div>
                  <h2 className="font-serif text-2xl mb-8 text-center text-muted-foreground">
                    Presentes já escolhidos ({purchasedGifts.length})
                  </h2>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 opacity-60">
                    {purchasedGifts.map((gift) => (
                      <Card key={gift.id} className="relative">
                        <div className="absolute inset-0 bg-background/60 rounded-lg z-10 flex items-center justify-center">
                          <div className="text-center">
                            <Check className="w-12 h-12 text-success mx-auto mb-2" />
                            <p className="font-medium text-success">Já presenteado</p>
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
      <Dialog open={!!selectedGift && !showPaymentInfo} onOpenChange={() => closeDialog()}>
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              Cancelar
            </Button>
            <Button
              onClick={handlePurchase}
              disabled={purchaseGift.isPending}
              className="bg-gold hover:bg-gold-dark text-primary-foreground"
            >
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment Info Dialog */}
      <Dialog open={showPaymentInfo} onOpenChange={() => closeDialog()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl text-center">
              <Check className="w-12 h-12 text-success mx-auto mb-4" />
              Obrigado, {purchaserName}!
            </DialogTitle>
            <DialogDescription className="text-center">
              Você escolheu nos presentear com: <strong>{selectedGift?.name}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-center text-muted-foreground">
              Para completar o presente, faça uma transferência usando os dados abaixo:
            </p>
            
            <div className="bg-champagne rounded-lg p-4 space-y-3">
              <p className="text-lg font-serif text-center text-gold">
                {selectedGift && formatPrice(Number(selectedGift.price))}
              </p>
              
              {settings?.pix_key && (
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Chave PIX:</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 bg-background rounded px-3 py-2 text-sm">
                      {settings.pix_key}
                    </code>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(settings.pix_key!)}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}

              {settings?.account_holder && (
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Titular:</p>
                  <p className="font-medium">{settings.account_holder}</p>
                </div>
              )}

              {settings?.bank_name && (
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Banco:</p>
                  <p className="font-medium">{settings.bank_name}</p>
                </div>
              )}

              {!settings?.pix_key && !settings?.bank_name && (
                <p className="text-center text-muted-foreground italic">
                  Dados bancários serão informados em breve.
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button onClick={closeDialog} className="w-full bg-gold hover:bg-gold-dark text-primary-foreground">
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default Presentes;
