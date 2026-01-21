import { useState, useEffect } from "react";
import { useWeddingSettings, useUpdateWeddingSettings } from "@/hooks/useWeddingSettings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

const AdminConfiguracoes = () => {
  const { data: settings } = useWeddingSettings();
  const updateSettings = useUpdateWeddingSettings();
  const { toast } = useToast();

  const [form, setForm] = useState({
    groom_name: "", bride_name: "", wedding_date: "", ceremony_location: "", ceremony_address: "",
    reception_location: "", reception_address: "", dress_code: "", story_text: "", pix_key: "", bank_name: "", account_holder: ""
  });

  useEffect(() => {
    if (settings) {
      setForm({
        groom_name: settings.groom_name || "",
        bride_name: settings.bride_name || "",
        wedding_date: settings.wedding_date ? new Date(settings.wedding_date).toISOString().slice(0, 16) : "",
        ceremony_location: settings.ceremony_location || "",
        ceremony_address: settings.ceremony_address || "",
        reception_location: settings.reception_location || "",
        reception_address: settings.reception_address || "",
        dress_code: settings.dress_code || "",
        story_text: settings.story_text || "",
        pix_key: settings.pix_key || "",
        bank_name: settings.bank_name || "",
        account_holder: settings.account_holder || "",
      });
    }
  }, [settings]);

  const handleSave = async () => {
    if (!settings?.id) return;
    await updateSettings.mutateAsync({
      id: settings.id,
      ...form,
      wedding_date: form.wedding_date ? new Date(form.wedding_date).toISOString() : null,
    });
    toast({ title: "Configurações salvas!" });
  };

  const update = (field: string, value: string) => setForm((f) => ({ ...f, [field]: value }));

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="font-serif text-3xl">Configurações</h1>

      <Card>
        <CardHeader><CardTitle>Informações dos Noivos</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Nome do Noivo</Label><Input value={form.groom_name} onChange={(e) => update("groom_name", e.target.value)} /></div>
            <div><Label>Nome da Noiva</Label><Input value={form.bride_name} onChange={(e) => update("bride_name", e.target.value)} /></div>
          </div>
          <div><Label>Data e Hora</Label><Input type="datetime-local" value={form.wedding_date} onChange={(e) => update("wedding_date", e.target.value)} /></div>
          <div><Label>Nossa História</Label><Textarea value={form.story_text} onChange={(e) => update("story_text", e.target.value)} rows={4} /></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Locais</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div><Label>Cerimônia</Label><Input value={form.ceremony_location} onChange={(e) => update("ceremony_location", e.target.value)} /></div>
          <div><Label>Endereço Cerimônia</Label><Input value={form.ceremony_address} onChange={(e) => update("ceremony_address", e.target.value)} /></div>
          <div><Label>Recepção</Label><Input value={form.reception_location} onChange={(e) => update("reception_location", e.target.value)} /></div>
          <div><Label>Endereço Recepção</Label><Input value={form.reception_address} onChange={(e) => update("reception_address", e.target.value)} /></div>
          <div><Label>Dress Code</Label><Input value={form.dress_code} onChange={(e) => update("dress_code", e.target.value)} /></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Dados para Pagamento</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div><Label>Chave PIX</Label><Input value={form.pix_key} onChange={(e) => update("pix_key", e.target.value)} /></div>
          <div><Label>Titular</Label><Input value={form.account_holder} onChange={(e) => update("account_holder", e.target.value)} /></div>
          <div><Label>Banco</Label><Input value={form.bank_name} onChange={(e) => update("bank_name", e.target.value)} /></div>
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={updateSettings.isPending} className="bg-gold hover:bg-gold-dark">
        {updateSettings.isPending ? "Salvando..." : "Salvar Configurações"}
      </Button>
    </div>
  );
};

export default AdminConfiguracoes;
