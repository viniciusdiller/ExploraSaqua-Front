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

  const text = await response.text();
  const data = text ? JSON.parse(text) : {};

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
      typeof data === "object" && data.message
        ? data.message
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

export const getLocaisByCategoria = (categoria: string) =>
  fetchApi(`/api/locais/categoria/${encodeURIComponent(categoria)}`);

export const getLocalById = (id: string) => fetchApi(`/api/locais/${id}`);

export const getLocalByNome = (nome: string) =>
  fetchApi(`/api/locais/nome/${encodeURIComponent(nome)}`);

export const cadastrarLocal = (data: FormData) =>
  fetchApi("/api/locais", {
    method: "POST",
    body: data,
  });

export const solicitarAtualizacaoLocal = (id: string, data: FormData) =>
  fetchApi(`/api/locais/solicitar-atualizacao/${id}`, {
    method: "PUT",
    body: data,
  });

export const solicitarExclusaoLocal = (id: string, data: any) =>
  fetchApi(`/api/locais/solicitar-exclusao/${id}`, {
    method: "POST",
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
  const response = await fetch(`${API_URL}/api/admin/locais-ativos`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!response.ok) {
    throw new Error("Falha ao buscar locais ativos");
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

export const getDashboardStats = (token: string): Promise<any> =>
  fetchApi("/api/admin/dashboard-stats", {
    method: "GET",
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
  throw new Error("Function not implemented.");
}
