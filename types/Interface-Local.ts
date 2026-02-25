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
  // Identificadores e Sistema
  localId: number; // Padronizado para localId (antes era id ou projetoId)
  slug: string;
  createdAt: string | Date;
  updatedAt: string | Date;
  criadoPor: string;

  // Status e Administração
status: "aprovado" | "pendente" | "pendente_atualizacao" | "rejeitado" | "pendente_exclusao";  
  aprovado: boolean;
  dados_atualizacao?: DadosAtualizacaoLocal | null; // Para aprovação de edits
  oficioUrl?: string | null; // Mantido para burocracia/admin

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

// Cores das Categorias (Mantido e expandido)
export const categoryColors: Record<string, string> = {
  restaurantes: "from-orange-400 to-red-500",
  "pontos-turisticos": "from-blue-400 to-purple-500",
  trilhas: "from-green-400 to-emerald-500",
  "telefones-uteis": "from-red-400 to-pink-500",
  escolas: "from-indigo-400 to-blue-500",
  supermercados: "from-yellow-400 to-orange-500",
  transporte: "from-cyan-400 to-blue-500",
  hospedagens: "from-purple-400 to-pink-500",
  eventos: "from-rose-400 to-red-500",
  "lazer-e-esporte": "from-amber-400 to-yellow-500",
  "espacos-culturais": "from-violet-400 to-purple-500",
  praias: "from-teal-400 to-cyan-500",
  "mulheres-e-criancas": "from-pink-400 to-red-600",
  compras: "from-gray-400 to-gray-500",
  emergencias: "from-red-600 to-rose-700",
  feiras: "from-green-400 to-lime-300",
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
