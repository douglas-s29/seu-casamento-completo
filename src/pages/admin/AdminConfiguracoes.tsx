import { useState, useEffect } from "react";
import { useWeddingSettings, useUpdateWeddingSettings } from "@/hooks/useWeddingSettings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { MapPin, CreditCard, Users, Settings, Image, X, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const AdminConfiguracoes = () => {
  const { data: settings } = useWeddingSettings();
  const updateSettings = useUpdateWeddingSettings();
  const { toast } = useToast();

  const [form, setForm] = useState({
    groom_name: "",
    bride_name: "",
    wedding_date: "",
    ceremony_location: "",
    ceremony_address: "",
    ceremony_map_url: "",
    reception_location: "",
    reception_address: "",
    reception_map_url: "",
    dress_code: "",
    story_text: "",
    pix_key: "",
    bank_name: "",
    account_holder: "",
    gift_purchase_limit: "8",
    background_image_url: "",
  });

  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (settings) {
      setForm({
        groom_name: settings.groom_name || "",
        bride_name: settings.bride_name || "",
        wedding_date: settings.wedding_date ? new Date(settings.wedding_date).toISOString().slice(0, 16) : "",
        ceremony_location: settings.ceremony_location || "",
        ceremony_address: settings.ceremony_address || "",
        ceremony_map_url: (settings as any).ceremony_map_url || "",
        reception_location: settings.reception_location || "",
        reception_address: settings.reception_address || "",
        reception_map_url: (settings as any).reception_map_url || "",
        dress_code: settings.dress_code || "",
        story_text: settings.story_text || "",
        pix_key: settings.pix_key || "",
        bank_name: settings.bank_name || "",
        account_holder: settings.account_holder || "",
        gift_purchase_limit: String((settings as any).gift_purchase_limit || 8),
        background_image_url: (settings as any).background_image_url || "",
      });
    }
  }, [settings]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({
        title: "Erro",
        description: "Por favor, selecione uma imagem válida.",
        variant: "destructive",
      });
      return;
    }

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
      const fileName = `background-${crypto.randomUUID()}.${fileExt}`;
      const filePath = `backgrounds/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("gift-images")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("gift-images")
        .getPublicUrl(filePath);

      setForm((f) => ({ ...f, background_image_url: publicUrl }));
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
    if (!settings?.id) return;
    await updateSettings.mutateAsync({
      id: settings.id,
      groom_name: form.groom_name,
      bride_name: form.bride_name,
      wedding_date: form.wedding_date ? new Date(form.wedding_date).toISOString() : null,
      ceremony_location: form.ceremony_location,
      ceremony_address: form.ceremony_address,
      ceremony_map_url: form.ceremony_map_url || null,
      reception_location: form.reception_location,
      reception_address: form.reception_address,
      reception_map_url: form.reception_map_url || null,
      dress_code: form.dress_code,
      story_text: form.story_text,
      pix_key: form.pix_key,
      bank_name: form.bank_name,
      account_holder: form.account_holder,
      gift_purchase_limit: parseInt(form.gift_purchase_limit) || 8,
      background_image_url: form.background_image_url || null,
    } as any);
    toast({ title: "Configurações salvas!" });
  };

  const update = (field: string, value: string) => setForm((f) => ({ ...f, [field]: value }));

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="font-serif text-3xl">Configurações</h1>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Informações dos Noivos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Nome da Noiva</Label>
              <Input value={form.bride_name} onChange={(e) => update("bride_name", e.target.value)} />
            </div>
            <div>
              <Label>Nome do Noivo</Label>
              <Input value={form.groom_name} onChange={(e) => update("groom_name", e.target.value)} />
            </div>
          </div>
          <div>
            <Label>Data e Hora</Label>
            <Input type="datetime-local" value={form.wedding_date} onChange={(e) => update("wedding_date", e.target.value)} />
          </div>
          <div>
            <Label>Nossa História</Label>
            <Textarea value={form.story_text} onChange={(e) => update("story_text", e.target.value)} rows={4} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Image className="w-5 h-5" />
            Imagem de Fundo
          </CardTitle>
          <CardDescription>
            Adicione uma imagem de fundo para a página inicial
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Papel de Parede</Label>
            <div className="flex items-start gap-4">
              {form.background_image_url ? (
                <div className="relative">
                  <img
                    src={form.background_image_url}
                    alt="Background preview"
                    className="w-32 h-20 object-cover rounded border"
                  />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute -top-2 -right-2 w-6 h-6"
                    onClick={() => update("background_image_url", "")}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              ) : (
                <div className="w-32 h-20 bg-muted rounded border flex items-center justify-center">
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
                  JPG, PNG ou WebP. Recomendado: 1920x1080. Máximo 5MB.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Locais
          </CardTitle>
          <CardDescription>
            Cole o link do Google Maps para exibir o botão "Ver no mapa" e o minimapa
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Cerimônia</Label>
            <Input value={form.ceremony_location} onChange={(e) => update("ceremony_location", e.target.value)} placeholder="Nome do local" />
          </div>
          <div>
            <Label>Endereço Cerimônia</Label>
            <Input value={form.ceremony_address} onChange={(e) => update("ceremony_address", e.target.value)} placeholder="Endereço completo" />
          </div>
          <div>
            <Label>Link Google Maps (Cerimônia)</Label>
            <Input 
              value={form.ceremony_map_url} 
              onChange={(e) => update("ceremony_map_url", e.target.value)} 
              placeholder="https://maps.google.com/..." 
            />
          </div>
          
          <div className="border-t pt-4 mt-4">
            <Label>Recepção</Label>
            <Input value={form.reception_location} onChange={(e) => update("reception_location", e.target.value)} placeholder="Nome do local" />
          </div>
          <div>
            <Label>Endereço Recepção</Label>
            <Input value={form.reception_address} onChange={(e) => update("reception_address", e.target.value)} placeholder="Endereço completo" />
          </div>
          <div>
            <Label>Link Google Maps (Recepção)</Label>
            <Input 
              value={form.reception_map_url} 
              onChange={(e) => update("reception_map_url", e.target.value)} 
              placeholder="https://maps.google.com/..." 
            />
          </div>
          
          <div className="border-t pt-4 mt-4">
            <Label>Dress Code</Label>
            <Input value={form.dress_code} onChange={(e) => update("dress_code", e.target.value)} placeholder="Ex: Traje Social" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Dados para Pagamento
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Chave PIX</Label>
            <Input value={form.pix_key} onChange={(e) => update("pix_key", e.target.value)} placeholder="CPF, E-mail, Telefone ou Chave aleatória" />
          </div>
          <div>
            <Label>Titular</Label>
            <Input value={form.account_holder} onChange={(e) => update("account_holder", e.target.value)} />
          </div>
          <div>
            <Label>Banco</Label>
            <Input value={form.bank_name} onChange={(e) => update("bank_name", e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Configurações de Presentes
          </CardTitle>
          <CardDescription>
            Defina quantas vezes o mesmo presente pode ser comprado por pessoas diferentes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Limite de vendas por presente</Label>
            <Input 
              type="number" 
              min="1" 
              max="100"
              value={form.gift_purchase_limit} 
              onChange={(e) => update("gift_purchase_limit", e.target.value)} 
            />
            <p className="text-xs text-muted-foreground mt-1">
              Cada presente poderá ser comprado até {form.gift_purchase_limit} vezes
            </p>
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={updateSettings.isPending || isUploading} className="bg-gold hover:bg-gold-dark">
        {updateSettings.isPending ? "Salvando..." : "Salvar Configurações"}
      </Button>
    </div>
  );
};

export default AdminConfiguracoes;
