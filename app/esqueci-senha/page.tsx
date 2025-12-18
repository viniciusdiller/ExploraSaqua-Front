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
import { requestPasswordReset } from "@/lib/api";
import { AnimatePresence } from "framer-motion";
import { Notification, NotificationType } from "@/components/ui/notification";
import { ArrowLeft, Loader2 } from "lucide-react";

export default function EsqueciSenhaPage() {
  const [email, setEmail] = useState("");
  const [notifications, setNotifications] = useState<NotificationType[]>([]);
  const [isLoading, setIsLoading] = useState(false);

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

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const userData = {
      email: email,
    };

    try {
      await requestPasswordReset(userData);
      addNotification(
        "Email enviado com sucesso! Verifique sua caixa de entrada.",
        "success"
      );
      setTimeout(() => {
        window.location.href = "/login";
      }, 3000);
    } catch (err) {
      addNotification(
        "Erro ao processar o pedido. Verifique os dados e tente novamente.",
        "error"
      );
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      {/* Container de Notificações */}
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
                src="/Logo_Explore.png"
                alt="Logo Explore Saqua"
                width={200}
                height={80}
                className="mx-auto w-auto h-16 object-contain"
              />
            </Link>
          </div>

          <div className="mb-4">
            <Link
              href="/login"
              className="flex items-center gap-2 text-gray-600 hover:text-[#017DB9] transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Voltar</span>
            </Link>
          </div>

          <Card className="rounded-2xl border border-[#017DB9]/30 bg-white shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl text-gray-800">
                Recupere sua senha
              </CardTitle>
              <CardDescription>
                Insira seu e-mail para receber o link de recuperação.
              </CardDescription>
            </CardHeader>
            <form onSubmit={handlePasswordReset}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="seuemail@exemplo.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                    className="w-full py-2 rounded-2xl border border-gray-200 bg-white shadow-sm placeholder:text-gray-400 focus:ring-2 focus:ring-[#017DB9]/20 focus:border-[#017DB9] transition-all duration-300"
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-[#017DB9] hover:bg-[#005f8d] text-white rounded-2xl flex justify-center mx-auto px-10 transition-colors duration-300 disabled:bg-gray-300 disabled:cursor-not-allowed border-none"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Carregando...
                    </>
                  ) : (
                    "Enviar email"
                  )}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}
