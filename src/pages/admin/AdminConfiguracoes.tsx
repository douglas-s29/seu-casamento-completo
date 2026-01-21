import { useState, useEffect } from "react";
import { useWeddingSettings, useUpdateWeddingSettings } from "@/hooks/useWeddingSettings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { MapPin, CreditCard, Users, Settings } from "lucide-react";

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
  });

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
      });
    }
  }, [settings]);

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
              <Label>Nome do Noivo</Label>
              <Input value={form.groom_name} onChange={(e) => update("groom_name", e.target.value)} />
            </div>
            <div>
              <Label>Nome da Noiva</Label>
              <Input value={form.bride_name} onChange={(e) => update("bride_name", e.target.value)} />
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

      <Button onClick={handleSave} disabled={updateSettings.isPending} className="bg-gold hover:bg-gold-dark">
        {updateSettings.isPending ? "Salvando..." : "Salvar Configurações"}
      </Button>
    </div>
  );
};

export default AdminConfiguracoes;
