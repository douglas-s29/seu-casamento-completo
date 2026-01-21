import { useGuests } from "@/hooks/useGuests";
import { useGifts } from "@/hooks/useGifts";
import { useMessages } from "@/hooks/useMessages";
import { Users, Gift, MessageCircle, Check, X, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const Dashboard = () => {
  const { data: guests } = useGuests();
  const { data: gifts } = useGifts();
  const { data: messages } = useMessages(true);

  const confirmed = guests?.filter((g) => g.rsvp_status === "confirmed") || [];
  const declined = guests?.filter((g) => g.rsvp_status === "declined") || [];
  const pending = guests?.filter((g) => g.rsvp_status === "pending") || [];
  const totalCompanions = confirmed.reduce((sum, g) => sum + (g.companions || 0), 0);

  const purchasedGifts = gifts?.filter((g) => g.purchased) || [];
  const totalValue = purchasedGifts.reduce((sum, g) => sum + Number(g.price), 0);

  const pendingMessages = messages?.filter((m) => !m.approved) || [];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
  };

  return (
    <div className="space-y-8">
      <h1 className="font-serif text-3xl">Dashboard</h1>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Confirmados</CardTitle>
            <Check className="w-4 h-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{confirmed.length}</div>
            <p className="text-xs text-muted-foreground">+ {totalCompanions} acompanhantes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
            <Clock className="w-4 h-4 text-gold" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pending.length}</div>
            <p className="text-xs text-muted-foreground">aguardando resposta</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Presentes</CardTitle>
            <Gift className="w-4 h-4 text-gold" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{purchasedGifts.length}/{gifts?.length || 0}</div>
            <p className="text-xs text-muted-foreground">{formatCurrency(totalValue)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Recados</CardTitle>
            <MessageCircle className="w-4 h-4 text-gold" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{messages?.length || 0}</div>
            <p className="text-xs text-muted-foreground">{pendingMessages.length} pendentes</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
