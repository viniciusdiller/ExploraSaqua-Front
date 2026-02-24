"use client";

import React, { useEffect, useState } from "react";
import {
  Card,
  Statistic,
  Row,
  Col,
  Spin,
  message,
  Typography,
  Button,
} from "antd";
import {
  ArrowLeftOutlined,
  TrophyOutlined,
  BulbOutlined,
  RiseOutlined,
  CheckCircleOutlined,
  BarChartOutlined,
  HomeOutlined,
  GlobalOutlined,
  UserOutlined,
  RocketOutlined,
  ShareAltOutlined,
  DownloadOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/navigation";
import * as api from "@/lib/api";
import Link from "next/link";
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  XAxis,
  YAxis,
  Pie,
  PieChart,
  Cell,
} from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";

const { Title, Text } = Typography;

// --- CORES DINÂMICAS PARA AS CATEGORIAS DO EXPLORESAQUÁ ---
const CATEGORY_COLORS_MAP: { [key: string]: string } = {
  "Praias": "#017DB9", // Azul Primário
  "Igrejas": "#DDA63A", // Dourado
  "Gastronomia": "#E5243B", // Vermelho
  "Hospedagem": "#4C9F38", // Verde
  "Aventura": "#FD6925", // Laranja
  "Cultura": "#A21942", // Vinho
  "Emergências": "#C5192D", // Vermelho Alerta
};

const DEFAULT_COLORS = ["#017DB9", "#007a73", "#B4D55F", "#8884d8", "#26BDE2", "#FCC30B"];

const getCategoryColor = (categoryName: string, index: number) => {
  if (!categoryName) return "#8884d8";
  return CATEGORY_COLORS_MAP[categoryName] || DEFAULT_COLORS[index % DEFAULT_COLORS.length];
};

// --- CONFIGURAÇÃO DE LABELS (RECHARTS) ---
const chartConfigEscala = {
  votos: { label: "Qtd. Locais", color: "#00AEEF" },
} satisfies ChartConfig;

const chartConfigApoio = {
  value: { label: "Interações", color: "#FDB713" },
} satisfies ChartConfig;

const chartConfigViews = {
  views: { label: "Acessos", color: "#8884d8" },
} satisfies ChartConfig;

const chartConfigLocais = {
  qtd: { label: "Locais", color: "#017DB9" },
} satisfies ChartConfig;

export default function AdminIndicadoresPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchStats = async () => {
      const token = localStorage.getItem("admin_token");
      if (!token) {
        router.push("/admin/login");
        return;
      }
      try {
          const stats = await api.getAdminStats(token);
          setData(stats);
        } catch (error) {
          message.error("Erro ao carregar indicadores.");
        } finally {
          setLoading(false);
        }
    };
    fetchStats();
  }, [router]);

  const handleExportIndicators = () => {
    if (!data) {
      message.warning("Aguarde o carregamento dos dados.");
      return;
    }

    try {
      const dataAtual = new Date();
      const dataFormatada = dataAtual.toLocaleString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });

      const metaRows = [
        ["Relatório de Indicadores - ExploreSaquá"],
        ["Gerado em", dataFormatada],
        [],
      ];

      const headers = ["Categoria / Seção", "Indicador", "Valor"];

      // Fallbacks para aceitar tanto variáveis antigas quanto novas da API
      const totalLocais = data.totalLocais || data.totalProjetos || 0;
      
      const fixedRows = [
        ["Resumo Geral", "Locais Ativos", totalLocais],
        ["Resumo Geral", "Média de Avaliações", data.mediaEscala || data.mediaAvaliacoes || 0],
        ["Resumo Geral", "Locais em Destaque", data.statsPspe?.[0]?.value || data.locaisDestaque || 0],
        ["Resumo Geral", "Locais Comuns", data.statsPspe?.[1]?.value || 0],
        ["Tráfego", "Usuários Cadastrados", data.totalUsuarios || 0],
        ["Tráfego", "Acessos Home", data.pageViews?.home || 0],
        ["Tráfego", "Acessos Guias/Explorar", data.pageViews?.espacoOds || data.pageViews?.explorar || 0],
        ["Tráfego", "Interações Especiais/Rotas", data.pageViews?.gameClick || data.pageViews?.rotas || 0],
        ["Tráfego", "Compartilhamentos de Locais", data.pageViews?.compartilhamento || 0],
      ];

      const arrayLocais = data.chartLocaisPorCategoria || data.chartProjetosPorOds || [];
      const ofertaRows = arrayLocais.map((item: any) => [
        "Oferta (Locais Cadastrados)",
        item.categoria || item.ods,
        item.qtd,
      ]);

      const arrayViews = data.chartVisualizacoes || [];
      const demandaRows = arrayViews.map((item: any) => [
        "Demanda (Visualizações/Interesse)",
        item.categoria || item.ods,
        item.views,
      ]);

      const arrayApoio = data.chartApoio || [];
      const apoioRows = arrayApoio.map((item: any) => [
        "Engajamento por Categoria",
        item.label,
        item.value,
      ]);

      const arrayEscala = data.chartEscala || [];
      const escalaRows = arrayEscala.map((item: any) => [
        "Distribuição de Notas",
        item.nota,
        item.votos,
      ]);

      const allRows = [
        ...metaRows,
        headers,
        ...fixedRows,
        ...ofertaRows,
        ...demandaRows,
        ...apoioRows,
        ...escalaRows,
      ];

      const csvContent =
        "\uFEFF" +
        allRows
          .map((row) =>
            row.map((item: string | number) => `"${item}"`).join(";")
          )
          .join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const nomeArquivoDate = dataAtual.toISOString().split("T")[0];
      link.setAttribute(
        "download",
        `indicadores_exploresaqua_${nomeArquivoDate}.csv`
      );
      document.body.appendChild(link);
      link.click();

      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      message.success("Relatório gerado com sucesso!");
    } catch (error) {
      console.error("Erro ao gerar CSV:", error);
      message.error("Erro ao gerar o arquivo.");
    }
  };

  if (loading)
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <Spin size="large" tip="Calculando indicadores do ExploreSaquá..." />
      </div>
    );

  const SummaryCard = ({ title, value, icon, colorBg, colorText, suffix }: any) => (
    <Card
      bordered={false}
      className="shadow-sm h-full"
      styles={{ body: { padding: "20px", background: colorBg, borderRadius: "8px" } }}
    >
      <div className="flex items-center justify-between">
        <div>
          <Text
            type="secondary"
            className="font-medium uppercase text-xs tracking-wider"
            style={{ color: colorText, opacity: 0.8 }}
          >
            {title}
          </Text>
          <Statistic
            value={value}
            valueStyle={{
              color: colorText,
              fontWeight: "800",
              fontSize: "28px",
            }}
            suffix={
              suffix && (
                <span className="text-lg opacity-70 font-semibold ml-1">
                  {suffix}
                </span>
              )
            }
          />
        </div>
        <div
          className="p-3 rounded-full bg-white bg-opacity-30 text-3xl"
          style={{ color: colorText }}
        >
          {icon}
        </div>
      </div>
    </Card>
  );

  const hoverCursorColor = { fill: "#d1d5db", opacity: 0.15 };
  
  // Variáveis unificadas para os gráficos
  const chartLocais = data?.chartLocaisPorCategoria || data?.chartProjetosPorOds || [];
  const chartVisitas = data?.chartVisualizacoes || [];

  return (
    <div className="p-6 min-h-screen bg-[#f4f7fe]">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
          <div className="flex items-center">
            <Link href="/admin/dashboard" passHref>
              <Button icon={<ArrowLeftOutlined />} type="text" className="mr-4">
                Voltar
              </Button>
            </Link>
            <div>
              <Title level={3} style={{ margin: 0, color: "#333" }}>
                Painel de Indicadores
              </Title>
              <Text type="secondary">
                Visão geral do impacto turístico e acessos da plataforma.
              </Text>
            </div>
          </div>

          <Button
            type="primary"
            icon={<DownloadOutlined />}
            onClick={handleExportIndicators}
            style={{ backgroundColor: "#1D6F42", borderColor: "#1D6F42" }}
          >
            Exportar Indicadores (Excel)
          </Button>
        </div>

        {/* 1. CARDS DE RESUMO GERAL */}
        <Row gutter={[16, 16]} className="mb-6">
          <Col xs={24} sm={8}>
            <SummaryCard
              title="Locais Cadastrados"
              value={data?.totalLocais || data?.totalProjetos || 0}
              icon={<BulbOutlined />}
              colorBg="#E6F7FF"
              colorText="#0050B3"
            />
          </Col>
          <Col xs={24} sm={8}>
            <SummaryCard
              title="Média de Avaliações"
              value={data?.mediaAvaliacoes || data?.mediaEscala || 0}
              icon={<RiseOutlined />}
              colorBg="#FFF7E6"
              colorText="#D46B08"
              suffix="/ 5"
            />
          </Col>
          <Col xs={24} sm={8}>
            <SummaryCard
              title="Locais em Destaque"
              value={data?.locaisDestaque || data?.statsPspe?.[0]?.value || 0}
              icon={<TrophyOutlined />}
              colorBg="#FFF0F6"
              colorText="#C41D7F"
              suffix={`de ${data?.totalLocais || data?.totalProjetos || 0}`}
            />
          </Col>
        </Row>

        {/* 2. CARDS DE TRÁFEGO */}
        <Title level={5} className="mb-4 text-gray-500 uppercase text-xs tracking-widest mt-8">
          Tráfego e Engajamento
        </Title>
        <Row gutter={[16, 16]} className="mb-8">
          <Col xs={24} sm={6}>
            <SummaryCard
              title="Usuários Cadastrados"
              value={data?.totalUsuarios || 0}
              icon={<UserOutlined />}
              colorBg="#F6FFED"
              colorText="#389E0D"
            />
          </Col>

          <Col xs={24} sm={6}>
            <SummaryCard
              title="Acessos Página Inicial"
              value={data?.pageViews?.home || 0}
              icon={<HomeOutlined />}
              colorBg="#E6F7FF"
              colorText="#0050B3"
            />
          </Col>

          <Col xs={24} sm={6}>
            <SummaryCard
              title="Acessos Guias de Turismo"
              value={data?.pageViews?.explorar || data?.pageViews?.espacoOds || 0}
              icon={<GlobalOutlined />}
              colorBg="#F0F5FF"
              colorText="#2F54EB"
            />
          </Col>

          <Col xs={24} sm={6}>
            <SummaryCard
              title="Acessos a Rotas/Mapas"
              value={data?.pageViews?.rotas || data?.pageViews?.gameClick || 0}
              icon={<RocketOutlined />}
              colorBg="#FFF2E8"
              colorText="#D4380D"
            />
          </Col>
        </Row>

        {/* 3. GRÁFICOS PRINCIPAIS (COMPARATIVO CATEGORIAS) */}
        <Title level={5} className="mb-4 text-gray-500 uppercase text-xs tracking-widest mt-4">
          Análise por Categoria (Oferta vs Demanda)
        </Title>
        <Row gutter={[16, 16]}>
          {/* OFERTA DE LOCAIS */}
          <Col xs={24} lg={12}>
            <Card
              title={
                <>
                  <BulbOutlined className="mr-2 text-blue-600" />
                  Oferta Turística (Locais Cadastrados)
                </>
              }
              className="shadow-sm rounded-lg h-full"
              size="small"
              bordered={false}
            >
              <Text type="secondary" className="block mb-4 text-xs">
                Quantidade de estabelecimentos e locais ativos por categoria.
              </Text>
              <ChartContainer config={chartConfigLocais} className="h-[300px] w-full">
                <BarChart
                  accessibilityLayer
                  data={chartLocais}
                  margin={{ top: 20, right: 10, left: 10, bottom: 0 }}
                  barSize={24}
                >
                  <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#eee" />
                  <XAxis
                    dataKey={(row) => row.categoria || row.ods}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11, fill: "#666" }}
                    dy={10}
                    interval={0}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis allowDecimals={false} width={30} tick={{ fontSize: 11, fill: "#666" }} />
                  <ChartTooltip
                    cursor={hoverCursorColor}
                    content={<ChartTooltipContent indicator="line" className="bg-white border border-gray-200 shadow-xl" />}
                  />
                  <Bar dataKey="qtd" radius={[4, 4, 0, 0]}>
                    <LabelList
                      dataKey="qtd"
                      position="top"
                      style={{ fill: "#666", fontWeight: "bold", fontSize: 12 }}
                    />
                    {chartLocais.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={getCategoryColor(entry.categoria || entry.ods, index)} />
                    ))}
                  </Bar>
                </BarChart>
              </ChartContainer>
            </Card>
          </Col>

          {/* INTERESSE PÚBLICO */}
          <Col xs={24} lg={12}>
            <Card
              title={
                <>
                  <BarChartOutlined className="mr-2 text-purple-600" />
                  Interesse Público (Acessos)
                </>
              }
              className="shadow-sm rounded-lg h-full"
              size="small"
              bordered={false}
            >
              <Text type="secondary" className="block mb-4 text-xs">
                Categorias mais visitadas pela população e turistas.
              </Text>
              <ChartContainer config={chartConfigViews} className="h-[300px] w-full">
                <BarChart
                  accessibilityLayer
                  data={chartVisitas}
                  margin={{ top: 20, right: 10, left: 10, bottom: 0 }}
                  barSize={24}
                >
                  <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#eee" />
                  <XAxis
                    dataKey={(row) => row.categoria || row.ods}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11, fill: "#666" }}
                    dy={10}
                    interval={0}
                    height={60}
                    angle={-45}
                    textAnchor="end"
                  />
                  <YAxis hide allowDecimals={false} width={30} tick={{ fontSize: 11, fill: "#666" }} />
                  <ChartTooltip
                    cursor={hoverCursorColor}
                    content={<ChartTooltipContent indicator="line" className="bg-white border border-gray-200 shadow-xl" />}
                  />
                  <Bar dataKey="views" radius={[4, 4, 0, 0]}>
                    <LabelList
                      dataKey="views"
                      position="top"
                      style={{ fill: "#666", fontWeight: "bold", fontSize: 12 }}
                    />
                    {chartVisitas.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={getCategoryColor(entry.categoria || entry.ods, index)} />
                    ))}
                  </Bar>
                </BarChart>
              </ChartContainer>
            </Card>
          </Col>
        </Row>

        {/* 4. GRÁFICOS SECUNDÁRIOS */}
        <Row gutter={[16, 16]} className="mt-6">
          {/* ENGANJAMENTO */}
          <Col xs={24} lg={12}>
            <Card
              title={
                <>
                  <CheckCircleOutlined className="mr-2 text-yellow-500" />
                  Engajamento e Interações
                </>
              }
              className="shadow-sm rounded-lg h-full"
              size="small"
              bordered={false}
            >
              <Text type="secondary" className="block mb-4 text-xs">
                Frequência de ações tomadas pelos usuários nos locais.
              </Text>
              <ChartContainer config={chartConfigApoio} className="h-[300px] w-full">
                <BarChart
                  accessibilityLayer
                  data={data?.chartApoio}
                  layout="vertical"
                  margin={{ left: 5, right: 40, top: 10, bottom: 10 }}
                  barSize={24}
                >
                  <CartesianGrid horizontal={false} strokeDasharray="3 3" stroke="#eee" />
                  <YAxis
                    dataKey="label"
                    type="category"
                    tickLine={false}
                    axisLine={false}
                    width={180}
                    tick={{ fontSize: 11, fill: "#666" }}
                  />
                  <XAxis dataKey="value" type="number" hide />
                  <ChartTooltip
                    cursor={hoverCursorColor}
                    content={<ChartTooltipContent indicator="line" className="bg-white border border-gray-200 shadow-xl" />}
                  />
                  <Bar dataKey="value" fill="#017DB9" radius={[0, 4, 4, 0]}>
                    <LabelList
                      dataKey="value"
                      position="right"
                      style={{ fontSize: 12, fontWeight: "bold", fill: "#666" }}
                    />
                  </Bar>
                </BarChart>
              </ChartContainer>
            </Card>
          </Col>

          {/* DISTRIBUIÇÃO DE AVALIAÇÕES */}
          <Col xs={24} lg={12}>
            <Card
              title={
                <>
                  <RiseOutlined className="mr-2 text-blue-500" />
                  Distribuição de Avaliações
                </>
              }
              className="shadow-sm rounded-lg h-full"
              size="small"
              bordered={false}
            >
              <Text type="secondary" className="block mb-4 text-xs">
                Quantidade de locais por nota recebida.
              </Text>
              <ChartContainer config={chartConfigEscala} className="h-[300px] w-full">
                <BarChart
                  accessibilityLayer
                  data={data?.chartEscala}
                  margin={{ top: 20, right: 10, left: 10, bottom: 0 }}
                  barSize={32}
                >
                  <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#eee" />
                  <XAxis
                    dataKey="nota"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 12, fill: "#666" }}
                    dy={10}
                  />
                  <YAxis hide />
                  <ChartTooltip
                    cursor={hoverCursorColor}
                    content={<ChartTooltipContent indicator="dashed" className="bg-white border border-gray-200 shadow-xl" />}
                  />
                  <Bar dataKey="votos" fill="#00AEEF" radius={[8, 8, 0, 0]}>
                    <LabelList
                      dataKey="votos"
                      position="top"
                      style={{ fill: "#666", fontWeight: "bold", fontSize: 12 }}
                    />
                  </Bar>
                </BarChart>
              </ChartContainer>
            </Card>
          </Col>
        </Row>
      </div>
    </div>
  );
}