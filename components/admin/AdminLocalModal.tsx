"use client";

import React, { useState, useEffect } from "react";
import { Modal, Form, Button, Spin, message, ConfigProvider } from "antd";
import { adminUpdateLocal } from "@/lib/api"; 
import { Local } from "@/types/Interface-Local"; 
import GerarCertificadoButton from "../GerarCertificadoButton";
import "@/app/cadastro-locais/quill-styles.css";
import { LocalAlerts } from "./AdminLocalModalSections/localAlerts";
import { LocalMainInfo } from "./AdminLocalModalSections/LocalMainInfo";
import { LocalContactLocation } from "./AdminLocalModalSections/LocalContactLocation";
import { LocalDetails } from "./AdminLocalModalSections/LocalDetails";
import { LocalImages } from "./AdminLocalModalSections/LocalImages";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const COLORS = {
  primary: "#017db9",
  secondary: "#a8cf45",
  tertiary: "#d04798",
};

const categorias = [
  "Compras", "Emergências", "Escolas", "Espaços Culturais", "Eventos Locais",
  "Feiras e Produtores Rurais", "Hospedagens", "Lazer e Esporte", "Mulheres e Crianças",
  "Pontos Turísticos", "Praias e Lagoas", "Restaurantes e Lanchonetes", "Supermercados",
  "Telefones Úteis", "Transporte Público", "Trilhas",
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
      const portfolioOriginal = (local as any).produtosImg || local.localImg || (local as any).imagens || [];

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

        if (local.dados_atualizacao.imagens && local.dados_atualizacao.imagens.length > 0) {
          setCurrentPortfolio(local.dados_atualizacao.imagens);
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

  const handleAddressBlur = async () => {
    const endereco = editForm.getFieldValue("endereco");
    if (!endereco) return;

    try {
      message.loading({ content: "Buscando coordenadas pelo endereço...", key: "geocode" });
      const query = `${endereco}, Saquarema, RJ, Brasil`;
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`);
      const data = await response.json();

      if (data && data.length > 0) {
        editForm.setFieldsValue({ latitude: parseFloat(data[0].lat), longitude: parseFloat(data[0].lon) });
        message.success({ content: "Coordenadas preenchidas com sucesso!", key: "geocode" });
      } else {
        message.warning({ content: "Não foi possível encontrar as coordenadas exatas deste endereço.", key: "geocode" });
      }
    } catch (error) {
      message.error({ content: "Erro ao buscar coordenadas.", key: "geocode" });
    }
  };

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
            />
            
            <LocalContactLocation 
              colors={COLORS} 
              handleAddressBlur={handleAddressBlur} 
            />
            
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