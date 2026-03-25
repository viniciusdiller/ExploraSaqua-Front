export type PerfilEstabelecimentoStatus =
  | "pendente_aprovacao"
  | "ativo"
  | "inativo"
  | "pendente_atualizacao"
  | "pendente_exclusao"
  | "rejeitado";

export interface PerfilEstabelecimentoImagem {
  url: string;
}

export interface PerfilEstabelecimento {
  localId: number;
  usuarioId: number | null;
  nomeLocal: string | null;
  categoria: string | null;
  descricao: string | null;
  endereco: string | null;
  instagram: string | null;
  logoUrl?: string | null;
  logo?: string | null;
  status: PerfilEstabelecimentoStatus;
  ativo: boolean | null;
  locaisImg: PerfilEstabelecimentoImagem[];
}

export interface PerfilEstabelecimentosResponse {
  total: number;
  locais: PerfilEstabelecimento[];
}
