import { useGuests } from "@/hooks/useGuests";
import { useGifts } from "@/hooks/useGifts";
import { useMessages } from "@/hooks/useMessages";
import { useAllGuestCompanions } from "@/hooks/useGuestCompanions";
import { Users, Gift, MessageCircle, Check, X, Clock, TrendingUp, UserCheck, UserX, Baby } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const Dashboard = () => {
  const { data: guests } = useGuests();
  const { data: gifts } = useGifts();
  const { data: messages } = useMessages(true);
  const { data: companions } = useAllGuestCompanions();

  const confirmed = guests?.filter((g) => g.rsvp_status === "confirmed") || [];
  const declined = guests?.filter((g) => g.rsvp_status === "declined") || [];
  const pending = guests?.filter((g) => g.rsvp_status === "pending") || [];
  
  // Calculate companions from confirmed guests
  const confirmedGuestIds = new Set(confirmed.map(g => g.id));
  const confirmedCompanions = companions?.filter(c => confirmedGuestIds.has(c.guest_id)) || [];
  
  // Total people attending (guests + companions)
  const totalAttending = confirmed.length + confirmedCompanions.length;
  
  // Age breakdown
  const allAges = [
    ...confirmed.filter(g => g.age).map(g => g.age!),
    ...confirmedCompanions.filter(c => c.age).map(c => c.age!)
  ];
  const children = allAges.filter(age => age < 12).length;
  const teens = allAges.filter(age => age >= 12 && age < 18).length;
  const adults = allAges.filter(age => age >= 18).length;

  const purchasedGifts = gifts?.filter((g) => g.purchased) || [];
  const availableGifts = gifts?.filter((g) => !g.purchased) || [];
  const totalValue = purchasedGifts.reduce((sum, g) => sum + Number(g.price), 0);
  const totalAvailableValue = availableGifts.reduce((sum, g) => sum + Number(g.price), 0);

  const pendingMessages = messages?.filter((m) => !m.approved) || [];
  const approvedMessages = messages?.filter((m) => m.approved) || [];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-3xl md:text-4xl mb-2">Dashboard</h1>
        <p className="text-muted-foreground">Visão geral do seu casamento</p>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <Card className="bg-gradient-to-br from-success/10 to-success/5 border-success/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Confirmados</CardTitle>
            <UserCheck className="w-5 h-5 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-success">{totalAttending}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {confirmed.length} convidados + {confirmedCompanions.length} acompanhantes
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-gold/10 to-gold/5 border-gold/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
            <Clock className="w-5 h-5 text-gold" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gold">{pending.length}</div>
            <p className="text-xs text-muted-foreground mt-1">aguardando resposta</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-destructive/10 to-destructive/5 border-destructive/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Recusaram</CardTitle>
            <UserX className="w-5 h-5 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-destructive">{declined.length}</div>
            <p className="text-xs text-muted-foreground mt-1">não poderão ir</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Presentes</CardTitle>
            <Gift className="w-5 h-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{purchasedGifts.length}</div>
            <p className="text-xs text-muted-foreground mt-1">de {gifts?.length || 0} itens</p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Stats */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Age Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="w-5 h-5 text-gold" />
              Faixa Etária (Confirmados)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Baby className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">Crianças (até 11)</span>
              </div>
              <span className="font-bold">{children}</span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">Adolescentes (12-17)</span>
              </div>
              <span className="font-bold">{teens}</span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">Adultos (18+)</span>
              </div>
              <span className="font-bold">{adults}</span>
            </div>
            <div className="pt-2 border-t">
              <p className="text-xs text-muted-foreground">
                * {totalAttending - allAges.length} pessoas sem idade informada
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Gifts Value */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="w-5 h-5 text-gold" />
              Presentes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Recebidos</span>
              <span className="font-bold text-success">{formatCurrency(totalValue)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Disponíveis</span>
              <span className="font-bold">{formatCurrency(totalAvailableValue)}</span>
            </div>
            <div className="pt-2 border-t">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Total Lista</span>
                <span className="font-bold text-lg">{formatCurrency(totalValue + totalAvailableValue)}</span>
              </div>
            </div>
            <div className="w-full bg-muted rounded-full h-2 mt-2">
              <div 
                className="bg-success h-2 rounded-full transition-all"
                style={{ width: `${gifts?.length ? (purchasedGifts.length / gifts.length) * 100 : 0}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground text-center">
              {gifts?.length ? Math.round((purchasedGifts.length / gifts.length) * 100) : 0}% da lista presenteada
            </p>
          </CardContent>
        </Card>

        {/* Messages */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <MessageCircle className="w-5 h-5 text-gold" />
              Recados
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Aprovados</span>
              <span className="font-bold text-success">{approvedMessages.length}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Pendentes</span>
              <span className="font-bold text-gold">{pendingMessages.length}</span>
            </div>
            <div className="pt-2 border-t">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Total</span>
                <span className="font-bold text-lg">{messages?.length || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
