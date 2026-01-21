import { useGuests } from "@/hooks/useGuests";
import { useGifts } from "@/hooks/useGifts";
import { useMessages } from "@/hooks/useMessages";
import { useAllGuestCompanions } from "@/hooks/useGuestCompanions";
import { useGiftPurchasesByDay } from "@/hooks/useGiftPurchases";
import { Users, Gift, MessageCircle, TrendingUp, UserCheck, UserX, Baby, Clock, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

const Dashboard = () => {
  const { data: guests } = useGuests();
  const { data: gifts } = useGifts();
  const { data: messages } = useMessages(true);
  const { data: companions } = useAllGuestCompanions();
  const { data: purchasesByDay } = useGiftPurchasesByDay();

  const confirmed = guests?.filter((g) => g.rsvp_status === "confirmed") || [];
  const declined = guests?.filter((g) => g.rsvp_status === "declined") || [];
  const pending = guests?.filter((g) => g.rsvp_status === "pending") || [];
  
  const confirmedGuestIds = new Set(confirmed.map(g => g.id));
  const confirmedCompanions = companions?.filter(c => confirmedGuestIds.has(c.guest_id)) || [];
  
  const totalAttending = confirmed.length + confirmedCompanions.length;
  
  const allAges = [
    ...confirmed.filter(g => g.age).map(g => g.age!),
    ...confirmedCompanions.filter(c => c.age).map(c => c.age!)
  ];
  const children = allAges.filter(age => age < 12).length;
  const teens = allAges.filter(age => age >= 12 && age < 18).length;
  const adults = allAges.filter(age => age >= 18).length;

  // Calculate total from purchases
  const totalPurchased = purchasesByDay?.reduce((sum, day) => sum + day.total, 0) || 0;
  const totalPurchaseCount = purchasesByDay?.reduce((sum, day) => sum + day.count, 0) || 0;
  
  const availableGifts = gifts?.filter((g) => {
    const purchaseCount = (g as any).purchase_count || 0;
    const limit = (g as any).purchase_limit || 1;
    return purchaseCount < limit;
  }) || [];
  
  const totalAvailableValue = availableGifts.reduce((sum, g) => sum + Number(g.price), 0);

  const pendingMessages = messages?.filter((m) => !m.approved) || [];
  const approvedMessages = messages?.filter((m) => m.approved) || [];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
  };

  // Format chart data
  const chartData = purchasesByDay?.map(day => ({
    ...day,
    dateFormatted: new Date(day.date).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
  })) || [];

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
            <CardTitle className="text-sm font-medium">Arrecadado</CardTitle>
            <Gift className="w-5 h-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{formatCurrency(totalPurchased)}</div>
            <p className="text-xs text-muted-foreground mt-1">{totalPurchaseCount} presentes</p>
          </CardContent>
        </Card>
      </div>

      {/* Chart - Daily Revenue */}
      {chartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Calendar className="w-5 h-5 text-gold" />
              Arrecadação por Dia
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="dateFormatted" 
                    tick={{ fontSize: 12 }}
                    className="text-muted-foreground"
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => `R$${value}`}
                    className="text-muted-foreground"
                  />
                  <Tooltip 
                    formatter={(value: number) => [formatCurrency(value), "Total"]}
                    labelFormatter={(label) => `Data: ${label}`}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar 
                    dataKey="total" 
                    fill="hsl(var(--gold))" 
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

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
              <span className="text-sm text-muted-foreground">Arrecadado</span>
              <span className="font-bold text-success">{formatCurrency(totalPurchased)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Disponíveis</span>
              <span className="font-bold">{formatCurrency(totalAvailableValue)}</span>
            </div>
            <div className="pt-2 border-t">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Total Lista</span>
                <span className="font-bold text-lg">{formatCurrency(totalPurchased + totalAvailableValue)}</span>
              </div>
            </div>
            <div className="w-full bg-muted rounded-full h-2 mt-2">
              <div 
                className="bg-success h-2 rounded-full transition-all"
                style={{ width: `${(totalPurchased + totalAvailableValue) > 0 ? (totalPurchased / (totalPurchased + totalAvailableValue)) * 100 : 0}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground text-center">
              {(totalPurchased + totalAvailableValue) > 0 ? Math.round((totalPurchased / (totalPurchased + totalAvailableValue)) * 100) : 0}% da lista arrecadado
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
