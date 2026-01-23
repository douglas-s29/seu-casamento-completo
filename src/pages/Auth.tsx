import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { useAuth } from "@/hooks/useAuth";
import { LogIn, UserPlus, Eye, EyeOff, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

const emailSchema = z.string().email("E-mail inválido");
const passwordSchema = z.string().min(6, "A senha deve ter pelo menos 6 caracteres");

// Strong password schema for sign up
const strongPasswordSchema = z.string()
  .min(8, "Senha deve ter no mínimo 8 caracteres")
  .regex(/[A-Z]/, "Senha deve conter ao menos uma letra maiúscula")
  .regex(/[a-z]/, "Senha deve conter ao menos uma letra minúscula")
  .regex(/[0-9]/, "Senha deve conter ao menos um número")
  .regex(/[^A-Za-z0-9]/, "Senha deve conter ao menos um caractere especial");

type PasswordStrength = "weak" | "medium" | "strong";

const checkPasswordStrength = (password: string): PasswordStrength => {
  let strength = 0;
  if (password.length >= 8) strength++;
  if (/[A-Z]/.test(password)) strength++;
  if (/[a-z]/.test(password)) strength++;
  if (/[0-9]/.test(password)) strength++;
  if (/[^A-Za-z0-9]/.test(password)) strength++;
  
  if (strength <= 2) return "weak";
  if (strength <= 4) return "medium";
  return "strong";
};

const Auth = () => {
  const navigate = useNavigate();
  const { signIn, signUp, user, isAdmin, loading } = useAuth();
  const { toast } = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength>("weak");
  
  // Brute force protection (client-side)
  // Note: For production, implement server-side rate limiting via Edge Function
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [lockoutUntil, setLockoutUntil] = useState<number | null>(null);

  // Check password strength as user types
  useEffect(() => {
    if (password) {
      setPasswordStrength(checkPasswordStrength(password));
    }
  }, [password]);

  // Redirect if already logged in as admin
  if (!loading && user && isAdmin) {
    navigate("/x7k9m2p8/dashboard");
    return null;
  }

  const validateInputs = (isSignUp: boolean = false) => {
    const newErrors: { email?: string; password?: string } = {};

    const emailResult = emailSchema.safeParse(email);
    if (!emailResult.success) {
      newErrors.email = emailResult.error.errors[0].message;
    }

    // Use strong password validation for sign up
    if (isSignUp) {
      const passwordResult = strongPasswordSchema.safeParse(password);
      if (!passwordResult.success) {
        newErrors.password = passwordResult.error.errors[0].message;
      }
    } else {
      const passwordResult = passwordSchema.safeParse(password);
      if (!passwordResult.success) {
        newErrors.password = passwordResult.error.errors[0].message;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if account is locked
    if (lockoutUntil && Date.now() < lockoutUntil) {
      const remaining = Math.ceil((lockoutUntil - Date.now()) / 1000);
      toast({
        title: "Conta temporariamente bloqueada",
        description: `Muitas tentativas de login. Tente novamente em ${remaining} segundos.`,
        variant: "destructive",
      });
      return;
    }
    
    if (!validateInputs(false)) return;

    setIsSubmitting(true);
    try {
      const { error } = await signIn(email, password);

      if (error) {
        const newAttempts = loginAttempts + 1;
        setLoginAttempts(newAttempts);
        
        if (newAttempts >= 5) {
          const lockTime = Date.now() + (30 * 60 * 1000); // 30 minutes
          setLockoutUntil(lockTime);
          toast({
            title: "Conta bloqueada",
            description: "Muitas tentativas de login. Tente novamente em 30 minutos.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Erro ao entrar",
            description: error.message === "Invalid login credentials"
              ? `E-mail ou senha incorretos. (${5 - newAttempts} tentativas restantes)`
              : error.message,
            variant: "destructive",
          });
        }
      } else {
        // Reset attempts on successful login
        setLoginAttempts(0);
        setLockoutUntil(null);
        toast({
          title: "Bem-vindo!",
          description: "Login realizado com sucesso.",
        });
        navigate("/x7k9m2p8/dashboard");
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao fazer login.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateInputs(true)) return;

    setIsSubmitting(true);
    try {
      const { error } = await signUp(email, password);

      if (error) {
        if (error.message.includes("already registered")) {
          toast({
            title: "E-mail já cadastrado",
            description: "Este e-mail já está em uso. Tente fazer login.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Erro ao cadastrar",
            description: error.message,
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "Conta criada!",
          description: "Você pode fazer login agora. Nota: somente administradores podem acessar o painel.",
        });
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao criar a conta.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout>
      <div className="py-20 min-h-[calc(100vh-8rem)] flex items-center justify-center bg-gradient-to-b from-champagne/30 to-background">
        <div className="container mx-auto px-4 max-w-md">
          <Card className="elegant-shadow">
            <CardHeader className="text-center">
              <CardTitle className="font-serif text-3xl">Área Administrativa</CardTitle>
              <CardDescription>
                Acesso exclusivo para os noivos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="login" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="login">Entrar</TabsTrigger>
                  <TabsTrigger value="register">Cadastrar</TabsTrigger>
                </TabsList>

                <TabsContent value="login">
                  <form onSubmit={handleSignIn} className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label htmlFor="login-email">E-mail</Label>
                      <Input
                        id="login-email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="seu@email.com"
                      />
                      {errors.email && (
                        <p className="text-xs text-destructive">{errors.email}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="login-password">Senha</Label>
                      <div className="relative">
                        <Input
                          id="login-password"
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showPassword ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                      {errors.password && (
                        <p className="text-xs text-destructive">{errors.password}</p>
                      )}
                    </div>
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full bg-gold hover:bg-gold-dark text-primary-foreground"
                    >
                      <LogIn className="w-4 h-4 mr-2" />
                      {isSubmitting ? "Entrando..." : "Entrar"}
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="register">
                  <form onSubmit={handleSignUp} className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label htmlFor="register-email">E-mail</Label>
                      <Input
                        id="register-email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="seu@email.com"
                      />
                      {errors.email && (
                        <p className="text-xs text-destructive">{errors.email}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="register-password">Senha</Label>
                      <div className="relative">
                        <Input
                          id="register-password"
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Mínimo 8 caracteres"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showPassword ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                      {password && (
                        <div className="flex items-center gap-2 text-xs">
                          <Shield className="w-3 h-3" />
                          <span className={
                            passwordStrength === "strong" ? "text-green-600" :
                            passwordStrength === "medium" ? "text-yellow-600" :
                            "text-red-600"
                          }>
                            Força: {
                              passwordStrength === "strong" ? "Forte" :
                              passwordStrength === "medium" ? "Média" :
                              "Fraca"
                            }
                          </span>
                        </div>
                      )}
                      {errors.password && (
                        <p className="text-xs text-destructive">{errors.password}</p>
                      )}
                    </div>
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full bg-gold hover:bg-gold-dark text-primary-foreground"
                    >
                      <UserPlus className="w-4 h-4 mr-2" />
                      {isSubmitting ? "Cadastrando..." : "Cadastrar"}
                    </Button>
                    <p className="text-xs text-muted-foreground text-center">
                      Após o cadastro, solicite acesso de administrador aos noivos.
                    </p>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Auth;
