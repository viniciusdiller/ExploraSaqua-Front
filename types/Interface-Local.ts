// types/Interface-Local.ts

// Tipo auxiliar para imagens (para suportar ID e URL, útil no gerenciamento)
export interface Imagens {
  id: string | number;
  url: string;
}

// Tipo para dados de atualização pendente (Lógica do Admin)
export interface DadosAtualizacaoLocal {
  nome?: string;
  descricao?: string;
  descricaoDiferencial?: string;
  categoria?: string;
  logo?: string;
  imagens?: string[]; // URLs das novas imagens sugeridas
  outrasAlteracoes?: string; // Texto livre do usuário
  [key: string]: any;
}

export interface Local {
  alvaraFuncionamentoUrl: string | null | undefined;
  nomeResponsavel: any;
  localImages?: { id: number; url: string }[];
  localId: number; 
  slug: string;
  createdAt: string | Date;
  updatedAt: string | Date;
  criadoPor: string;

  // Status e Administração
  // Valores possíveis (conforme sua entity)
  status: "pendente_aprovacao" | "ativo" | "inativo" | "pendente_atualizacao" | "pendente_exclusao" | "rejeitado";
  aprovado: boolean;
  dados_atualizacao?: DadosAtualizacaoLocal | null; // Para aprovação de edits
  oficioUrl?: string | null; // Mantido para burocracia/admin
  // Flag de ativação (soft-delete)
  active?: boolean;

  // Dados Principais
  nome: string;
  nomeLocal?: string;
  descricao: string; // Descrição completa (HTML/Rich Text)
  categoria: string; // Ex: "Restaurantes", "Hospedagens" (string direta ou ID)

  // Mídia
  logoUrl?: string | null;
  localImg?: Imagens[];
  // Array de objetos de imagem

  // Localização e Responsabilidade
  bairro?: string;
  endereco?: string;

  // Contato e Redes
  instagram?: string;

  // Métricas e Legado
  visualizacoes: number;
  media: number; // Média de avaliação (0-5)
  countAvaliacoes: number; // Total de avaliações

  // Geolocalização
  latitude?: number | null;
  longitude?: number | null;
}

// Cores das Categorias
export const categoryColors: Record<string, string> = {
  "comercio-e-lojas": "from-gray-400 to-gray-500",
  "educacao-e-capacitacao": "from-indigo-400 to-blue-500",
  emergencias: "from-red-400 to-red-500",
  esportes: "from-green-400 to-green-500",
  "eventos-e-agenda": "from-yellow-400 to-yellow-500",
  hospedagem: "from-blue-400 to-blue-500",
  industria: "from-gray-400 to-gray-500",
  "mei-de-saqua": "from-gray-400 to-gray-500",
  "saude-e-bem-estar": "from-pink-400 to-red-500",
  "servicos-publicos": "from-gray-400 to-gray-500",
  "supermercado-e-feiras": "from-green-400 to-green-500",
  "turismo-e-lazer": "from-blue-400 to-blue-500",
  "utilidades-e-informacoes-gerais": "from-gray-400 to-gray-500",
  default: "from-blue-500 to-cyan-500",
};

export const getCategoryColor = (catId: string | undefined) => {
  if (!catId) return categoryColors["default"];
  const normalizedKey = catId
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "-");

  return categoryColors[normalizedKey] || categoryColors["default"];
};
