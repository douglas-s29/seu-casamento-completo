import { Layout } from "@/components/Layout";
import { Countdown } from "@/components/Countdown";
import { useWeddingSettings } from "@/hooks/useWeddingSettings";
import { Heart, ArrowDown, Gift, MessageCircle, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const Index = () => {
  const { data: settings, isLoading } = useWeddingSettings();

  const weddingDate = settings?.wedding_date 
    ? new Date(settings.wedding_date) 
    : null;

  const groomName = settings?.groom_name || "Noivo";
  const brideName = settings?.bride_name || "Noiva";

  return (
    <Layout>
      {/* Hero Section */}
      <section className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center relative bg-gradient-to-b from-champagne/50 to-background px-4">
        <div className="text-center space-y-8 animate-fade-in">
          <div className="space-y-2">
            <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground font-sans">
              Casamento de
            </p>
            <h1 className="font-serif text-5xl md:text-7xl lg:text-8xl text-foreground">
              {groomName}
              <span className="text-gold mx-4">&</span>
              {brideName}
            </h1>
          </div>

          <div className="flex items-center justify-center gap-2">
            <div className="h-px w-12 bg-gold/50" />
            <Heart className="w-5 h-5 text-gold fill-gold/30" />
            <div className="h-px w-12 bg-gold/50" />
          </div>

          {weddingDate && (
            <p className="font-serif text-xl md:text-2xl text-muted-foreground italic">
              {weddingDate.toLocaleDateString("pt-BR", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          )}

          <div className="pt-8">
            <Countdown targetDate={weddingDate} />
          </div>
        </div>

        <button
          onClick={() => document.getElementById("story")?.scrollIntoView({ behavior: "smooth" })}
          className="absolute bottom-8 animate-float"
        >
          <ArrowDown className="w-6 h-6 text-gold" />
        </button>
      </section>

      {/* Story Section */}
      <section id="story" className="py-20 bg-blush/30">
        <div className="container mx-auto px-4 max-w-3xl text-center">
          <h2 className="font-serif text-4xl md:text-5xl mb-8 text-foreground">
            Nossa História
          </h2>
          <div className="h-px w-24 bg-gold mx-auto mb-8" />
          {settings?.story_text ? (
            <p className="text-lg text-muted-foreground leading-relaxed whitespace-pre-line">
              {settings.story_text}
            </p>
          ) : (
            <p className="text-lg text-muted-foreground leading-relaxed italic">
              Em breve contaremos nossa história aqui...
            </p>
          )}
        </div>
      </section>

      {/* Quick Links Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="font-serif text-4xl md:text-5xl mb-12 text-center text-foreground">
            Navegue pelo site
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <Link to="/evento" className="group">
              <div className="bg-card elegant-shadow rounded-lg p-8 text-center transition-all hover:scale-105 hover:shadow-lg">
                <div className="w-16 h-16 rounded-full bg-champagne flex items-center justify-center mx-auto mb-4 group-hover:bg-gold/20 transition-colors">
                  <MapPin className="w-8 h-8 text-gold" />
                </div>
                <h3 className="font-serif text-2xl mb-2">Evento</h3>
                <p className="text-muted-foreground text-sm">
                  Local, data e informações
                </p>
              </div>
            </Link>

            <Link to="/presentes" className="group">
              <div className="bg-card elegant-shadow rounded-lg p-8 text-center transition-all hover:scale-105 hover:shadow-lg">
                <div className="w-16 h-16 rounded-full bg-champagne flex items-center justify-center mx-auto mb-4 group-hover:bg-gold/20 transition-colors">
                  <Gift className="w-8 h-8 text-gold" />
                </div>
                <h3 className="font-serif text-2xl mb-2">Presentes</h3>
                <p className="text-muted-foreground text-sm">
                  Nossa lista de presentes
                </p>
              </div>
            </Link>

            <Link to="/recados" className="group">
              <div className="bg-card elegant-shadow rounded-lg p-8 text-center transition-all hover:scale-105 hover:shadow-lg">
                <div className="w-16 h-16 rounded-full bg-champagne flex items-center justify-center mx-auto mb-4 group-hover:bg-gold/20 transition-colors">
                  <MessageCircle className="w-8 h-8 text-gold" />
                </div>
                <h3 className="font-serif text-2xl mb-2">Recados</h3>
                <p className="text-muted-foreground text-sm">
                  Deixe sua mensagem
                </p>
              </div>
            </Link>
          </div>

          <div className="text-center mt-12">
            <Link to="/confirmar">
              <Button size="lg" className="bg-gold hover:bg-gold-dark text-primary-foreground font-sans">
                Confirmar Presença
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Index;
