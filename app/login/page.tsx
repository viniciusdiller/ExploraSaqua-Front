"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import Image from "next/image";
import { loginUser, adminResendConfirmation } from "@/lib/api";
import { AnimatePresence } from "framer-motion";
import { Notification, NotificationType } from "@/components/ui/notification";
import { useAuth } from "@/context/AuthContext";
import { ArrowLeft, Loader2, Eye, EyeOff, RefreshCw } from "lucide-react";

export default function LoginPage() {
  const [emailOrUsername, setEmailOrUsername] = useState("");
  const [password, setPassword] = useState("");
  const [notifications, setNotifications] = useState<NotificationType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();

  // --- Estados para reenviar email de confirmação ---
  const [showResendOption, setShowResendOption] = useState(false);
  const [adminTokenInput, setAdminTokenInput] = useState("");
  const [resendUserId, setResendUserId] = useState("");
  const [isResending, setIsResending] = useState(false);

  // Prefill do token admin caso já exista um usuário salvo no localStorage (ex: admin logado previamente)
  useEffect(() => {
    try {
      const stored = localStorage.getItem("user");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.token) {
          setAdminTokenInput(parsed.token);
        }
      }
    } catch (e) {
      // ignore
    }
  }, []);

  const addNotification = (text: string, type: "success" | "error") => {
    const newNotif: NotificationType = {
      id: Math.random(),
      text,
      type,
    };
    setNotifications((prev) => [newNotif, ...prev]);
  };

  const removeNotif = (id: number) => {
    setNotifications((pv) => pv.filter((n) => n.id !== id));
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const loginData = {
      username: emailOrUsername,
      password: password,
    };

    try {
      const userData = await loginUser(loginData);
      addNotification("Login bem-sucedido! Redirecionando...", "success");
      login(userData);
      setTimeout(() => {
        window.location.href = "/";
      }, 2000);
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || err.message;

      // Detecção mais tolerante de mensagens que indicam conta não ativada / não verificada
      const errText = String(errorMessage || "");
      // Regex mais abrangente para diferentes variações de mensagens indicando conta não ativada/confirmada
      const accountNotActivated = /(conta|email).*(nao|não|ainda)?.*(ativ|verif|confirm)|não.*confirmad|nao.*confirmad|confirmad(o|a)|unconfirmed|not.*activated/i.test(
        errText
      );

      if (accountNotActivated) {
        addNotification(
          "Sua conta ainda não foi verificada. Por favor, verifique seu e-mail.",
          "error",
        );
        // Mostra opção de reenviar email de confirmação
        setShowResendOption(true);
        // tenta preencher automaticamente o campo de ID com o que o usuário digitou (se for numérico)
        if (emailOrUsername && /^[0-9]+$/.test(emailOrUsername)) {
          setResendUserId(emailOrUsername);
        }
      } else {
        addNotification(
          "Email/usuário ou senha inválidos. Tente novamente.",
          "error",
        );
      }

      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Função para chamar a API de reenvio de confirmação (tenta automático)
  const handleResendConfirmation = async () => {
    // identifica o usuário a partir do campo Email/Username do formulário ou do campo explícito (se preenchido)
    const identifier = resendUserId || emailOrUsername;

    if (!identifier) {
      addNotification("Não foi possível identificar o usuário. Tente informar email/usuário no campo acima.", "error");
      return;
    }

    // tenta obter token admin primeiro do localStorage (usuário admin já logado), senão do campo manual
    let token = adminTokenInput;
    try {
      const stored = localStorage.getItem("user");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.token) token = parsed.token;
      }
    } catch (e) {
      // ignore
    }

    if (!token) {
      addNotification("Token de admin não encontrado. Faça login como admin ou cole o token manualmente.", "error");
      return;
    }

    setIsResending(true);
    try {
      // passa o identificador como string (backend aceitará id ou username se suportado)
      await adminResendConfirmation(identifier, token);
      addNotification("Email de confirmação reenviado com sucesso.", "success");
      setShowResendOption(false);
      setResendUserId("");
    } catch (error: any) {
      addNotification(error?.message || "Falha ao reenviar confirmação.", "error");
      console.error(error);
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div>
      {/* Notificações Flutuantes */}
      <div className="flex flex-col gap-1 w-72 fixed top-4 right-4 z-50 pointer-events-none">
        <AnimatePresence>
          {notifications.map((n) => (
            <Notification removeNotif={removeNotif} {...n} key={n.id} />
          ))}
        </AnimatePresence>
      </div>

      <div className="flex items-center justify-center min-h-screen bg-gray-50 px-4">
        <div className="w-full max-w-md">
          {/* LOGO EXPLORA SAQUA */}
          <div className="text-center mb-6">
            <Link href="/" passHref>
              <Image
                src="/logos/Logo_Explore.png"
                alt="Logo Explore Saqua"
                width={200}
                height={80}
                className="mx-auto w-auto h-16 object-contain"
              />
            </Link>
          </div>

          <div className="mb-4">
            <Link
              href="/"
              className="flex items-center gap-2 text-gray-600 hover:text-[#017DB9] transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Voltar</span>
            </Link>
          </div>

          <Card
            className="rounded-2xl border border-[#017DB9]/30 bg-white shadow-lg
                      focus:outline-none focus:ring-2 focus:border-transparent
                      transition-all duration-300 placeholder-gray-400 text-sm
                      hover:shadow-xl"
          >
            <CardHeader className="text-center">
              <CardTitle className="text-2xl text-gray-800">
                Efetue o Login
              </CardTitle>
              <CardDescription>
                Entre com suas credenciais para avaliar ou cadastrar um novo{" "}
                <strong>local</strong> na plataforma.
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleLogin}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="emailOrUsername">
                    Email / Nome de usuário
                  </Label>
                  <Input
                    id="emailOrUsername"
                    type="text"
                    placeholder="Insira seu email ou nome de usuário"
                    required
                    value={emailOrUsername}
                    onChange={(e) => setEmailOrUsername(e.target.value)}
                    disabled={isLoading}
                    className="w-full py-2
                      rounded-2xl border border-gray-200 bg-white shadow-sm
                      focus:ring-2 focus:ring-[#017DB9]/20 focus:border-[#017DB9] transition-all duration-300 placeholder:text-gray-400
                      "
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Senha</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Sua senha"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={isLoading}
                      className="w-full py-2 pr-10
                      rounded-2xl border border-gray-200 bg-white shadow-sm
                      focus:ring-2 focus:ring-[#017DB9]/20 focus:border-[#017DB9] transition-all duration-300 placeholder:text-gray-400
                      "
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                      aria-label={
                        showPassword ? "Esconder senha" : "Mostrar senha"
                      }
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col items-center space-y-4">
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="bg-[#017DB9] hover:bg-[#005f8d] text-white rounded-2xl flex justify-center mx-auto px-10 w-full transition-colors duration-300 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Aguarde...
                    </>
                  ) : (
                    "Entrar"
                  )}
                </Button>
                <div className="text-sm">
                  <Link href="/cadastro" className="text-gray-600">
                    Novo por aqui?{" "}
                    <strong className="underline hover:text-[#017DB9] transition-colors">
                      Cadastre-se
                    </strong>
                  </Link>
                </div>
              </CardFooter>
            </form>
          </Card>

          {/* Se a conta não foi ativada, mostra botão único para reenviar o e-mail de confirmação */}
          {showResendOption && (
            <div className="mt-4 p-4 bg-white border rounded-lg shadow-sm">
              <p className="text-sm text-gray-700 mb-3">
                Sua conta ainda não foi verificada. Clique em "Reenviar confirmação" para receber novamente o e‑mail de ativação.
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleResendConfirmation}
                  disabled={isResending}
                  aria-label="Reenviar e-mail de confirmação"
                  className={`ml-auto flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3 rounded-full text-white font-medium shadow-lg transform transition-all duration-200 ${isResending ? "opacity-80 cursor-wait" : "hover:scale-105 hover:shadow-2xl"} bg-gradient-to-r from-[#0ea5d8] to-[#017DB9] focus:outline-none focus:ring-4 focus:ring-[#017DB9]/30 disabled:opacity-50`}
                >
                  {isResending ? (
                    <>
                      <Loader2 className="animate-spin w-4 h-4" />
                      <span>Enviando...</span>
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4" />
                      <span>Reenviar confirmação</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          <div className="mt-4 text-center text-sm">
            <Link
              href="/esqueci-senha"
              className="underline text-gray-600 hover:text-[#017DB9] transition-colors"
            >
              Esqueceu sua senha?
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
