// app/admin/components/AdminLocalModal.tsx
"use client";

import React, { useState, useEffect } from "react";
import {
  Modal,
  Form,
  Input,
  Select,
  Row,
  Col,
  Button,
  Spin,
  Alert,
  message,
  Typography,
  Image as AntdImage,
  Tag,
  Popconfirm,
  ConfigProvider,
  Rate,
} from "antd";
import { CloseOutlined, QuestionCircleOutlined } from "@ant-design/icons";
import { adminUpdateLocal } from "@/lib/api"; // Atualizado para a nova API
import { Local, Imagens } from "@/types/Interface-Local"; // Atualizado para tipo Local
import dynamic from "next/dynamic";
import "react-quill/dist/quill.snow.css";
import "@/app/cadastro-locais/quill-styles.css";
import GerarCertificadoButton from "./GerarCertificadoButton";

const ReactQuill = dynamic(() => import("react-quill"), {
  ssr: false,
  loading: () => (
    <Spin
      size="large"
      style={{ display: "block", margin: "20px auto", minHeight: "150px" }}
    />
  ),
});

const quillModules = {
  toolbar: [
    [{ header: "1" }, { header: "2" }],
    [{ list: "ordered" }, { list: "bullet" }],
    ["bold", "italic", "underline", "strike"],
    [{ color: [] }, { background: [] }],
    [{ align: [] }],
    ["link"],
    ["clean"],
  ],
};

const { Title } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// Cores da Marca
const COLORS = {
  primary: "#017db9",
  secondary: "#a8cf45",
  tertiary: "#d04798",
};

// Nova lista de categorias organizada
const categorias = [
  "Compras",
  "Emergências",
  "Escolas",
  "Espaços Culturais",
  "Eventos Locais",
  "Feiras e Produtores Rurais",
  "Hospedagens",
  "Lazer e Esporte",
  "Mulheres e Crianças",
  "Pontos Turísticos",
  "Praias e Lagoas",
  "Restaurantes e Lanchonetes",
  "Supermercados",
  "Telefones Úteis",
  "Transporte Público",
  "Trilhas",
];

interface AdminLocalModalProps {
  local: Local | null; // Renomeado de projeto para local
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
  const [currentPortfolio, setCurrentPortfolio] = useState<Imagens[]>([]);
  const [portfolioToDelete, setPortfolioToDelete] = useState<string[]>([]);
  const [logoToDelete, setLogoToDelete] = useState<boolean>(false);

  useEffect(() => {
    if (local) {
      // Clona o objeto para edição
      let dataToEdit: any = { ...local };

      // Ajuste de campos de imagem
      setCurrentLogo(local.logoUrl || null);
      setCurrentPortfolio(local.localImg || []); // Assumindo que na interface Local agora é localImg
      setPortfolioToDelete([]);
      setLogoToDelete(false);

      // Lógica para mesclar dados pendentes de atualização
      if (local.status === "pendente_atualizacao" && local.dados_atualizacao) {
        dataToEdit = { ...local, ...local.dados_atualizacao };
        setOutrasAlteracoes(local.dados_atualizacao.outrasAlteracoes || null);

        if (local.dados_atualizacao.logo) {
          setCurrentLogo(local.dados_atualizacao.logo);
        }

        if (local.dados_atualizacao.imagens) {
          const novasImagens = local.dados_atualizacao.imagens.map(
            (url: string, index: number) => ({
              id: `new-${index}`,
              url: url,
            })
          );
          setCurrentPortfolio(novasImagens);
        }
        delete dataToEdit.outrasAlteracoes;
      } else {
        setOutrasAlteracoes(null);
      }

      // Converte booleans string para boolean real se necessário
      if (dataToEdit.hasOwnProperty("venceuPspe")) {
        dataToEdit.venceuPspe =
          String(dataToEdit.venceuPspe).toLowerCase() === "true" ||
          dataToEdit.venceuPspe === true;
      }

      editForm.setFieldsValue(dataToEdit);
    } else {
      editForm.resetFields();
      setOutrasAlteracoes(null);
      setCurrentLogo(null);
      setCurrentPortfolio([]);
      setPortfolioToDelete([]);
      setLogoToDelete(false);
    }
  }, [local, visible, editForm]);

  const handleSubmit = async (values: any) => {
    if (!local) return;

    setIsEditLoading(true);

    const finalValues = { ...values };

    if (logoToDelete) {
      finalValues.logoUrl = null;
    }

    if (portfolioToDelete.length > 0) {
      finalValues.urlsParaExcluir = portfolioToDelete;
    }

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
        // Chamada à nova função da API
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

  const getFullImageUrl = (path: string): string => {
    if (!path) return "";
    if (path.startsWith("http") || path.startsWith("blob:")) {
      return path;
    }
    const normalizedPath = path.replace(/\\/g, "/");
    const cleanPath = normalizedPath.startsWith("/")
      ? normalizedPath.substring(1)
      : normalizedPath;
    return `${API_URL}/${cleanPath}`;
  };

  const handleViewOficio = () => {
    if (local?.oficioUrl) {
      window.open(getFullImageUrl(local.oficioUrl), "_blank");
    }
  };

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: COLORS.primary,
          colorLink: COLORS.primary,
          borderRadius: 8,
        },
        components: {
          Button: {
            colorPrimary: COLORS.primary,
            algorithm: true,
            colorPrimaryHover: COLORS.tertiary,
          },
        },
      }}
    >
      <Modal
        title={
          mode === "edit-and-approve"
            ? "Editar e Aprovar Local"
            : "Editar Local"
        }
        open={visible}
        onCancel={() => onClose(false)}
        width={900}
        destroyOnClose={true}
        footer={[
          <Button key="cancel" onClick={() => onClose(false)}>
            Cancelar
          </Button>,

          local && (
            <GerarCertificadoButton
              key="certificado"
              nomeProjeto={local.nome} // Assumindo 'nome' para local
              nomeResponsavel={local.nomeResponsavel || ""}
              ods={local.categoria} // Usando categoria no lugar de ODS no certificado antigo
              dataCadastro={
                local.createdAt?.toString() || new Date().toISOString()
              }
            />
          ),
          <Button
            key="submit"
            type="primary"
            loading={isEditLoading}
            onClick={() => editForm.submit()}
          >
            {mode === "edit-and-approve"
              ? "Salvar e Aprovar"
              : "Salvar Edições"}
          </Button>,
        ]}
      >
        <Form
          form={editForm}
          layout="vertical"
          onFinish={handleSubmit}
          autoComplete="off"
        >
          <Spin spinning={isEditLoading}>
            {outrasAlteracoes && (
              <Alert
                message="Solicitação de 'Outras Alterações' do Usuário"
                description={
                  <Typography.Paragraph pre-wrap>
                    {outrasAlteracoes}
                  </Typography.Paragraph>
                }
                type="info"
                showIcon
                className="mb-4"
              />
            )}

            <Title level={5} className="mt-4" style={{ color: COLORS.primary }}>
              Informações Principais
            </Title>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="nome"
                  label="Nome do Local/Projeto"
                  rules={[{ required: true }]}
                >
                  <Input />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="categoria"
                  label="Categoria"
                  rules={[{ required: true }]}
                >
                  <Select placeholder="Selecione a categoria">
                    {categorias.map((cat) => (
                      <Option key={cat} value={cat}>
                        {cat}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="prefeitura"
                  label="Prefeitura / Entidade"
                  rules={[{ required: true }]}
                >
                  <Input />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="secretaria"
                  label="Secretaria / Departamento"
                  rules={[{ required: true }]}
                >
                  <Input />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="responsavel"
                  label="Responsável"
                  rules={[{ required: true }]}
                >
                  <Input />
                </Form.Item>
              </Col>

              <Col span={12}>
                <Form.Item
                  name="oficio"
                  label="Ofício de Requisição"
                  rules={[{ required: false }]}
                >
                  {local?.oficioUrl ? (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                      }}
                    >
                      <Button
                        onClick={handleViewOficio}
                        style={{
                          borderColor: COLORS.secondary,
                          color: COLORS.secondary,
                        }}
                      >
                        Visualizar Ofício Anexado
                      </Button>
                    </div>
                  ) : (
                    <span style={{ color: "red" }}>Nenhum ofício anexado.</span>
                  )}
                </Form.Item>
              </Col>
            </Row>

            <Title level={5} className="mt-4" style={{ color: COLORS.primary }}>
              Contato e Links
            </Title>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="emailContato"
                  label="Email de Contato"
                  rules={[{ required: true, type: "email" }]}
                >
                  <Input />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="linkLocal" // Ajustado de linkProjeto para linkLocal (assumindo mudança)
                  label="Link Oficial"
                  rules={[{ required: false, type: "url" }]}
                >
                  <Input placeholder="http://..." />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="website"
                  label="Site da Prefeitura/Entidade"
                  rules={[{ type: "url" }]}
                >
                  <Input placeholder="http://..." />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="instagram"
                  label="Instagram"
                  rules={[{ type: "url" }]}
                >
                  <Input placeholder="http://instagram.com/..." />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="endereco" label="Endereço">
                  <Input />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="bairro" label="Bairro">
                  <Input />
                </Form.Item>
              </Col>
            </Row>

            <Title level={5} className="mt-4" style={{ color: COLORS.primary }}>
              Detalhes
            </Title>

            <Form.Item
              name="descricaoDiferencial"
              label="Briefing (Resumo)"
              rules={[{ required: true }]}
            >
              <TextArea rows={2} maxLength={150} showCount />
            </Form.Item>

            <Form.Item
              name="descricao"
              label="Descrição Completa"
              rules={[{ required: true }]}
              className="quill-editor-container"
            >
              <ReactQuill
                theme="snow"
                modules={quillModules}
                placeholder="Descreva o local em detalhes..."
                style={{ minHeight: "10px" }}
              />
            </Form.Item>

            <Form.Item
              name="venceuPspe"
              label="Venceu o Prêmio PSPE?"
              rules={[{ required: true, message: "Selecione uma opção" }]}
            >
              <Select placeholder="Selecione uma opção">
                <Option value={true}>Sim</Option>
                <Option value={false}>Não</Option>
              </Select>
            </Form.Item>

            <Form.Item
              name="escala"
              label="Nota de Impacto (0-10)"
              help="Nota de impacto fornecida pelo usuário no cadastro."
            >
              <Rate count={10} disabled />
            </Form.Item>

            {/* --- SEÇÃO DE GERENCIAMENTO DE IMAGENS --- */}
            <Title level={5} className="mt-4" style={{ color: COLORS.primary }}>
              Gerenciamento de Imagens
            </Title>

            <Row gutter={16}>
              <Col span={12}>
                <Title level={5} style={{ fontSize: "16px" }}>
                  Logo
                </Title>
                {currentLogo ? (
                  <div style={{ position: "relative", width: "fit-content" }}>
                    <AntdImage
                      src={getFullImageUrl(currentLogo)}
                      alt="Logo"
                      style={{
                        width: 150,
                        height: 150,
                        objectFit: "cover",
                        border: "1px solid #d9d9d9",
                        borderRadius: "8px",
                      }}
                      fallback="/placeholder-logo.svg"
                    />
                    <Popconfirm
                      title="Remover esta logo?"
                      okText="Remover"
                      cancelText="Cancelar"
                      okType="danger"
                      placement="topRight"
                      icon={<QuestionCircleOutlined style={{ color: "red" }} />}
                      onConfirm={() => {
                        setLogoToDelete(true);
                        setCurrentLogo(null);
                        message.info("Logo marcada para remoção.");
                      }}
                    >
                      <Button
                        type="primary"
                        danger
                        icon={<CloseOutlined />}
                        style={{ position: "absolute", top: 5, right: 5 }}
                        size="small"
                        title="Remover Logo"
                      />
                    </Popconfirm>
                  </div>
                ) : (
                  <p>
                    {logoToDelete ? "Logo será removida." : "Nenhuma logo."}
                  </p>
                )}
              </Col>

              <Col span={12}>
                <Title level={5} style={{ fontSize: "16px" }}>
                  Portfólio
                </Title>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                  {currentPortfolio.length > 0 ? (
                    currentPortfolio.map((img) => (
                      <div
                        key={img.url}
                        style={{ position: "relative", width: "fit-content" }}
                      >
                        <AntdImage
                          src={getFullImageUrl(img.url)}
                          alt="Img"
                          style={{
                            width: 100,
                            height: 100,
                            objectFit: "cover",
                            border: "1px solid #d9d9d9",
                            borderRadius: "8px",
                          }}
                          fallback="/placeholder-logo.svg"
                        />
                        <Popconfirm
                          title="Remover imagem?"
                          okText="Remover"
                          cancelText="Cancelar"
                          okType="danger"
                          placement="topRight"
                          icon={
                            <QuestionCircleOutlined style={{ color: "red" }} />
                          }
                          onConfirm={() => {
                            setPortfolioToDelete((prev) => [...prev, img.url]);
                            setCurrentPortfolio((prev) =>
                              prev.filter((i) => i.url !== img.url)
                            );
                            message.info("Imagem marcada para remoção.");
                          }}
                        >
                          <Button
                            type="primary"
                            danger
                            icon={<CloseOutlined />}
                            style={{ position: "absolute", top: 5, right: 5 }}
                            size="small"
                          />
                        </Popconfirm>
                      </div>
                    ))
                  ) : (
                    <p>Nenhuma imagem no portfólio.</p>
                  )}
                  {portfolioToDelete.length > 0 && (
                    <Tag color="red" style={{ marginTop: 10, width: "100%" }}>
                      {portfolioToDelete.length} imagem(ns) serão removidas.
                    </Tag>
                  )}
                </div>
              </Col>
            </Row>
          </Spin>
        </Form>
      </Modal>
    </ConfigProvider>
  );
};

export default AdminLocalModal;
