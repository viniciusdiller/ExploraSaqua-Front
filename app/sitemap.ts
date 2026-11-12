import { MetadataRoute } from "next";

// --- INÍCIO DA CONFIGURAÇÃO ---

// 1. URL PÚBLICA (para o Google)
// TODO: definir NEXT_PUBLIC_SITE_URL no ambiente de produção assim que o domínio
// final do ExploreSaqua existir (não usar "aquitemods.saquarema.rj.gov.br", que é
// o domínio de um projeto diferente).
const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3004";

// 2. URL INTERNA (para o Next.js buscar os dados no backend)
const backendApiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3005";

// Categorias reais do ExploreSaqua (mesmos ids usados em app/page.tsx e nos links
// "/categoria/{id}" — mantenha esta lista em sincronia se novas categorias forem
// adicionadas lá).
const CATEGORY_IDS = [
  "comercio-e-lojas",
  "educacao-e-capacitacao",
  "emergencias",
  "esportes",
  "eventos-e-agenda",
  "hospedagem",
  "industria",
  "mei-de-saqua",
  "saude-e-bem-estar",
  "servicos-publicos",
  "supermercado-e-feiras",
  "turismo-e-lazer",
  "utilidades-e-informacoes-gerais",
];

interface Local {
  localId: number;
  nomeLocal: string | null;
  categoria: string | null;
  updatedAt: string;
}

// --- FIM DA CONFIGURAÇÃO ---

// Função principal do sitemap
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // 1. Buscar locais ativos (páginas dinâmicas de cada estabelecimento)
  let localRoutes: MetadataRoute.Sitemap = [];
  try {
    const res = await fetch(`${backendApiBaseUrl}/api/locais`, {
      next: { revalidate: 3600 }, // Atualiza a cada 1 hora
    });

    if (!res.ok) {
      throw new Error(`Sitemap: Falha ao buscar locais: ${res.statusText}`);
    }

    const locais: Local[] = await res.json();

    localRoutes = locais
      .filter((local) => local.nomeLocal && local.categoria)
      .map((local) => ({
        url: `${baseUrl}/categoria/${local.categoria}/${encodeURIComponent(local.nomeLocal as string)}`,
        lastModified: new Date(local.updatedAt),
        priority: 0.6,
        changeFrequency: "monthly" as const,
      }));
  } catch (error) {
    console.error("Sitemap: Erro ao gerar sitemap para locais:", error);
  }

  // 2. Páginas de Categoria
  const categoryRoutes: MetadataRoute.Sitemap = CATEGORY_IDS.map((categoryId) => ({
    url: `${baseUrl}/categoria/${categoryId}`,
    lastModified: new Date(),
    priority: 0.8,
    changeFrequency: "weekly",
  }));

  // 3. Páginas Estáticas (só as públicas — páginas de conta/admin ficam de fora)
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/`,
      lastModified: new Date(),
      priority: 1.0,
      changeFrequency: "daily",
    },
    {
      url: `${baseUrl}/sobre`,
      lastModified: new Date(),
      priority: 0.8,
      changeFrequency: "monthly",
    },
    {
      url: `${baseUrl}/FAQ`,
      lastModified: new Date(),
      priority: 0.7,
      changeFrequency: "monthly",
    },
    {
      url: `${baseUrl}/espaco-explore`,
      lastModified: new Date(),
      priority: 0.7,
      changeFrequency: "weekly",
    },
    {
      url: `${baseUrl}/meis-saqua`,
      lastModified: new Date(),
      priority: 0.7,
      changeFrequency: "monthly",
    },
    {
      url: `${baseUrl}/cadastro-locais`,
      lastModified: new Date(),
      priority: 0.6,
      changeFrequency: "monthly",
    },
  ];

  // 4. Combina todas as rotas
  return [...staticRoutes, ...categoryRoutes, ...localRoutes];
}
