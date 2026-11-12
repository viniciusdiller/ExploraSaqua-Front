"use client";

import React, { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Spin } from "antd";
import Cookies from "js-cookie";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const localToken = localStorage.getItem("admin_token");
    const cookieToken = Cookies.get("admin_token") || Cookies.get("token");
    const token = localToken || cookieToken;

    const isLoginPage = pathname === "/admin/login";

    // Mantem compatibilidade entre middleware (cookie) e telas client-side (localStorage).
    if (!localToken && token) {
      localStorage.setItem("admin_token", token);
    }

    if (!token && !isLoginPage) {
      router.push("/admin/login");
    } else if (token && isLoginPage) {
      router.push("/admin/dashboard");
    } else {
      setIsAuthorized(true);
    }
  }, [pathname, router]);

  if (!isAuthorized && pathname !== "/admin/login") {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spin size="large" tip="Verificando permissões..." />
      </div>
    );
  }

  // Se passou nas validações, renderiza a página filha (cursos, dashboard, etc)
  return <>{children}</>;
}
