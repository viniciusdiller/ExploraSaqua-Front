"use client";

import React, { useState, useEffect } from "react";
import { Modal, Form, Button, Spin, message, ConfigProvider } from "antd";
import { adminUpdateLocal } from "@/lib/api"; 
import { Local } from "@/types/Interface-Local"; 
import GerarCertificadoButton from "../GerarCertificadoButton";
import "@/app/cadastro-locais/quill-styles.css";
import { LocalAlerts } from "./AdminLocalModalSections/LocalAlerts";
import { LocalMainInfo } from "./AdminLocalModalSections/LocalMainInfo";
import { LocalDetails } from "./AdminLocalModalSections/LocalDetails";
import { LocalImages } from "./AdminLocalModalSections/LocalImages";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const COLORS = {
  primary: "#017db9",
  secondary: "#a8cf45",
  tertiary: "#d04798",
};

const categorias = [
  "Comércio & Lojas",
  "Educação & Capacitação",
  "Emergências",
  "Esportes",
  "Eventos & Agenda",
  "Hospedagem",
  "Indústria",
  "Mei de Saquá",
  "Saúde & Bem-estar",
  "Serviços Públicos",
  "Supermercado & Feiras",
  "Turismo & Lazer",
  "Utilidades & Informações Gerais",
];

interface AdminLocalModalProps {
  local: Local | null; 
  visible: boolean;
  onClose: (shouldRefresh: boolean) => void;
  mode: "edit-and-approve" | "edit-only";
  onEditAndApprove: (values: any) => Promise<void>;
}

const AdminLocalModal: React.FC<AdminLocalModalProps> = ({
  local,
  visible,
  onClose,
  mode,
  onEditAndApprove,
}) => {
  const [isEditLoading, setIsEditLoading] = useState(false);
  const [editForm] = Form.useForm();
  
  const [outrasAlteracoes, setOutrasAlteracoes] = useState<string | null>(null);
  const [currentLogo, setCurrentLogo] = useState<string | null>(null);
  const [currentPortfolio, setCurrentPortfolio] = useState<any[]>([]); 
  const [portfolioToDelete, setPortfolioToDelete] = useState<string[]>([]);
  const [logoToDelete, setLogoToDelete] = useState<boolean>(false);
  
  // Mantive esses estados pois vi que você os adicionou recentemente!
  const [currentFotoFachada, setCurrentFotoFachada] = useState<string | null>(null);
  const [fotoFachadaToDelete, setFotoFachadaToDelete] = useState<boolean>(false);

  useEffect(() => {
    if (local) {
      let dataToEdit: any = { ...local };
      // Suporte a variações de chave que o backend pode retornar (locaisImg, localImg, imagens)
      const portfolioOriginal = (local as any).locaisImg || local.localImg || (local as any).imagens || [];

      setCurrentLogo(local.logoUrl || null);
      setCurrentPortfolio(portfolioOriginal); 
      setPortfolioToDelete([]);
      setLogoToDelete(false);

      if (local.status === "pendente_atualizacao" && local.dados_atualizacao) {
        dataToEdit = { ...local, ...local.dados_atualizacao };
        setOutrasAlteracoes(local.dados_atualizacao.outrasAlteracoes || null);

        if (local.dados_atualizacao.logo) {
          setCurrentLogo(local.dados_atualizacao.logo);
        }

        // Também considera possíveis chaves alternativas em dados_atualizacao (imagens, locaisImg)
        if (local.dados_atualizacao.imagens && local.dados_atualizacao.imagens.length > 0) {
          setCurrentPortfolio(local.dados_atualizacao.imagens);
        } else if (local.dados_atualizacao.locaisImg && local.dados_atualizacao.locaisImg.length > 0) {
          setCurrentPortfolio(local.dados_atualizacao.locaisImg);
        }
        delete dataToEdit.outrasAlteracoes;
      } else {
        setOutrasAlteracoes(null);
      }

      if (dataToEdit.hasOwnProperty("venceuPspe")) {
        dataToEdit.venceuPspe =
          String(dataToEdit.venceuPspe).toLowerCase() === "true" ||
          dataToEdit.venceuPspe === true;
      }

      editForm.setFieldsValue({
        ...dataToEdit,
        nome: dataToEdit.nomeLocal || dataToEdit.nome,
        responsavel: dataToEdit.nomeResponsavel || dataToEdit.responsavel,
        emailContato: dataToEdit.emailResponsavel || dataToEdit.emailContato,
      });
    } else {
      editForm.resetFields();
      setOutrasAlteracoes(null);
      setCurrentLogo(null);
      setCurrentPortfolio([]);
      setPortfolioToDelete([]);
      setLogoToDelete(false);
    }
  }, [local, visible, editForm]);

  const getFullImageUrl = (path: string): string => {
    if (!path) return "";
    if (path.startsWith("http") || path.startsWith("blob:")) return path;
    let normalized = path.replace(/\\/g, "/");
    if (normalized.startsWith("/")) normalized = normalized.substring(1);
    if (!normalized.startsWith("uploads/")) {
      const idx = normalized.indexOf("uploads/");
      normalized = idx !== -1 ? normalized.substring(idx) : `uploads/${normalized}`;
    }
    return `${API_URL}/${normalized}`;
  };

  const handleSubmit = async (values: any) => {
    if (!local) return;
    setIsEditLoading(true);
    const finalValues = { ...values };

    if (finalValues.nome) { finalValues.nomeLocal = finalValues.nome; delete finalValues.nome; }
    if (finalValues.responsavel) { finalValues.nomeResponsavel = finalValues.responsavel; delete finalValues.responsavel; }
    if (finalValues.emailContato) { finalValues.emailResponsavel = finalValues.emailContato; delete finalValues.emailContato; }

    if (logoToDelete) finalValues.logoUrl = "DELETE"; 
    if (portfolioToDelete.length > 0) finalValues.urlsParaExcluir = portfolioToDelete;

    try {
      const token = localStorage.getItem("admin_token");
      if (!token) {
        message.error("Autenticação expirada.");
        setIsEditLoading(false);
        return;
      }

      if (mode === "edit-and-approve") {
        await onEditAndApprove(finalValues);
        message.success("Local editado e aprovado!");
      } else {
        await adminUpdateLocal(local.localId, finalValues, token);
        message.success("Local atualizado com sucesso!");
      }

      onClose(true);
    } catch (error: any) {
      message.error(error.message || "Falha ao salvar.");
    } finally {
      setIsEditLoading(false);
    }
  };

  return (
    <ConfigProvider
      theme={{
        token: { colorPrimary: COLORS.primary, colorLink: COLORS.primary, borderRadius: 8 },
        components: { Button: { colorPrimary: COLORS.primary, algorithm: true, colorPrimaryHover: COLORS.tertiary } },
      }}
    >
      <Modal
        title={mode === "edit-and-approve" ? "Editar e Aprovar Local" : "Editar Local"}
        open={visible}
        onCancel={() => onClose(false)}
        width={900}
        destroyOnClose={true}
        footer={[
          <Button key="cancel" onClick={() => onClose(false)}>Cancelar</Button>,
          local && (
            <GerarCertificadoButton
              key="certificado"
              nomeProjeto={local.nomeLocal || (local as any).nome} 
              nomeResponsavel={local.nomeResponsavel || (local as any).responsavel || ""}
              ods={local.categoria} 
              dataCadastro={local.createdAt?.toString() || new Date().toISOString()}
            />
          ),
          <Button key="submit" type="primary" loading={isEditLoading} onClick={() => editForm.submit()}>
            {mode === "edit-and-approve" ? "Salvar e Aprovar" : "Salvar Edições"}
          </Button>,
        ]}
      >
        <Form form={editForm} layout="vertical" onFinish={handleSubmit} autoComplete="off">
          <Spin spinning={isEditLoading}>
            
            <LocalAlerts local={local} outrasAlteracoes={outrasAlteracoes} />
            
            <LocalMainInfo 
              categorias={categorias} 
              local={local} 
              getFullImageUrl={getFullImageUrl} 
              colors={COLORS} 
              form={editForm}
             />
            
            {/* Contato e Localização removidos deste modal (estão gerenciados em outro lugar) */}
            
            <LocalDetails colors={COLORS} />
            
            <LocalImages 
              colors={COLORS}
              currentLogo={currentLogo}
              logoToDelete={logoToDelete}
              currentPortfolio={currentPortfolio}
              portfolioToDelete={portfolioToDelete}
              getFullImageUrl={getFullImageUrl}
              setLogoToDelete={setLogoToDelete}
              setCurrentLogo={setCurrentLogo}
              setPortfolioToDelete={setPortfolioToDelete}
              setCurrentPortfolio={setCurrentPortfolio}
            />

          </Spin>
        </Form>
      </Modal>
    </ConfigProvider>
  );
};

export default AdminLocalModal;