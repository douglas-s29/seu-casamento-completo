import { useState } from "react";
import { Layout } from "@/components/Layout";
import { useMessages, useAddMessage } from "@/hooks/useMessages";
import { MessageCircle, Heart, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

const Recados = () => {
  const { data: messages, isLoading } = useMessages(false); // Only approved
  const addMessage = useAddMessage();
  const { toast } = useToast();

  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!guestName.trim() || !content.trim()) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha seu nome e sua mensagem.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await addMessage.mutateAsync({
        guest_name: guestName.trim(),
        guest_email: guestEmail.trim() || null,
        content: content.trim(),
        approved: false,
      });

      toast({
        title: "Recado enviado!",
        description: "Sua mensagem será exibida após aprovação dos noivos.",
      });

      setGuestName("");
      setGuestEmail("");
      setContent("");
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível enviar sua mensagem. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("pt-BR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  return (
    <Layout>
      <div className="py-20 bg-gradient-to-b from-champagne/30 to-background min-h-screen">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h1 className="font-serif text-4xl md:text-6xl mb-4 text-foreground">
              Mural de Recados
            </h1>
            <div className="h-px w-24 bg-gold mx-auto mb-6" />
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Deixe sua mensagem de carinho para os noivos!
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-12">
            {/* Form */}
            <div className="lg:col-span-1">
              <Card className="elegant-shadow sticky top-24">
                <CardContent className="pt-6">
                  <h2 className="font-serif text-2xl mb-6 flex items-center gap-2">
                    <Heart className="w-5 h-5 text-gold" />
                    Deixe seu recado
                  </h2>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Seu nome *</Label>
                      <Input
                        id="name"
                        value={guestName}
                        onChange={(e) => setGuestName(e.target.value)}
                        placeholder="Digite seu nome"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Seu e-mail (opcional)</Label>
                      <Input
                        id="email"
                        type="email"
                        value={guestEmail}
                        onChange={(e) => setGuestEmail(e.target.value)}
                        placeholder="seu@email.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="message">Sua mensagem *</Label>
                      <Textarea
                        id="message"
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="Escreva sua mensagem de carinho..."
                        rows={4}
                      />
                    </div>
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full bg-gold hover:bg-gold-dark text-primary-foreground"
                    >
                      <Send className="w-4 h-4 mr-2" />
                      {isSubmitting ? "Enviando..." : "Enviar Recado"}
                    </Button>
                    <p className="text-xs text-muted-foreground text-center">
                      Seu recado será exibido após aprovação
                    </p>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Messages */}
            <div className="lg:col-span-2">
              {isLoading ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">Carregando recados...</p>
                </div>
              ) : messages && messages.length > 0 ? (
                <div className="space-y-6">
                  {messages.map((msg) => (
                    <Card key={msg.id} className="elegant-shadow">
                      <CardContent className="pt-6">
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 rounded-full bg-champagne flex items-center justify-center shrink-0">
                            <span className="font-serif text-xl text-gold">
                              {msg.guest_name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-medium">{msg.guest_name}</h3>
                              <span className="text-xs text-muted-foreground">
                                {formatDate(msg.created_at)}
                              </span>
                            </div>
                            <p className="text-muted-foreground whitespace-pre-line">
                              {msg.content}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <MessageCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground text-lg">
                    Seja o primeiro a deixar um recado!
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Recados;
