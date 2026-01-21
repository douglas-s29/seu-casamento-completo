import { useState } from "react";
import { useGifts, useAddGift, useDeleteGift } from "@/hooks/useGifts";
import { Plus, Trash2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

const AdminPresentes = () => {
  const { data: gifts } = useGifts();
  const addGift = useAddGift();
  const deleteGift = useDeleteGift();
  const { toast } = useToast();

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");

  const handleAdd = async () => {
    if (!name.trim() || !price) return;
    await addGift.mutateAsync({ name: name.trim(), price: parseFloat(price), category: category.trim() || null });
    setShowAddDialog(false);
    setName(""); setPrice(""); setCategory("");
    toast({ title: "Presente adicionado!" });
  };

  const formatCurrency = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-3xl">Presentes</h1>
        <Button onClick={() => setShowAddDialog(true)} className="bg-gold hover:bg-gold-dark">
          <Plus className="w-4 h-4 mr-2" />Adicionar
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Presenteado por</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {gifts?.map((gift) => (
                <TableRow key={gift.id}>
                  <TableCell className="font-medium">{gift.name}</TableCell>
                  <TableCell>{formatCurrency(Number(gift.price))}</TableCell>
                  <TableCell>{gift.category || "-"}</TableCell>
                  <TableCell>
                    {gift.purchased ? <Badge className="bg-success"><Check className="w-3 h-3 mr-1" />Comprado</Badge> : <Badge variant="secondary">Disponível</Badge>}
                  </TableCell>
                  <TableCell>{gift.purchaser_name || "-"}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => deleteGift.mutateAsync(gift.id)}>
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
          <DialogHeader><DialogTitle>Adicionar Presente</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2"><Label>Nome *</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
            <div className="space-y-2"><Label>Valor *</Label><Input type="number" value={price} onChange={(e) => setPrice(e.target.value)} /></div>
            <div className="space-y-2"><Label>Categoria</Label><Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Lua de Mel, Casa, etc." /></div>
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

export default AdminPresentes;
