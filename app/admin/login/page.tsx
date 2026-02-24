"use client";

import React, { useState } from "react";
import { Form, Input, Button, message, ConfigProvider } from "antd";
import { LockOutlined, UserOutlined } from "@ant-design/icons";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const AdminLoginPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (values: any) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/admin/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      const data = await response.json();

      if (response.ok && data.token) {
        // Salvamos em Cookie para o Middleware
        Cookies.set("token", data.token, { expires: 1 });
        // Mantemos no localStorage para requisições no client-side
        localStorage.setItem("admin_token", data.token);

        message.success("Acesso autorizado!");
        window.location.href = "/admin/dashboard"; 
      } else {
        message.error(data.message || "Credenciais inválidas. Tente novamente.");
      }
    } catch (error) {
      console.error("Erro de conexão:", error);
      message.error("Não foi possível conectar ao servidor. Verifique sua rede.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: "#017DB9", // Azul ExploreSaquá
          borderRadius: 12,        // Bordas mais arredondadas (moderno)
          controlHeight: 52,       // Inputs bem mais altos e confortáveis
          colorBorder: "#e2e8f0",  // Cinza super claro para as bordas
          fontFamily: "inherit",
        },
        components: {
          Input: {
            activeShadow: "0 0 0 3px rgba(1, 125, 185, 0.1)", // Sombra de foco suave
            errorActiveShadow: "0 0 0 3px rgba(255, 77, 79, 0.1)",
          },
          Button: {
            fontWeight: 600,
          },
        },
      }}
    >
      {/* Fundo super limpo e neutro */}
      <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] p-4 sm:p-8">
        
        {/* Card minimalista com sombra difusa e muito respiro (padding) */}
        <div className="w-full max-w-[420px] bg-white rounded-[24px] shadow-[0_8px_40px_rgba(0,0,0,0.04)] border border-gray-100 p-8 sm:p-10">
          
          <div className="mb-8 text-left">
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-2">
              Acesso Restrito
            </h1>
            <p className="text-gray-500 text-sm font-medium leading-relaxed">
              Insira suas credenciais para acessar o painel administrativo do ExploreSaquá.
            </p>
          </div>

          <Form
            name="admin_login"
            initialValues={{ remember: true }}
            onFinish={handleLogin}
            autoComplete="off"
            layout="vertical"
            requiredMark={false} // Remove os asteriscos vermelhos para ficar mais limpo
          >
            <Form.Item
              name="username"
              label={<span className="text-gray-700 font-medium">Usuário</span>}
              rules={[{ required: true, message: "Insira seu usuário." }]}
            >
              <Input 
                prefix={<UserOutlined className="text-gray-400 mr-2" />} 
                placeholder="Ex: admin" 
              />
            </Form.Item>

            <Form.Item
              name="password"
              label={<span className="text-gray-700 font-medium">Senha</span>}
              rules={[{ required: true, message: "Insira sua senha." }]}
              className="mb-8"
            >
              <Input.Password 
                prefix={<LockOutlined className="text-gray-400 mr-2" />} 
                placeholder="••••••••" 
              />
            </Form.Item>

            <Form.Item className="mb-0">
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                block
                className="shadow-sm hover:shadow-md transition-all duration-300"
              >
                Entrar no Sistema
              </Button>
            </Form.Item>
          </Form>

        </div>
      </div>
    </ConfigProvider>
  );
};

export default AdminLoginPage;