import { useState } from "react";
import { Layout } from "@/components/Layout";
import { useAddGuest } from "@/hooks/useGuests";
import { Check, X, Users, MessageCircle, User, Mail, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";

const Confirmar = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [rsvpStatus, setRsvpStatus] = useState<"confirmed" | "declined">("confirmed");
  const [companions, setCompanions] = useState("0");
  const [message, setMessage] = useState("");
  const [isConfirmed, setIsConfirmed] = useState(false);

  const addGuestMutation = useAddGuest();
  const { toast } = useToast();

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "Por favor, informe seu nome.",
        variant: "destructive",
      });
      return;
    }

    if (!phone.trim() && !email.trim()) {
      toast({
        title: "Contato obrigatório",
        description: "Por favor, informe seu telefone ou e-mail.",
        variant: "destructive",
      });
      return;
    }

    try {
      await addGuestMutation.mutateAsync({
        name: name.trim(),
        email: email.trim() || null,
        phone: phone.trim() || null,
        rsvp_status: rsvpStatus,
        companions: parseInt(companions) || 0,
        message: message.trim() || null,
      });

      setIsConfirmed(true);
      toast({
        title: rsvpStatus === "confirmed" ? "Presença confirmada!" : "Resposta registrada!",
        description: rsvpStatus === "confirmed" 
          ? "Obrigado por confirmar. Esperamos você!" 
          : "Obrigado por nos informar. Sentiremos sua falta!",
      });
    } catch (error) {
      toast({
        title: "Erro ao confirmar",
        description: "Ocorreu um erro. Por favor, tente novamente.",
        variant: "destructive",
      });
    }
  };

  if (isConfirmed) {
    return (
      <Layout>
        <div className="py-20 min-h-[calc(100vh-8rem)] flex items-center justify-center bg-gradient-to-b from-sage-light/30 to-background">
          <Card className="max-w-md mx-4 text-center elegant-shadow">
            <CardContent className="pt-12 pb-8">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                <Check className="w-10 h-10 text-primary" />
              </div>
              <h1 className="font-serif text-3xl mb-4">
                {rsvpStatus === "confirmed" ? "Até lá!" : "Sentiremos sua falta!"}
              </h1>
              <p className="text-muted-foreground">
                {rsvpStatus === "confirmed"
                  ? "Sua presença foi confirmada com sucesso. Mal podemos esperar para celebrar com você!"
                  : "Obrigado por nos avisar. Sua resposta foi registrada."}
              </p>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="py-20 min-h-[calc(100vh-8rem)] flex items-center justify-center bg-gradient-to-b from-sage-light/30 to-background">
        <div className="container mx-auto px-4 max-w-md">
          <div className="text-center mb-8">
            <h1 className="font-serif text-4xl md:text-5xl mb-4 text-foreground">
              Confirmar Presença
            </h1>
            <div className="h-px w-24 bg-gold mx-auto" />
          </div>

          <Card className="elegant-shadow">
            <CardHeader className="text-center">
              <div className="w-16 h-16 rounded-full bg-sage-light flex items-center justify-center mx-auto mb-4">
                <User className="w-8 h-8 text-primary" />
              </div>
              <CardTitle className="font-serif text-2xl">Seus Dados</CardTitle>
              <CardDescription>
                Preencha suas informações para confirmar presença
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleConfirm} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name" className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Nome completo *
                  </Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Seu nome"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    Telefone
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="(00) 00000-0000"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    E-mail
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                  />
                </div>

                <div className="space-y-3">
                  <Label>Você vai comparecer? *</Label>
                  <RadioGroup
                    value={rsvpStatus}
                    onValueChange={(v) => setRsvpStatus(v as "confirmed" | "declined")}
                    className="grid grid-cols-2 gap-4"
                  >
                    <div>
                      <RadioGroupItem
                        value="confirmed"
                        id="confirmed"
                        className="peer sr-only"
                      />
                      <Label
                        htmlFor="confirmed"
                        className="flex flex-col items-center justify-center rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/10 cursor-pointer transition-all"
                      >
                        <Check className="mb-2 h-6 w-6" />
                        <span className="font-medium">Sim, irei!</span>
                      </Label>
                    </div>
                    <div>
                      <RadioGroupItem
                        value="declined"
                        id="declined"
                        className="peer sr-only"
                      />
                      <Label
                        htmlFor="declined"
                        className="flex flex-col items-center justify-center rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-destructive peer-data-[state=checked]:bg-destructive/10 cursor-pointer transition-all"
                      >
                        <X className="mb-2 h-6 w-6" />
                        <span className="font-medium">Não poderei</span>
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                {rsvpStatus === "confirmed" && (
                  <div className="space-y-2">
                    <Label htmlFor="companions" className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Número de acompanhantes
                    </Label>
                    <Input
                      id="companions"
                      type="number"
                      min="0"
                      max="10"
                      value={companions}
                      onChange={(e) => setCompanions(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Não inclua você mesmo neste número
                    </p>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="message" className="flex items-center gap-2">
                    <MessageCircle className="w-4 h-4" />
                    Mensagem (opcional)
                  </Label>
                  <Textarea
                    id="message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Deixe uma mensagem para os noivos..."
                    rows={3}
                  />
                </div>

                <Button
                  type="submit"
                  disabled={addGuestMutation.isPending}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  {addGuestMutation.isPending ? "Confirmando..." : "Confirmar Presença"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Confirmar;