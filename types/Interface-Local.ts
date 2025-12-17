// types/Interface-Local.ts
// Baseado em types/Interface-Projeto.ts
export interface Local {
  id: number;
  nome: string; // Antes: nomeProjeto
  descricao: string; // Antes: descricaoProjeto
  categoriaId: string; // Antes: odsId (Ex: "restaurantes", "trilhas")
  imagemCapa?: string; // Antes: imagemCapa
  galeriaImagens?: string[];
  autorId: number;
  autorNome: string;
  dataCriacao: string;
  aprovado: boolean;

  // Mantendo a lógica de visualizações e avaliações
  visualizacoes: number;
  mediaAvaliacao?: number;
  totalAvaliacoes?: number;

  // Metadados específicos que existiam no projeto (ex: público alvo virar algo genérico ou manter)
  endereco?: string; // Adaptado de metadados genéricos
  telefone?: string;
  website?: string;
}

// lib/categoryColors.ts
// Baseado em lib/odsColors.ts, mas usando as cores do ExploraSaqua
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
  // Fallback
  default: "from-blue-500 to-cyan-500",
};

export const getCategoryColor = (catId: string) => {
  return categoryColors[catId] || categoryColors["default"];
};
