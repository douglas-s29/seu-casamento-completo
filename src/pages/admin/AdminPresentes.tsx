import { useState } from "react";
import { useGifts, useAddGift, useUpdateGift, useDeleteGift } from "@/hooks/useGifts";
import { Plus, Trash2, Check, Pencil, Upload, X, Image } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { Gift } from "@/hooks/useGifts";

const AdminPresentes = () => {
  const { data: gifts } = useGifts();
  const addGift = useAddGift();
  const updateGift = useUpdateGift();
  const deleteGift = useDeleteGift();
  const { toast } = useToast();

  const [showDialog, setShowDialog] = useState(false);
  const [editingGift, setEditingGift] = useState<Gift | null>(null);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const openAddDialog = () => {
    setEditingGift(null);
    setName("");
    setPrice("");
    setCategory("");
    setDescription("");
    setImageUrl("");
    setShowDialog(true);
  };

  const openEditDialog = (gift: Gift) => {
    setEditingGift(gift);
    setName(gift.name);
    setPrice(String(gift.price));
    setCategory(gift.category || "");
    setDescription(gift.description || "");
    setImageUrl(gift.image_url || "");
    setShowDialog(true);
  };

  const closeDialog = () => {
    setShowDialog(false);
    setEditingGift(null);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Erro",
        description: "Por favor, selecione uma imagem válida.",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Erro",
        description: "A imagem deve ter no máximo 5MB.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const filePath = `gifts/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("gift-images")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("gift-images")
        .getPublicUrl(filePath);

      setImageUrl(publicUrl);
      toast({ title: "Imagem carregada!" });
    } catch (error: any) {
      console.error("Upload error:", error);
      toast({
        title: "Erro ao carregar imagem",
        description: error.message || "Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim() || !price) {
      toast({
        title: "Erro",
        description: "Nome e valor são obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    try {
      if (editingGift) {
        await updateGift.mutateAsync({
          id: editingGift.id,
          name: name.trim(),
          price: parseFloat(price),
          category: category.trim() || null,
          description: description.trim() || null,
          image_url: imageUrl || null,
        });
        toast({ title: "Presente atualizado!" });
      } else {
        await addGift.mutateAsync({
          name: name.trim(),
          price: parseFloat(price),
          category: category.trim() || null,
          description: description.trim() || null,
          image_url: imageUrl || null,
        });
        toast({ title: "Presente adicionado!" });
      }
      closeDialog();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este presente?")) return;
    await deleteGift.mutateAsync(id);
    toast({ title: "Presente excluído!" });
  };

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-3xl">Presentes</h1>
        <Button onClick={openAddDialog} className="bg-gold hover:bg-gold-dark">
          <Plus className="w-4 h-4 mr-2" />
          Adicionar
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Foto</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Presenteado por</TableHead>
                <TableHead className="w-24"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {gifts?.map((gift) => (
                <TableRow key={gift.id}>
                  <TableCell>
                    {gift.image_url ? (
                      <img
                        src={gift.image_url}
                        alt={gift.name}
                        className="w-12 h-12 object-cover rounded"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
                        <Image className="w-5 h-5 text-muted-foreground" />
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">{gift.name}</TableCell>
                  <TableCell>{formatCurrency(Number(gift.price))}</TableCell>
                  <TableCell>{gift.category || "-"}</TableCell>
                  <TableCell>
                    {gift.purchased ? (
                      <Badge className="bg-success">
                        <Check className="w-3 h-3 mr-1" />
                        Comprado
                      </Badge>
                    ) : (
                      <Badge variant="secondary">Disponível</Badge>
                    )}
                  </TableCell>
                  <TableCell>{gift.purchaser_name || "-"}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditDialog(gift)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(gift.id)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {(!gifts || gifts.length === 0) && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    Nenhum presente cadastrado
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingGift ? "Editar Presente" : "Adicionar Presente"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Image Upload */}
            <div className="space-y-2">
              <Label>Foto do presente</Label>
              <div className="flex items-start gap-4">
                {imageUrl ? (
                  <div className="relative">
                    <img
                      src={imageUrl}
                      alt="Preview"
                      className="w-24 h-24 object-cover rounded border"
                    />
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute -top-2 -right-2 w-6 h-6"
                      onClick={() => setImageUrl("")}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ) : (
                  <div className="w-24 h-24 bg-muted rounded border flex items-center justify-center">
                    <Image className="w-8 h-8 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={isUploading}
                    className="cursor-pointer"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    JPG, PNG ou WebP. Máximo 5MB.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Nome *</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Jogo de Panelas"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Valor *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label>Categoria</Label>
                <Input
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="Cozinha, Casa, etc."
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descrição do presente (opcional)"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={addGift.isPending || updateGift.isPending || isUploading}
              className="bg-gold hover:bg-gold-dark"
            >
              {isUploading ? "Carregando..." : editingGift ? "Salvar" : "Adicionar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminPresentes;
