// lib/api.ts

const API_URL = process.env.NEXT_PUBLIC_API_URL;

/**
 * Função genérica para chamadas à API.
 * Trata autenticação (Bearer Token) e redirecionamento em caso de erro 401.
 */
async function fetchApi(path: string, options: RequestInit = {}) {
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  // Se tiver body e não for FormData, define como JSON
  if (options.body && !(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  // Se passar Authorization nos headers, mantém
  if (options.headers && "Authorization" in options.headers) {
    headers["Authorization"] = (options.headers as Record<string, string>)[
      "Authorization"
    ];
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  // Ler o body como texto e tentar parsear JSON de forma segura
  const text = await response.text();
  let data: any = {};
  if (text) {
    try {
      data = JSON.parse(text);
    } catch (e) {
      // Se não for JSON válido, manter o texto cru para usos futuros
      data = text;
    }
  }

  if (!response.ok) {
    if (response.status === 401) {
      // SÓ REDIRECIONA SE O 401 NÃO VIER DA PÁGINA DE LOGIN
      if (path !== "/api/auth/login") {
        localStorage.removeItem("user");
        window.location.href = "/login";
        throw new Error("Sessão expirada. Redirecionando para login...");
      }
    }

    const errorMessage =
      typeof data === "object" && data && (data.message || data.error)
        ? data.message || data.error
        : typeof data === "string"
        ? data
        : `API error: ${response.statusText}`;
    throw new Error(errorMessage);
  }

  return data;
}

// ==========================================
// AUTENTICAÇÃO E USUÁRIOS
// ==========================================

export const registerUser = (data: any) =>
  fetchApi("/api/auth/cadastro", {
    method: "POST",
    body: JSON.stringify(data),
  });

export const loginUser = (data: any) =>
  fetchApi("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(data),
  });

export const confirmAccount = (token: string) =>
  fetchApi(`/api/auth/confirm-account?token=${token}`, {
    method: "GET",
  });

export const updateUserProfile = (
  data: { nomeCompleto?: string; email?: string; chosenAvatar?: string },
  token: string
) =>
  fetchApi("/api/users/profile", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

export const changeUserPassword = (
  data: { currentPassword?: string; newPassword?: string },
  token: string
) =>
  fetchApi("/api/users/password", {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

export const requestPasswordReset = (data: { email: string }) =>
  fetchApi("/api/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify(data),
  });

export const resetPassword = (data: { token: string; newPassword: string }) =>
  fetchApi("/api/auth/reset-password", {
    method: "POST",
    body: JSON.stringify(data),
  });

export const deleteUserAccount = (token: string) =>
  fetchApi("/api/users/profile", {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

export const confirmEmailChange = (token: string) =>
  fetchApi(`/api/auth/confirm-email-change?token=${token}`, {
    method: "GET",
  });

// ==========================================
// LOCAIS (Antigos Projetos)
// ==========================================

export const getAllLocais = () => fetchApi("/api/locais");

export const getAllLocaisAtivos = async () => {
  try {
    return await fetchApi("/api/locais/ativos");
  } catch {
    // Fallback para ambientes onde a rota dedicada ainda nao existe.
    return await getAllLocais();
  }
};

export const getLocaisByCategoria = (categoria: string) =>
  fetchApi(`/api/locais/categoria/${encodeURIComponent(categoria)}`);

export const getLocalById = (id: string) => fetchApi(`/api/locais/${id}`);

export const getLocalByNome = (nome: string) =>
  fetchApi(`/api/locais/nome/${encodeURIComponent(nome)}`);

export const cadastrarLocal = (data: FormData, token?: string) =>
  fetchApi("/api/locais", {
    method: "POST",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: data,
  });

export const solicitarAtualizacaoLocal = (
  id: string,
  data: FormData,
  token?: string
) =>
  fetchApi(`/api/locais/solicitar-atualizacao/${id}`, {
    method: "PUT",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: data,
  });

export const solicitarExclusaoLocal = (id: string, data: any, token?: string) =>
  fetchApi(`/api/locais/solicitar-exclusao/${id}`, {
    method: "POST",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(data),
  });

// ==========================================
// AVALIAÇÕES (Reviews)
// ==========================================

export const getReviewsByLocal = (id: string) =>
  fetchApi(`/api/avaliacoes/locais/${id}`);

export const submitReview = (data: any, token: string) =>
  fetchApi("/api/avaliacoes", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

export const deleteReview = (id: number, token: string) =>
  fetchApi(`/api/avaliacoes/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

// ==========================================
// ADMINISTRAÇÃO
// ==========================================

export const getPendingAdminRequests = (token: string) =>
  fetchApi("/api/admin/pending", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

export const getAllActiveLocal = async (token: string): Promise<any> => {
  // adiciona timestamp e força no-store para evitar caches intermediários e garantir que os dados venham do backend
  const url = `${API_URL}/api/admin/locais-ativos?_=${Date.now()}`;
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: 'no-store',
  });
  if (!response.ok) {
    throw new Error("Falha ao buscar locais ativos");
  }
  return response.json();
};

// Busca locais inativos usando a rota dedicada do backend
export const getAllInactiveLocal = async (token: string): Promise<any> => {
  const url = `${API_URL}/api/admin/locais-inativos?_=${Date.now()}`;
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error("Falha ao buscar locais inativos");
  }

  return response.json();
};

// Busca locais pelo campo `status` no backend (ex: 'ativo' ou 'inativo')
export const getLocaisAdminByStatus = async (
  status: 'ativo' | 'inativo',
  token: string
): Promise<any> => {
  const url = `${API_URL}/api/admin/locais?status=${encodeURIComponent(status)}&_=${Date.now()}`;
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`Falha ao buscar locais com status ${status}`);
  }

  return response.json();
};

export const adminUpdateLocal = async (
  id: number,
  data: any,
  token: string
) => {
  const response = await fetch(`${API_URL}/api/admin/local/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Falha ao atualizar local");
  }
  return response.json();
};

export const adminDeleteLocal = async (id: number, token: string) => {
  const response = await fetch(`${API_URL}/api/admin/local/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Falha ao excluir local");
  }
  return { success: true };
};

export const adminGetReviewsByLocal = (localId: string, token: string) =>
  fetchApi(`/api/admin/avaliacoes/local/${localId}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

export const adminDeleteReview = (id: number, token: string) =>
  fetchApi(`/api/admin/avaliacoes/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

export const adminExportLocais = async (token: string) => {
  const response = await fetch(`${API_URL}/api/admin/exportar-locais`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Falha ao exportar locais");
  }

  // Retorna o Blob do arquivo para download
  return response.blob();
};

// Alterna o status ativo/inativo de um local (toggle)
export const adminToggleLocalAtivo = async (id: number, token: string) => {
  const response = await fetch(`${API_URL}/api/admin/local/${id}/ativo`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Falha ao alternar status do local");
  }

  return response.json();
};

// ==========================================
// ADMIN - USUÁRIOS (compatível com outro projeto)
// ==========================================

export const getAllUsers = (token: string, enable?: 0 | 1) => {
  const qs = enable !== undefined ? `?enable=${encodeURIComponent(String(enable))}&_=${Date.now()}` : `?_=${Date.now()}`;
  return fetchApi(`/api/admin/users${qs}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const adminUpdateUser = (id: number, data: any, token: string) =>
  fetchApi(`/api/admin/users/${id}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

export const adminDeleteUser = (id: number, token: string) =>
  fetchApi(`/api/admin/users/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

export const adminChangeUserPassword = (
  id: number,
  newPassword: string,
  token: string,
) =>
  fetchApi(`/api/admin/users/${id}/password`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ newPassword }),
  });

export const adminResendConfirmation = (id: number | string, token: string) =>
  fetchApi(`/api/admin/users/${id}/resend-confirmation`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

// ==========================================
// UTILITÁRIOS E ANALYTICS
// ==========================================

export const registerShareClick = () =>
  fetchApi("/api/locais/visualizacao/COMPARTILHAMENTO", {
    method: "POST",
  });

/**
 * Remove emojis de uma string.
 * @param text A string de entrada.
 * @returns A string sem emojis.
 */
export const removeEmojis = (text: string): string => {
  if (!text) return "";
  // Regex que corresponde aos emojis para substituí-los por uma string vazia
  return text.replace(
    /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu,
    ""
  );
};

/**
 * Formata uma data para o formato "Mês de Ano" em português.
 * Exemplo: "outubro de 2025"
 * @param dateString A data em formato de string (ex: "2025-10-15T...")
 * @returns A data formatada.
 */
export function formatarDataParaMesAno(dateString: string): string {
  if (!dateString) {
    return "";
  }
  const data = new Date(dateString);
  return new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric",
  }).format(data);
}

export function getAdminStats(token: string) {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  return fetch(`${API_URL}/api/admin/indicadores`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }).then(async (res) => {
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Falha ao buscar indicadores");
    }
    return res.json();
  });
}

// Marca visita de um usuário a um local
export const markVisit = (userId: number, localId: number, token: string) =>
  fetchApi(`/api/users/${userId}/visits`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ localId }),
  });

// Busca o progresso do usuário (porcentagem de locais visitados)
export const getUserProgress = (userId: number, token: string) =>
  fetchApi(`/api/users/${userId}/progress`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

export async function hasUserVisited(userId: number, localId: number, token?: string) {
  if (!userId || !localId) return false;
  const url = `${process.env.NEXT_PUBLIC_API_URL || ""}/api/users/${userId}/visits/${localId}`;
  try {
    const resp = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    // 404 significa que não existe registro dessa visita
    if (resp.status === 404) return false;

    // Se não OK, considerar falso (defensivo)
    if (!resp.ok) return false;

    // Tentar parse seguro
    const text = await resp.text();
    if (!text) return false;
    try {
      const data = JSON.parse(text);
      if (typeof data === "object" && data !== null) {
        if (typeof data.visited !== "undefined") return Boolean(data.visited);
        if (typeof data.alreadyVisited !== "undefined") return Boolean(data.alreadyVisited);
        // se backend retornar sucesso sem campo, considerar true
        return true;
      }
    } catch (e) {
      // resposta não-JSON, mas status OK => considerar true
      return true;
    }

    return false;
  } catch (e) {
    console.warn("Erro em hasUserVisited:", e);
    return false;
  }
}
