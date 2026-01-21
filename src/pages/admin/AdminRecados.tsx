import { useMessages, useApproveMessage, useDeleteMessage } from "@/hooks/useMessages";
import { Check, X, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

const AdminRecados = () => {
  const { data: messages } = useMessages(true);
  const approveMessage = useApproveMessage();
  const deleteMessage = useDeleteMessage();
  const { toast } = useToast();

  const handleApprove = async (id: string, approved: boolean) => {
    await approveMessage.mutateAsync({ id, approved });
    toast({ title: approved ? "Recado aprovado!" : "Recado ocultado" });
  };

  return (
    <div className="space-y-6">
      <h1 className="font-serif text-3xl">Recados</h1>
      <div className="space-y-4">
        {messages?.map((msg) => (
          <Card key={msg.id}>
            <CardContent className="pt-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-medium">{msg.guest_name}</span>
                    {msg.approved ? <Badge className="bg-success">Aprovado</Badge> : <Badge variant="secondary">Pendente</Badge>}
                  </div>
                  <p className="text-muted-foreground">{msg.content}</p>
                </div>
                <div className="flex gap-1">
                  {!msg.approved && (
                    <Button variant="ghost" size="icon" onClick={() => handleApprove(msg.id, true)}>
                      <Check className="w-4 h-4 text-success" />
                    </Button>
                  )}
                  {msg.approved && (
                    <Button variant="ghost" size="icon" onClick={() => handleApprove(msg.id, false)}>
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                  <Button variant="ghost" size="icon" onClick={() => deleteMessage.mutateAsync(msg.id)}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AdminRecados;
