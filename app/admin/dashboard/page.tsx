"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Card,
  Row,
  Col,
  Button,
  List,
  Modal,
  message,
  Descriptions,
  Spin,
  Empty,
  Typography,
  Image,
  Alert,
  Avatar,
  Table,
  Input,
  Select,
  Pagination,
  Grid,
  ConfigProvider,
} from "antd";
import {
  UserAddOutlined,
  EditOutlined,
  DeleteOutlined,
  CheckOutlined,
  CloseOutlined,
  DatabaseOutlined,
  CommentOutlined,
  HomeOutlined,
} from "@ant-design/icons";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getPendingAdminRequests } from "@/lib/api";
import AdminLocalModal from "@/components/AdminLocalModal";
import { Local } from "@/types/Interface-Local";
import FormattedDescription from "@/components/FormattedDescription";

const { Text, Title } = Typography;
const { Column } = Table;
const { TextArea } = Input;
const { useBreakpoint } = Grid;

// --- CORES ---
const COLORS = {
  primary: "#017DB9",
  secondary: "#007a73",
  tertiary: "#B4D55F",
};

// --- ENUM ALINHADO COM A INTERFACE ---
enum StatusLocal {
  PENDENTE_APROVACAO = "pendente",
  PENDENTE_ATUALIZACAO = "pendente_atualizacao",
  PENDENTE_EXCLUSAO = "pendente_exclusao",
}

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const DASHBOARD_PAGE_SIZE = 5;

const listIcons: { [key: string]: React.ReactNode } = {
  "Novos Cadastros": <UserAddOutlined style={{ color: "#52c41a" }} />,
  Atualizações: <EditOutlined style={{ color: "#1890ff" }} />,
  Exclusões: <DeleteOutlined style={{ color: "#f5222d" }} />,
};

interface PendingData {
  cadastros: Local[];
  atualizacoes: Local[];
  exclusoes: Local[];
}

// --- NOVO FIELD CONFIG ---
const fieldConfig: {
  [key: string]: { label: string; order: number; group: string };
} = {
  // --- Identificação do Responsável ---
  nomeResponsavel: { label: "Nome do Responsável", order: 1, group: "identificacao" },
  cpfResponsavel: { label: "CPF do Responsável", order: 2, group: "identificacao" },
  emailResponsavel: { label: "E-mail do Responsável", order: 3, group: "identificacao" },
  contatoResponsavel: { label: "Contato do Responsável", order: 4, group: "identificacao" },

  // --- Informações do Local ---
  localId: { label: "ID do Registro", order: 5, group: "identificacao" },
  nomeLocal: { label: "Nome do Estabelecimento", order: 6, group: "info" },
  categoria: { label: "Categoria", order: 7, group: "info" },
  contatoLocal: { label: "Telefone/Contato Local", order: 8, group: "info" },
  instagram: { label: "Instagram", order: 9, group: "info" },
  endereco: { label: "Endereço Completo", order: 10, group: "info" },
  descricao: { label: "Descrição Detalhada", order: 11, group: "info" },

  // --- Documentação e Mídias ---
  logoUrl: { label: "Logo Atual", order: 20, group: "info" },
  logo: { label: "Nova Logo", order: 21, group: "info" },
  alvaraFuncionamentoUrl: { label: "Alvará de Funcionamento", order: 22, group: "info" },
  alvaraVigilanciaUrl: { label: "Alvará da Vigilância", order: 23, group: "info" },

  // --- Dados Geográficos e Sistema ---
  latitude: { label: "Latitude", order: 30, group: "meta" },
  longitude: { label: "Longitude", order: 31, group: "meta" },
  status: { label: "Status do Processo", order: 32, group: "meta" },
  ativo: { label: "Publicado no Site", order: 33, group: "meta" },
  createdAt: { label: "Data de Submissão", order: 100, group: "meta" },
  updatedAt: { label: "Última Atualização", order: 101, group: "meta" },
};

const AdminDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<PendingData>({
    cadastros: [],
    atualizacoes: [],
    exclusoes: [],
  });
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Local | null>(null);
  const router = useRouter();
  const [isActionLoading, setIsActionLoading] = useState(false);

  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [isRejectModalVisible, setIsRejectModalVisible] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  const [currentPages, setCurrentPages] = useState({
    cadastros: 1,
    atualizacoes: 1,
    exclusoes: 1,
  });

  const screens = useBreakpoint();
  const isMobile = !screens.md;

  const getFullImageUrl = (path: string): string => {
    if (!path) return "";
    if (path.startsWith("http") || path.startsWith("blob:")) return path;
    const normalizedPath = path.replace(/\\/g, "/");
    const cleanPath = normalizedPath.startsWith("/")
      ? normalizedPath.substring(1)
      : normalizedPath;
    return `${API_URL}/${cleanPath}`;
  };

  const renderValue = (key: string, value: any): React.ReactNode => {
    if (value === null || value === undefined || value === "") {
      return <Text type="secondary">Não informado</Text>;
    }

    if (key === "linkLocal" || key === "website") {
      const urlString = String(value);
      let href = urlString;
      if (!/^https?:\/\//i.test(href)) {
        href = `https://${href}`;
      }
      return (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: "#d6386d", textDecoration: "underline" }}
        >
          {urlString}
        </a>
      );
    }

    if (key === "instagram") {
      const val = String(value).trim();
      let href = val;
      if (!val.includes("instagram.com") && !/^https?:\/\//i.test(val)) {
        const handle = val.replace(/^@/, "");
        href = `https://www.instagram.com/${handle}`;
      } else if (!/^https?:\/\//i.test(href)) {
        href = `https://${href}`;
      }
      return (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: "#d6386d", textDecoration: "underline" }}
        >
          {val}
        </a>
      );
    }

    if (key === "descricao") {
      return (
        <div
          className="prose prose-sm max-w-none prose-p:my-1"
          dangerouslySetInnerHTML={{ __html: value }}
        />
      );
    }

    if (key === "descricaoDiferencial") {
      return <FormattedDescription text={value} />;
    }

    if (
      key === "motivo" ||
      key === "motivoExclusao" ||
      key === "outrasAlteracoes"
    ) {
      return (
        <Typography.Paragraph style={{ whiteSpace: "pre-wrap", margin: 0 }}>
          {String(value)}
        </Typography.Paragraph>
      );
    }

    if (key === "createdAt" || key === "updatedAt") {
      try {
        const date = new Date(value);
        return new Intl.DateTimeFormat("pt-BR", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }).format(date);
      } catch (error) {
        return String(value);
      }
    }

    // Tratamento para booleanos atualizados (ativo vs venceuPspe)
    if (key === "venceuPspe" || key === "ativo") {
      const boolValue =
        String(value).toLowerCase() === "true" || value === true;
      return boolValue ? "Sim" : "Não";
    }

    if (
      (key === "localImg" || key === "imagens") &&
      Array.isArray(value) &&
      value.length > 0
    ) {
      const imagesUrls = value
        .map((item) => (typeof item === "string" ? item : item.url))
        .map(getFullImageUrl)
        .filter(Boolean);

      return (
        <Image.PreviewGroup>
          <Row gutter={[8, 8]}>
            {imagesUrls.map((imageUrl, index) => (
              <Col key={index}>
                <Image src={imageUrl} alt={`Imagem ${index + 1}`} width={80} />
              </Col>
            ))}
          </Row>
        </Image.PreviewGroup>
      );
    }

    if (
      (key === "logoUrl" || key === "logo") &&
      typeof value === "string" &&
      value
    ) {
      return <Image src={getFullImageUrl(value)} alt="Logo" width={150} />;
    }

    // Adaptado para visualizar PDFs dos Alvarás também
    if (
      (key === "oficioUrl" || key === "oficio" || key === "alvaraFuncionamentoUrl" || key === "alvaraVigilanciaUrl") &&
      typeof value === "string" &&
      value
    ) {
      const url = getFullImageUrl(value);
      const isPdf = url.toLowerCase().endsWith(".pdf");
      if (isPdf) {
        return (
          <Button type="primary" href={url} target="_blank" size="small">
            Visualizar PDF
          </Button>
        );
      }
      return <Image src={url} alt="Documento" width={150} />;
    }

    if (typeof value === "object" && value !== null)
      return JSON.stringify(value);

    return String(value);
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    const token = localStorage.getItem("admin_token");
    if (!token) {
      message.error("Acesso negado.");
      router.push("/admin/login");
      return;
    }
    try {
      const pendingData = await getPendingAdminRequests(token);
      setData(pendingData);
      setCurrentPages({ cadastros: 1, atualizacoes: 1, exclusoes: 1 });
    } catch (error: any) {
      message.error(error.message || "Falha ao buscar dados.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAction = async (
    action: "approve" | "reject",
    motivoRejeicao?: string
  ) => {
    if (!selectedItem) return;

    setIsActionLoading(true);
    const token = localStorage.getItem("admin_token");

    try {
      const fetchOptions: RequestInit = {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      };

      if (action === "reject") {
        fetchOptions.headers = {
          ...fetchOptions.headers,
          "Content-Type": "application/json",
        };
        fetchOptions.body = JSON.stringify({
          motivoRejeicao: motivoRejeicao || "",
        });
      }

      const response = await fetch(
        `${API_URL}/api/admin/${action}/${selectedItem.localId}`,
        fetchOptions
      );

      if (!response.ok) {
        const errorText = await response.text();
        try {
          const errorJson = JSON.parse(errorText);
          throw new Error(errorJson.message || "Erro do servidor");
        } catch (e) {
          throw new Error("Falha na comunicação com o servidor.");
        }
      }

      const result = await response.json();
      message.success(result.message || `Ação executada com sucesso!`);

      setData((prevData) => {
        const newData = { ...prevData };
        (Object.keys(newData) as Array<keyof PendingData>).forEach((key) => {
          newData[key] = newData[key].filter(
            (item) => item.localId !== selectedItem.localId
          );
        });
        return newData;
      });

      const status = selectedItem.status as string;

      if (status === StatusLocal.PENDENTE_APROVACAO)
        handlePageChange("cadastros")(1);
      else if (status === StatusLocal.PENDENTE_ATUALIZACAO)
        handlePageChange("atualizacoes")(1);
      else if (status === StatusLocal.PENDENTE_EXCLUSAO)
        handlePageChange("exclusoes")(1);

      setModalVisible(false);
      setIsRejectModalVisible(false);
      setSelectedItem(null);
      setRejectionReason("");
    } catch (error: any) {
      message.error(error.message);
    } finally {
      setIsActionLoading(false);
    }
  };

  const showModal = (item: Local) => {
    setSelectedItem(item);
    setModalVisible(true);
  };

  const handleOpenEditModal = () => {
    if (!selectedItem) return;
    setIsEditModalVisible(true);
  };

  const handleEditAndApproveSubmit = async (values: any) => {
    if (!selectedItem) return;
    setIsActionLoading(true);
    const token = localStorage.getItem("admin_token");
    if (!token) {
      message.error("Autenticação expirada.");
      setIsActionLoading(false);
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/api/admin/edit-and-approve/${selectedItem.localId}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(values),
        }
      );
      const result = await response.json();
      if (!response.ok) throw new Error(result.message);

      setIsEditModalVisible(false);
      setModalVisible(false);
      setSelectedItem(null);
      fetchData();
    } catch (error: any) {
      setIsActionLoading(false);
      throw error;
    } finally {
      setIsActionLoading(false);
    }
  };

  const renderDiffTable = (
    status: string,
    alertType: "info" | "error",
    title: string,
    keysToFilter: string[] = []
  ) => {
    if (
      !selectedItem ||
      (selectedItem.status as string) !== status ||
      !selectedItem.dados_atualizacao
    ) {
      return null;
    }

    // Mapa expandido para cobrir oficios e os novos Alvarás
    const keyMap: { [newKey: string]: { oldKey: string; labelKey: string } } = {
      logo: { oldKey: "logoUrl", labelKey: "logo" },
      imagens: { oldKey: "localImg", labelKey: "localImg" },
      oficio: { oldKey: "oficioUrl", labelKey: "oficio" },
      alvaraFuncionamento: { oldKey: "alvaraFuncionamentoUrl", labelKey: "alvaraFuncionamentoUrl" },
      alvaraVigilancia: { oldKey: "alvaraVigilanciaUrl", labelKey: "alvaraVigilanciaUrl" },
    };

    const diffDataAll = Object.entries(selectedItem.dados_atualizacao)
      .filter(([key]) => !keysToFilter.includes(key))
      .map(([key, newValue]) => {
        const mapping = keyMap[key];
        const oldKey = mapping ? mapping.oldKey : key;
        const labelKey = mapping ? mapping.labelKey : key;

        // @ts-ignore
        const oldValue = selectedItem[oldKey];
        const fieldLabel = fieldConfig[labelKey]?.label ?? fieldConfig[key]?.label ?? `Novo ${key}`;

        let finalLabel = fieldLabel;
        if (labelKey === "localImg") finalLabel = "Portfólio";
        if (labelKey === "logo") finalLabel = "Logo";
        if (key === "motivo") finalLabel = "Motivo da Exclusão";

        return {
          key: oldKey,
          newKey: key,
          field: finalLabel,
          oldValue: oldValue,
          newValue: newValue,
        };
      })
      .sort(
        (a, b) =>
          (fieldConfig[a.newKey]?.order ?? 999) -
          (fieldConfig[b.newKey]?.order ?? 999)
      );

    const outrasAlteracoesUpdate = diffDataAll.find(
      (d) => d.newKey === "outrasAlteracoes"
    );
    const diffData = diffDataAll.filter((d) => d.newKey !== "outrasAlteracoes");

    const identificacaoDiff = diffData.filter(
      (d) =>
        fieldConfig[d.newKey]?.group === "identificacao" ||
        fieldConfig[d.key]?.group === "identificacao"
    );
    const infoDiff = diffData.filter(
      (d) =>
        fieldConfig[d.newKey]?.group === "info" ||
        fieldConfig[d.key]?.group === "info"
    );
    const metaDiff = diffData.filter(
      (d) =>
        (fieldConfig[d.newKey]?.group === "meta" ||
          fieldConfig[d.key]?.group === "meta") &&
        fieldConfig[d.newKey]?.group !== "identificacao"
    );

    const titleColor = alertType === "info" ? "#0050b3" : "#d4380d";

    const columns = [
      <Column title="Campo" dataIndex="field" key="field" width={150} />,
      <Column
        title="Valor Antigo"
        dataIndex="oldValue"
        key="oldValue"
        width={400}
        render={(value, record: any) => renderValue(record.key, value)}
      />,
      <Column
        title="Valor Novo"
        dataIndex="newValue"
        key="newValue"
        width={450}
        render={(value, record: any) => renderValue(record.newKey, value)}
      />,
    ];

    return (
      <Alert
        type={alertType}
        showIcon
        className="mt-6"
        style={{ overflow: "hidden" }}
        message={
          <Title level={4} style={{ margin: 0, color: titleColor }}>
            {title}
          </Title>
        }
        description={
          <>
            {outrasAlteracoesUpdate && (
              <Alert
                message="Atenção: Pedido de 'Outras Alterações' (Ação Manual)"
                description={
                  <Typography.Paragraph
                    style={{
                      whiteSpace: "pre-wrap",
                      margin: 0,
                      padding: "8px",
                      background: "#fff",
                      borderRadius: "4px",
                    }}
                  >
                    {renderValue(
                      "outrasAlteracoes",
                      outrasAlteracoesUpdate.newValue
                    )}
                  </Typography.Paragraph>
                }
                type="warning"
                showIcon
                className="my-4"
              />
            )}
            {identificacaoDiff.length > 0 && (
              <>
                <Title
                  level={5}
                  style={{ color: titleColor, marginTop: "16px" }}
                >
                  Identificação do Local
                </Title>
                <Table
                  dataSource={identificacaoDiff}
                  pagination={false}
                  size="middle"
                  bordered
                  className="mt-4"
                  scroll={{ x: true }}
                >
                  {columns.map((col) => col)}
                </Table>
              </>
            )}
            {infoDiff.length > 0 && (
              <>
                <Title
                  level={5}
                  style={{ color: titleColor, marginTop: "24px" }}
                >
                  Informações do Local
                </Title>
                <Table
                  dataSource={infoDiff}
                  pagination={false}
                  size="middle"
                  bordered
                  className="mt-4"
                  scroll={{ x: true }}
                >
                  {columns.map((col) => col)}
                </Table>
              </>
            )}
            {metaDiff.length > 0 && (
              <Table
                dataSource={metaDiff}
                pagination={false}
                size="middle"
                bordered
                className="mt-4"
                scroll={{ x: true }}
              >
                {columns.map((col) => col)}
              </Table>
            )}
          </>
        }
      />
    );
  };

  const handlePageChange = (listKey: keyof PendingData) => (page: number) => {
    setCurrentPages((prev) => ({ ...prev, [listKey]: page }));
  };

  const renderList = (
    title: string,
    listData: Local[],
    listKey: keyof PendingData
  ) => {
    const totalCount = listData.length;
    const currentPage = currentPages[listKey];
    const pagedData = listData.slice(
      (currentPage - 1) * DASHBOARD_PAGE_SIZE,
      currentPage * DASHBOARD_PAGE_SIZE
    );

    return (
      <Col xs={24} md={12} lg={8}>
        <Card
          title={
            <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              {listIcons[title]} {title} ({listData.length})
            </span>
          }
        >
          {listData.length > 0 ? (
            <>
              <List
                dataSource={pagedData}
                renderItem={(item) => (
                  <List.Item
                    actions={[
                      <Button type="link" onClick={() => showModal(item)}>
                        Detalhes
                      </Button>,
                    ]}
                  >
                    <List.Item.Meta
                      avatar={
                        <Avatar
                          src={getFullImageUrl(item.logoUrl || "")}
                          icon={listIcons[title]}
                        />
                      }
                      title={item.nomeLocal || (item as any).nome || "Local sem nome"}
                      description={`Responsável: ${item.nomeResponsavel || (item as any).responsavel || "Não informado"}`}
                    />
                  </List.Item>
                )}
              />
              {totalCount > DASHBOARD_PAGE_SIZE && (
                <div className="mt-4 text-center">
                  <Pagination
                    current={currentPage}
                    pageSize={DASHBOARD_PAGE_SIZE}
                    total={totalCount}
                    onChange={handlePageChange(listKey)}
                    size="small"
                    showSizeChanger={false}
                  />
                </div>
              )}
            </>
          ) : (
            <Empty description="Nenhuma solicitação" />
          )}
        </Card>
      </Col>
    );
  };

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: COLORS.primary,
          colorLink: COLORS.primary,
          borderRadius: 8,
        },
      }}
    >
      <div className="p-8">
        <Spin spinning={loading}>
          <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-4">
            <Title
              level={isMobile ? 3 : 2}
              className="m-0 md:text-left text-center"
              style={{ color: COLORS.primary }}
            >
              Painel de Administração
            </Title>

            <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
              <Link href="/" passHref target="_blank" rel="noopener noreferrer">
                <Button
                  icon={<HomeOutlined />}
                  size="large"
                  className={isMobile ? "w-full" : ""}
                >
                  Ir para Home
                </Button>
              </Link>
            </div>

            <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
              <Link href="/admin/locais-ativos" passHref>
                <Button
                  type="primary"
                  icon={<DatabaseOutlined />}
                  size="large"
                  className={isMobile ? "w-full" : ""}
                >
                  Gerenciar Locais Ativos
                </Button>
              </Link>
              <Link href="/admin/comentarios" passHref>
                <Button
                  icon={<CommentOutlined />}
                  size="large"
                  style={{ backgroundColor: COLORS.primary, color: "#fff" }}
                  className={isMobile ? "w-full" : ""}
                >
                  Gerenciar Comentários
                </Button>
              </Link>
            </div>
          </div>

          <Row gutter={[16, 16]}>
            {renderList("Novos Cadastros", data.cadastros, "cadastros")}
            {renderList("Atualizações", data.atualizacoes, "atualizacoes")}
            {renderList("Exclusões", data.exclusoes, "exclusoes")}
          </Row>
        </Spin>

        {selectedItem && (
          <Modal
            title={`Detalhes de ${selectedItem.nomeLocal || (selectedItem as any).nome || "Local"}`}
            open={modalVisible}
            onCancel={() => setModalVisible(false)}
            width={1000}
            footer={[
              <Button
                key="reject"
                onClick={() => setIsRejectModalVisible(true)}
                icon={<CloseOutlined />}
                danger
                loading={isActionLoading}
              >
                Recusar
              </Button>,

              (selectedItem.status as string) !==
                StatusLocal.PENDENTE_EXCLUSAO && (
                <Button
                  key="edit_and_approve"
                  onClick={handleOpenEditModal}
                  icon={<EditOutlined />}
                  loading={isActionLoading}
                >
                  Editar Informações
                </Button>
              ),

              (selectedItem.status as string) !==
              StatusLocal.PENDENTE_EXCLUSAO ? (
                <Button
                  key="approve_direct"
                  type="primary"
                  onClick={() => handleAction("approve")}
                  icon={<CheckOutlined />}
                  loading={isActionLoading}
                >
                  Aprovar Direto
                </Button>
              ) : (
                <Button
                  key="approve_delete"
                  type="primary"
                  danger
                  onClick={() => handleAction("approve")}
                  icon={<CheckOutlined />}
                  loading={isActionLoading}
                >
                  Confirmar Exclusão
                </Button>
              ),
            ]}
          >
            {(() => {
              const allEntries = Object.entries(selectedItem)
                .filter(
                  ([key]) =>
                    key !== "dados_atualizacao" &&
                    key !== "logoUrl" &&
                    key !== "localImg" &&
                    key !== "status" &&
                    fieldConfig[key]
                )
                .sort(
                  ([keyA], [keyB]) =>
                    (fieldConfig[keyA]?.order ?? 999) -
                    (fieldConfig[keyB]?.order ?? 999)
                );
              const identificacaoEntries = allEntries.filter(
                ([key]) => fieldConfig[key]?.group === "identificacao"
              );
              const infoEntries = allEntries.filter(
                ([key]) => fieldConfig[key]?.group === "info"
              );
              const metaEntries = allEntries.filter(
                ([key]) => fieldConfig[key]?.group === "meta"
              );

              return (
                <>
                  {identificacaoEntries.length > 0 && (
                    <>
                      <Title
                        level={4}
                        className="mt-4"
                        style={{ color: COLORS.primary }}
                      >
                        Identificação do Responsável / Registro
                      </Title>
                      <Descriptions bordered column={1} size="small">
                        {identificacaoEntries.map(([key, value]) => (
                          <Descriptions.Item
                            key={key}
                            label={fieldConfig[key]?.label ?? key}
                          >
                            {renderValue(key, value)}
                          </Descriptions.Item>
                        ))}
                      </Descriptions>
                    </>
                  )}
                  <Title
                    level={4}
                    className="mt-6"
                    style={{ color: COLORS.primary }}
                  >
                    Informações do Local
                  </Title>
                  <Descriptions bordered column={1} size="small">
                    {selectedItem.logoUrl && (
                      <Descriptions.Item label={fieldConfig.logoUrl.label}>
                        {renderValue("logoUrl", selectedItem.logoUrl)}
                      </Descriptions.Item>
                    )}
                    {(selectedItem as any).localImg &&
                      (selectedItem as any).localImg.length > 0 && (
                        <Descriptions.Item label="Portfólio / Imagens">
                          {renderValue("localImg", (selectedItem as any).localImg)}
                        </Descriptions.Item>
                      )}
                    {infoEntries.map(([key, value]) => (
                      <Descriptions.Item
                        key={key}
                        label={fieldConfig[key]?.label ?? key}
                      >
                        {renderValue(key, value)}
                      </Descriptions.Item>
                    ))}
                  </Descriptions>
                  {metaEntries.length > 0 && (
                    <>
                      <Title
                        level={4}
                        className="mt-6"
                        style={{ color: COLORS.primary }}
                      >
                        Metadados e Sistema
                      </Title>
                      <Descriptions bordered column={1} size="small">
                        {metaEntries.map(([key, value]) => (
                          <Descriptions.Item
                            key={key}
                            label={fieldConfig[key]?.label ?? key}
                          >
                            {renderValue(key, value)}
                          </Descriptions.Item>
                        ))}
                      </Descriptions>
                    </>
                  )}
                </>
              );
            })()}

            {renderDiffTable(
              StatusLocal.PENDENTE_EXCLUSAO,
              "error",
              "Solicitação de Exclusão",
              ["localId", "confirmacao"]
            )}
            {renderDiffTable(
              StatusLocal.PENDENTE_ATUALIZACAO,
              "info",
              "Dados para Atualizar",
              ["motivoExclusao"]
            )}
          </Modal>
        )}

        {isEditModalVisible && (
          <AdminLocalModal
            local={selectedItem}
            visible={isEditModalVisible}
            onClose={(shouldRefresh) => {
              setIsEditModalVisible(false);
              if (shouldRefresh) {
                setModalVisible(false);
                setSelectedItem(null);
                fetchData();
              }
            }}
            mode="edit-and-approve"
            onEditAndApprove={handleEditAndApproveSubmit}
          />
        )}

        <Modal
          title="Confirmar Rejeição"
          open={isRejectModalVisible}
          onCancel={() => {
            setIsRejectModalVisible(false);
            setRejectionReason("");
          }}
          onOk={() => handleAction("reject", rejectionReason)}
          confirmLoading={isActionLoading}
          okText="Confirmar Rejeição"
          cancelText="Voltar"
          okButtonProps={{ danger: true }}
        >
          <Typography.Text strong className="block mb-2">
            Por favor, informe o motivo da rejeição:
          </Typography.Text>
          <TextArea
            rows={4}
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            placeholder="Motivo..."
          />
        </Modal>
      </div>
    </ConfigProvider>
  );
};

export default AdminDashboard;