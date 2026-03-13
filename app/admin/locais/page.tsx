"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Spin,
  Typography,
  message,
  Empty,
  Card,
  Row,
  Col,
  Avatar,
  Button,
  Tabs,
  Input,
  Popconfirm,
  Grid,
  Pagination,
} from "antd";
import Link from "next/link";
import {
  ArrowLeftOutlined,
  EditOutlined,
  DeleteOutlined,
  DownloadOutlined,
  StopOutlined,
  CheckCircleOutlined,
  BarChartOutlined,
} from "@ant-design/icons";
import {
  getAllActiveLocal,
  getAllInactiveLocal,
  adminToggleLocalAtivo,
  adminDeleteLocal,
  adminExportLocais,
} from "@/lib/api";
import AdminLocalModal from "@/components/admin/AdminLocalModal";
import { Local } from "@/types/Interface-Local";

const { Title, Text } = Typography;
const { Search } = Input;
const { TabPane } = Tabs;
const { useBreakpoint } = Grid;

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const PAGE_SIZE = 6;

const getFullImageUrl = (path: string): string => {
  if (!path) return "";
  const normalizedPath = path.replace(/\\/g, "/");
  const cleanPath = normalizedPath.startsWith("/") ? normalizedPath.substring(1) : normalizedPath;
  return `${API_URL}/${cleanPath}`;
};

export default function LocaisAllPage() {
  const [loading, setLoading] = useState(true);
  const [locais, setLocais] = useState<Local[]>([]);
  const [filteredLocais, setFilteredLocais] = useState<Local[]>([]);
  const [viewMode, setViewMode] = useState<"todos" | "ativos" | "inativos">("todos");
  const [selectedItem, setSelectedItem] = useState<Local | null>(null);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const screens = useBreakpoint();

  const fetchData = useCallback(async () => {
    setLoading(true);
    const token = localStorage.getItem("admin_token");
    if (!token) {
      message.error("Acesso negado.");
      return;
    }

    try {
      // Busca específicos do backend para garantir locais inativos aparecem
      let all: Local[] = [] as any;
      if (viewMode === "inativos") {
        const res = await getAllInactiveLocal(token);
        all = Array.isArray(res) ? res : [];
      } else if (viewMode === "ativos") {
        const res = await getAllActiveLocal(token);
        all = Array.isArray(res) ? res : [];
      } else {
        const [actRes, inactRes] = await Promise.all([getAllActiveLocal(token), getAllInactiveLocal(token)]);
        const act = Array.isArray(actRes) ? actRes : [];
        const inact = Array.isArray(inactRes) ? inactRes : [];
        all = [...act, ...inact];
      }

      setLocais(all);
      if (viewMode === "ativos") setFilteredLocais(all.filter((l: any) => l.status === "ativo"));
      else if (viewMode === "inativos") setFilteredLocais(all.filter((l: any) => l.status === "inativo"));
      else setFilteredLocais(all);
    } catch (err: any) {
      message.error(err.message || "Falha ao buscar locais.");
    } finally {
      setLoading(false);
    }
  }, [viewMode]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Reaplica filtro quando a lista bruta ou o modo mudar
  useEffect(() => {
    const apply = () => {
      if (viewMode === "ativos") setFilteredLocais(locais.filter((l: any) => l.status === "ativo"));
      else if (viewMode === "inativos") setFilteredLocais(locais.filter((l: any) => l.status === "inativo"));
      else setFilteredLocais(locais);
      setCurrentPage(1);
    };
    apply();
  }, [locais, viewMode]);

  const handleSearch = (value: string) => {
    const q = value.toLowerCase();
    // pesquisa é aplicada sobre a lista já filtrada pelo modo atual
    const base = viewMode === "ativos" ? locais.filter((l: any) => l.status === "ativo") : viewMode === "inativos" ? locais.filter((l: any) => l.status === "inativo") : locais;
    const filtered = base.filter((l) => {
      const nome = l.nomeLocal || (l as any).nome || "";
      const responsavel = l.nomeResponsavel || (l as any).responsavel || "";
      const categoria = l.categoria || "";
      return (
        nome.toLowerCase().includes(q) ||
        responsavel.toLowerCase().includes(q) ||
        categoria.toLowerCase().includes(q) ||
        String(l.localId).includes(q)
      );
    });
    setFilteredLocais(filtered);
    setCurrentPage(1);
  };

  const openEditModal = (local: Local) => {
    setSelectedItem(local);
    setIsEditModalVisible(true);
  };

  const handleModalClose = (shouldRefresh: boolean) => {
    setIsEditModalVisible(false);
    setSelectedItem(null);
    if (shouldRefresh) fetchData();
  };

  const handleToggleActive = async (localId: number) => {
    const token = localStorage.getItem("admin_token");
    if (!token) {
      message.error("Autenticação expirada.");
      return;
    }

    setLoading(true);
    try {
      const updated = await adminToggleLocalAtivo(localId, token);
      const newLocal = (updated && (updated.local || updated)) as any;

      if (!newLocal) {
        await fetchData();
        message.success("Status do local atualizado.");
        return;
      }

      setLocais((prev) => prev.map((l) => (l.localId === localId ? { ...l, ...newLocal } : l)));
      setFilteredLocais((prev) => prev.map((l) => (l.localId === localId ? { ...l, ...newLocal } : l)));

      message.success(newLocal.status === "ativo" ? "Local reativado." : "Local inativado.");
    } catch (err: any) {
      message.error(err.message || "Falha ao alternar status.");
    } finally {
      setLoading(false);
    }
  };

  const handlePermanentDelete = async (localId: number) => {
    const token = localStorage.getItem("admin_token");
    if (!token) {
      message.error("Autenticação expirada.");
      return;
    }

    setLoading(true);
    try {
      await adminDeleteLocal(localId, token);
      message.success("Local excluído com sucesso!");
      await fetchData();
    } catch (err: any) {
      message.error(err.message || "Falha ao excluir o local.");
      setLoading(false);
    }
  };

  const handleExport = async () => {
    const token = localStorage.getItem("admin_token");
    if (!token) {
      message.error("Sessão expirada.");
      return;
    }

    setExporting(true);
    try {
      const blob = await adminExportLocais(token);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `locais_ExploreSaqua_${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      message.success("Relatório gerado com sucesso!");
    } catch (err: any) {
      console.error(err);
      message.error("Erro ao gerar relatório.");
    } finally {
      setExporting(false);
    }
  };

  const groupedLocais = filteredLocais.reduce((acc, local) => {
    const categoria = local.categoria || "Sem Categoria";
    if (!acc[categoria]) acc[categoria] = [];
    acc[categoria].push(local);
    return acc;
  }, {} as { [key: string]: Local[] });

  const sortedCategories = Object.keys(groupedLocais).sort((a, b) => a.localeCompare(b));
  const total = filteredLocais.length;
  const paginated = filteredLocais.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <div className="p-4 md:p-8">
      <div className="flex justify-between items-center mb-4 flex-wrap gap-4">
        <Link href="/admin/dashboard" passHref>
          <Button icon={<ArrowLeftOutlined />} type="text">
            Voltar ao Dashboard
          </Button>
        </Link>

        <div className="flex gap-3 flex-wrap">
          <Link href="/admin/indicadores" passHref>
            <Button
              type="primary"
              icon={<BarChartOutlined />}
              className="bg-[#0b6d9c] hover:!bg-[#09546f] border-[#0b6d9c] hover:!border-[#09546f] text-white"
            >
              Ver Indicadores
            </Button>
          </Link>

          <Button
            type="primary"
            icon={<DownloadOutlined />}
            onClick={handleExport}
            loading={exporting}
            className="bg-green-600 hover:!bg-green-700 border-green-600 hover:!border-green-700"
          >
            Exportar Locais (CSV)
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-between mb-6 gap-4">
        <Title level={2} className="m-0">Gerenciar Locais</Title>
        <div className="flex gap-2">
          <Button onClick={() => setViewMode("ativos")} className={viewMode === "ativos" ? "bg-[#0b6d9c] text-white" : ""}>Ativos</Button>
          <Button onClick={() => setViewMode("inativos")} className={viewMode === "inativos" ? "bg-[#0b6d9c] text-white" : ""}>Inativos</Button>
          <Button onClick={() => setViewMode("todos")} className={viewMode === "todos" ? "bg-[#0b6d9c] text-white" : ""}>Todos</Button>
        </div>
      </div>

      <Search
        placeholder="Buscar por ID, nome, categoria ou responsável..."
        onSearch={handleSearch}
        onChange={(e) => handleSearch((e.target as any).value)}
        enterButton
        size="large"
        className="mb-6"
      />

      <Spin spinning={loading}>
        {filteredLocais.length === 0 && !loading ? (
          <Empty description="Nenhum local encontrado." />
        ) : (
          <Tabs defaultActiveKey="todos" tabPosition={screens.md ? "left" : "top"}>
            <TabPane tab={`Todos os Locais (${total})`} key="todos">
              <Row gutter={[16, 16]}>
                {paginated.map((local) => (
                  <Col xs={24} md={12} lg={8} key={local.localId}>
                    <Card
                      hoverable
                      className={local.status === "inativo" ? "!bg-gray-50" : undefined}
                      style={
                        local.status === "inativo"
                          ? { opacity: 0.65, filter: "grayscale(1)" }
                          : undefined
                      }
                      actions={[
                        <Button type="text" icon={<EditOutlined />} onClick={() => openEditModal(local)}>
                          Editar
                        </Button>,
                        <Popconfirm
                          key={`toggle-${local.localId}`}
                          title={local.status === "ativo" ? "Inativar Local" : "Reativar Local"}
                          description={
                            local.status === "ativo"
                              ? "Tem certeza que deseja inativar este local?"
                              : "Deseja reativar este local?"
                          }
                          onConfirm={() => handleToggleActive(local.localId)}
                          okText={local.status === "ativo" ? "Sim, Inativar" : "Sim, Reativar"}
                          cancelText="Não"
                          okButtonProps={{ danger: local.status === "ativo" }}
                        >
                          <Button
                            type="text"
                            danger={local.status === "ativo"}
                            icon={local.status === "ativo" ? <StopOutlined /> : <CheckCircleOutlined />}
                            className={
                              local.status === "ativo" ? "hover:!bg-red-500 hover:!text-white" : "hover:!bg-green-500 hover:!text-white"
                            }
                          >
                            {local.status === "ativo" ? "Inativar" : "Reativar"}
                          </Button>
                        </Popconfirm>,
                        <Popconfirm
                          key={`delete-${local.localId}`}
                          title="Excluir Local permanentemente"
                          description="Esta ação irá remover o local permanentemente. Deseja continuar?"
                          onConfirm={() => handlePermanentDelete(local.localId)}
                          okText="Sim, Excluir"
                          cancelText="Não"
                          okButtonProps={{ danger: true }}
                        >
                          <Button type="text" danger icon={<DeleteOutlined />}>
                            Excluir
                          </Button>
                        </Popconfirm>,
                      ]}
                    >
                      <Card.Meta
                        avatar={<Avatar src={getFullImageUrl(local.logoUrl || "")} />}
                        title={local.nomeLocal || (local as any).nome}
                        description={
                          <>
                            <Text>
                              <strong>ID do Local:</strong> {local.localId}
                            </Text>
                            <br />
                            <Text>
                              <strong>Categoria:</strong> {local.categoria || "N/A"}
                            </Text>
                            <br />
                            <Text>
                              <strong>Responsável:</strong> {local.nomeResponsavel || (local as any).responsavel || "N/A"}
                            </Text>
                          </>
                        }
                      />
                    </Card>
                  </Col>
                ))}
              </Row>

              {total > PAGE_SIZE && (
                <div className="mt-6 text-center">
                  <Pagination
                    current={currentPage}
                    pageSize={PAGE_SIZE}
                    total={total}
                    onChange={(page) => setCurrentPage(page)}
                    showSizeChanger={false}
                  />
                </div>
              )}
            </TabPane>

            {sortedCategories.map((cat) => (
              <TabPane tab={`${cat} (${groupedLocais[cat].length})`} key={cat}>
                <Row gutter={[16, 16]}>
                  {groupedLocais[cat].map((local) => (
                    <Col xs={24} md={12} lg={8} key={local.localId}>
                      <Card
                        hoverable
                        className={local.status === "inativo" ? "!bg-gray-50" : undefined}
                        style={local.status === "inativo" ? { opacity: 0.65, filter: "grayscale(1)" } : undefined}
                        actions={[
                          <Button type="text" icon={<EditOutlined />} onClick={() => openEditModal(local)}>
                            Editar
                          </Button>,
                          <Popconfirm key={`toggle-${local.localId}`} title={local.status === "ativo" ? "Inativar Local" : "Reativar Local"} description={local.status === "ativo" ? "Tem certeza que deseja inativar este local?" : "Deseja reativar este local?"} onConfirm={() => handleToggleActive(local.localId)} okText={local.status === "ativo" ? "Sim, Inativar" : "Sim, Reativar"} cancelText="Não" okButtonProps={{ danger: local.status === "ativo" }}>
                            <Button type="text" danger={local.status === "ativo"} icon={local.status === "ativo" ? <StopOutlined /> : <CheckCircleOutlined />} className={local.status === "ativo" ? "hover:!bg-red-500 hover:!text-white" : "hover:!bg-green-500 hover:!text-white"}>
                              {local.status === "ativo" ? "Inativar" : "Reativar"}
                            </Button>
                          </Popconfirm>,
                          <Popconfirm key={`delete-${local.localId}`} title="Excluir Local permanentemente" description="Esta ação irá remover o local permanentemente. Deseja continuar?" onConfirm={() => handlePermanentDelete(local.localId)} okText="Sim, Excluir" cancelText="Não" okButtonProps={{ danger: true }}>
                            <Button type="text" danger icon={<DeleteOutlined />}>Excluir</Button>
                          </Popconfirm>,
                        ]}
                      >
                        <Card.Meta avatar={<Avatar src={getFullImageUrl(local.logoUrl || "")} />} title={local.nomeLocal || (local as any).nome} description={<><Text><strong>ID:</strong> {local.localId}</Text><br/><Text>{local.categoria}</Text></>} />
                      </Card>
                    </Col>
                  ))}
                </Row>

                {groupedLocais[cat].length > PAGE_SIZE && (
                  <div className="mt-6 text-center">
                    <Pagination current={currentPage} pageSize={PAGE_SIZE} total={groupedLocais[cat].length} onChange={(p) => setCurrentPage(p)} showSizeChanger={false} />
                  </div>
                )}
              </TabPane>
            ))}
          </Tabs>
        )}
      </Spin>

      <AdminLocalModal local={selectedItem} visible={isEditModalVisible} onClose={handleModalClose} mode="edit-only" onEditAndApprove={async () => {}} />
    </div>
  );
}
