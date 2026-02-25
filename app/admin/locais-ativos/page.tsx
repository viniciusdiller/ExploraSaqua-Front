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
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeftOutlined,
  EditOutlined,
  DeleteOutlined,
  DownloadOutlined,
  BarChartOutlined,
} from "@ant-design/icons";
import {
  getAllActiveLocal,
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
  const cleanPath = normalizedPath.startsWith("/")
    ? normalizedPath.substring(1)
    : normalizedPath;
  return `${API_URL}/${cleanPath}`;
};

const LocaisAtivosPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [locais, setLocais] = useState<Local[]>([]);
  const [filteredLocais, setFilteredLocais] = useState<Local[]>([]);
  const [selectedItem, setSelectedItem] = useState<Local | null>(null);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const router = useRouter();
  const screens = useBreakpoint();

  const fetchData = useCallback(async () => {
    setLoading(true);
    const token = localStorage.getItem("admin_token");
    if (!token) {
      message.error("Acesso negado.");
      router.push("/admin/login");
      return;
    }
    try {
      const data = await getAllActiveLocal(token);
      setLocais(data);
      setFilteredLocais(data);
    } catch (error: any) {
      message.error(error.message || "Falha ao buscar locais.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // --- LÓGICA DE BUSCA ATUALIZADA PARA LOCAIS ---
  const handleSearch = (value: string) => {
    const lowerCaseValue = value.toLowerCase();
    const filtered = locais.filter((l) => {
      const nome = l.nomeLocal || (l as any).nome || "";
      const responsavel = l.nomeResponsavel || (l as any).responsavel || "";
      const categoria = l.categoria || "";

      return (
        nome.toLowerCase().includes(lowerCaseValue) ||
        responsavel.toLowerCase().includes(lowerCaseValue) ||
        categoria.toLowerCase().includes(lowerCaseValue) ||
        String(l.localId).includes(lowerCaseValue)
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
    if (shouldRefresh) {
      fetchData();
    }
  };

  const handleDelete = async (localId: number) => {
    const token = localStorage.getItem("admin_token");
    if (!token) {
      message.error("Autenticação expirada.");
      return;
    }

    setLoading(true);
    try {
      await adminDeleteLocal(localId, token);
      message.success("Local excluído com sucesso!");
      fetchData();
    } catch (error: any) {
      message.error(error.message || "Falha ao excluir o local.");
      setLoading(false);
    }
  };

  // --- EXPORTAR LOCAIS ---
  const handleExport = async () => {
    const token = localStorage.getItem("admin_token");
    if (!token) {
      message.error("Sessão expirada.");
      return;
    }

    setExporting(true);
    try {
      const blob = await adminExportLocais(token);

      // Cria um link temporário para forçar o download
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `locais_ExploreSaqua_${
        new Date().toISOString().split("T")[0]
      }.csv`; // Nome do arquivo atualizado
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      message.success("Relatório gerado com sucesso!");
    } catch (error: any) {
      console.error(error);
      message.error("Erro ao gerar relatório. Tente novamente.");
    } finally {
      setExporting(false);
    }
  };

  const handleTabChange = () => {
    setCurrentPage(1);
  };

  // Agrupa os locais por Categoria
  const groupedLocais = filteredLocais.reduce((acc, local) => {
    const categoria = local.categoria || "Sem Categoria";
    if (!acc[categoria]) {
      acc[categoria] = [];
    }
    acc[categoria].push(local);
    return acc;
  }, {} as { [key: string]: Local[] });

  // Ordena as categorias alfabeticamente
  const sortedCategories = Object.keys(groupedLocais).sort((a, b) => {
    if (a === "Sem Categoria") return 1;
    if (b === "Sem Categoria") return -1;
    return a.localeCompare(b);
  });

  const tabPosition = screens.md ? "left" : "top";

  const totalTodos = filteredLocais.length;
  const paginatedTodos = filteredLocais.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

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
              className="bg-[#D7386E] hover:!bg-[#b32e5a] border-[#D7386E] hover:!border-[#2e5491] text-white"
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
            Exportar Locais Ativos (CSV)
          </Button>
        </div>
      </div>

      <Title level={2} className="mb-6">
        Gerenciar Locais Ativos ({locais.length})
      </Title>

      <Search
        placeholder="Buscar por ID, nome, categoria ou responsável..."
        onSearch={handleSearch}
        onChange={(e) => handleSearch(e.target.value)}
        enterButton
        size="large"
        className="mb-6"
      />

      <Spin spinning={loading}>
        {filteredLocais.length === 0 && !loading ? (
          <Empty description="Nenhum local ativo encontrado." />
        ) : (
          <Tabs
            defaultActiveKey="todos"
            tabPosition={tabPosition}
            onChange={handleTabChange}
          >
            <TabPane tab={`Todos os Locais (${totalTodos})`} key="todos">
              <Row gutter={[16, 16]}>
                {paginatedTodos.map((local) => (
                  <Col xs={24} md={12} lg={8} key={local.localId}>
                    <Card
                      hoverable
                      actions={[
                        <Button
                          type="text"
                          icon={<EditOutlined />}
                          onClick={() => openEditModal(local)}
                          className="hover:!bg-blue-500 hover:!text-white"
                        >
                          Editar
                        </Button>,
                        <Popconfirm
                          key="delete"
                          title="Excluir Local"
                          description="Tem certeza que deseja excluir este local? Esta ação não pode ser desfeita."
                          onConfirm={() => handleDelete(local.localId)}
                          okText="Sim, Excluir"
                          cancelText="Não"
                          okButtonProps={{ danger: true }}
                        >
                          <Button
                            type="text"
                            danger
                            icon={<DeleteOutlined />}
                            className="hover:!bg-red-500 hover:!text-white"
                          >
                            Excluir
                          </Button>
                        </Popconfirm>,
                      ]}
                    >
                      <Card.Meta
                        avatar={
                          <Avatar
                            src={getFullImageUrl(local.logoUrl || "")}
                          />
                        }
                        title={local.nomeLocal || (local as any).nome}
                        description={
                          <>
                            <Text>
                              <strong>ID do Local:</strong>{" "}
                              {local.localId}
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

              {totalTodos > PAGE_SIZE && (
                <div className="mt-6 text-center">
                  <Pagination
                    current={currentPage}
                    pageSize={PAGE_SIZE}
                    total={totalTodos}
                    onChange={(page) => setCurrentPage(page)}
                    showSizeChanger={false}
                  />
                </div>
              )}
            </TabPane>

            {sortedCategories.map((categoria) => {
              const allLocaisForCat = groupedLocais[categoria];
              const totalCount = allLocaisForCat.length;
              const locaisToShow = allLocaisForCat.slice(
                (currentPage - 1) * PAGE_SIZE,
                currentPage * PAGE_SIZE
              );

              return (
                <TabPane tab={`${categoria} (${allLocaisForCat.length})`} key={categoria}>
                  <Row gutter={[16, 16]}>
                    {locaisToShow.map((local) => (
                      <Col xs={24} md={12} lg={8} key={local.localId}>
                        <Card
                          hoverable
                          actions={[
                            <Button
                              type="text"
                              icon={<EditOutlined />}
                              onClick={() => openEditModal(local)}
                              className="hover:!bg-blue-500 hover:!text-white"
                            >
                              Editar
                            </Button>,
                            <Popconfirm
                              key="delete"
                              title="Excluir Local"
                              description="Tem certeza que deseja excluir este local? Esta ação não pode ser desfeita."
                              onConfirm={() => handleDelete(local.localId)}
                              okText="Sim, Excluir"
                              cancelText="Não"
                              okButtonProps={{ danger: true }}
                            >
                              <Button
                                type="text"
                                danger
                                icon={<DeleteOutlined />}
                                className="hover:!bg-red-500 hover:!text-white"
                              >
                                Excluir
                              </Button>
                            </Popconfirm>,
                          ]}
                        >
                          <Card.Meta
                            avatar={
                              <Avatar
                                src={getFullImageUrl(local.logoUrl || "")}
                              />
                            }
                            title={local.nomeLocal || (local as any).nome}
                            description={
                              <>
                                <Text>
                                  <strong>ID do Local:</strong>{" "}
                                  {local.localId}
                                </Text>
                                <br />
                                <Text>
                                  <strong>Categoria:</strong>{" "}
                                  {local.categoria || "N/A"}
                                </Text>
                                <br />
                                <Text>
                                  <strong>Responsável:</strong>{" "}
                                  {local.nomeResponsavel || (local as any).responsavel || "N/A"}
                                </Text>
                              </>
                            }
                          />
                        </Card>
                      </Col>
                    ))}
                  </Row>

                  {/* Paginação para as abas de Categoria */}
                  {totalCount > PAGE_SIZE && (
                    <div className="mt-6 text-center">
                      <Pagination
                        current={currentPage}
                        pageSize={PAGE_SIZE}
                        total={totalCount}
                        onChange={(page) => setCurrentPage(page)}
                        showSizeChanger={false}
                      />
                    </div>
                  )}
                </TabPane>
              );
            })}
          </Tabs>
        )}
      </Spin>

      {/* MODAL DE EDIÇÃO ATUALIZADO */}
      <AdminLocalModal
        local={selectedItem}
        visible={isEditModalVisible}
        onClose={handleModalClose}
        mode="edit-only"
        onEditAndApprove={async () => {}}
      />
    </div>
  );
};

export default LocaisAtivosPage;