import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { useGifts } from "@/hooks/useGifts";
import { useAddGiftPurchase } from "@/hooks/useGiftPurchases";
import { useWeddingSettings } from "@/hooks/useWeddingSettings";
import { Gift, Check, Copy, CreditCard, QrCode, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Progress } from "@/components/ui/progress";

type PaymentMethod = "PIX" | "CREDIT_CARD" | null;

interface PixPaymentResult {
  pixQrCode: string;
  pixCopyPaste: string;
  expirationDate: string;
}

const Presentes = () => {
  const navigate = useNavigate();
  const { data: gifts, isLoading } = useGifts();
  const { data: settings } = useWeddingSettings();
  const addPurchase = useAddGiftPurchase();
  const { toast } = useToast();

  const [selectedGift, setSelectedGift] = useState<typeof gifts[0] | null>(null);
  const [purchaserName, setPurchaserName] = useState("");
  const [purchaserEmail, setPurchaserEmail] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [pixResult, setPixResult] = useState<PixPaymentResult | null>(null);

  // Credit card fields
  const [cardNumber, setCardNumber] = useState("");
  const [cardName, setCardName] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [cpf, setCpf] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [addressNumber, setAddressNumber] = useState("");
  const [phone, setPhone] = useState("");

  const handleSelectPayment = async (method: PaymentMethod) => {
    if (!selectedGift || !purchaserName.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, informe seu nome.",
        variant: "destructive",
      });
      return;
    }
    setPaymentMethod(method);
  };

  const goToThankYou = (giftName: string, amount: number) => {
    navigate("/agradecimento", {
      state: {
        purchaserName: purchaserName.trim(),
        giftName,
        amount,
      },
    });
  };

  const handlePixPayment = async () => {
    if (!selectedGift) return;

    setIsProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke("asaas-payment", {
        body: {
          giftId: selectedGift.id,
          giftName: selectedGift.name,
          value: Number(selectedGift.price),
          customerName: purchaserName.trim(),
          customerEmail: purchaserEmail.trim() || undefined,
          billingType: "PIX",
        },
      });

      if (error) throw error;

      if (data.success) {
        setPixResult({
          pixQrCode: data.pixQrCode,
          pixCopyPaste: data.pixCopyPaste,
          expirationDate: data.expirationDate,
        });

        // Record the purchase
        await addPurchase.mutateAsync({
          giftId: selectedGift.id,
          purchaserName: purchaserName.trim(),
          purchaserEmail: purchaserEmail.trim() || undefined,
          amount: Number(selectedGift.price),
        });
      } else {
        throw new Error(data.error || "Erro ao gerar PIX");
      }
    } catch (error: any) {
      console.error("PIX payment error:", error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao gerar QR Code PIX. Tente novamente.",
        variant: "destructive",
      });
      setPaymentMethod(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCardPayment = async () => {
    if (!selectedGift) return;

    if (!cardNumber || !cardName || !cardExpiry || !cardCvv || !cpf || !postalCode || !addressNumber || !phone) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos do cartão.",
        variant: "destructive",
      });
      return;
    }

    const [expiryMonth, expiryYear] = cardExpiry.split("/");
    if (!expiryMonth || !expiryYear) {
      toast({
        title: "Erro",
        description: "Data de validade inválida. Use o formato MM/AA.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke("asaas-payment", {
        body: {
          giftId: selectedGift.id,
          giftName: selectedGift.name,
          value: Number(selectedGift.price),
          customerName: purchaserName.trim(),
          customerEmail: purchaserEmail.trim() || undefined,
          billingType: "CREDIT_CARD",
          creditCard: {
            holderName: cardName,
            number: cardNumber.replace(/\s/g, ""),
            expiryMonth: expiryMonth.padStart(2, "0"),
            expiryYear: `20${expiryYear}`,
            ccv: cardCvv,
          },
          creditCardHolderInfo: {
            name: cardName,
            email: purchaserEmail.trim() || `${purchaserName.trim().toLowerCase().replace(/\s/g, "")}@email.com`,
            cpfCnpj: cpf.replace(/\D/g, ""),
            postalCode: postalCode.replace(/\D/g, ""),
            addressNumber,
            phone: phone.replace(/\D/g, ""),
          },
        },
      });

      if (error) throw error;

      if (data.success && (data.status === "CONFIRMED" || data.status === "RECEIVED")) {
        await addPurchase.mutateAsync({
          giftId: selectedGift.id,
          purchaserName: purchaserName.trim(),
          purchaserEmail: purchaserEmail.trim() || undefined,
          amount: Number(selectedGift.price),
        });

        toast({
          title: "Pagamento confirmado!",
          description: "Obrigado pelo presente!",
        });
        
        goToThankYou(selectedGift.name, Number(selectedGift.price));
      } else if (data.status === "PENDING") {
        await addPurchase.mutateAsync({
          giftId: selectedGift.id,
          purchaserName: purchaserName.trim(),
          purchaserEmail: purchaserEmail.trim() || undefined,
          amount: Number(selectedGift.price),
        });
        
        toast({
          title: "Pagamento em processamento",
          description: "Seu pagamento está sendo processado.",
        });
        
        goToThankYou(selectedGift.name, Number(selectedGift.price));
      } else {
        throw new Error(data.error || "Pagamento não autorizado");
      }
    } catch (error: any) {
      console.error("Card payment error:", error);
      toast({
        title: "Erro no pagamento",
        description: error.message || "Não foi possível processar o pagamento. Verifique os dados do cartão.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePixSuccess = () => {
    if (selectedGift) {
      goToThankYou(selectedGift.name, Number(selectedGift.price));
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copiado!",
      description: "Código PIX copiado para a área de transferência.",
    });
  };

  const closeDialog = () => {
    setSelectedGift(null);
    setPurchaserName("");
    setPurchaserEmail("");
    setPaymentMethod(null);
    setPixResult(null);
    setCardNumber("");
    setCardName("");
    setCardExpiry("");
    setCardCvv("");
    setCpf("");
    setPostalCode("");
    setAddressNumber("");
    setPhone("");
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(price);
  };

  const formatCardNumber = (value: string) => {
    const numbers = value.replace(/\D/g, "").slice(0, 16);
    return numbers.replace(/(\d{4})(?=\d)/g, "$1 ");
  };

  const formatExpiry = (value: string) => {
    const numbers = value.replace(/\D/g, "").slice(0, 4);
    if (numbers.length >= 2) {
      return `${numbers.slice(0, 2)}/${numbers.slice(2)}`;
    }
    return numbers;
  };

  const formatCpf = (value: string) => {
    const numbers = value.replace(/\D/g, "").slice(0, 11);
    return numbers
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  };

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, "").slice(0, 11);
    return numbers
      .replace(/(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{5})(\d)/, "$1-$2");
  };

  const formatCep = (value: string) => {
    const numbers = value.replace(/\D/g, "").slice(0, 8);
    return numbers.replace(/(\d{5})(\d)/, "$1-$2");
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
                              <div className="mt-3 space-y-1">
                                <div className="flex justify-between text-xs text-muted-foreground">
                                  <span>{purchaseCount} de {limit} vendidos</span>
                                  <span>{limit - purchaseCount} restantes</span>
                                </div>
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

      {/* Main Purchase Dialog */}
      <Dialog open={!!selectedGift && !paymentMethod} onOpenChange={() => closeDialog()}>
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

            <div className="pt-4">
              <Label className="mb-3 block">Forma de pagamento</Label>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  className="h-24 flex-col gap-2"
                  onClick={() => handleSelectPayment("PIX")}
                >
                  <QrCode className="w-8 h-8 text-gold" />
                  <span>PIX</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-24 flex-col gap-2"
                  onClick={() => handleSelectPayment("CREDIT_CARD")}
                >
                  <CreditCard className="w-8 h-8 text-gold" />
                  <span>Cartão</span>
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              Cancelar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* PIX Payment Dialog */}
      <Dialog open={paymentMethod === "PIX" && !pixResult} onOpenChange={() => setPaymentMethod(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl text-center">
              Gerando PIX...
            </DialogTitle>
          </DialogHeader>
          <div className="py-8 flex flex-col items-center justify-center">
            {isProcessing ? (
              <>
                <Loader2 className="w-12 h-12 animate-spin text-gold mb-4" />
                <p className="text-muted-foreground">Aguarde enquanto geramos o QR Code...</p>
              </>
            ) : (
              <Button 
                onClick={handlePixPayment}
                className="bg-gold hover:bg-gold-dark text-primary-foreground"
              >
                Gerar QR Code PIX
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* PIX QR Code Result Dialog */}
      <Dialog open={!!pixResult} onOpenChange={() => closeDialog()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl text-center">
              Pagamento via PIX
            </DialogTitle>
            <DialogDescription className="text-center">
              Escaneie o QR Code ou copie o código para pagar
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="text-center">
              <p className="font-serif text-2xl text-gold mb-4">
                {selectedGift && formatPrice(Number(selectedGift.price))}
              </p>
            </div>

            {pixResult?.pixQrCode && (
              <div className="flex justify-center">
                <img
                  src={`data:image/png;base64,${pixResult.pixQrCode}`}
                  alt="QR Code PIX"
                  className="w-48 h-48"
                />
              </div>
            )}

            {pixResult?.pixCopyPaste && (
              <div className="space-y-2">
                <Label>Código PIX Copia e Cola:</Label>
                <div className="flex items-center gap-2">
                  <Input
                    value={pixResult.pixCopyPaste}
                    readOnly
                    className="text-xs"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(pixResult.pixCopyPaste)}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}

            <p className="text-sm text-muted-foreground text-center">
              Após o pagamento, o presente será marcado como presenteado.
            </p>
          </div>
          <DialogFooter className="flex-col gap-2 sm:flex-row">
            <Button variant="outline" onClick={closeDialog} className="w-full sm:w-auto">
              Fechar
            </Button>
            <Button 
              onClick={handlePixSuccess} 
              className="w-full sm:w-auto bg-gold hover:bg-gold-dark text-primary-foreground"
            >
              Já paguei!
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Credit Card Payment Dialog */}
      <Dialog open={paymentMethod === "CREDIT_CARD"} onOpenChange={() => setPaymentMethod(null)}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl">
              Pagamento com Cartão
            </DialogTitle>
            <DialogDescription>
              {selectedGift && formatPrice(Number(selectedGift.price))} - {selectedGift?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Número do cartão</Label>
              <Input
                value={cardNumber}
                onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                placeholder="0000 0000 0000 0000"
                maxLength={19}
              />
            </div>
            <div className="space-y-2">
              <Label>Nome no cartão</Label>
              <Input
                value={cardName}
                onChange={(e) => setCardName(e.target.value.toUpperCase())}
                placeholder="NOME COMO ESTÁ NO CARTÃO"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Validade</Label>
                <Input
                  value={cardExpiry}
                  onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
                  placeholder="MM/AA"
                  maxLength={5}
                />
              </div>
              <div className="space-y-2">
                <Label>CVV</Label>
                <Input
                  value={cardCvv}
                  onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
                  placeholder="123"
                  maxLength={4}
                  type="password"
                />
              </div>
            </div>

            <div className="border-t pt-4 mt-4">
              <p className="text-sm text-muted-foreground mb-4">Dados do titular</p>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>CPF</Label>
                  <Input
                    value={cpf}
                    onChange={(e) => setCpf(formatCpf(e.target.value))}
                    placeholder="000.000.000-00"
                    maxLength={14}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Telefone</Label>
                  <Input
                    value={phone}
                    onChange={(e) => setPhone(formatPhone(e.target.value))}
                    placeholder="(00) 00000-0000"
                    maxLength={15}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>CEP</Label>
                    <Input
                      value={postalCode}
                      onChange={(e) => setPostalCode(formatCep(e.target.value))}
                      placeholder="00000-000"
                      maxLength={9}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Número</Label>
                    <Input
                      value={addressNumber}
                      onChange={(e) => setAddressNumber(e.target.value)}
                      placeholder="123"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setPaymentMethod(null)}>
              Voltar
            </Button>
            <Button
              onClick={handleCardPayment}
              disabled={isProcessing}
              className="bg-gold hover:bg-gold-dark text-primary-foreground"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processando...
                </>
              ) : (
                "Pagar"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default Presentes;
