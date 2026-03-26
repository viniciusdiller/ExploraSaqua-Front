import {
  PerfilEstabelecimento,
  PerfilEstabelecimentosResponse,
} from "@/types/profile-estabelecimentos";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function getPerfilEstabelecimentos(
  token: string
): Promise<PerfilEstabelecimentosResponse> {
  const response = await fetch(
    `${API_URL}/api/users/profile/estabelecimentos`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    }
  );

  const text = await response.text();
  let data: unknown = {};

  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem("user");
      window.location.href = "/login";
      throw new Error("Sessão expirada. Redirecionando para login...");
    }

    const fallbackMessage = "Falha ao carregar seus estabelecimentos.";
    if (typeof data === "object" && data) {
      const maybeMessage = (data as { message?: string; error?: string }).message;
      const maybeError = (data as { message?: string; error?: string }).error;
      throw new Error(maybeMessage || maybeError || fallbackMessage);
    }
    if (typeof data === "string" && data.trim()) {
      throw new Error(data);
    }
    throw new Error(fallbackMessage);
  }

  return (data as PerfilEstabelecimentosResponse) || { total: 0, locais: [] };
}

type AtualizacaoPerfilEstabelecimentoInput = {
  nomeLocal?: string;
  categoria?: string;
  descricao?: string;
  endereco?: string;
  instagram?: string;
  logo?: File | null;
  imagens?: File[];
};

function extrairMensagemErro(data: unknown, fallback: string) {
  if (typeof data === "object" && data) {
    const maybeMessage = (data as { message?: string; error?: string }).message;
    const maybeError = (data as { message?: string; error?: string }).error;
    return maybeMessage || maybeError || fallback;
  }

  if (typeof data === "string" && data.trim()) {
    if (data.trim().startsWith("<!DOCTYPE")) {
      return fallback;
    }
    return data;
  }

  return fallback;
}

export async function updatePerfilEstabelecimento(
  localId: number,
  token: string,
  input: AtualizacaoPerfilEstabelecimentoInput
): Promise<PerfilEstabelecimento> {
  const formData = new FormData();

  if (input.nomeLocal) formData.append("nomeLocal", input.nomeLocal);
  if (input.categoria) formData.append("categoria", input.categoria);
  if (input.descricao) formData.append("descricao", input.descricao);
  if (input.endereco) formData.append("endereco", input.endereco);
  if (input.instagram) formData.append("instagram", input.instagram);
  if (input.logo) formData.append("logo", input.logo);
  input.imagens?.forEach((imagem) => {
    formData.append("imagens", imagem);
  });

  const response = await fetch(
    `${API_URL}/api/users/profile/estabelecimentos/${localId}`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    }
  );

  const text = await response.text();
  let data: unknown = {};

  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem("user");
      window.location.href = "/login";
      throw new Error("Sessão expirada. Redirecionando para login...");
    }

    if (response.status === 413) {
      throw new Error("Os arquivos enviados são muito grandes.");
    }

    const fallbackMessage =
      "Falha ao atualizar estabelecimento. Verifique os dados e os arquivos enviados.";
    throw new Error(extrairMensagemErro(data, fallbackMessage));
  }

  return data as PerfilEstabelecimento;
}
