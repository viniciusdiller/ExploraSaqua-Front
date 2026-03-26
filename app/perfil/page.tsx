"use client";

import { useAuth } from "@/context/AuthContext";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import {
  updateUserProfile,
  changeUserPassword,
  deleteUserAccount,
  getUserProgress,
} from "@/lib/api";
import { cn } from "@/lib/utils";
import { contemPalavrao } from "@/lib/profanityFilter";
import { removeEmojis, containsEmoji, isValidEmail } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getPerfilEstabelecimentos,
  updatePerfilEstabelecimento,
} from "@/lib/profile-estabelecimentos";
import {
  PerfilEstabelecimento,
  PerfilEstabelecimentoStatus,
} from "@/types/profile-estabelecimentos";

type EstabelecimentoFiltro = "todos" | "ativos" | "pendentes" | "inativos";
const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

type FormularioEdicaoEstabelecimento = {
  nomeLocal: string;
  categoria: string;
  endereco: string;
  instagram: string;
  descricao: string;
};

export default function PerfilPage() {
  const { user, logout, isLoading, updateUser: updateUserContext } = useAuth();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");

  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);
  const [editUsername, setEditUsername] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const [progressPercentage, setProgressPercentage] = useState<number | null>(null);
  const [isFetchingProgress, setIsFetchingProgress] = useState(false);
  const [userTag, setUserTag] = useState<string | null>(null);
  const [visitedCount, setVisitedCount] = useState<number | null>(null);
  const [totalLocations, setTotalLocations] = useState<number | null>(null);
  const [meusEstabelecimentos, setMeusEstabelecimentos] = useState<
    PerfilEstabelecimento[]
  >([]);
  const [totalEstabelecimentos, setTotalEstabelecimentos] = useState(0);
  const [isLoadingEstabelecimentos, setIsLoadingEstabelecimentos] =
    useState(false);
  const [erroEstabelecimentos, setErroEstabelecimentos] = useState<
    string | null
  >(null);
  const [filtroStatus, setFiltroStatus] =
    useState<EstabelecimentoFiltro>("todos");
  const [isDetalhesEstabelecimentoOpen, setIsDetalhesEstabelecimentoOpen] =
    useState(false);
  const [estabelecimentoSelecionado, setEstabelecimentoSelecionado] =
    useState<PerfilEstabelecimento | null>(null);
  const [isEditandoEstabelecimento, setIsEditandoEstabelecimento] =
    useState(false);
  const [isSalvandoEstabelecimento, setIsSalvandoEstabelecimento] =
    useState(false);
  const [formularioEdicao, setFormularioEdicao] =
    useState<FormularioEdicaoEstabelecimento>({
      nomeLocal: "",
      categoria: "",
      endereco: "",
      instagram: "",
      descricao: "",
    });
  const [novaLogo, setNovaLogo] = useState<File | null>(null);
  const [novasImagens, setNovasImagens] = useState<File[]>([]);
  const [previewNovaLogo, setPreviewNovaLogo] = useState<string | null>(null);
  const [previewNovasImagens, setPreviewNovasImagens] = useState<string[]>([]);
  const inputLogoRef = useRef<HTMLInputElement | null>(null);
  const inputImagensRef = useRef<HTMLInputElement | null>(null);

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valueComEmoji = e.target.value;
    const valueSemEmoji = removeEmojis(valueComEmoji);

    if (valueComEmoji !== valueSemEmoji) {
      toast.error("Não é possível adicionar emojis", {
        id: "emoji-profile-toast",
      });
    }

    setEditUsername(valueSemEmoji);
  };
  const handleProfileDialogOpenChange = (open: boolean) => {
    setIsProfileDialogOpen(open);
    if (open && user) {
      setEditUsername(user.username || "");
      setEditEmail(user.email || "");
    }
  };

  useEffect(() => {
    if (user) {
      setUsername(user.username || "");
      setEmail(user.email || "");
    }
  }, [user]);

  useEffect(() => {
    const fetchProgress = async () => {
      if (!user || !user.token) return;
      const userId = Number(user.usuarioId ?? 0);
      if (!userId) return;
      try {
        setIsFetchingProgress(true);
        const resp = await getUserProgress(userId, user.token);
        // Preencher campos retornados pelo backend (percentual, tag e contagens)
        if (resp) {
          if (typeof resp.progressPercentage !== "undefined") {
            const pct = Number(resp.progressPercentage);
            if (!Number.isNaN(pct)) setProgressPercentage(pct);
          }
          if (typeof resp.tag !== "undefined") {
            setUserTag(String(resp.tag));
          }
          if (typeof resp.visitedCount !== "undefined") {
            const v = Number(resp.visitedCount);
            if (!Number.isNaN(v)) setVisitedCount(v);
          }
          if (typeof resp.totalLocations !== "undefined") {
            const t = Number(resp.totalLocations);
            if (!Number.isNaN(t)) setTotalLocations(t);
          }
          // Se backend não fornecer porcentagem, calcular a partir das contagens
          if (typeof resp.progressPercentage === "undefined") {
            if (typeof resp.visitedCount !== "undefined" && typeof resp.totalLocations !== "undefined" && resp.totalLocations > 0) {
              const calc = (Number(resp.visitedCount) / Number(resp.totalLocations)) * 100;
              if (!Number.isNaN(calc)) setProgressPercentage(calc);
            }
          }
        }
      } catch (err) {
        console.warn("Erro ao buscar progresso do usuário (perfil):", err);
      } finally {
        setIsFetchingProgress(false);
      }
    };

    fetchProgress();
  }, [user]);

  const fetchMeusEstabelecimentos = async () => {
    if (!user?.token) return [] as PerfilEstabelecimento[];

    try {
      setIsLoadingEstabelecimentos(true);
      setErroEstabelecimentos(null);
      const resp = await getPerfilEstabelecimentos(user.token);
      const locais = Array.isArray(resp.locais) ? resp.locais : [];
      setMeusEstabelecimentos(locais);
      setTotalEstabelecimentos(Number(resp.total) || 0);
      return locais;
    } catch {
      setErroEstabelecimentos("Falha ao carregar seus estabelecimentos.");
      return [] as PerfilEstabelecimento[];
    } finally {
      setIsLoadingEstabelecimentos(false);
    }
  };

  useEffect(() => {
    fetchMeusEstabelecimentos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.token]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Carregando perfil...</p>
      </div>
    );
  }

  if (!user) {
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
    return null;
  }

  const handleProfileUpdate = async () => {
    if (contemPalavrao(username)) {
      toast.error("Você utilizou palavras inapropriadas no nome de usuário.");
      return;
    }
    if (
      editEmail.toLowerCase() !== user.email.toLowerCase() &&
      !isValidEmail(editEmail)
    ) {
      toast.error("Por favor, insira um e-mail válido.");
      return;
    }
    if (!user?.token) {
      toast.error("Erro de autenticação. Por favor, faça login novamente.");
      return;
    }

    const profileData = {
      username: editUsername !== user.username ? editUsername : undefined,
      email:
        editEmail.toLowerCase() !== user.email.toLowerCase()
          ? editEmail
          : undefined,
    };

    if (!profileData.username && !profileData.email) {
      toast.info("Nenhuma alteração foi feita.");
      setIsProfileDialogOpen(false);
      return;
    }

    setIsUpdatingProfile(true);
    try {
      const updatedUser = await updateUserProfile(profileData, user.token);
      updateUserContext(updatedUser);

      if (profileData.email) {
        toast.success(
          "Dados atualizados! Um e-mail de confirmação foi enviado para o seu novo endereço."
        );
      } else {
        toast.success("Nome de usuário atualizado com sucesso!");
      }
      setIsProfileDialogOpen(false);
    } catch (error: any) {
      toast.error(`Erro ao atualizar perfil: ${error.message}`);
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handlePasswordChange = async () => {
    if (!newPassword || !currentPassword) {
      toast.error("Preencha todos os campos de senha.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("As novas senhas não coincidem.");
      return;
    }
    if (!user?.token) {
      toast.error("Erro de autenticação. Por favor, faça login novamente.");
      return;
    }

    setIsChangingPassword(true);
    try {
      await changeUserPassword({ currentPassword, newPassword }, user.token);
      toast.success("Senha alterada com sucesso!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setIsPasswordDialogOpen(false);
    } catch (error: any) {
      toast.error(`Erro ao alterar senha: ${error.message}`);
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user?.token) {
      toast.error("Erro de autenticação. Por favor, faça login novamente.");
      return;
    }

    try {
      await deleteUserAccount(user.token);
      toast.success("Conta excluída com sucesso. Você será desconectado.");
      setTimeout(() => {
        logout();
      }, 2000);
    } catch (error: any) {
      toast.error(`Erro ao excluir a conta: ${error.message}`);
    }
  };

  const getStatusLabel = (status: PerfilEstabelecimentoStatus) => {
    const statusLabelMap: Record<PerfilEstabelecimentoStatus, string> = {
      ativo: "Ativo",
      inativo: "Inativo",
      pendente_aprovacao: "Pendente de aprovação",
      pendente_atualizacao: "Pendente de atualização",
      pendente_exclusao: "Pendente de exclusão",
      rejeitado: "Rejeitado",
    };

    return statusLabelMap[status] || "Sem status";
  };

  const getStatusBadgeClass = (status: PerfilEstabelecimentoStatus) => {
    if (status === "ativo") {
      return "bg-emerald-100 text-emerald-800 border-emerald-200";
    }
    if (status === "inativo") {
      return "bg-zinc-100 text-zinc-700 border-zinc-200";
    }
    if (status === "rejeitado") {
      return "bg-rose-100 text-rose-800 border-rose-200";
    }
    return "bg-amber-100 text-amber-800 border-amber-200";
  };

  const resumirEndereco = (endereco: string | null) => {
    if (!endereco) return "Endereço não informado";
    if (endereco.length <= 60) return endereco;
    return `${endereco.slice(0, 57)}...`;
  };

  const limparHtml = (texto: string | null | undefined) => {
    if (!texto) return "";
    return texto
      .replace(/<[^>]*>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  };

  const normalizarUrlImagem = (url: string | null | undefined) => {
    if (!url) return null;

    const semBarrasInvertidas = url.replace(/\\/g, "/");

    if (/^https?:\/\//i.test(semBarrasInvertidas)) {
      return semBarrasInvertidas;
    }

    const caminhoLimpo = semBarrasInvertidas.startsWith("/")
      ? semBarrasInvertidas.slice(1)
      : semBarrasInvertidas;

    if (!API_URL) {
      return `/${caminhoLimpo}`;
    }

    return `${API_URL.replace(/\/$/, "")}/${caminhoLimpo}`;
  };

  const abrirDetalhesEstabelecimento = (local: PerfilEstabelecimento) => {
    setEstabelecimentoSelecionado(local);
    setFormularioEdicao({
      nomeLocal: local.nomeLocal || "",
      categoria: local.categoria || "",
      endereco: local.endereco || "",
      instagram: local.instagram || "",
      descricao: limparHtml(local.descricao),
    });
    if (previewNovaLogo) {
      URL.revokeObjectURL(previewNovaLogo);
    }
    previewNovasImagens.forEach((url) => URL.revokeObjectURL(url));
    setNovaLogo(null);
    setNovasImagens([]);
    setPreviewNovaLogo(null);
    setPreviewNovasImagens([]);
    setIsEditandoEstabelecimento(false);
    setIsDetalhesEstabelecimentoOpen(true);
  };

  const atualizarCampoEdicao = (
    campo: keyof FormularioEdicaoEstabelecimento,
    valor: string
  ) => {
    setFormularioEdicao((prev) => ({ ...prev, [campo]: valor }));
  };

  const handleLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const arquivo = event.target.files?.[0] || null;
    if (previewNovaLogo) {
      URL.revokeObjectURL(previewNovaLogo);
    }
    setNovaLogo(arquivo);
    setPreviewNovaLogo(arquivo ? URL.createObjectURL(arquivo) : null);
  };

  const handleImagensChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const arquivos = Array.from(event.target.files || []);
    previewNovasImagens.forEach((url) => URL.revokeObjectURL(url));
    setNovasImagens(arquivos);
    setPreviewNovasImagens(arquivos.map((arquivo) => URL.createObjectURL(arquivo)));
  };

  const removerNovaLogoSelecionada = () => {
    if (previewNovaLogo) {
      URL.revokeObjectURL(previewNovaLogo);
    }
    setNovaLogo(null);
    setPreviewNovaLogo(null);
    if (inputLogoRef.current) {
      inputLogoRef.current.value = "";
    }
  };

  const removerNovaImagemSelecionada = (index: number) => {
    setNovasImagens((prev) => prev.filter((_, currentIndex) => currentIndex !== index));
    setPreviewNovasImagens((prev) => {
      const urlRemovida = prev[index];
      if (urlRemovida) {
        URL.revokeObjectURL(urlRemovida);
      }
      return prev.filter((_, currentIndex) => currentIndex !== index);
    });
    if (inputImagensRef.current) {
      inputImagensRef.current.value = "";
    }
  };

  const salvarEstabelecimento = async () => {
    if (!estabelecimentoSelecionado || !user?.token) {
      toast.error("Erro de autenticação. Faça login novamente.");
      return;
    }

    const payload = {
      nomeLocal: removeEmojis(formularioEdicao.nomeLocal.trim()),
      categoria: formularioEdicao.categoria.trim(),
      endereco: removeEmojis(formularioEdicao.endereco.trim()),
      instagram: formularioEdicao.instagram.trim(),
      descricao: removeEmojis(formularioEdicao.descricao.trim()),
      logo: novaLogo,
      imagens: novasImagens,
    };

    if (
      (payload.nomeLocal && contemPalavrao(payload.nomeLocal)) ||
      (payload.descricao && contemPalavrao(payload.descricao))
    ) {
      toast.error("Remova palavras inapropriadas antes de salvar.");
      return;
    }

    const houveAlteracaoTexto =
      payload.nomeLocal !== (estabelecimentoSelecionado.nomeLocal || "") ||
      payload.categoria !== (estabelecimentoSelecionado.categoria || "") ||
      payload.endereco !== (estabelecimentoSelecionado.endereco || "") ||
      payload.instagram !== (estabelecimentoSelecionado.instagram || "") ||
      payload.descricao !== limparHtml(estabelecimentoSelecionado.descricao);

    if (!houveAlteracaoTexto && !payload.logo && payload.imagens.length === 0) {
      toast.info("Nenhuma alteração foi feita.");
      return;
    }

    setIsSalvandoEstabelecimento(true);
    try {
      const atualizado = await updatePerfilEstabelecimento(
        estabelecimentoSelecionado.localId,
        user.token,
        payload
      );

      const locaisAtualizados = await fetchMeusEstabelecimentos();
      const atualizadoRefetch = locaisAtualizados.find(
        (item) => item.localId === estabelecimentoSelecionado.localId
      );
      const estabelecimentoFinal = atualizadoRefetch
        ? atualizadoRefetch
        : combinarEstabelecimentoAtualizado(estabelecimentoSelecionado, atualizado);

      setMeusEstabelecimentos((prev) =>
        prev.map((item) =>
          item.localId === estabelecimentoFinal.localId ? estabelecimentoFinal : item
        )
      );
      setEstabelecimentoSelecionado(estabelecimentoFinal);
      setFormularioEdicao({
        nomeLocal: estabelecimentoFinal.nomeLocal || "",
        categoria: estabelecimentoFinal.categoria || "",
        endereco: estabelecimentoFinal.endereco || "",
        instagram: estabelecimentoFinal.instagram || "",
        descricao: limparHtml(estabelecimentoFinal.descricao),
      });
      if (previewNovaLogo) {
        URL.revokeObjectURL(previewNovaLogo);
      }
      previewNovasImagens.forEach((url) => URL.revokeObjectURL(url));
      setNovaLogo(null);
      setNovasImagens([]);
      setPreviewNovaLogo(null);
      setPreviewNovasImagens([]);
      setIsEditandoEstabelecimento(false);
      toast.success("Estabelecimento atualizado com sucesso.");
    } catch (error: any) {
      toast.error(
        error?.message ||
          "Falha ao atualizar estabelecimento. Verifique os arquivos enviados."
      );
    } finally {
      setIsSalvandoEstabelecimento(false);
    }
  };

  const obterImagemCapa = (local: PerfilEstabelecimento) => {
    const logo = normalizarUrlImagem(local.logoUrl || local.logo);
    if (logo) return logo;
    return normalizarUrlImagem(local.locaisImg?.[0]?.url);
  };

  const obterLogoAtual = (local: PerfilEstabelecimento) => {
    return normalizarUrlImagem(local.logoUrl || local.logo);
  };

  const obterImagensAtuais = (local: PerfilEstabelecimento) => {
    return (local.locaisImg || [])
      .map((imagem) => normalizarUrlImagem(imagem?.url))
      .filter((url): url is string => Boolean(url));
  };

  const combinarEstabelecimentoAtualizado = (
    anterior: PerfilEstabelecimento,
    parcial: PerfilEstabelecimento
  ): PerfilEstabelecimento => {
    return {
      ...anterior,
      ...parcial,
      logoUrl: parcial.logoUrl ?? anterior.logoUrl,
      logo: parcial.logo ?? anterior.logo,
      locaisImg:
        Array.isArray(parcial.locaisImg) && parcial.locaisImg.length > 0
          ? parcial.locaisImg
          : anterior.locaisImg,
    };
  };

  const estabelecimentosFiltrados = meusEstabelecimentos.filter((local) => {
    if (filtroStatus === "ativos") {
      return local.status === "ativo";
    }
    if (filtroStatus === "inativos") {
      return local.status === "inativo";
    }
    if (filtroStatus === "pendentes") {
      return local.status.startsWith("pendente");
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Meu Perfil</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-1">
            <Card className="rounded-xl shadow-md">
              <CardHeader className="text-center flex flex-col items-center">
                <Image
                  src="/avatars/default-avatar.png"
                  alt="Avatar"
                  width={96}
                  height={96}
                  className="w-24 h-24 rounded-full mx-auto mb-4 border-2 border-[#d04798] object-cover"
                />
                <CardTitle>{user.nomeCompleto}</CardTitle>
                {userTag && (
                  <div className="mt-1 text-sm text-gray-600 font-medium px-3 py-1 bg-[#e6f7f6] rounded-full">
                    {userTag}
                  </div>
                )}
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <Button
                  onClick={logout}
                  variant="destructive"
                  className="w-full rounded-xl transition-all transform hover:scale-105 active:scale-95 border-2 border-transparent hover:border-red-700"
                >
                  Sair
                </Button>
              </CardContent>
            </Card>
          </div>
          <div className="md:col-span-2 space-y-8">
            {/* Card de Configurações da Conta */}
            <Card className="rounded-xl shadow-md">
              <CardHeader>
                <CardTitle>Configurações da Conta</CardTitle>
                <CardDescription>
                  Altere seu nome de usuário e e-mail.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Progresso</Label>
                  <div className="mt-2">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-600">Locais visitados</div>
                      <div className="text-lg font-bold">
                        {isFetchingProgress ? (
                          <Loader2 className="inline-block h-4 w-4 animate-spin" />
                        ) : progressPercentage !== null ? (
                          `${progressPercentage.toFixed(2)}%` +
                          (visitedCount !== null && totalLocations !== null ? ` (${visitedCount}/${totalLocations})` : "")
                        ) : (
                          "—"
                        )}
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 h-3 rounded-full overflow-hidden mt-2">
                      <div
                        className="bg-gradient-to-r from-[#017DB9] to-[#007a73] h-full transition-all"
                        style={{ width: `${progressPercentage ? Math.round(progressPercentage) : 0}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
                <div>
                  <Label htmlFor="currentUsername">Nome de Usuário</Label>
                  <Input
                    id="currentUsername"
                    value={username}
                    readOnly
                    disabled
                    className="mt-1 bg-gray-100 cursor-not-allowed"
                  />
                </div>
                <div>
                  <Label htmlFor="currentEmail">Email</Label>
                  <Input
                    id="currentEmail"
                    value={email}
                    readOnly
                    disabled
                    className="mt-1 bg-gray-100 cursor-not-allowed"
                  />
                </div>
              </CardContent>
              <CardFooter className="flex justify-center">
                <Dialog
                  open={isProfileDialogOpen}
                  onOpenChange={handleProfileDialogOpenChange}
                >
                  <DialogTrigger asChild>
                    <Button className="w-fit rounded-full bg-gray-800 text-white transition-all transform hover:scale-105 hover:bg-gray-700 active:scale-95">
                      Alterar Dados
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Editar Perfil</DialogTitle>
                      <DialogDescription>
                        Faça alterações no seu perfil aqui. Clique em salvar
                        quando terminar.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div>
                        <Label htmlFor="usernameEdit">Nome de Usuário</Label>
                        <Input
                          id="usernameEdit"
                          value={editUsername}
                          onChange={handleUsernameChange}
                          className="mt-1 w-full py-2
                          rounded-2xl border border-gray-200 bg-white shadow-sm
                          focus:ring-2 focus:border-[#017db9] transition-all duration-300 placeholder:text-gray-400"
                        />
                      </div>
                      <div>
                        <Label htmlFor="emailEdit">E-mail</Label>
                        <Input
                          id="emailEdit"
                          value={editEmail}
                          onChange={(e) => setEditEmail(e.target.value)}
                          className="mt-1 w-full py-2
                          rounded-2xl border border-gray-200 bg-white shadow-sm
                          focus:ring-2 focus:border-[#017db9] transition-all duration-300 placeholder:text-gray-400"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <DialogClose asChild>
                        <Button
                          variant="outline"
                          className="rounded-full transition-all transform hover:scale-105"
                          disabled={isUpdatingProfile}
                        >
                          Cancelar
                        </Button>
                      </DialogClose>
                      <Button
                        onClick={handleProfileUpdate}
                        className="w-fit rounded-full transition-all transform hover:scale-105 active:scale-95 border-2 border-transparent hover:border-[#017db9]"
                        disabled={isUpdatingProfile}
                      >
                        {isUpdatingProfile && (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        {isUpdatingProfile
                          ? "Salvando..."
                          : "Salvar Alterações"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardFooter>
            </Card>

            <Card className="rounded-xl shadow-md">
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <CardTitle>Meus Estabelecimentos</CardTitle>
                    <CardDescription>
                      Total cadastrado: {totalEstabelecimentos}
                    </CardDescription>
                  </div>
                  <div className="flex items-center flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant={filtroStatus === "todos" ? "default" : "outline"}
                      onClick={() => setFiltroStatus("todos")}
                    >
                      Todos
                    </Button>
                    <Button
                      size="sm"
                      variant={filtroStatus === "ativos" ? "default" : "outline"}
                      onClick={() => setFiltroStatus("ativos")}
                    >
                      Ativos
                    </Button>
                    <Button
                      size="sm"
                      variant={
                        filtroStatus === "pendentes" ? "default" : "outline"
                      }
                      onClick={() => setFiltroStatus("pendentes")}
                    >
                      Pendentes
                    </Button>
                    <Button
                      size="sm"
                      variant={filtroStatus === "inativos" ? "default" : "outline"}
                      onClick={() => setFiltroStatus("inativos")}
                    >
                      Inativos
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {isLoadingEstabelecimentos ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Array.from({ length: 4 }).map((_, idx) => (
                      <div
                        key={`skeleton-estabelecimento-${idx}`}
                        className="overflow-hidden rounded-xl border"
                      >
                        <Skeleton className="h-36 w-full rounded-none" />
                        <div className="p-4 space-y-3">
                          <Skeleton className="h-5 w-2/3" />
                          <Skeleton className="h-4 w-1/3" />
                          <Skeleton className="h-4 w-full" />
                          <Skeleton className="h-9 w-28" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : erroEstabelecimentos ? (
                  <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
                    <p>{erroEstabelecimentos}</p>
                    <Button
                      variant="outline"
                      className="mt-3"
                      onClick={fetchMeusEstabelecimentos}
                    >
                      Tentar novamente
                    </Button>
                  </div>
                ) : totalEstabelecimentos === 0 ? (
                  <div className="rounded-xl border border-dashed p-6 text-center text-gray-600">
                    Você ainda não cadastrou estabelecimentos. Quando cadastrar,
                    eles aparecerão aqui.
                  </div>
                ) : estabelecimentosFiltrados.length === 0 ? (
                  <div className="rounded-xl border border-dashed p-6 text-center text-gray-600">
                    Nenhum estabelecimento encontrado para o filtro selecionado.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {estabelecimentosFiltrados.map((local) => {
                      const capa = obterImagemCapa(local);
                      const nomeLocal = local.nomeLocal || "Estabelecimento sem nome";
                      return (
                        <div
                          key={local.localId}
                          className="border rounded-xl overflow-hidden bg-white"
                        >
                          {capa ? (
                            <img
                              src={capa}
                              alt={`Capa de ${nomeLocal}`}
                              className="w-full h-40 object-cover"
                              loading="lazy"
                              onError={(e) => {
                                e.currentTarget.src = "/avatars/default-avatar.png";
                              }}
                            />
                          ) : (
                            <div className="w-full h-40 bg-gray-100 flex items-center justify-center text-gray-500 text-sm">
                              Sem imagem de capa
                            </div>
                          )}

                          <div className="p-4 space-y-3">
                            <div className="flex items-start justify-between gap-3">
                              <h3 className="font-semibold text-gray-900 line-clamp-2">
                                {nomeLocal}
                              </h3>
                              <Badge
                                variant="outline"
                                className={getStatusBadgeClass(local.status)}
                              >
                                {getStatusLabel(local.status)}
                              </Badge>
                            </div>

                            <p className="text-sm text-gray-600">
                              Categoria: {local.categoria || "Não informada"}
                            </p>
                            <p className="text-sm text-gray-600 line-clamp-2">
                              {resumirEndereco(local.endereco)}
                            </p>

                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => abrirDetalhesEstabelecimento(local)}
                            >
                              Ver detalhes
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            <Dialog
              open={isDetalhesEstabelecimentoOpen}
              onOpenChange={(open) => {
                setIsDetalhesEstabelecimentoOpen(open);
                if (!open) {
                  setIsEditandoEstabelecimento(false);
                  if (previewNovaLogo) {
                    URL.revokeObjectURL(previewNovaLogo);
                  }
                  previewNovasImagens.forEach((url) => URL.revokeObjectURL(url));
                  setNovaLogo(null);
                  setNovasImagens([]);
                  setPreviewNovaLogo(null);
                  setPreviewNovasImagens([]);
                }
              }}
            >
              <DialogContent className="sm:max-w-[640px] max-h-[90vh] overflow-hidden">
                <DialogHeader>
                  <DialogTitle>
                    {estabelecimentoSelecionado?.nomeLocal ||
                      "Detalhes do estabelecimento"}
                  </DialogTitle>
                  <DialogDescription>
                    Visualização dos dados do seu estabelecimento, mesmo em
                    status pendente.
                  </DialogDescription>
                </DialogHeader>

                {estabelecimentoSelecionado && (
                  <div className="max-h-[calc(90vh-13rem)] overflow-y-auto pr-2 space-y-4">
                    {obterImagemCapa(estabelecimentoSelecionado) ? (
                      <img
                        src={obterImagemCapa(estabelecimentoSelecionado) as string}
                        alt={`Capa de ${
                          estabelecimentoSelecionado.nomeLocal ||
                          "estabelecimento"
                        }`}
                        className="w-full h-52 object-cover rounded-lg border"
                        onError={(e) => {
                          e.currentTarget.src = "/avatars/default-avatar.png";
                        }}
                      />
                    ) : (
                      <div className="w-full h-52 rounded-lg border bg-gray-100 flex items-center justify-center text-gray-500 text-sm">
                        Sem imagem disponível
                      </div>
                    )}

                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm text-gray-600">
                        Categoria: {estabelecimentoSelecionado.categoria || "Não informada"}
                      </p>
                      <Badge
                        variant="outline"
                        className={getStatusBadgeClass(
                          estabelecimentoSelecionado.status
                        )}
                      >
                        {getStatusLabel(estabelecimentoSelecionado.status)}
                      </Badge>
                    </div>

                    {isEditandoEstabelecimento ? (
                      <div className="space-y-4 text-sm text-gray-700">
                        <div>
                          <Label htmlFor="edit-nome-local">Nome do estabelecimento</Label>
                          <Input
                            id="edit-nome-local"
                            value={formularioEdicao.nomeLocal}
                            onChange={(e) =>
                              atualizarCampoEdicao("nomeLocal", e.target.value)
                            }
                          />
                        </div>
                        <div>
                          <Label htmlFor="edit-categoria">Categoria</Label>
                          <Input
                            id="edit-categoria"
                            value={formularioEdicao.categoria}
                            onChange={(e) =>
                              atualizarCampoEdicao("categoria", e.target.value)
                            }
                          />
                        </div>
                        <div>
                          <Label htmlFor="edit-endereco">Endereço</Label>
                          <Input
                            id="edit-endereco"
                            value={formularioEdicao.endereco}
                            onChange={(e) =>
                              atualizarCampoEdicao("endereco", e.target.value)
                            }
                          />
                        </div>
                        <div>
                          <Label htmlFor="edit-instagram">Instagram</Label>
                          <Input
                            id="edit-instagram"
                            value={formularioEdicao.instagram}
                            onChange={(e) =>
                              atualizarCampoEdicao("instagram", e.target.value)
                            }
                          />
                        </div>
                        <div>
                          <Label htmlFor="edit-descricao">Descrição</Label>
                          <textarea
                            id="edit-descricao"
                            value={formularioEdicao.descricao}
                            onChange={(e) =>
                              atualizarCampoEdicao("descricao", e.target.value)
                            }
                            className="flex min-h-28 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                          />
                        </div>
                        <div>
                          <Label htmlFor="edit-logo">Nova logo</Label>
                          {obterLogoAtual(estabelecimentoSelecionado) && (
                            <div className="mb-3">
                              <p className="mb-2 text-xs text-gray-500">Logo atual</p>
                              <img
                                src={obterLogoAtual(estabelecimentoSelecionado) as string}
                                alt="Logo atual do estabelecimento"
                                className="h-24 w-24 rounded-lg border object-cover"
                                onError={(e) => {
                                  e.currentTarget.src = "/avatars/default-avatar.png";
                                }}
                              />
                            </div>
                          )}
                          <Input
                            ref={inputLogoRef}
                            id="edit-logo"
                            type="file"
                            accept="image/*"
                            onChange={handleLogoChange}
                          />
                          {novaLogo && (
                            <p className="mt-2 text-xs text-gray-500">
                              Arquivo selecionado: {novaLogo.name}
                            </p>
                          )}
                          {previewNovaLogo && (
                            <div className="mt-3 flex items-start gap-3">
                              <img
                                src={previewNovaLogo}
                                alt="Preview da nova logo"
                                className="h-24 w-24 rounded-lg border object-cover"
                              />
                              <Button
                                type="button"
                                variant="outline"
                                onClick={removerNovaLogoSelecionada}
                                disabled={isSalvandoEstabelecimento}
                              >
                                Remover foto
                              </Button>
                            </div>
                          )}
                        </div>
                        <div>
                          <Label htmlFor="edit-imagens">Novas imagens do portfólio</Label>
                          {obterImagensAtuais(estabelecimentoSelecionado).length > 0 && (
                            <div className="mb-3">
                              <p className="mb-2 text-xs text-gray-500">Imagens atuais</p>
                              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                                {obterImagensAtuais(estabelecimentoSelecionado).map((url, index) => (
                                  <img
                                    key={`${url}-atual-${index}`}
                                    src={url}
                                    alt={`Imagem atual ${index + 1}`}
                                    className="h-24 w-full rounded-lg border object-cover"
                                    onError={(e) => {
                                      e.currentTarget.src = "/avatars/default-avatar.png";
                                    }}
                                  />
                                ))}
                              </div>
                            </div>
                          )}
                          <Input
                            ref={inputImagensRef}
                            id="edit-imagens"
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handleImagensChange}
                          />
                          {novasImagens.length > 0 && (
                            <p className="mt-2 text-xs text-gray-500">
                              {novasImagens.length} arquivo(s) selecionado(s)
                            </p>
                          )}
                          {previewNovasImagens.length > 0 && (
                            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                              {previewNovasImagens.map((url, index) => (
                                <div key={`${url}-${index}`} className="space-y-2">
                                  <img
                                    src={url}
                                    alt={`Preview da imagem ${index + 1}`}
                                    className="h-24 w-full rounded-lg border object-cover"
                                  />
                                  <Button
                                    type="button"
                                    variant="outline"
                                    className="w-full"
                                    onClick={() => removerNovaImagemSelecionada(index)}
                                    disabled={isSalvandoEstabelecimento}
                                  >
                                    Remover
                                  </Button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2 text-sm text-gray-700">
                        <p>
                          <span className="font-semibold">Endereço:</span>{" "}
                          {estabelecimentoSelecionado.endereco || "Não informado"}
                        </p>
                        <p>
                          <span className="font-semibold">Instagram:</span>{" "}
                          {estabelecimentoSelecionado.instagram || "Não informado"}
                        </p>
                        <p>
                          <span className="font-semibold">Descrição:</span>{" "}
                          {limparHtml(estabelecimentoSelecionado.descricao) ||
                            "Sem descrição"}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                <DialogFooter>
                  {isEditandoEstabelecimento ? (
                    <>
                      <Button
                        variant="outline"
                        disabled={isSalvandoEstabelecimento}
                        onClick={() => {
                          setIsEditandoEstabelecimento(false);
                          if (estabelecimentoSelecionado) {
                            setFormularioEdicao({
                              nomeLocal: estabelecimentoSelecionado.nomeLocal || "",
                              categoria: estabelecimentoSelecionado.categoria || "",
                              endereco: estabelecimentoSelecionado.endereco || "",
                              instagram: estabelecimentoSelecionado.instagram || "",
                              descricao: limparHtml(estabelecimentoSelecionado.descricao),
                            });
                          }
                          if (previewNovaLogo) {
                            URL.revokeObjectURL(previewNovaLogo);
                          }
                          previewNovasImagens.forEach((url) => URL.revokeObjectURL(url));
                          setNovaLogo(null);
                          setNovasImagens([]);
                          setPreviewNovaLogo(null);
                          setPreviewNovasImagens([]);
                        }}
                      >
                        Cancelar
                      </Button>
                      <Button
                        onClick={salvarEstabelecimento}
                        disabled={isSalvandoEstabelecimento}
                      >
                        {isSalvandoEstabelecimento && (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        Salvar estabelecimento
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        variant="outline"
                        onClick={() => setIsEditandoEstabelecimento(true)}
                      >
                        Editar estabelecimento
                      </Button>
                      <DialogClose asChild>
                        <Button variant="outline">Fechar</Button>
                      </DialogClose>
                    </>
                  )}
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Card de Alteração de Senha */}
            <Card className="rounded-xl shadow-md">
              <CardHeader>
                <CardTitle>Alterar Senha</CardTitle>
                <CardDescription>
                  Para sua segurança, recomendamos o uso de senhas fortes.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center">
                <Dialog
                  open={isPasswordDialogOpen}
                  onOpenChange={setIsPasswordDialogOpen}
                >
                  <DialogTrigger asChild>
                    <Button
                      variant="secondary"
                      className="w-fit rounded-full bg-gray-800 text-white transition-all transform hover:scale-105 hover:bg-gray-700 active:scale-95"
                    >
                      Alterar Senha
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Alterar sua senha</DialogTitle>
                      <DialogDescription>
                        Preencha os campos abaixo para definir uma nova senha.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div>
                        <Label htmlFor="currentPassword">Senha Atual</Label>
                        <Input
                          id="currentPassword"
                          type="password"
                          placeholder="Sua senha atual"
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          className="mt-1 w-full py-2
                          rounded-2xl border border-gray-200 bg-white shadow-sm
                          focus:ring-2 focus:border-[#017db9] transition-all duration-300 placeholder:text-gray-400"
                        />
                      </div>
                      <div>
                        <Label htmlFor="newPassword">Nova Senha</Label>
                        <Input
                          id="newPassword"
                          type="password"
                          placeholder="Digite a nova senha"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="mt-1 w-full py-2
                          rounded-2xl border border-gray-200 bg-white shadow-sm
                          focus:ring-2 focus:border-[#017db9] transition-all duration-300 placeholder:text-gray-400"
                        />
                      </div>
                      <div>
                        <Label htmlFor="confirmPassword">
                          Confirmar Nova Senha
                        </Label>
                        <Input
                          id="confirmPassword"
                          type="password"
                          placeholder="Digite novamente sua nova senha"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="mt-1 w-full py-2
                          rounded-2xl border border-gray-200 bg-white shadow-sm
                          focus:ring-2 focus:border-[#017db9] transition-all duration-300 placeholder:text-gray-400"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <DialogClose asChild>
                        <Button
                          variant="outline"
                          className="rounded-full transition-all transform hover:scale-105"
                          disabled={isChangingPassword}
                        >
                          Cancelar
                        </Button>
                      </DialogClose>
                      <Button
                        onClick={handlePasswordChange}
                        className="w-fit rounded-full transition-all transform hover:scale-105 hover:bg-[#017db9] active:scale-95 border-2 border-transparent hover:border-blue-700"
                        disabled={isChangingPassword}
                      >
                        {isChangingPassword && (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        {isChangingPassword
                          ? "Alterando..."
                          : "Salvar Nova Senha"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>

            {/* Card da Zona de Perigo */}
            <Card className="border-red-500 rounded-xl shadow-md">
              <CardHeader>
                <CardTitle className="text-red-600">Zona de Perigo</CardTitle>
                <CardDescription>
                  A exclusão da sua conta é uma ação irreversível.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="destructive"
                      className="w-fit rounded-full transition-all transform hover:scale-105 hover:bg-red-500 active:scale-95 border-2 border-transparent hover:border-red-700"
                    >
                      Excluir conta
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        Você tem certeza absoluta?
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta ação não pode ser desfeita. Isso excluirá
                        permanentemente sua conta e removerá seus dados de
                        nossos servidores.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="w-fit rounded-full transform hover:scale-105 bg-[#017db9] text-white active:scale-95 border-2 border-transparent hover:border-[#a8cf45] hover:bg-[#017db9]/90 hover:text-white">
                        Cancelar
                      </AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDeleteAccount}
                        className={cn(
                          buttonVariants({ variant: "destructive" }) +
                            " w-fit rounded-full transition-all transform hover:scale-105 hover:bg-red-500 active:scale-95 border-2 border-transparent hover:border-red-700"
                        )}
                      >
                        Continuar
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
