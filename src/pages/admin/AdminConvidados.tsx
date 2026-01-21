import { useState } from "react";
import { useGuests, useAddGuest, useUpdateGuest, useDeleteGuest } from "@/hooks/useGuests";
import { Plus, Search, Trash2, Copy, Check, X, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

const AdminConvidados = () => {
  const { data: guests, isLoading } = useGuests();
  const addGuest = useAddGuest();
  const deleteGuest = useDeleteGuest();
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newGuestName, setNewGuestName] = useState("");
  const [newGuestEmail, setNewGuestEmail] = useState("");

  const filteredGuests = guests?.filter((g) =>
    g.name.toLowerCase().includes(search.toLowerCase()) ||
    g.email?.toLowerCase().includes(search.toLowerCase())
  ) || [];

  const handleAdd = async () => {
    if (!newGuestName.trim()) return;
    await addGuest.mutateAsync({ name: newGuestName.trim(), email: newGuestEmail.trim() || null });
    setShowAddDialog(false);
    setNewGuestName("");
    setNewGuestEmail("");
    toast({ title: "Convidado adicionado!" });
  };

  const handleDelete = async (id: string) => {
    await deleteGuest.mutateAsync(id);
    toast({ title: "Convidado removido" });
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({ title: "Código copiado!" });
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case "confirmed": return <Badge className="bg-success"><Check className="w-3 h-3 mr-1" />Confirmado</Badge>;
      case "declined": return <Badge variant="destructive"><X className="w-3 h-3 mr-1" />Recusou</Badge>;
      default: return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Pendente</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-3xl">Convidados</h1>
        <Button onClick={() => setShowAddDialog(true)} className="bg-gold hover:bg-gold-dark">
          <Plus className="w-4 h-4 mr-2" />Adicionar
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Buscar..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Código</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Acomp.</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredGuests.map((guest) => (
                <TableRow key={guest.id}>
                  <TableCell className="font-medium">{guest.name}</TableCell>
                  <TableCell>
                    <button onClick={() => copyCode(guest.invitation_code || "")} className="font-mono text-sm flex items-center gap-1 hover:text-gold">
                      {guest.invitation_code} <Copy className="w-3 h-3" />
                    </button>
                  </TableCell>
                  <TableCell>{statusBadge(guest.rsvp_status)}</TableCell>
                  <TableCell>{guest.companions}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(guest.id)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Adicionar Convidado</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nome *</Label>
              <Input value={newGuestName} onChange={(e) => setNewGuestName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>E-mail</Label>
              <Input type="email" value={newGuestEmail} onChange={(e) => setNewGuestEmail(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancelar</Button>
            <Button onClick={handleAdd} className="bg-gold hover:bg-gold-dark">Adicionar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminConvidados;
