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
  Grid,
  Pagination,
} from "antd";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeftOutlined, CommentOutlined } from "@ant-design/icons";
import { getAllActiveLocal, adminGetReviewsByLocal } from "@/lib/api";
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

const AdminComentariosPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [locais, setLocais] = useState<Local[]>([]);
  const [filteredLocais, setFilteredLocais] = useState<Local[]>([]);
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
      // Busca todos os locais ativos no sistema
      const allLocais = await getAllActiveLocal(token);

      const locaisComComentarios: Local[] = [];

      for (const local of allLocais) {
        try {
          const response = await adminGetReviewsByLocal(
            String(local.localId),
            token
          );
          let reviewsList = [];
          if (Array.isArray(response)) {
            reviewsList = response;
          } else if (response && Array.isArray(response.data)) {
            reviewsList = response.data;
          } else if (response && Array.isArray(response.reviews)) {
            reviewsList = response.reviews;
          } else if (response && Array.isArray(response.avaliacoes)) {
            reviewsList = response.avaliacoes;
          }

          if (reviewsList.length > 0) {
            locaisComComentarios.push(local);
          }
        } catch (error) {
          console.error(
            `Erro ao verificar avaliações do local ${local.localId}:`,
            error
          );
        }
      }
      setLocais(locaisComComentarios);
      setFilteredLocais(locaisComComentarios);
    } catch (error: any) {
      message.error(error.message || "Falha ao buscar locais.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Lógica de busca atualizada para os novos campos
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

  const handleTabChange = () => {
    setCurrentPage(1);
  };

  // Agrupa locais pelas suas Categorias
  const groupedLocais = filteredLocais.reduce((acc, local) => {
    const categoria = local.categoria || "Sem Categoria";
    if (!acc[categoria]) {
      acc[categoria] = [];
    }
    acc[categoria].push(local);
    return acc;
  }, {} as { [key: string]: Local[] });

  // Ordena categorias alfabeticamente
  const sortedCategories = Object.keys(groupedLocais).sort((a, b) => {
    if (a === "Sem Categoria") return 1;
    if (b === "Sem Categoria") return -1;
    return a.localeCompare(b);
  });

  const tabPosition = screens.md ? "left" : "top";

  // Paginação para a aba "Todos"
  const totalTodos = filteredLocais.length;
  const paginatedTodos = filteredLocais.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  return (
    <div className="p-4 md:p-8">
      <Link href="/admin/dashboard" passHref>
        <Button icon={<ArrowLeftOutlined />} type="text" className="mb-4">
          Voltar ao Dashboard
        </Button>
      </Link>

      <Title level={2} className="mb-6">
        Gerenciar Comentários por Local ({locais.length})
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
          <Empty description="Nenhum local com comentários encontrado." />
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
                        <Link
                          href={`/admin/comentarios/${local.localId}`}
                          passHref
                          key="comentarios"
                        >
                          <Button
                            type="text"
                            icon={<CommentOutlined />}
                            className="hover:!bg-blue-500 hover:!text-white"
                          >
                            Ver Comentários
                          </Button>
                        </Link>,
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
                              <strong>ID do Local:</strong> {local.localId}
                            </Text>
                            <br />
                            <Text>
                              <strong>Categoria:</strong> {local.categoria || "N/A"}
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

            {/* Abas de Categoria */}
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
                            <Link
                              href={`/admin/comentarios/${local.localId}`}
                              passHref
                              key="comentarios"
                            >
                              <Button
                                type="text"
                                icon={<CommentOutlined />}
                                className="hover:!bg-blue-500 hover:!text-white"
                              >
                                Ver Comentários
                              </Button>
                            </Link>,
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
                                  <strong>ID do Local:</strong> {local.localId}
                                </Text>
                                <br />
                                <Text>
                                  <strong>Categoria:</strong> {local.categoria || "N/A"}
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

                  {/* Lógica de paginação por aba */}
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
    </div>
  );
};

export default AdminComentariosPage;