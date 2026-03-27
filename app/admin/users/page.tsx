"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Card,
  Row,
  Col,
  Avatar,
  Button,
  Tabs,
  Input,
  Popconfirm,
  Typography,
  message,
  Spin,
  Pagination,
  Modal,
  Form,
  Switch,
  Tag,
  Empty,
  Tooltip,
  Grid,
  Space,
  Divider,
  List,
  Badge,
} from "antd";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeftOutlined,
  EditOutlined,
  DeleteOutlined,
  UserOutlined,
  MailOutlined,
  IdcardOutlined,
  KeyOutlined,
  SendOutlined,
  LockOutlined,
  FilterOutlined,
  ShopOutlined,
  CommentOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import {
  getAllUsers,
  adminUpdateUser,
  adminDeleteUser,
  adminChangeUserPassword,
  adminResendConfirmation,
  getAllActiveLocal,
  getAllInactiveLocal,
  getPendingAdminRequests,
  adminGetReviewsByLocal,
} from "@/lib/api";
import { Local } from "@/types/Interface-Local";

const { Title, Text } = Typography;
const { Search } = Input;
const { useBreakpoint } = Grid;

const PAGE_SIZE = 8; // Ajustado para grid par

interface User {
  usuarioId: number;
  nomeCompleto: string;
  username: string;
  email: string;
  enabled: boolean;
}

interface UserReviewItem {
  id: number;
  comentario: string;
  nota: number | null;
  localId: number;
  nomeLocal: string;
}

type CadastroOrigem = "indication" | "owner";

interface LocalWithCadastroOrigem extends Local {
  cadastroOrigem?: CadastroOrigem;
}

const normalizeUser = (raw: any): User => {
  // Normaliza os campos que podem variar entre APIs
  const usuarioId = raw.usuarioId || raw.id || raw.userId || raw._id || 0;
  const nomeCompleto = raw.nomeCompleto || raw.name || raw.fullName || "";
  const username = raw.username || raw.userName || raw.login || (String(usuarioId) ?? "");
  const email = raw.email || raw.mail || "";
  const enabled = raw.enabled !== undefined ? Boolean(raw.enabled) : raw.enable !== undefined ? Number(raw.enable) === 1 : false;

  return {
    usuarioId: Number(usuarioId),
    nomeCompleto,
    username,
    email,
    enabled,
  };
};

const AdminUsuariosPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchText, setSearchText] = useState("");

  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editForm] = Form.useForm();

  const [isPasswordModalVisible, setIsPasswordModalVisible] = useState(false);
  const [passwordUser, setPasswordUser] = useState<User | null>(null);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordForm] = Form.useForm();

  const [isInteractionModalVisible, setIsInteractionModalVisible] = useState(false);
  const [interactionLoading, setInteractionLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userEstablishments, setUserEstablishments] = useState<LocalWithCadastroOrigem[]>([]);
  const [userComments, setUserComments] = useState<UserReviewItem[]>([]);

  const router = useRouter();
  const screens = useBreakpoint();

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    const token = localStorage.getItem("admin_token");
    if (!token) {
      message.error("Acesso negado.");
      router.push("/admin/login");
      return;
    }

    try {
      // Tenta obter todos e normalizar
      const data = await getAllUsers(token);
      const list = Array.isArray(data) ? data : data.users || [];
      const normalized = (list as any[])
        .map((item: any) => normalizeUser(item))
        .sort((a: User, b: User) => a.usuarioId - b.usuarioId);
      setUsers(normalized);
      setFilteredUsers(normalized);
      setCurrentPage(1);
    } catch (error: any) {
      message.error(error.message || "Erro ao buscar usuários.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleSearch = (value: string) => {
    setSearchText(value);
    const lower = value.toLowerCase();
    const filtered = users.filter(
      (u) =>
        (u.nomeCompleto || "").toLowerCase().includes(lower) ||
        (u.email || "").toLowerCase().includes(lower) ||
        (u.username || "").toLowerCase().includes(lower) ||
        String(u.usuarioId).includes(lower),
    );
    setFilteredUsers(filtered);
    setCurrentPage(1);
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    editForm.setFieldsValue({
      nomeCompleto: user.nomeCompleto,
      email: user.email,
      username: user.username,
      enabled: user.enabled,
    });
    setIsEditModalVisible(true);
  };

  const handleEditSubmit = async () => {
    try {
      const values = await editForm.validateFields();
      const token = localStorage.getItem("admin_token");
      if (!token || !editingUser) return;

      setEditLoading(true);
      // Converter enabled boolean para 0/1 se backend esperar isso
      const payload: any = { ...values };
      if (payload.enabled !== undefined) payload.enabled = payload.enabled;

      await adminUpdateUser(editingUser.usuarioId, payload, token);
      message.success("Perfil atualizado com sucesso!");
      setIsEditModalVisible(false);
      setEditingUser(null);
      fetchUsers();
    } catch (error: any) {
      message.error(error.message || "Falha ao atualizar usuário.");
    } finally {
      setEditLoading(false);
    }
  };

  const handleOpenPasswordModal = (user: User) => {
    setPasswordUser(user);
    passwordForm.resetFields();
    setIsPasswordModalVisible(true);
  };

  const handlePasswordSubmit = async () => {
    try {
      const values = await passwordForm.validateFields();
      const token = localStorage.getItem("admin_token");
      if (!token || !passwordUser) return;

      setPasswordLoading(true);
      await adminChangeUserPassword(passwordUser.usuarioId, values.newPassword, token);
      message.success("Senha alterada com sucesso!");
      setIsPasswordModalVisible(false);
      setPasswordUser(null);
    } catch (error: any) {
      message.error(error.message || "Falha ao alterar senha.");
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleResendEmail = async (user: User) => {
    const token = localStorage.getItem("admin_token");
    if (!token) return;
    const hide = message.loading("Enviando email...", 0);
    try {
      await adminResendConfirmation(user.usuarioId, token);
      hide();
      message.success(`Email de confirmação enviado para ${user.email}`);
    } catch (error: any) {
      hide();
      message.error(error.message || "Falha ao enviar email.");
    }
  };

  const handleDelete = async (id: number) => {
    const token = localStorage.getItem("admin_token");
    if (!token) return;
    try {
      await adminDeleteUser(id, token);
      message.success("Usuário excluído.");
      const newUsers = users.filter((u) => u.usuarioId !== id);
      setUsers(newUsers);
      setFilteredUsers(newUsers.filter((u) => u.nomeCompleto.toLowerCase().includes(searchText.toLowerCase())));
    } catch (error: any) {
      message.error(error.message || "Falha ao excluir usuário.");
    }
  };

  const isLocalOwnedByUser = (local: any, user: User) => {
    const ownerIdCandidates = [
      local.usuarioId,
      local.userId,
      local.donoId,
      local.proprietarioId,
      local.responsavelId,
      local.criadoPorId,
      local.authorId,
    ]
      .map((val: any) => Number(val))
      .filter((val: number) => !Number.isNaN(val) && val > 0);

    if (ownerIdCandidates.includes(user.usuarioId)) return true;

    const ownerTextCandidates = [
      local.criadoPor,
      local.username,
      local.nomeResponsavel,
      local.responsavel,
      local.emailResponsavel,
      local.email,
      local.ownerUsername,
    ]
      .filter(Boolean)
      .map((val: any) => String(val).toLowerCase());

    const normalizedName = (user.nomeCompleto || "").toLowerCase();
    const normalizedUsername = (user.username || "").toLowerCase();
    const normalizedEmail = (user.email || "").toLowerCase();

    return ownerTextCandidates.some(
      (text: string) =>
        text === normalizedName ||
        text === normalizedUsername ||
        text === normalizedEmail,
    );
  };

  const getCadastroOrigem = (local: any): CadastroOrigem => {
    const tipoCadastro = String(local?.tipoCadastro ?? local?.tipo ?? local?.type ?? "").toLowerCase();
    const origem = String(local?.origem ?? local?.source ?? "").toLowerCase();
    const hasIndicadorFields = Boolean(
      local?.indicadorNome ||
        local?.indicadorEmail ||
        local?.indicadorContato ||
        local?.cpfResponsavel,
    );
    const hasResponsavelContactFields = Boolean(
      local?.contatoResponsavel ||
        local?.emailResponsavel ||
        local?.emailContato,
    );

    if (
      tipoCadastro === "indication" ||
      tipoCadastro === "indicacao" ||
      tipoCadastro === "indicação" ||
      origem.includes("indic") ||
      local?.isIndicacao === true ||
      local?.indicacao === true ||
      hasIndicadorFields ||
      hasResponsavelContactFields
    ) {
      return "indication";
    }

    return "owner";
  };

  const normalizeCommentsFromResponse = (response: any) => {
    if (Array.isArray(response)) return response;
    if (response && Array.isArray(response.avaliacoes)) return response.avaliacoes;
    if (response && Array.isArray(response.reviews)) return response.reviews;
    if (response && Array.isArray(response.data)) return response.data;
    return [];
  };

  const handleOpenInteractionDashboard = async (user: User) => {
    const token = localStorage.getItem("admin_token");
    if (!token) {
      message.error("Sessão expirada. Faça login novamente.");
      router.push("/admin/login");
      return;
    }

    setSelectedUser(user);
    setUserEstablishments([]);
    setUserComments([]);
    setIsInteractionModalVisible(true);
    setInteractionLoading(true);

    try {
      const [locaisAtivosResp, locaisInativosResp, pendentesResp] = await Promise.all([
        getAllActiveLocal(token),
        getAllInactiveLocal(token),
        getPendingAdminRequests(token),
      ]);

      const locaisAtivos = Array.isArray(locaisAtivosResp)
        ? locaisAtivosResp
        : locaisAtivosResp?.data || [];
      const locaisInativos = Array.isArray(locaisInativosResp)
        ? locaisInativosResp
        : locaisInativosResp?.data || [];

      const pendentes = pendentesResp || {};
      const pendentesCadastros = Array.isArray(pendentes.cadastros) ? pendentes.cadastros : [];
      const pendentesAtualizacoes = Array.isArray(pendentes.atualizacoes) ? pendentes.atualizacoes : [];
      const pendentesExclusoes = Array.isArray(pendentes.exclusoes) ? pendentes.exclusoes : [];
      const pendentesIndicacoes = Array.isArray(pendentes.indicacoes) ? pendentes.indicacoes : [];

      const pendentesList = [
        ...pendentesCadastros,
        ...pendentesAtualizacoes,
        ...pendentesExclusoes,
        ...pendentesIndicacoes.map((item: any) => ({ ...item, cadastroOrigem: "indication" as CadastroOrigem })),
      ];

      const allLocaisMap = new Map<number, LocalWithCadastroOrigem>();

      [...locaisAtivos, ...locaisInativos, ...pendentesList].forEach((local: any) => {
        const id = Number(local?.localId ?? local?.id ?? 0);
        if (!id) return;

        const cadastroOrigem = (local?.cadastroOrigem as CadastroOrigem | undefined) ?? getCadastroOrigem(local);
        const current = allLocaisMap.get(id);

        // Se houver conflito entre fontes, prioriza "indication" para não esconder essa informação.
        if (!current || (current.cadastroOrigem !== "indication" && cadastroOrigem === "indication")) {
          allLocaisMap.set(id, { ...local, localId: id, cadastroOrigem });
        }
      });

      const allLocais = Array.from(allLocaisMap.values());

      const ownedLocais = allLocais.filter((local: LocalWithCadastroOrigem) =>
        isLocalOwnedByUser(local, user),
      );
      setUserEstablishments(ownedLocais);

      const reviewsByLocal = await Promise.allSettled(
        allLocais.map(async (local: LocalWithCadastroOrigem) => {
          const response = await adminGetReviewsByLocal(String(local.localId), token);
          const localReviews = normalizeCommentsFromResponse(response);

          return localReviews
            .filter((review: any) => {
              const reviewUserId = Number(review?.usuario?.usuarioId ?? review?.usuarioId ?? review?.userId ?? 0);
              return reviewUserId === user.usuarioId;
            })
            .map((review: any) => ({
              id: Number(review.avaliacoesId ?? review.id ?? 0),
              comentario: review.comentario || review.comment || "",
              nota: review.nota ?? review.rating ?? null,
              localId: local.localId,
              nomeLocal: local.nomeLocal || (local as any).nome || `Local ${local.localId}`,
            }));
        }),
      );

      const flattenedReviews = reviewsByLocal
        .filter((result): result is PromiseFulfilledResult<UserReviewItem[]> => result.status === "fulfilled")
        .flatMap((result) => result.value)
        .sort((a, b) => b.id - a.id);

      setUserComments(flattenedReviews);
    } catch (error: any) {
      message.error(error.message || "Falha ao carregar interações do usuário.");
    } finally {
      setInteractionLoading(false);
    }
  };

  const renderUserList = (list: User[]) => {
    if (list.length === 0)
      return (
        <div className="py-20">
          <Empty description="Nenhum usuário encontrado com estes critérios." />
        </div>
      );

    const startIndex = (currentPage - 1) * PAGE_SIZE;
    const currentList = list.slice(startIndex, startIndex + PAGE_SIZE);

    return (
      <div className="animate-in fade-in duration-500">
        <Row gutter={[24, 24]}>
          {currentList.map((user) => (
            <Col xs={24} xl={12} key={user.usuarioId}>
              <Card
                bordered={false}
                className="shadow-sm hover:shadow-md transition-all duration-300 rounded-xl overflow-hidden border border-gray-100 cursor-pointer"
                bodyStyle={{ padding: "20px" }}
                onClick={() => handleOpenInteractionDashboard(user)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex gap-4">
                    <Avatar
                      size={64}
                      icon={<UserOutlined />}
                      className={`shadow-inner ${user.enabled ? "bg-emerald-100 text-emerald-600" : "bg-orange-100 text-orange-600"}`}
                      style={{ border: "2px solid #fff" }}
                    />
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2 mb-1">
                        <Button
                          type="link"
                          className="!p-0 !h-auto"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenInteractionDashboard(user);
                          }}
                        >
                          <Text strong className="text-lg leading-none m-0">
                            {user.nomeCompleto}
                          </Text>
                        </Button>
                        <Tag
                          bordered={false}
                          className="rounded-full px-3 text-[10px] font-bold tracking-wider"
                          color={user.enabled ? "success" : "error"}
                        >
                          {user.enabled ? "ATIVO" : "INATIVO"}
                        </Tag>
                      </div>
                      <Text type="secondary" className="text-xs mb-2">
                        @{user.username} • ID: {user.usuarioId}
                      </Text>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-gray-500">
                          <MailOutlined className="text-xs" />
                          <Text className="text-sm italic">{user.email}</Text>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <Tooltip title="Editar">
                      <Button
                        shape="circle"
                        icon={<EditOutlined />}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(user);
                        }}
                        className="hover:text-blue-600 hover:border-blue-600"
                      />
                    </Tooltip>
                    <Tooltip title="Segurança">
                      <Button
                        shape="circle"
                        icon={<KeyOutlined />}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenPasswordModal(user);
                        }}
                      />
                    </Tooltip>
                  </div>
                </div>

                <Divider className="my-4" />

                <div className="flex justify-between items-center bg-gray-50 -mx-5 -mb-5 px-5 py-3">
                  <Button
                    type="link"
                    size="small"
                    icon={<SendOutlined />}
                    disabled={user.enabled}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleResendEmail(user);
                    }}
                    className={
                      user.enabled
                        ? "text-gray-400"
                        : "text-blue-600 font-medium"
                    }
                  >
                    Reenviar Email
                  </Button>

                  <Popconfirm
                    title="Excluir Usuário"
                    description={`Esta ação é irreversível. Deseja deletar ${user.username}?`}
                    onConfirm={() => handleDelete(user.usuarioId)}
                    okText="Sim, excluir"
                    cancelText="Não"
                    okButtonProps={{ danger: true, size: "small" }}
                    cancelButtonProps={{ size: "small" }}
                  >
                    <Button
                      type="text"
                      danger
                      size="small"
                      icon={<DeleteOutlined />}
                      onClick={(e) => e.stopPropagation()}
                    >
                      Remover
                    </Button>
                  </Popconfirm>
                </div>
              </Card>
            </Col>
          ))}
        </Row>

        <div className="mt-10 flex justify-center">
          <Pagination
            current={currentPage}
            pageSize={PAGE_SIZE}
            total={list.length}
            onChange={(page) => setCurrentPage(page)}
            showSizeChanger={false}
            className="bg-white p-2 rounded-lg shadow-sm border border-gray-100"
          />
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] p-4 md:p-10">
      {/* Header Section */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <Link
              href="/admin/dashboard"
              className="text-gray-500 hover:text-blue-600 transition-colors flex items-center gap-2 mb-2"
            >
              <ArrowLeftOutlined /> <span>Painel de Controle</span>
            </Link>
            <Title
              level={2}
              style={{ margin: 0 }}
              className="font-extrabold tracking-tight"
            >
              Gestão de Usuários
            </Title>
            <Text type="secondary" className="text-base">
              Gerencie permissões, contas e segurança dos membros da plataforma.
            </Text>
          </div>

          <div className="bg-blue-600 p-4 rounded-2xl text-white shadow-lg shadow-blue-200 min-w-[180px]">
            <div className="text-xs opacity-80 uppercase font-bold tracking-widest">
              Total de Usuários
            </div>
            <div className="text-3xl font-black">{users.length}</div>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-8 flex flex-col md:flex-row gap-4 items-center">
          <Search
            placeholder="Buscar por nome, email ou username..."
            onSearch={handleSearch}
            onChange={(e) => handleSearch(e.target.value)}
            size="large"
            allowClear
            className="max-w-2xl custom-search"
            style={{ borderRadius: "12px" }}
          />
          <div className="flex-1" />
          <Space>
            <Tag
              color="blue"
              className="m-0 px-3 py-1 rounded-md border-none font-medium"
            >
              <FilterOutlined className="mr-2" />
              {filteredUsers.length} resultados
            </Tag>
          </Space>
        </div>

        <Spin spinning={loading} tip="Carregando base de usuários...">
          <Tabs
            defaultActiveKey="todos"
            onChange={() => setCurrentPage(1)}
            className="custom-tabs"
            items={[
              {
                key: "todos",
                label: `Todos`,
                children: renderUserList(filteredUsers),
              },
              {
                key: "ativos",
                label: `Ativos`,
                children: renderUserList(
                  filteredUsers.filter((u) => u.enabled),
                ),
              },
              {
                key: "bloqueados",
                label: `Inativos`,
                children: renderUserList(
                  filteredUsers.filter((u) => !u.enabled),
                ),
              },
            ]}
          />
        </Spin>
      </div>

      {/* Modais com Estilo Melhorado */}
      <Modal
        title={
          <div className="pb-2 border-b">
            <div className="flex items-center justify-between gap-3">
              <Space>
                <Avatar size={48} icon={<UserOutlined />} className="bg-blue-100 text-blue-600" />
                <div>
                  <Text strong className="text-base block">
                    Mini Dashboard do Usuário
                  </Text>
                  <Text type="secondary">
                    {selectedUser?.nomeCompleto} • @{selectedUser?.username}
                  </Text>
                </div>
              </Space>
            </div>
          </div>
        }
        open={isInteractionModalVisible}
        onCancel={() => setIsInteractionModalVisible(false)}
        footer={null}
        width={screens.lg ? 980 : "95vw"}
        centered
      >
        <Spin spinning={interactionLoading} tip="Buscando interações do usuário...">
          <div className="pt-4 space-y-6">
            <Row gutter={[12, 12]}>
              <Col xs={24} md={8}>
                <Card className="rounded-xl" bodyStyle={{ padding: 14 }}>
                  <Space>
                    <Badge color="#3b82f6" />
                    <ShopOutlined className="text-blue-500" />
                    <Text type="secondary">Estabelecimentos</Text>
                  </Space>
                  <Title level={3} className="!m-0">
                    {userEstablishments.length}
                  </Title>
                </Card>
              </Col>
              <Col xs={24} md={8}>
                <Card className="rounded-xl" bodyStyle={{ padding: 14 }}>
                  <Space>
                    <Badge color="#f59e0b" />
                    <CommentOutlined className="text-amber-500" />
                    <Text type="secondary">Comentários</Text>
                  </Space>
                  <Title level={3} className="!m-0">
                    {userComments.length}
                  </Title>
                </Card>
              </Col>
              <Col xs={24} md={8}>
                <Card className="rounded-xl" bodyStyle={{ padding: 14 }}>
                  <Space>
                    <Badge color="#10b981" />
                    <EyeOutlined className="text-emerald-500" />
                    <Text type="secondary">Interações Totais</Text>
                  </Space>
                  <Title level={3} className="!m-0">
                    {userEstablishments.length + userComments.length}
                  </Title>
                </Card>
              </Col>
            </Row>

            <Row gutter={[16, 16]}>
              <Col xs={24} lg={12}>
                <Card title="Estabelecimentos cadastrados" className="h-full">
                  {userEstablishments.length === 0 ? (
                    <Empty description="Nenhum estabelecimento encontrado para este usuário." image={Empty.PRESENTED_IMAGE_SIMPLE} />
                  ) : (
                    <List
                      dataSource={userEstablishments}
                      renderItem={(local) => (
                        <List.Item>
                          <List.Item.Meta
                            title={local.nomeLocal || (local as any).nome || `Local ${local.localId}`}
                            description={
                              <div>
                                <span>
                                  ID: {local.localId} • Categoria: {local.categoria || "N/A"}
                                </span>
                                <div className="mt-1">
                                  <Tag color={(local as LocalWithCadastroOrigem).cadastroOrigem === "indication" ? "orange" : "blue"}>
                                    {(local as LocalWithCadastroOrigem).cadastroOrigem === "indication"
                                      ? "Cadastro por indicação"
                                      : "Cadastro pelo dono"}
                                  </Tag>
                                </div>
                              </div>
                            }
                          />
                        </List.Item>
                      )}
                    />
                  )}
                </Card>
              </Col>

              <Col xs={24} lg={12}>
                <Card title="Comentários feitos" className="h-full">
                  {userComments.length === 0 ? (
                    <Empty description="Nenhum comentário encontrado para este usuário." image={Empty.PRESENTED_IMAGE_SIMPLE} />
                  ) : (
                    <List
                      dataSource={userComments}
                      renderItem={(comment) => (
                        <List.Item>
                          <List.Item.Meta
                            title={comment.nomeLocal}
                            description={
                              <div>
                                <Text className="block text-sm">
                                  {comment.comentario || "(Sem texto)"}
                                </Text>
                                <Text type="secondary" className="text-xs">
                                  Local ID: {comment.localId}
                                  {comment.nota !== null ? ` • Nota: ${comment.nota}` : ""}
                                </Text>
                              </div>
                            }
                          />
                        </List.Item>
                      )}
                    />
                  )}
                </Card>
              </Col>
            </Row>
          </div>
        </Spin>
      </Modal>

      <Modal
        title={<div className="pb-4 border-b">Editar Perfil do Usuário</div>}
        open={isEditModalVisible}
        onOk={handleEditSubmit}
        onCancel={() => setIsEditModalVisible(false)}
        confirmLoading={editLoading}
        okText="Salvar Alterações"
        cancelText="Descartar"
        centered
        className="modern-modal"
      >
        <Form form={editForm} layout="vertical" className="mt-6">
          <Form.Item
            name="nomeCompleto"
            label="Nome Completo"
            rules={[{ required: true }]}
          >
            <Input
              prefix={<UserOutlined className="text-gray-400" />}
              size="large"
            />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="username"
                label="Username"
                rules={[{ required: true }]}
              >
                <Input
                  prefix={<IdcardOutlined className="text-gray-400" />}
                  size="large"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="enabled"
                label="Status da Conta"
                valuePropName="checked"
              >
                <Switch
                  checkedChildren="Ativo"
                  unCheckedChildren="Inativo"
                  className="bg-gray-300"
                />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item
            name="email"
            label="Email Corporativo"
            rules={[{ required: true, type: "email" }]}
          >
            <Input
              prefix={<MailOutlined className="text-gray-400" />}
              size="large"
            />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={
          <Space>
            <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
              <LockOutlined className="text-yellow-600" />
            </div>
            <Text strong className="text-lg">
              Redefinir Senha: {passwordUser?.username}
            </Text>
          </Space>
        }
        open={isPasswordModalVisible}
        onOk={handlePasswordSubmit}
        onCancel={() => setIsPasswordModalVisible(false)}
        confirmLoading={passwordLoading}
        okText="Atualizar Senha"
        okButtonProps={{ danger: true, size: "large" }}
        cancelButtonProps={{ size: "large" }}
        centered
      >
        <div className="my-6 bg-amber-50 p-4 rounded-xl border border-amber-100">
          <Text className="text-amber-800 text-sm">
            <strong>Importante:</strong> Ao confirmar, o usuário perderá o
            acesso com a senha antiga imediatamente.
          </Text>
        </div>

        <Form form={passwordForm} layout="vertical">
          <Form.Item
            name="newPassword"
            label="Nova Senha"
            rules={[{ required: true, min: 6 }]}
          >
            <Input.Password
              prefix={<KeyOutlined className="text-gray-400" />}
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            label="Confirmar Senha"
            dependencies={["newPassword"]}
            rules={[
              { required: true },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue("newPassword") === value)
                    return Promise.resolve();
                  return Promise.reject(new Error("As senhas não coincidem"));
                },
              }),
            ]}
          >
            <Input.Password
              prefix={<KeyOutlined className="text-gray-400" />}
              size="large"
            />
          </Form.Item>
        </Form>
      </Modal>

      <style jsx global>{`
        .custom-tabs .ant-tabs-nav::before {
          border-bottom: 2px solid #e2e8f0;
        }
        .custom-tabs .ant-tabs-tab {
          font-weight: 500;
          padding: 12px 8px;
        }
        .custom-search .ant-input-affix-wrapper {
          border-radius: 12px;
          padding: 8px 16px;
          border-color: #e2e8f0;
        }
        .custom-search .ant-input-search-button {
          border-radius: 0 12px 12px 0 !important;
        }
      `}</style>
    </div>
  );
};

export default AdminUsuariosPage;
