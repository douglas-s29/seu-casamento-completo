import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Heart, Gift, Home } from "lucide-react";

const Agradecimento = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Support both state (old flow) and query params (AbacatePay redirect)
  const state = location.state as {
    purchaserName?: string;
    giftName?: string;
    amount?: number;
  } | null;

  const purchaserName = state?.purchaserName || searchParams.get("name") || "";
  const giftName = state?.giftName || searchParams.get("gift") || "";
  const amount = state?.amount || Number(searchParams.get("amount")) || 0;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  return (
    <Layout>
      <div className="min-h-screen py-20 bg-gradient-to-b from-champagne/30 to-background flex items-center justify-center">
        <div className="container mx-auto px-4">
          <Card className="max-w-lg mx-auto elegant-shadow">
            <CardContent className="pt-12 pb-8 text-center space-y-6">
              <div className="w-24 h-24 rounded-full bg-success/10 flex items-center justify-center mx-auto">
                <Heart className="w-12 h-12 text-success fill-success" />
              </div>
              
              <div className="space-y-2">
                <h1 className="font-serif text-3xl md:text-4xl text-foreground">
                  Muito Obrigado{purchaserName ? `, ${purchaserName}` : ""}!
                </h1>
                <p className="text-muted-foreground text-lg">
                  Sua generosidade nos enche de alegria
                </p>
              </div>

              {giftName && (
                <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                  <div className="flex items-center justify-center gap-2 text-primary">
                    <Gift className="w-5 h-5" />
                    <span className="font-medium">{giftName}</span>
                  </div>
                  {amount > 0 && (
                    <p className="text-2xl font-serif text-gold">
                      {formatCurrency(amount)}
                    </p>
                  )}
                </div>
              )}

              <div className="space-y-3 pt-4">
                <p className="text-muted-foreground">
                  Cada presente é um símbolo do seu carinho e apoio neste momento 
                  tão especial das nossas vidas. Mal podemos esperar para celebrar 
                  junto com você!
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-4 justify-center">
                <Button
                  variant="outline"
                  onClick={() => navigate("/presentes")}
                  className="gap-2"
                >
                  <Gift className="w-4 h-4" />
                  Ver mais presentes
                </Button>
                <Button
                  onClick={() => navigate("/")}
                  className="bg-gold hover:bg-gold-dark text-primary-foreground gap-2"
                >
                  <Home className="w-4 h-4" />
                  Voltar ao início
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Agradecimento;
