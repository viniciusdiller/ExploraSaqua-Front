// lib/api.ts
const API_URL = process.env.NEXT_PUBLIC_API_URL;

// --- FUNÇÃO FETCHAPI IDÊNTICA AO AQUITEMODS ---
async function fetchApi(path: string, options: RequestInit = {}) {
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  if (options.body && !(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

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

// --- AUTH (MANTIDO IDÊNTICO) ---
export const registerUser = (data: any) =>
  fetchApi("/api/auth/cadastro", {
    method: "POST",
    body: JSON.stringify(data),
  });

export const loginUser = (data: any) =>
  fetchApi("/api/auth/login", { method: "POST", body: JSON.stringify(data) });

export const confirmAccount = (token: string) =>
  fetchApi(`/api/auth/confirm-account?token=${token}`, { method: "GET" });

export const updateUserProfile = (data: any, token: string) =>
  fetchApi("/api/users/profile", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(data),
  });

// ... (Outras funções de User mantidas iguais: changeUserPassword, deleteUserAccount, etc.)

// --- LOCAIS (REFATORADO DE PROJETOS) ---

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

// --- AVALIAÇÕES (MANTIDO LÓGICA, MUDADO ENDPOINT) ---

export const getReviewsByLocal = (id: string) =>
  fetchApi(`/api/avaliacoes/locais/${id}`); // Antes: /projetos/${id}

export const submitReview = (data: any, token: string) =>
  fetchApi("/api/avaliacoes", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(data),
  });

// ... (deleteReview, etc mantidos)

// --- ADMIN (REFATORADO) ---

export const getAllActiveLocais = async (token: string) => {
  // Rota hipotética do backend
  return fetchApi("/api/admin/locais-ativos", {
    headers: { Authorization: `Bearer ${token}` },
  });
};

export const adminUpdateLocal = async (
  id: number,
  data: any,
  token: string
) => {
  return fetchApi(`/api/admin/local/${id}`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(data),
  });
};

export const adminDeleteLocal = async (id: number, token: string) => {
  return fetchApi(`/api/admin/local/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
};

// ... Utilitários (removeEmojis, formatarData) mantidos iguais.
