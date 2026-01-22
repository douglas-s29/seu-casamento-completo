import { useState } from "react";
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
  Lock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Link, useNavigate } from "react-router-dom";
import { validateCheckoutForm } from "@/utils/checkoutValidation";
import { processPixPayment, processCreditCardPayment } from "@/services/paymentService";

type PaymentMethod = "PIX" | "CREDIT_CARD";

const Checkout = () => {
  const { items, removeItem, updateQuantity, clearCart, getTotalPrice } = useCart();
  const addPurchase = useAddGiftPurchase();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("PIX");
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Customer info
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  
  // Credit card fields
  const [cardNumber, setCardNumber] = useState("");
  const [cardHolder, setCardHolder] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [cpf, setCpf] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [addressNumber, setAddressNumber] = useState("");

  const totalPrice = getTotalPrice();

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(price);
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
        title: "Erro",
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

      if (paymentMethod === "PIX") {
        // Process PIX payment using service
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
            externalPaymentId: result.billingId,
            paymentGateway: "abacatepay",
          });
        }

        clearCart();
        window.location.href = result.paymentUrl!;
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
        title: "Erro",
        description: error.message || "Erro ao processar pagamento. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

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
                        placeholder="Seu nome"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Telefone *</Label>
                      <Input
                        id="phone"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="(00) 00000-0000"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cpfGeneral">CPF *</Label>
                    <Input
                      id="cpfGeneral"
                      value={cpf}
                      onChange={(e) => setCpf(e.target.value)}
                      placeholder="000.000.000-00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">E-mail {paymentMethod === "CREDIT_CARD" ? "*" : "(opcional)"}</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="seu@email.com"
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
                          <p className="text-xs text-muted-foreground">Processado via Asaas</p>
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
                          onChange={(e) => setCardNumber(e.target.value)}
                          placeholder="0000 0000 0000 0000"
                          maxLength={19}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="cardHolder">Nome no cartão *</Label>
                        <Input
                          id="cardHolder"
                          value={cardHolder}
                          onChange={(e) => setCardHolder(e.target.value)}
                          placeholder="NOME COMPLETO"
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="cardExpiry">Validade *</Label>
                          <Input
                            id="cardExpiry"
                            value={cardExpiry}
                            onChange={(e) => setCardExpiry(e.target.value)}
                            placeholder="MM/AA"
                            maxLength={5}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="cardCvv">CVV *</Label>
                          <Input
                            id="cardCvv"
                            value={cardCvv}
                            onChange={(e) => setCardCvv(e.target.value)}
                            placeholder="123"
                            maxLength={4}
                          />
                        </div>
                      </div>
                      
                      <Separator />
                      
                      <div className="space-y-2">
                        <Label htmlFor="cpf">CPF *</Label>
                        <Input
                          id="cpf"
                          value={cpf}
                          onChange={(e) => setCpf(e.target.value)}
                          placeholder="000.000.000-00"
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="postalCode">CEP *</Label>
                          <Input
                            id="postalCode"
                            value={postalCode}
                            onChange={(e) => setPostalCode(e.target.value)}
                            placeholder="00000-000"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="addressNumber">Número *</Label>
                          <Input
                            id="addressNumber"
                            value={addressNumber}
                            onChange={(e) => setAddressNumber(e.target.value)}
                            placeholder="123"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Order Summary Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-24">
                <Card className="border-gold/20">
                  <CardHeader className="bg-gold/5">
                    <CardTitle className="font-serif">Resumo do Pedido</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 pt-6">
                    <div className="space-y-2">
                      {items.map((item) => (
                        <div key={item.id} className="flex justify-between text-sm">
                          <span className="text-muted-foreground">
                            {item.name} x{item.quantity}
                          </span>
                          <span>{formatPrice(item.price * item.quantity)}</span>
                        </div>
                      ))}
                    </div>
                    
                    <Separator />
                    
                    <div className="flex justify-between font-serif text-lg">
                      <span>Total</span>
                      <span className="text-gold font-bold">{formatPrice(totalPrice)}</span>
                    </div>

                    <Button
                      onClick={handleCheckout}
                      disabled={isProcessing}
                      className="w-full bg-gold hover:bg-gold-dark text-primary-foreground h-12 text-base"
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Processando...
                        </>
                      ) : paymentMethod === "PIX" ? (
                        <>
                          <Wallet className="w-5 h-5 mr-2" />
                          Pagar com PIX
                        </>
                      ) : (
                        <>
                          <CreditCard className="w-5 h-5 mr-2" />
                          Pagar com Cartão
                        </>
                      )}
                    </Button>

                    <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                      <Lock className="w-3 h-3" />
                      <span>Pagamento 100% seguro</span>
                    </div>

                    <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg text-xs text-muted-foreground">
                      <ShieldCheck className="w-4 h-4 text-success flex-shrink-0" />
                      <span>
                        Seus dados estão protegidos e não são armazenados em nossos servidores.
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Checkout;