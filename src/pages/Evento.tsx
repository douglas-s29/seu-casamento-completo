import { Layout } from "@/components/Layout";
import { useWeddingSettings } from "@/hooks/useWeddingSettings";
import { MapPin, Clock, Shirt, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const Evento = () => {
  const { data: settings, isLoading } = useWeddingSettings();

  const weddingDate = settings?.wedding_date
    ? new Date(settings.wedding_date)
    : null;

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("pt-BR", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const openInMaps = (address: string | null | undefined) => {
    if (!address) return;
    const encoded = encodeURIComponent(address);
    window.open(`https://www.google.com/maps/search/?api=1&query=${encoded}`, "_blank");
  };

  return (
    <Layout>
      <div className="py-20 bg-gradient-to-b from-champagne/30 to-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h1 className="font-serif text-4xl md:text-6xl mb-4 text-foreground">
              Informações do Evento
            </h1>
            <div className="h-px w-24 bg-gold mx-auto" />
          </div>

          {weddingDate && (
            <div className="text-center mb-16">
              <p className="font-serif text-2xl md:text-3xl text-gold mb-2">
                {formatDate(weddingDate)}
              </p>
              <p className="text-lg text-muted-foreground">
                às {formatTime(weddingDate)}
              </p>
            </div>
          )}

          <div className="max-w-xl mx-auto">
            {/* Cerimônia */}
            <Card className="elegant-shadow">
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 rounded-full bg-sage-light flex items-center justify-center mx-auto mb-4">
                  <MapPin className="w-8 h-8 text-primary" />
                </div>
                <CardTitle className="font-serif text-2xl">Cerimônia</CardTitle>
              </CardHeader>
              <CardContent className="text-center space-y-4">
                {settings?.ceremony_location ? (
                  <>
                    <p className="font-medium text-lg">{settings.ceremony_location}</p>
                    {settings.ceremony_address && (
                      <p className="text-muted-foreground">{settings.ceremony_address}</p>
                    )}
                    {settings.ceremony_address && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openInMaps(settings.ceremony_address)}
                        className="mt-4"
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Ver no mapa
                      </Button>
                    )}
                  </>
                ) : (
                  <p className="text-muted-foreground italic">Local a definir</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Dress Code */}
          {settings?.dress_code && (
            <Card className="max-w-xl mx-auto mt-12 elegant-shadow">
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 rounded-full bg-champagne flex items-center justify-center mx-auto mb-4">
                  <Shirt className="w-8 h-8 text-gold" />
                </div>
                <CardTitle className="font-serif text-2xl">Dress Code</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-lg">{settings.dress_code}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Evento;
