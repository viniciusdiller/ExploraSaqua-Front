"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Button,
  Select,
  Spin,
  Result,
  Form,
  ConfigProvider,
  message,
} from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Cadastro from "@/components/cadastro-locais/Cadastro";
import Atualizacao from "@/components/cadastro-locais/Atualizacao";
import Exclusao from "@/components/cadastro-locais/Exclusao";
import "@/app/cadastro-locais/quill-styles.css";

// --- DEFINIÇÃO DE CORES (Usadas no Layout Principal) ---
const COLORS = {
  primary: "#017db9", // Azul
  secondary: "#a8cf45", // Verde
  tertiary: "#d04798", // Rosa
};

const { Option } = Select;

type FlowStep = "initial" | "register" | "update" | "delete" | "submitted";

const CadastroProjetoPage: React.FC = () => {
  const [flowStep, setFlowStep] = useState<FlowStep>("initial");
  const [submittedMessage, setSubmittedMessage] = useState({
    title: "",
    subTitle: "",
  });

  const { user, isLoading } = useAuth();
  const router = useRouter();
  const toastShownRef = useRef(false);

  // Verificação de Autenticação
  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      if (!toastShownRef.current) {
        toast.error("Você precisa estar logado para gerenciar projetos.");
        toastShownRef.current = true;
      }
      router.push("/login");
    }
  }, [user, isLoading, router]);

  if (isLoading || !user) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="flex items-center space-x-3">
          <p className="text-xl font-medium" style={{ color: COLORS.primary }}>
            Verificando autenticação
          </p>
          <div className="flex space-x-1.5">
            <span
              className="h-2.5 w-2.5 rounded-full animate-bounce [animation-delay:-0.3s]"
              style={{ backgroundColor: COLORS.secondary }}
            ></span>
            <span
              className="h-2.5 w-2.5 rounded-full animate-bounce [animation-delay:-0.15s]"
              style={{ backgroundColor: COLORS.secondary }}
            ></span>
            <span
              className="h-2.5 w-2.5 rounded-full animate-bounce"
              style={{ backgroundColor: COLORS.secondary }}
            ></span>
          </div>
        </div>
      </div>
    );
  }

  const resetAll = () => {
    setFlowStep("initial");
    setSubmittedMessage({ title: "", subTitle: "" });
  };

  const handleSuccess = (title: string, subTitle: string) => {
    setSubmittedMessage({ title, subTitle });
    setFlowStep("submitted");
  };

  // Renderização da Escolha Inicial
  const renderInitialChoice = () => (
    <>
      <h1
        className="text-4xl font-extrabold mb-6 inline-block pb-2"
        style={{
          borderBottom: `4px solid ${COLORS.tertiary}`,
          color: COLORS.primary,
        }}
      >
        PORTAL DE PROJETOS
      </h1>
      <p className="text-gray-700 leading-relaxed text-lg mt-4 mb-8">
        Bem-vindo ao <strong>Portal de Projetos</strong>! Este é o espaço
        oficial para gerenciar iniciativas que transformam a nossa cidade. Aqui,
        você pode cadastrar, atualizar ou remover projetos de forma centralizada
        e transparente.
      </p>
      <section className="flex flex-col border-t pt-6">
        <Form.Item
          layout="vertical"
          label={
            <span className="text-lg font-semibold" style={{ color: "#333" }}>
              O que você deseja fazer hoje?
            </span>
          }
        >
          <Select
            placeholder="Selecione uma ação"
            onChange={(value) => {
              setFlowStep(value as FlowStep);
            }}
            size="large"
            style={{ width: "100%" }}
          >
            <Option value="register">Cadastrar novo projeto</Option>
            <Option value="update">Atualizar projeto existente</Option>
            <Option value="delete">Excluir projeto da plataforma</Option>
          </Select>
        </Form.Item>
      </section>
    </>
  );

  // Renderização da Tela de Sucesso
  const renderSuccess = () => (
    <Result
      status="success"
      title={submittedMessage.title}
      subTitle={submittedMessage.subTitle}
      extra={[
        <Button
          type="primary"
          key="console"
          onClick={resetAll}
          className="mb-6"
        >
          Voltar ao Início
        </Button>,
      ]}
    />
  );

  // Gerenciador de Conteúdo
  const renderContent = () => {
    switch (flowStep) {
      case "register":
        return <Cadastro onSuccess={handleSuccess} />;
      case "update":
        return <Atualizacao onSuccess={handleSuccess} />;
      case "delete":
        return <Exclusao onSuccess={handleSuccess} />;
      case "submitted":
        return renderSuccess();
      default:
        return renderInitialChoice();
    }
  };

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: COLORS.primary,
          colorLink: COLORS.primary,
          colorSuccess: COLORS.secondary,
          borderRadius: 8,
        },
        components: {
          Button: {
            colorPrimary: COLORS.primary,
            algorithm: true,
            colorPrimaryHover: COLORS.tertiary,
          },
          Input: {
            activeBorderColor: COLORS.secondary,
            hoverBorderColor: COLORS.primary,
          },
          Select: {
            colorPrimary: COLORS.secondary,
          },
        },
      }}
    >
      <div
        className="min-h-screen py-20 px-6 sm:px-12"
        style={{
          background: `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.tertiary} 100%)`,
        }}
      >
        <div className="max-w-5xl mx-auto bg-white rounded-3xl shadow-lg p-10 sm:p-16">
          {flowStep !== "initial" && flowStep !== "submitted" && (
            <Button
              type="text"
              icon={<ArrowLeftOutlined />}
              onClick={resetAll}
              className="mb-6"
            >
              Voltar ao início
            </Button>
          )}
          {renderContent()}
        </div>
      </div>
    </ConfigProvider>
  );
};

export default CadastroProjetoPage;
