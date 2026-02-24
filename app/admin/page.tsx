"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Spin } from "antd"; // Assumindo que você usa Ant Design como no restante do projeto

export default function AdminPage() {
  const router = useRouter();

  useEffect(() => {
    // Quando o usuário acessa /admin, mandamos ele direto para o login
    router.push("/admin/login");
  }, [router]);

  return (
    <div className="flex h-screen w-full items-center justify-center bg-gray-100">
      <div className="text-center">
        <Spin size="large" />
        <p className="mt-4 text-gray-600 font-medium">Redirecionando para o login...</p>
      </div>
    </div>
  );
}