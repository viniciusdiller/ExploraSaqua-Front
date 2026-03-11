"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Button,
  Select,
  Result,
  Form,
  ConfigProvider,
} from "antd";
import { ArrowLeftOutlined, MoreOutlined, EnvironmentOutlined } from "@ant-design/icons";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Cadastro from "@/components/cadastro-locais/Cadastro";
import Atualizacao from "@/components/cadastro-locais/Atualizacao";
import Exclusao from "@/components/cadastro-locais/Exclusao";
import CadastroIndicacao from "@/components/cadastro-locais/CadastroIndicacao";
import "@/app/cadastro-locais/quill-styles.css";

// --- DEFINIÇÃO DE CORES ORIGINAIS PRESERVADAS ---
const COLORS = {
  primary: "#017db9", 
  secondary: "#007a73", 
  tertiary: "#a8cf45", // Verde de destaque para botões/hover
};

const { Option } = Select;

// Atualizado para incluir as sub-etapas de cadastro
type FlowStep = "initial" | "register_choice" | "register_owner" | "register_indication" | "update" | "delete" | "submitted";

const CadastroLocaisPage: React.FC = () => {
  const [flowStep, setFlowStep] = useState<FlowStep>("initial");
  const [submittedMessage, setSubmittedMessage] = useState({
    title: "",
    subTitle: "",
  });

  const { user, isLoading } = useAuth();
  const router = useRouter();
  const toastShownRef = useRef(false);

  // Verificação de Autenticação Original
  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      if (!toastShownRef.current) {
        toast.error("Você precisa estar logado para gerenciar locais.");
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
            <span className="h-2.5 w-2.5 rounded-full animate-bounce [animation-delay:-0.3s]" style={{ backgroundColor: COLORS.secondary }}></span>
            <span className="h-2.5 w-2.5 rounded-full animate-bounce [animation-delay:-0.15s]" style={{ backgroundColor: COLORS.secondary }}></span>
            <span className="h-2.5 w-2.5 rounded-full animate-bounce" style={{ backgroundColor: COLORS.secondary }}></span>
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

  // --- FUNÇÃO: Tela de Escolha entre Dono e Indicador ---
  const renderRegisterChoice = () => (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h2 className="text-3xl font-bold mb-8 text-center text-gray-800">
        Como você deseja cadastrar este local?
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-4">
        {/* Card: Sou Dono */}
        <div 
          onClick={() => setFlowStep("register_owner")}
          className="group p-8 border-2 border-dashed border-gray-200 rounded-[2rem] hover:border-solid hover:border-[#a8cf45] hover:bg-green-50/50 cursor-pointer transition-all duration-300 text-center"
        >
          <div className="text-5xl mb-4 group-hover:scale-110 transition-transform duration-300">
            <MoreOutlined style={{ color: COLORS.secondary }} />
          </div>
          <h3 className="text-xl font-bold mb-2 text-gray-800">Sou Dono do Estabelecimento</h3>
          <p className="text-gray-500 text-sm">
            Escolha esta opção se você é o proprietário. Você poderá enviar documentos comprobatórios e terá acesso futuro para atualizar ou excluir o local.
          </p>
        </div>

        {/* Card: Quero Indicar */}
        <div 
          onClick={() => setFlowStep("register_indication")}
          className="group p-8 border-2 border-dashed border-gray-200 rounded-[2rem] hover:border-solid hover:border-[#017db9] hover:bg-blue-50/50 cursor-pointer transition-all duration-300 text-center"
        >
          <div className="text-5xl mb-4 group-hover:scale-110 transition-transform duration-300">
            <EnvironmentOutlined style={{ color: COLORS.primary }} />
          </div>
          <h3 className="text-xl font-bold mb-2 text-gray-800">Quero indicar um Local</h3>
          <p className="text-gray-500 text-sm">
            Indique um lugar legal! Note que como indicador, você apenas sugere o local e não poderá editá-lo ou excluí-lo posteriormente.
          </p>
        </div>
      </div>
    </div>
  );

  const renderInitialChoice = () => (
    <>
      <h1 className="text-4xl font-extrabold mb-6 inline-block pb-2" style={{ borderBottom: `4px solid ${COLORS.tertiary}`, color: COLORS.primary }}>
        PORTAL DE LOCAIS
      </h1>
      <p className="text-gray-700 leading-relaxed text-lg mt-4 mb-8">
        Bem-vindo ao <strong>Portal de Locais</strong>! Este é o espaço oficial para gerenciar locais de interesse da nossa cidade.
      </p>
      <section className="flex flex-col border-t pt-6">
        <Form.Item layout="vertical" label={<span className="text-lg font-semibold" style={{ color: "#333" }}>O que você deseja fazer hoje?</span>}>
          <Select
            placeholder="Selecione uma ação"
            onChange={(value) => setFlowStep(value as FlowStep)}
            size="large"
            style={{ width: "100%" }}
          >
            <Option value="register_choice">Cadastrar novo local</Option>
            <Option value="update">Atualizar meu local (Proprietários)</Option>
            <Option value="delete">Excluir meu local (Proprietários)</Option>
          </Select>
        </Form.Item>
      </section>
    </>
  );

  const renderContent = () => {
    switch (flowStep) {
      case "register_choice":
        return renderRegisterChoice();
      case "register_owner":
        return <Cadastro onSuccess={handleSuccess} />; 
      case "register_indication":
        return <CadastroIndicacao mode="page" onSuccess={handleSuccess} />; 
      case "update":
        return <Atualizacao onSuccess={handleSuccess} />;
      case "delete":
        return <Exclusao onSuccess={handleSuccess} />;
      case "submitted":
        return (
          <Result
            status="success"
            title={submittedMessage.title}
            subTitle={submittedMessage.subTitle}
            extra={[
              <Button type="primary" key="console" onClick={resetAll} className="mb-6 rounded-xl">
                Voltar ao Início
              </Button>,
            ]}
          />
        );
      default:
        return renderInitialChoice();
    }
  };

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: COLORS.primary,
          colorSuccess: COLORS.secondary,
          borderRadius: 12,
        },
        components: {
          Button: {
            colorPrimary: COLORS.primary,
            colorPrimaryHover: COLORS.tertiary,
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
          background: `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.secondary} 100%)`,
        }}
      >
        <div className="max-w-5xl mx-auto bg-white rounded-[2.5rem] shadow-2xl p-10 sm:p-16">
          {flowStep !== "initial" && flowStep !== "submitted" && (
            <Button
              type="text"
              icon={<ArrowLeftOutlined />}
              onClick={resetAll}
              className="mb-6 hover:text-[#a8cf45] transition-colors"
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
 
 export default CadastroLocaisPage;