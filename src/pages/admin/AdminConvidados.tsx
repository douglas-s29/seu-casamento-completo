import { useState, useMemo } from "react";
import { useGuests, useDeleteGuest } from "@/hooks/useGuests";
import { useAllGuestCompanions } from "@/hooks/useGuestCompanions";
import { Search, Trash2, Check, X, Clock, Download, ChevronDown, ChevronRight, Users, Phone, Mail, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

const AdminConvidados = () => {
  const { data: guests, isLoading } = useGuests();
  const { data: companions } = useAllGuestCompanions();
  const deleteGuest = useDeleteGuest();
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [expandedGuests, setExpandedGuests] = useState<Set<string>>(new Set());
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Group companions by guest_id
  const companionsByGuest = useMemo(() => {
    const map = new Map<string, typeof companions>();
    companions?.forEach((c) => {
      const list = map.get(c.guest_id) || [];
      list.push(c);
      map.set(c.guest_id, list);
    });
    return map;
  }, [companions]);

  const filteredGuests = useMemo(() => {
    return guests?.filter((g) => {
      const matchesSearch = 
        g.name.toLowerCase().includes(search.toLowerCase()) ||
        g.email?.toLowerCase().includes(search.toLowerCase()) ||
        g.phone?.toLowerCase().includes(search.toLowerCase());
      
      const matchesStatus = statusFilter === "all" || g.rsvp_status === statusFilter;
      
      return matchesSearch && matchesStatus;
    }) || [];
  }, [guests, search, statusFilter]);

  const toggleExpanded = (id: string) => {
    const newSet = new Set(expandedGuests);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setExpandedGuests(newSet);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja remover este convidado?")) return;
    await deleteGuest.mutateAsync(id);
    toast({ title: "Convidado removido" });
  };

  const exportCSV = () => {
    if (!guests) return;

    const rows: string[] = [];
    rows.push("Nome,Telefone,Email,Idade,Status,Acompanhantes,Nome Acompanhante,Idade Acompanhante,Mensagem");

    guests.forEach((guest) => {
      const guestCompanions = companionsByGuest.get(guest.id) || [];
      const status = guest.rsvp_status === "confirmed" ? "Confirmado" : guest.rsvp_status === "declined" ? "Recusou" : "Pendente";
      
      if (guestCompanions.length === 0) {
        rows.push(`"${guest.name}","${guest.phone || ""}","${guest.email || ""}","${guest.age || ""}","${status}","0","","","${(guest.message || "").replace(/"/g, '""')}"`);
      } else {
        guestCompanions.forEach((comp, idx) => {
          if (idx === 0) {
            rows.push(`"${guest.name}","${guest.phone || ""}","${guest.email || ""}","${guest.age || ""}","${status}","${guestCompanions.length}","${comp.name}","${comp.age || ""}","${(guest.message || "").replace(/"/g, '""')}"`);
          } else {
            rows.push(`"","","","","","","${comp.name}","${comp.age || ""}",""`);
          }
        });
      }
    });

    const csv = rows.join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `convidados_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    
    toast({ title: "Lista exportada!", description: "O arquivo CSV foi baixado." });
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case "confirmed": return <Badge className="bg-success"><Check className="w-3 h-3 mr-1" />Confirmado</Badge>;
      case "declined": return <Badge variant="destructive"><X className="w-3 h-3 mr-1" />Recusou</Badge>;
      default: return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Pendente</Badge>;
    }
  };

  const stats = useMemo(() => {
    const confirmed = guests?.filter(g => g.rsvp_status === "confirmed") || [];
    const declined = guests?.filter(g => g.rsvp_status === "declined") || [];
    const pending = guests?.filter(g => g.rsvp_status === "pending") || [];
    
    const confirmedIds = new Set(confirmed.map(g => g.id));
    const totalCompanions = companions?.filter(c => confirmedIds.has(c.guest_id)).length || 0;
    
    return { confirmed: confirmed.length, declined: declined.length, pending: pending.length, companions: totalCompanions };
  }, [guests, companions]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl">Convidados</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {stats.confirmed} confirmados + {stats.companions} acompanhantes | {stats.pending} pendentes | {stats.declined} recusaram
          </p>
        </div>
        <Button onClick={exportCSV} variant="outline" className="shrink-0">
          <Download className="w-4 h-4 mr-2" />
          Exportar CSV
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Buscar por nome, email ou telefone..." 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
            className="pl-9" 
          />
        </div>
        <div className="flex gap-2">
          {["all", "confirmed", "pending", "declined"].map((status) => (
            <Button
              key={status}
              variant={statusFilter === status ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter(status)}
              className={statusFilter === status ? "bg-gold hover:bg-gold-dark" : ""}
            >
              {status === "all" ? "Todos" : status === "confirmed" ? "Confirmados" : status === "pending" ? "Pendentes" : "Recusaram"}
            </Button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Carregando...</div>
      ) : filteredGuests.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Nenhum convidado encontrado
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredGuests.map((guest) => {
            const guestCompanions = companionsByGuest.get(guest.id) || [];
            const isExpanded = expandedGuests.has(guest.id);
            const hasCompanions = guestCompanions.length > 0;

            return (
              <Card key={guest.id} className="overflow-hidden">
                <Collapsible open={isExpanded} onOpenChange={() => hasCompanions && toggleExpanded(guest.id)}>
                  <div className="p-4">
                    <div className="flex items-start gap-3">
                      {hasCompanions ? (
                        <CollapsibleTrigger asChild>
                          <Button variant="ghost" size="icon" className="shrink-0 mt-1">
                            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                          </Button>
                        </CollapsibleTrigger>
                      ) : (
                        <div className="w-10" />
                      )}

                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <h3 className="font-medium text-lg">{guest.name}</h3>
                          {statusBadge(guest.rsvp_status)}
                          {hasCompanions && (
                            <Badge variant="outline" className="flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              +{guestCompanions.length}
                            </Badge>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                          {guest.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              {guest.phone}
                            </span>
                          )}
                          {guest.email && (
                            <span className="flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              {guest.email}
                            </span>
                          )}
                          {guest.age && (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {guest.age} anos
                            </span>
                          )}
                        </div>

                        {guest.message && (
                          <p className="mt-2 text-sm italic text-muted-foreground">
                            "{guest.message}"
                          </p>
                        )}
                      </div>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(guest.id)}
                        className="shrink-0 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {hasCompanions && (
                    <CollapsibleContent>
                      <div className="border-t bg-muted/30 px-4 py-3 ml-10">
                        <p className="text-xs font-medium text-muted-foreground mb-3">Acompanhantes:</p>
                        <div className="grid sm:grid-cols-2 gap-2">
                          {guestCompanions.map((comp) => (
                            <div key={comp.id} className="flex items-center gap-2 bg-background rounded-md px-3 py-2">
                              <Users className="w-4 h-4 text-muted-foreground" />
                              <span className="font-medium">{comp.name}</span>
                              {comp.age && (
                                <span className="text-sm text-muted-foreground">({comp.age} anos)</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </CollapsibleContent>
                  )}
                </Collapsible>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdminConvidados;
