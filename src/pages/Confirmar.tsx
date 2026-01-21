import { useState } from "react";
import { Layout } from "@/components/Layout";
import { useRsvpByCode } from "@/hooks/useGuests";
import { Check, X, Users, MessageCircle, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";

const Confirmar = () => {
  const [step, setStep] = useState<"code" | "confirm">("code");
  const [invitationCode, setInvitationCode] = useState("");
  const [rsvpStatus, setRsvpStatus] = useState<"confirmed" | "declined">("confirmed");
  const [companions, setCompanions] = useState("0");
  const [message, setMessage] = useState("");
  const [isConfirmed, setIsConfirmed] = useState(false);

  const rsvpMutation = useRsvpByCode();
  const { toast } = useToast();

  const handleCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!invitationCode.trim()) {
      toast({
        title: "Código obrigatório",
        description: "Por favor, insira seu código de convite.",
        variant: "destructive",
      });
      return;
    }
    setStep("confirm");
  };

  const handleConfirm = async () => {
    try {
      await rsvpMutation.mutateAsync({
        invitationCode: invitationCode.trim().toUpperCase(),
        rsvpStatus,
        companions: parseInt(companions) || 0,
        message: message.trim() || undefined,
      });

      setIsConfirmed(true);
      toast({
        title: "Presença confirmada!",
        description: rsvpStatus === "confirmed" 
          ? "Obrigado por confirmar. Esperamos você!" 
          : "Obrigado por nos informar. Sentiremos sua falta!",
      });
    } catch (error) {
      toast({
        title: "Código inválido",
        description: "Não encontramos esse código de convite. Verifique e tente novamente.",
        variant: "destructive",
      });
      setStep("code");
    }
  };

  if (isConfirmed) {
    return (
      <Layout>
        <div className="py-20 min-h-[calc(100vh-8rem)] flex items-center justify-center bg-gradient-to-b from-champagne/30 to-background">
          <Card className="max-w-md mx-4 text-center elegant-shadow">
            <CardContent className="pt-12 pb-8">
              <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-6">
                <Check className="w-10 h-10 text-success" />
              </div>
              <h1 className="font-serif text-3xl mb-4">
                {rsvpStatus === "confirmed" ? "Até lá!" : "Sentiremos sua falta!"}
              </h1>
              <p className="text-muted-foreground">
                {rsvpStatus === "confirmed"
                  ? "Sua presença foi confirmada com sucesso. Mal podemos esperar para celebrar com você!"
                  : "Obrigado por nos avisar. Sua mensagem foi registrada."}
              </p>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="py-20 min-h-[calc(100vh-8rem)] flex items-center justify-center bg-gradient-to-b from-champagne/30 to-background">
        <div className="container mx-auto px-4 max-w-md">
          <div className="text-center mb-8">
            <h1 className="font-serif text-4xl md:text-5xl mb-4 text-foreground">
              Confirmar Presença
            </h1>
            <div className="h-px w-24 bg-gold mx-auto" />
          </div>

          {step === "code" && (
            <Card className="elegant-shadow">
              <CardHeader className="text-center">
                <div className="w-16 h-16 rounded-full bg-champagne flex items-center justify-center mx-auto mb-4">
                  <Search className="w-8 h-8 text-gold" />
                </div>
                <CardTitle className="font-serif text-2xl">Código do Convite</CardTitle>
                <CardDescription>
                  Insira o código que você recebeu no seu convite
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCodeSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="code">Código</Label>
                    <Input
                      id="code"
                      value={invitationCode}
                      onChange={(e) => setInvitationCode(e.target.value.toUpperCase())}
                      placeholder="Ex: ABC12345"
                      className="text-center text-lg tracking-widest uppercase"
                      maxLength={8}
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-gold hover:bg-gold-dark text-primary-foreground"
                  >
                    Continuar
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          {step === "confirm" && (
            <Card className="elegant-shadow">
              <CardHeader className="text-center">
                <CardTitle className="font-serif text-2xl">
                  Confirmação de Presença
                </CardTitle>
                <CardDescription>
                  Código: <span className="font-mono">{invitationCode}</span>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <Label>Você vai comparecer?</Label>
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
                        className="flex flex-col items-center justify-center rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-success peer-data-[state=checked]:bg-success/10 cursor-pointer transition-all"
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

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setStep("code")}
                    className="flex-1"
                  >
                    Voltar
                  </Button>
                  <Button
                    onClick={handleConfirm}
                    disabled={rsvpMutation.isPending}
                    className="flex-1 bg-gold hover:bg-gold-dark text-primary-foreground"
                  >
                    {rsvpMutation.isPending ? "Confirmando..." : "Confirmar"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Confirmar;
