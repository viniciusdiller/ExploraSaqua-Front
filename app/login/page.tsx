"use client";

import { useState } from "react";
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
import { loginUser } from "@/lib/api";
import { AnimatePresence } from "framer-motion";
import { Notification, NotificationType } from "@/components/ui/notification";
import { useAuth } from "@/context/AuthContext";
import { ArrowLeft, Loader2, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const [emailOrUsername, setEmailOrUsername] = useState("");
  const [password, setPassword] = useState("");
  const [notifications, setNotifications] = useState<NotificationType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();

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

      if (errorMessage.includes("Conta não ativada")) {
        addNotification(
          "Sua conta ainda não foi verificada. Por favor, confirme seu e-mail antes de entrar.",
          "error"
        );
      } else {
        addNotification(
          "Email/usuário ou senha inválidos. Tente novamente.",
          "error"
        );
      }

      console.error(err);
    } finally {
      setIsLoading(false);
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
                src="/LogoExplora.png"
                alt="Logo ExploraSaqua"
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
