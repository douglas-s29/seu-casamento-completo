import { useState, useEffect, useCallback, useRef } from "react";
import { Layout } from "@/components/Layout";
import { useCart } from "@/hooks/useCart";
import { useAddGiftPurchase } from "@/hooks/useGiftPurchases";
import { 
  ShoppingCart, 
  Trash2, 
  Plus, 
  Minus, 
  ArrowLeft, 
  CreditCard, 
  Wallet,
  Loader2,
  Gift,
  ShieldCheck,
  Lock,
  Copy,
  Check,
  Clock,
  CheckCircle2,
  XCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Link, useNavigate } from "react-router-dom";
import { 
  validateCheckoutForm, 
  formatCPF, 
  formatPhone, 
  formatCardNumber, 
  formatCardExpiry,
  formatCEP 
} from "@/utils/checkoutValidation";
import { processPixPayment, processCreditCardPayment, checkPaymentStatus, cancelPayment } from "@/services/paymentService";

type PaymentMethod = "PIX" | "CREDIT_CARD";
type PixStatus = "pending" | "paid" | "expired" | "cancelled";

const PIX_TIMEOUT_SECONDS = 8 * 60; // 8 minutes

const Checkout = () => {
  const { items, removeItem, updateQuantity, clearCart, getTotalPrice } = useCart();
  const addPurchase = useAddGiftPurchase();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("PIX");
  const [isProcessing, setIsProcessing] = useState(false);
  
  // PIX result state
  const [pixResult, setPixResult] = useState<{
    paymentId?: string;
    pixQrCode?: string;
    pixCopyPaste?: string;
    invoiceUrl?: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);
  
  // PIX status polling
  const [pixStatus, setPixStatus] = useState<PixStatus>("pending");
  const [timeRemaining, setTimeRemaining] = useState(PIX_TIMEOUT_SECONDS);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const customerNameRef = useRef<string>("");
  
  // Customer info
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [cpf, setCpf] = useState("");
  
  // Credit card fields
  const [cardNumber, setCardNumber] = useState("");
  const [cardHolder, setCardHolder] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [addressNumber, setAddressNumber] = useState("");

  const totalPrice = getTotalPrice();

  // Cleanup intervals on unmount
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, []);

  // Start polling for payment status
  const startPolling = useCallback((paymentId: string) => {
    // Start countdown
    countdownIntervalRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          // Time expired - cancel payment
          handleExpiredPayment(paymentId);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Start status polling every 5 seconds
    pollingIntervalRef.current = setInterval(async () => {
      try {
        const status = await checkPaymentStatus(paymentId);
        
        if (status.isPaid) {
          setPixStatus("paid");
          stopPolling();
          toast({
            title: "Pagamento confirmado!",
            description: "Obrigado pela sua contribuição.",
          });
          // Navigate to thank you page after a short delay
          setTimeout(() => {
            navigate(`/agradecimento?name=${encodeURIComponent(customerNameRef.current)}&amount=${totalPrice}&items=${items.length}`);
          }, 2000);
        } else if (status.isCancelled) {
          setPixStatus("cancelled");
          stopPolling();
        }
      } catch (error) {
        console.error("Error checking payment status:", error);
      }
    }, 5000);
  }, [toast, navigate, totalPrice, items.length]);

  const stopPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
  }, []);

  const handleExpiredPayment = useCallback(async (paymentId: string) => {
    stopPolling();
    setPixStatus("expired");
    
    try {
      await cancelPayment(paymentId);
      toast({
        title: "Tempo esgotado",
        description: "O pagamento PIX expirou e foi cancelado.",
        variant: "destructive",
      });
    } catch (error) {
      console.error("Error cancelling expired payment:", error);
    }
  }, [stopPolling, toast]);

  const handleCancelPayment = useCallback(async () => {
    if (!pixResult?.paymentId) return;
    
    stopPolling();
    
    try {
      await cancelPayment(pixResult.paymentId);
      setPixStatus("cancelled");
      toast({
        title: "Pagamento cancelado",
        description: "Você pode tentar novamente quando quiser.",
      });
    } catch (error) {
      console.error("Error cancelling payment:", error);
      toast({
        title: "Erro ao cancelar",
        description: "Não foi possível cancelar o pagamento.",
        variant: "destructive",
      });
    }
  }, [pixResult?.paymentId, stopPolling, toast]);

  const formatTimeRemaining = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(price);
  };

  const handleCopyPix = async () => {
    if (pixResult?.pixCopyPaste) {
      await navigator.clipboard.writeText(pixResult.pixCopyPaste);
      setCopied(true);
      toast({
        title: "Código PIX copiado!",
        description: "Cole no seu aplicativo de banco.",
      });
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const handleCheckout = async () => {
    // Validate form
    const validation = validateCheckoutForm({
      name,
      email,
      phone,
      cpf,
      paymentMethod,
      cardNumber,
      cardHolder,
      cardExpiry,
      cardCvv,
      postalCode,
      addressNumber,
    });

    if (!validation.valid) {
      toast({
        title: "Erro de validação",
        description: validation.error,
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    try {
      const baseUrl = window.location.origin;
      const returnUrl = `${baseUrl}/presentes`;
      const completionUrl = `${baseUrl}/agradecimento?name=${encodeURIComponent(name.trim())}&amount=${totalPrice}&items=${items.length}`;

      // Store customer name for later use
      customerNameRef.current = name.trim();

      if (paymentMethod === "PIX") {
        // Process PIX payment via Asaas
        const result = await processPixPayment({
          items: items.map(item => ({
            giftId: item.giftId,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
          })),
          customerData: {
            name: name.trim(),
            email: email.trim() || undefined,
            phone,
            cpf,
          },
          returnUrl,
          completionUrl,
        });

        // Record purchases with pending status
        for (const item of items) {
          await addPurchase.mutateAsync({
            giftId: item.giftId,
            purchaserName: name.trim(),
            purchaserEmail: email.trim() || undefined,
            amount: item.price * item.quantity,
            paymentStatus: "pending",
            externalPaymentId: result.paymentId,
            paymentGateway: "asaas",
          });
        }

        // Show PIX QR code or redirect to invoice
        if (result.pixQrCode || result.pixCopyPaste) {
          setPixResult({
            paymentId: result.paymentId,
            pixQrCode: result.pixQrCode,
            pixCopyPaste: result.pixCopyPaste,
            invoiceUrl: result.invoiceUrl,
          });
          setTimeRemaining(PIX_TIMEOUT_SECONDS);
          setPixStatus("pending");
          clearCart();
          
          // Start polling for payment status
          if (result.paymentId) {
            startPolling(result.paymentId);
          }
        } else if (result.invoiceUrl) {
          clearCart();
          window.location.href = result.invoiceUrl;
        }
      } else {
        // Credit Card via Asaas - process each item separately
        for (const item of items) {
          const result = await processCreditCardPayment({
            item: {
              giftId: item.giftId,
              name: item.name,
              price: item.price,
              quantity: item.quantity,
            },
            customerData: {
              name: name.trim(),
              email: email.trim(),
              phone,
              cpf,
              postalCode,
              addressNumber,
            },
            cardData: {
              holder: cardHolder.trim(),
              number: cardNumber,
              expiry: cardExpiry,
              cvv: cardCvv,
            },
          });

          await addPurchase.mutateAsync({
            giftId: item.giftId,
            purchaserName: name.trim(),
            purchaserEmail: email.trim() || undefined,
            amount: item.price * item.quantity,
            paymentStatus: "pending",
            externalPaymentId: result.paymentId,
            paymentGateway: "asaas",
          });
        }

        clearCart();
        toast({
          title: "Pagamento em processamento!",
          description: "Você receberá a confirmação em breve.",
        });
        navigate(completionUrl);
      }
    } catch (error: any) {
      console.error("Checkout error:", error);
      toast({
        title: "Erro no pagamento",
        description: error.message || "Erro ao processar pagamento. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Show PIX result screen
  if (pixResult) {
    // Payment confirmed
    if (pixStatus === "paid") {
      return (
        <Layout>
          <div className="py-12 bg-gradient-to-b from-champagne/30 to-background min-h-screen">
            <div className="container mx-auto px-4 max-w-lg">
              <Card>
                <CardHeader className="text-center">
                  <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                    <CheckCircle2 className="w-10 h-10 text-green-600" />
                  </div>
                  <CardTitle className="font-serif text-2xl text-green-700">Pagamento Confirmado!</CardTitle>
                  <p className="text-muted-foreground mt-2">
                    Obrigado pela sua contribuição especial.
                  </p>
                </CardHeader>
                <CardContent className="text-center space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Você será redirecionado automaticamente...
                  </p>
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
                </CardContent>
              </Card>
            </div>
          </div>
        </Layout>
      );
    }

    // Payment expired or cancelled
    if (pixStatus === "expired" || pixStatus === "cancelled") {
      return (
        <Layout>
          <div className="py-12 bg-gradient-to-b from-champagne/30 to-background min-h-screen">
            <div className="container mx-auto px-4 max-w-lg">
              <Card>
                <CardHeader className="text-center">
                  <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                    <XCircle className="w-10 h-10 text-red-600" />
                  </div>
                  <CardTitle className="font-serif text-2xl text-red-700">
                    {pixStatus === "expired" ? "Tempo Esgotado" : "Pagamento Cancelado"}
                  </CardTitle>
                  <p className="text-muted-foreground mt-2">
                    {pixStatus === "expired" 
                      ? "O prazo para pagamento expirou." 
                      : "O pagamento foi cancelado."}
                  </p>
                </CardHeader>
                <CardContent className="text-center space-y-4">
                  <Button asChild className="w-full bg-gold hover:bg-gold-dark">
                    <Link to="/presentes">
                      Tentar novamente
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </Layout>
      );
    }

    // Pending - show QR code with timer
    return (
      <Layout>
        <div className="py-12 bg-gradient-to-b from-champagne/30 to-background min-h-screen">
          <div className="container mx-auto px-4 max-w-lg">
            <Card>
              <CardHeader className="text-center">
                <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                  <ShieldCheck className="w-8 h-8 text-primary" />
                </div>
                <CardTitle className="font-serif text-2xl">Pagamento PIX Gerado!</CardTitle>
                <p className="text-muted-foreground mt-2">
                  Escaneie o QR Code ou copie o código para pagar
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Timer countdown */}
                <div className={`flex items-center justify-center gap-2 p-3 rounded-lg ${
                  timeRemaining <= 60 ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"
                }`}>
                  <Clock className="w-5 h-5" />
                  <span className="font-mono font-bold text-lg">
                    {formatTimeRemaining(timeRemaining)}
                  </span>
                  <span className="text-sm">para pagar</span>
                </div>

                {/* Status indicator */}
                <div className="flex items-center justify-center gap-2 text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Aguardando confirmação do pagamento...</span>
                </div>

                {pixResult.pixQrCode && (
                  <div className="flex justify-center">
                    <img 
                      src={`data:image/png;base64,${pixResult.pixQrCode}`}
                      alt="QR Code PIX"
                      className="w-48 h-48 border rounded-lg"
                    />
                  </div>
                )}
                
                {pixResult.pixCopyPaste && (
                  <div className="space-y-2">
                    <Label>Código PIX Copia e Cola:</Label>
                    <div className="flex gap-2">
                      <Input 
                        value={pixResult.pixCopyPaste} 
                        readOnly 
                        className="font-mono text-xs"
                      />
                      <Button 
                        variant="outline" 
                        size="icon"
                        onClick={handleCopyPix}
                      >
                        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                )}

                <Separator />

                <div className="text-center space-y-3">
                  {pixResult.invoiceUrl && (
                    <Button asChild variant="outline" className="w-full">
                      <a href={pixResult.invoiceUrl} target="_blank" rel="noopener noreferrer">
                        Abrir página de pagamento
                      </a>
                    </Button>
                  )}
                  
                  <Button 
                    variant="ghost" 
                    className="w-full text-destructive hover:text-destructive"
                    onClick={handleCancelPayment}
                  >
                    Cancelar pagamento
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </Layout>
    );
  }

  if (items.length === 0) {
    return (
      <Layout>
        <div className="py-20 bg-gradient-to-b from-champagne/30 to-background min-h-screen">
          <div className="container mx-auto px-4 max-w-2xl">
            <div className="text-center py-16">
              <ShoppingCart className="w-20 h-20 text-muted-foreground mx-auto mb-6" />
              <h1 className="font-serif text-3xl mb-4">Seu carrinho está vazio</h1>
              <p className="text-muted-foreground mb-8">
                Adicione presentes ao carrinho para continuar.
              </p>
              <Button asChild className="bg-gold hover:bg-gold-dark">
                <Link to="/presentes">
                  <Gift className="w-4 h-4 mr-2" />
                  Ver Lista de Presentes
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="py-12 bg-gradient-to-b from-champagne/30 to-background min-h-screen">
        <div className="container mx-auto px-4">
          <div className="mb-8">
            <Button variant="ghost" asChild className="mb-4">
              <Link to="/presentes">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar para presentes
              </Link>
            </Button>
            <h1 className="font-serif text-3xl md:text-4xl">Finalizar Compra</h1>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Cart Items & Payment Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Cart Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 font-serif">
                    <ShoppingCart className="w-5 h-5" />
                    Itens no Carrinho ({items.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {items.map((item) => (
                    <div key={item.id} className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="w-16 h-16 object-cover rounded"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-muted rounded flex items-center justify-center">
                          <Gift className="w-6 h-6 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium truncate">{item.name}</h3>
                        <p className="text-sm text-gold font-medium">
                          {formatPrice(item.price)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        >
                          <Minus className="w-3 h-3" />
                        </Button>
                        <span className="w-8 text-center font-medium">{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>
                      <div className="text-right min-w-[80px]">
                        <p className="font-medium">{formatPrice(item.price * item.quantity)}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => removeItem(item.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Customer Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="font-serif">Seus Dados</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nome completo *</Label>
                      <Input
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Seu nome completo"
                        maxLength={100}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Telefone *</Label>
                      <Input
                        id="phone"
                        value={phone}
                        onChange={(e) => setPhone(formatPhone(e.target.value))}
                        placeholder="(00) 00000-0000"
                        maxLength={15}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cpfGeneral">CPF *</Label>
                    <Input
                      id="cpfGeneral"
                      value={cpf}
                      onChange={(e) => setCpf(formatCPF(e.target.value))}
                      placeholder="000.000.000-00"
                      maxLength={14}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">
                      E-mail {paymentMethod === "CREDIT_CARD" ? "*" : "(opcional)"}
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="seu@email.com"
                      maxLength={255}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Payment Method */}
              <Card>
                <CardHeader>
                  <CardTitle className="font-serif">Forma de Pagamento</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <RadioGroup
                    value={paymentMethod}
                    onValueChange={(value) => setPaymentMethod(value as PaymentMethod)}
                    className="grid sm:grid-cols-2 gap-4"
                  >
                    <div>
                      <RadioGroupItem value="PIX" id="pix" className="peer sr-only" />
                      <Label
                        htmlFor="pix"
                        className="flex items-center gap-3 rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-gold cursor-pointer transition-all"
                      >
                        <Wallet className="h-8 w-8 text-gold" />
                        <div>
                          <p className="font-medium">PIX</p>
                          <p className="text-xs text-muted-foreground">Pagamento instantâneo</p>
                        </div>
                      </Label>
                    </div>
                    <div>
                      <RadioGroupItem value="CREDIT_CARD" id="credit_card" className="peer sr-only" />
                      <Label
                        htmlFor="credit_card"
                        className="flex items-center gap-3 rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-gold cursor-pointer transition-all"
                      >
                        <CreditCard className="h-8 w-8 text-gold" />
                        <div>
                          <p className="font-medium">Cartão de Crédito</p>
                          <p className="text-xs text-muted-foreground">Pagamento seguro</p>
                        </div>
                      </Label>
                    </div>
                  </RadioGroup>

                  {/* Credit Card Fields */}
                  {paymentMethod === "CREDIT_CARD" && (
                    <div className="space-y-4 pt-4 border-t">
                      <div className="space-y-2">
                        <Label htmlFor="cardNumber">Número do cartão *</Label>
                        <Input
                          id="cardNumber"
                          value={cardNumber}
                          onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                          placeholder="0000 0000 0000 0000"
                          maxLength={19}
                          autoComplete="cc-number"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="cardHolder">Nome no cartão *</Label>
                        <Input
                          id="cardHolder"
                          value={cardHolder}
                          onChange={(e) => setCardHolder(e.target.value.toUpperCase())}
                          placeholder="NOME COMO NO CARTÃO"
                          maxLength={100}
                          autoComplete="cc-name"
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="cardExpiry">Validade *</Label>
                          <Input
                            id="cardExpiry"
                            value={cardExpiry}
                            onChange={(e) => setCardExpiry(formatCardExpiry(e.target.value))}
                            placeholder="MM/AA"
                            maxLength={5}
                            autoComplete="cc-exp"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="cardCvv">CVV *</Label>
                          <Input
                            id="cardCvv"
                            type="password"
                            value={cardCvv}
                            onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
                            placeholder="•••"
                            maxLength={4}
                            autoComplete="cc-csc"
                          />
                        </div>
                      </div>
                      
                      <Separator />
                      
                      <p className="text-sm text-muted-foreground">Endereço de cobrança</p>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="postalCode">CEP *</Label>
                          <Input
                            id="postalCode"
                            value={postalCode}
                            onChange={(e) => setPostalCode(formatCEP(e.target.value))}
                            placeholder="00000-000"
                            maxLength={9}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="addressNumber">Número *</Label>
                          <Input
                            id="addressNumber"
                            value={addressNumber}
                            onChange={(e) => setAddressNumber(e.target.value)}
                            placeholder="123"
                            maxLength={10}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <Card className="sticky top-24">
                <CardHeader>
                  <CardTitle className="font-serif">Resumo do Pedido</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    {items.map((item) => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span className="truncate max-w-[60%]">
                          {item.name} x{item.quantity}
                        </span>
                        <span>{formatPrice(item.price * item.quantity)}</span>
                      </div>
                    ))}
                  </div>
                  
                  <Separator />
                  
                  <div className="flex justify-between font-medium text-lg">
                    <span>Total</span>
                    <span className="text-gold">{formatPrice(totalPrice)}</span>
                  </div>

                  <Button
                    className="w-full bg-gold hover:bg-gold-dark text-white"
                    size="lg"
                    onClick={handleCheckout}
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Processando...
                      </>
                    ) : (
                      <>
                        <Lock className="w-4 h-4 mr-2" />
                        {paymentMethod === "PIX" ? "Gerar PIX" : "Pagar com Cartão"}
                      </>
                    )}
                  </Button>

                  <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Pagamento seguro via Asaas</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Checkout;
