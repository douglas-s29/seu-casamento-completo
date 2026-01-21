import { Layout } from "@/components/Layout";
import { useWeddingSettings } from "@/hooks/useWeddingSettings";
import { MapPin, Shirt, ExternalLink } from "lucide-react";
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

  const openInMaps = (mapUrl: string | null | undefined, address: string | null | undefined) => {
    if (mapUrl) {
      window.open(mapUrl, "_blank");
    } else if (address) {
      const encoded = encodeURIComponent(address);
      window.open(`https://www.google.com/maps/search/?api=1&query=${encoded}`, "_blank");
    }
  };

  // Extract place ID or coordinates from Google Maps URL for embed
  const getEmbedUrl = (mapUrl: string | null | undefined, address: string | null | undefined) => {
    if (mapUrl) {
      // Try to extract place from URL
      const placeMatch = mapUrl.match(/place\/([^\/]+)/);
      if (placeMatch) {
        return `https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${encodeURIComponent(placeMatch[1])}`;
      }
      
      // Try to extract coordinates
      const coordMatch = mapUrl.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
      if (coordMatch) {
        return `https://www.google.com/maps/embed/v1/view?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&center=${coordMatch[1]},${coordMatch[2]}&zoom=15`;
      }
    }
    
    if (address) {
      return `https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${encodeURIComponent(address)}`;
    }
    
    return null;
  };

  const ceremonyMapUrl = (settings as any)?.ceremony_map_url;
  const receptionMapUrl = (settings as any)?.reception_map_url;
  
  const ceremonyEmbedUrl = getEmbedUrl(ceremonyMapUrl, settings?.ceremony_address);
  const receptionEmbedUrl = getEmbedUrl(receptionMapUrl, settings?.reception_address);

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

          <div className="max-w-2xl mx-auto space-y-8">
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
                    
                    {/* Mini Map */}
                    {ceremonyEmbedUrl && (
                      <div className="rounded-lg overflow-hidden border mt-4">
                        <iframe
                          src={ceremonyEmbedUrl}
                          width="100%"
                          height="200"
                          style={{ border: 0 }}
                          allowFullScreen
                          loading="lazy"
                          referrerPolicy="no-referrer-when-downgrade"
                          title="Mapa da Cerimônia"
                        />
                      </div>
                    )}
                    
                    {(ceremonyMapUrl || settings.ceremony_address) && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openInMaps(ceremonyMapUrl, settings.ceremony_address)}
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

            {/* Recepção - show only if different from ceremony */}
            {settings?.reception_location && settings.reception_location !== settings.ceremony_location && (
              <Card className="elegant-shadow">
                <CardHeader className="text-center pb-4">
                  <div className="w-16 h-16 rounded-full bg-champagne flex items-center justify-center mx-auto mb-4">
                    <MapPin className="w-8 h-8 text-gold" />
                  </div>
                  <CardTitle className="font-serif text-2xl">Recepção</CardTitle>
                </CardHeader>
                <CardContent className="text-center space-y-4">
                  <p className="font-medium text-lg">{settings.reception_location}</p>
                  {settings.reception_address && (
                    <p className="text-muted-foreground">{settings.reception_address}</p>
                  )}
                  
                  {/* Mini Map */}
                  {receptionEmbedUrl && (
                    <div className="rounded-lg overflow-hidden border mt-4">
                      <iframe
                        src={receptionEmbedUrl}
                        width="100%"
                        height="200"
                        style={{ border: 0 }}
                        allowFullScreen
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                        title="Mapa da Recepção"
                      />
                    </div>
                  )}
                  
                  {(receptionMapUrl || settings.reception_address) && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openInMaps(receptionMapUrl, settings.reception_address)}
                      className="mt-4"
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Ver no mapa
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Dress Code */}
            {settings?.dress_code && (
              <Card className="elegant-shadow">
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
      </div>
    </Layout>
  );
};

export default Evento;
