"use client";

import React, { useState, useEffect } from "react";
import FaleConoscoButton from "@/components/FaleConoscoButton";
import { useAuth } from "@/context/AuthContext";
import { getUserProgress, getAllLocaisAtivos, markVisit } from "@/lib/api";
import { Local } from "@/types/Interface-Local";
import { getFullImageUrl } from "@/utils/AdminUtils";
import { MapPin, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

// Função para calcular distância usando a Fórmula de Haversine (retorna em metros)
const getDistanceFromLatLonInM = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
) => {
  const R = 6371e3;
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) *
      Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const deg2rad = (deg: number) => deg * (Math.PI / 180);

const extractLocaisArray = (payload: any): Local[] => {
  if (Array.isArray(payload)) return payload as Local[];
  if (Array.isArray(payload?.data)) return payload.data as Local[];
  if (Array.isArray(payload?.locais)) return payload.locais as Local[];
  if (Array.isArray(payload?.items)) return payload.items as Local[];
  return [];
};

const toNumberCoord = (value: unknown): number | null => {
  if (value === null || value === undefined) return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string") {
    const normalized = value.trim().replace(",", ".");
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

const formatCategoryLabel = (categoria?: string) => {
  if (!categoria) return "Sem categoria";
  return categoria
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
};

export default function EspacoExplorePage() {
  const { user } = useAuth();
  const [unlockedLocais, setUnlockedLocais] = useState<string[]>([]);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{
    id: string;
    message: string;
    type: "success" | "error";
  } | null>(null);
  const [backendProgress, setBackendProgress] = useState<number | null>(null);
  const [isFetchingBackendProgress, setIsFetchingBackendProgress] = useState(false);
  const [userTag, setUserTag] = useState<string | null>(null);
  const [visitedCount, setVisitedCount] = useState<number | null>(null);
  const [totalLocations, setTotalLocations] = useState<number | null>(null);

  // GPS do usuário
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationLoading, setLocationLoading] = useState(true);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Locais cadastrados no site
  const [locais, setLocais] = useState<Local[]>([]);
  const [locaisLoading, setLocaisLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem("explora_saqua_badges");
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        setUnlockedLocais(Array.from(new Set(parsed.map(String))));
      }
    }
  }, []);

  const unlockedLocaisUnicos = Array.from(new Set(unlockedLocais));
  // Filtra apenas IDs que ainda existem entre os locais ativos, evitando contar locais deletados
  const activeLocalIds = new Set(locais.map(l => String(l.localId)));
  const unlockedCount = unlockedLocaisUnicos.filter(id => activeLocalIds.has(id)).length;
  const totalLocais = totalLocations ?? locais.length;
  const visitedCountBase = Math.max(visitedCount ?? 0, unlockedCount);
  const visitedCountDisplay = totalLocais > 0
    ? Math.min(visitedCountBase, totalLocais)
    : visitedCountBase;

  // Buscar locais ativos cadastrados no site
  useEffect(() => {
    const fetchLocais = async () => {
      try {
        const payload = await getAllLocaisAtivos();
        const data = extractLocaisArray(payload);

        const ativosComCoordenadas = data
          .map((l) => {
            const latitude = toNumberCoord((l as any).latitude ?? (l as any).lat);
            const longitude = toNumberCoord((l as any).longitude ?? (l as any).lng);
            return {
              ...l,
              latitude,
              longitude,
            } as Local;
          })
          .filter((l) => {
            const isAtivo =
              l.status === "ativo" ||
              l.active === true ||
              l.aprovado === true;
            return isAtivo && l.latitude != null && l.longitude != null;
          });

        setLocais(ativosComCoordenadas);
      } catch (err) {
        console.warn("Erro ao buscar locais:", err);
      } finally {
        setLocaisLoading(false);
      }
    };
    fetchLocais();
  }, []);

  // Solicitar localização do usuário ao carregar a página
  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationError("Geolocalização não suportada neste dispositivo.");
      setLocationLoading(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setLocationLoading(false);
      },
      () => {
        setLocationError("Permita o acesso à localização para ver os locais mais próximos de você.");
        setLocationLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }, []);

  // Buscar progresso do usuário no backend quando estiver logado
  useEffect(() => {
    const fetchProgress = async () => {
      if (!user || !user.token) return;
      const userId = Number(user.usuarioId ?? 0);
      if (!userId) return;
      try {
        setIsFetchingBackendProgress(true);
        const resp = await getUserProgress(userId, user.token);
        if (resp) {
          if (typeof resp.progressPercentage !== "undefined") {
            const pct = Number(resp.progressPercentage);
            if (!Number.isNaN(pct)) setBackendProgress(pct);
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
          // fallback para calcular progresso se backend não fornecer porcentagem
          if (typeof resp.progressPercentage === "undefined") {
            if (typeof resp.visitedCount !== "undefined" && typeof resp.totalLocations !== "undefined" && resp.totalLocations > 0) {
              const calc = (Number(resp.visitedCount) / Number(resp.totalLocations)) * 100;
              if (!Number.isNaN(calc)) setBackendProgress(calc);
            }
          }
        }
      } catch (err) {
        console.warn("Erro ao buscar progresso do usuário (backend):", err);
      } finally {
        setIsFetchingBackendProgress(false);
      }
    };

    fetchProgress();
  }, [user]);

  const handleCheckIn = (local: Local) => {
    const localKey = String(local.localId);
    setLoadingId(localKey);
    setFeedback(null);

    if (!navigator.geolocation) {
      setFeedback({
        id: localKey,
        message: "Geolocalização não suportada.",
        type: "error",
      });
      setLoadingId(null);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const userLat = position.coords.latitude;
        const userLng = position.coords.longitude;
        const distanceMeters = getDistanceFromLatLonInM(
          userLat,
          userLng,
          local.latitude!,
          local.longitude!,
        );

        if (distanceMeters <= 300) {
          const alreadyUnlocked = unlockedLocaisUnicos.includes(localKey);

          if (!alreadyUnlocked) {
            // Usa a mesma rota de validacao da aba de categoria quando o usuario estiver logado.
            if (user?.token && user?.usuarioId) {
              const userId = Number(user.usuarioId ?? 0);
              const localId = Number(local.localId ?? 0);
              if (userId && localId) {
                try {
                  await markVisit(userId, localId, user.token);

                  // Atualiza progresso diretamente do backend para manter consistencia.
                  try {
                    const progressResp = await getUserProgress(userId, user.token);
                    if (progressResp) {
                      if (typeof progressResp.progressPercentage !== "undefined") {
                        const pct = Number(progressResp.progressPercentage);
                        if (!Number.isNaN(pct)) setBackendProgress(pct);
                      }
                      if (typeof progressResp.visitedCount !== "undefined") {
                        const v = Number(progressResp.visitedCount);
                        if (!Number.isNaN(v)) setVisitedCount(v);
                      }
                      if (typeof progressResp.totalLocations !== "undefined") {
                        const t = Number(progressResp.totalLocations);
                        if (!Number.isNaN(t)) setTotalLocations(t);
                      }
                    }
                  } catch (err) {
                    console.warn("Falha ao atualizar progresso apos validacao:", err);
                  }
                } catch (err: any) {
                  setFeedback({
                    id: localKey,
                    message: err?.message || "Falha ao validar visita no servidor.",
                    type: "error",
                  });
                  setLoadingId(null);
                  return;
                }
              }
            }

            const newUnlocked = [...unlockedLocaisUnicos, localKey];
            setUnlockedLocais(newUnlocked);
            localStorage.setItem(
              "explora_saqua_badges",
              JSON.stringify(newUnlocked),
            );

            const baseTotal = totalLocais > 0 ? totalLocais : locais.length;
            if (baseTotal > 0) {
              const nextVisited = Math.min(visitedCountDisplay + 1, baseTotal);
              setVisitedCount(nextVisited);
              setBackendProgress(Math.round((nextVisited / baseTotal) * 100));
            } else {
              setVisitedCount(visitedCountDisplay + 1);
            }
          }

          setFeedback({
            id: localKey,
            message: alreadyUnlocked
              ? "Este local ja foi validado anteriormente."
              : "Check-in confirmado com sucesso!",
            type: "success",
          });
        } else {
          setFeedback({
            id: localKey,
            message: `Você está a ${Math.round(distanceMeters)}m. Aproxime-se do local!`,
            type: "error",
          });
        }
        setLoadingId(null);
      },
      () => {
        setFeedback({
          id: localKey,
          message: "Ative o GPS do seu dispositivo.",
          type: "error",
        });
        setLoadingId(null);
      },
      { enableHighAccuracy: true },
    );
  };

  const localProgress = locais.length > 0
    ? Math.round((unlockedCount / locais.length) * 100)
    : 0;
  const progressFromVisited = totalLocais > 0
    ? Math.round((visitedCountDisplay / totalLocais) * 100)
    : localProgress;
  const progress = Math.min(
    Math.max(
      backendProgress !== null ? Math.round(backendProgress) : 0,
      localProgress,
      progressFromVisited,
    ),
    100,
  );
  const isCompleted = locais.length > 0 && unlockedCount >= locais.length;

  // Ordenar locais por distância quando o GPS estiver disponível
  const locaisOrdenados = userLocation
    ? [...locais].sort((a, b) => {
        const distA = getDistanceFromLatLonInM(userLocation.lat, userLocation.lng, a.latitude!, a.longitude!);
        const distB = getDistanceFromLatLonInM(userLocation.lat, userLocation.lng, b.latitude!, b.longitude!);
        return distA - distB;
      })
    : locais;

  const formatarDistancia = (metros: number): string => {
    if (metros < 1000) return `${Math.round(metros)} m`;
    return `${(metros / 1000).toFixed(1)} km`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#017DB9] to-[#007a73] py-20 px-6 sm:px-12">
      <div className="max-w-5xl mx-auto bg-white rounded-3xl shadow-lg p-10 sm:p-16">
        {/* --- CABEÇALHO --- */}
        <section className="mb-8">
          <div className="md:flex md:items-start md:gap-8 lg:gap-12">
            <div className="w-full">
              <h1
                className="text-4xl font-extrabold mb-6 inline-block pb-2
                  bg-gradient-to-r from-[#017DB9] to-[#007a73]
                  bg-no-repeat
                  [background-position:0_100%]
                  [background-size:100%_4px]"
              >
                <span className="bg-gradient-to-r from-[#017DB9] to-[#007a73] bg-clip-text text-transparent">
                  Espaço Explore
                </span>
              </h1>

              <p className="text-gray-700 leading-relaxed text-lg">
                O <strong>Espaço Explore</strong> é uma experiência interativa
                projetada para conectar você aos principais tesouros históricos,
                culturais e naturais de Saquarema.
              </p>

              <p className="text-gray-700 leading-relaxed text-lg mt-4">
                <strong>Como funciona?</strong> Visite fisicamente os locais
                listados abaixo. Ao chegar, clique em "Validar Localização". O
                sistema utilizará o GPS do seu celular para confirmar sua
                presença e desbloqueará uma{" "}
                <span className="bg-gradient-to-r from-[#017DB9] to-[#007a73] bg-clip-text text-transparent font-bold">
                  etiqueta de conquista exclusiva.
                </span>
              </p>
            </div>
          </div>
        </section>

        {/* --- SEU PROGRESSO --- */}
        <section className="mb-8 border-t pt-8">
          <h2 className="text-3xl font-semibold text-left mb-6">
            <span className="bg-gradient-to-r from-[#017DB9] to-[#007a73] bg-clip-text text-transparent">
              Seu Progresso de Exploração
            </span>
          </h2>

          <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
            <div className="flex justify-between items-start mb-3">
              <div>
                <span className="text-gray-700 text-lg font-medium">Locais Visitados</span>
                {/* mostrar tag e contagem abaixo do título em telas pequenas */}
                <div className="mt-2 flex items-center gap-3">
                  {userTag && (
                    <span className="text-sm font-semibold text-[#007a73] px-3 py-1 bg-[#e6f7f6] rounded-full">
                      {userTag}
                    </span>
                  )}
                  {totalLocais > 0 && (
                    <span className="text-sm text-gray-600">{visitedCountDisplay}/{totalLocais} locais</span>
                  )}
                </div>
              </div>
              
              <div className="text-right">
                <span className="text-2xl font-bold bg-gradient-to-r from-[#017DB9] to-[#007a73] bg-clip-text text-transparent">
                  {progress}%
                </span>
              </div>
            </div>
            <div className="w-full bg-gray-200 h-3 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-[#017DB9] to-[#007a73] h-full transition-all duration-1000 ease-out"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>

          {/* MENSAGEM DE 100% */}
          {isCompleted && (
            <div className="mt-6 bg-[#e6f7f6] border border-[#007a73] p-6 rounded-2xl text-center">
              <h3 className="text-2xl font-bold text-[#007a73] mb-2">
                🎉 Objetivo Concluído! 🎉
              </h3>
              <p className="text-gray-700 text-lg leading-relaxed">
                Você completou 100% do roteiro. Apresente esta tela na{" "}
                <strong>Secretaria de Turismo de Saquarema</strong> para
                resgatar sua recompensa de explorador!
              </p>
            </div>
          )}
        </section>

        {/* --- LISTA DE DESAFIOS --- */}
        <section className="mb-8 border-t pt-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-10">
            <h2 className="text-3xl font-semibold text-left">
              <span className="bg-gradient-to-r from-[#017DB9] to-[#007a73] bg-clip-text text-transparent">
                Desafios Disponíveis
              </span>
            </h2>

            {/* Status do GPS */}
            {locationLoading && (
              <div className="flex items-center gap-2 text-sm text-gray-500 animate-pulse">
                <Navigation size={16} className="text-[#017DB9]" />
                Buscando sua localização...
              </div>
            )}
            {!locationLoading && userLocation && (
              <div className="flex items-center gap-2 text-sm font-medium text-[#007a73] bg-[#e6f7f6] px-3 py-1.5 rounded-full">
                <MapPin size={15} />
                Ordenados por proximidade
              </div>
            )}
            {!locationLoading && locationError && (
              <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-full">
                <Navigation size={15} />
                {locationError}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {locaisLoading ? (
              <div className="col-span-3 flex justify-center py-12 text-gray-500 animate-pulse">
                Carregando locais...
              </div>
            ) : locaisOrdenados.length === 0 ? (
              <div className="col-span-3 text-center py-12 text-gray-500">
                Nenhum local com coordenadas cadastradas foi encontrado.
              </div>
            ) : (
              locaisOrdenados.map((local) => {
                const localKey = String(local.localId);
                const isUnlocked = unlockedLocaisUnicos.includes(localKey);
                const distancia = userLocation
                  ? getDistanceFromLatLonInM(userLocation.lat, userLocation.lng, local.latitude!, local.longitude!)
                  : null;
                const nomeExibicao = (local.nome || local.nomeLocal || "Local sem nome").trim();
                const categoriaExibicao = formatCategoryLabel(local.categoria);
                const imagemUrl =
                  local.localImages?.[0]?.url ??
                  local.localImg?.[0]?.url ??
                  local.logoUrl ??
                  "/placeholder-user.jpg";
                const logoUrl = getFullImageUrl(imagemUrl) || "/placeholder-user.jpg";

                return (
                  <div
                    key={localKey}
                    className={`flex flex-col justify-between p-6 rounded-2xl border transition-all duration-300 ${
                      isUnlocked
                        ? "border-[#007a73] bg-[#f0f9f8]"
                        : "border-gray-200 bg-white hover:border-[#017DB9] hover:shadow-md"
                    }`}
                  >
                    <div className="mb-4">
                      <div className="flex items-center gap-3 mb-3">
                        <img
                          src={logoUrl}
                          alt={`Logo de ${nomeExibicao}`}
                          className="w-14 h-14 rounded-xl object-cover border border-gray-200 bg-gray-100"
                        />
                        <div className="min-w-0">
                          <h3 className="text-xl font-bold text-gray-800 truncate">
                            {nomeExibicao}
                          </h3>
                          <p className="text-sm text-gray-500 truncate">
                            {categoriaExibicao}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 mt-2">
                        {isUnlocked && (
                          <div className="inline-flex items-center gap-1 text-[#007a73] text-sm font-semibold bg-[#e6f7f6] px-3 py-1 rounded-full">
                            <MapPin size={14} /> Desbloqueado
                          </div>
                        )}
                        {distancia !== null && (
                          <div className="inline-flex items-center gap-1 text-gray-500 text-sm bg-gray-100 px-3 py-1 rounded-full">
                            <Navigation size={13} />
                            {formatarDistancia(distancia)}
                          </div>
                        )}
                      </div>
                    </div>

                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant={isUnlocked ? "ghost" : "default"}
                          className={`w-full ${
                            !isUnlocked
                              ? "bg-[#017DB9] hover:bg-[#007a73] text-white"
                              : "text-[#007a73] hover:bg-[#e6f7f6]"
                          }`}
                        >
                          {isUnlocked ? "Ver Detalhes" : "Saiba Mais"}
                        </Button>
                      </DialogTrigger>

                      <DialogContent
                        className="sm:max-w-[500px] p-6 border-0 rounded-2xl shadow-lg"
                        overlayClassName="bg-black/60 backdrop-blur-sm"
                      >
                        <DialogHeader>
                          <DialogTitle className="text-2xl font-bold text-gray-800">
                            {nomeExibicao}
                          </DialogTitle>
                        </DialogHeader>

                        <div className="flex flex-col gap-4 mt-2">
                          {/* Imagem do Local */}
                          <div className="w-full h-48 rounded-xl overflow-hidden bg-gray-100">
                            <img
                              src={logoUrl}
                              alt={nomeExibicao}
                              className="w-full h-full object-cover"
                            />
                          </div>

                          {/* Descrição */}
                          <DialogDescription className="text-gray-700 text-base leading-relaxed">
                            {local.descricao?.replace(/<[^>]*>/g, "") ?? ""}
                          </DialogDescription>

                          {/* Botões e Interações */}
                          <div className="mt-4 border-t pt-4">
                            {isUnlocked ? (
                              <div className="flex flex-col items-center gap-2">
                                <p className="text-sm text-gray-500 font-medium">
                                  Você já visitou este local!
                                </p>
                                <div className="flex justify-center items-center gap-2 bg-gradient-to-r from-[#017DB9] to-[#007a73] text-white font-semibold py-3 px-6 rounded-xl shadow-md w-full">
                                  <MapPin size={20} />
                                  Categoria: {local.categoria}
                                </div>
                              </div>
                            ) : (
                              <div className="flex flex-col gap-3">
                                <div className="flex flex-col sm:flex-row gap-3">
                                  {/* Botão Traçar Rota */}
                                  <a
                                    href={`https://www.google.com/maps/dir/?api=1&destination=${local.latitude},${local.longitude}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-full sm:w-1/2 flex items-center justify-center gap-2 border border-blue-200 text-[#017DB9] hover:bg-blue-50 py-6 rounded-xl"
                                  >
                                    <Navigation size={18} />
                                    Traçar Rota
                                  </a>

                                  {/* Botão Validar Localização */}
                                  <button
                                    onClick={() => handleCheckIn(local)}
                                    disabled={loadingId === localKey}
                                    className="w-full sm:w-1/2 bg-[#017DB9] hover:bg-[#007a73] text-white font-semibold py-3 px-4 rounded-xl transition-colors disabled:opacity-70 flex justify-center items-center gap-2"
                                  >
                                    {loadingId === localKey ? (
                                      "Buscando GPS..."
                                    ) : (
                                      <>
                                        <MapPin size={18} />
                                        Validar Local
                                      </>
                                    )}
                                  </button>
                                </div>

                                {/* Feedback de Erro/Sucesso */}
                                {feedback?.id === localKey && (
                                  <div
                                    className={`text-center text-sm font-semibold mt-2 p-2 rounded-lg ${
                                      feedback.type === "success"
                                        ? "bg-[#e6f7f6] text-[#007a73]"
                                        : "bg-red-50 text-red-500"
                                    }`}
                                  >
                                    {feedback.message}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* --- CHAMADA PARA AÇÃO FINAL --- */}
        <section className="mt-12 border-t pt-8 text-center">
          <p className="text-gray-700 leading-relaxed text-lg mb-8 flex justify-center items-center gap-2">
            Explore, valide e compartilhe com o{""}
            <span className="bg-gradient-to-r from-[#017DB9] to-[#007a73] bg-clip-text text-transparent font-bold">
              #ExploraSaqua.
            </span>
          </p>

          <FaleConoscoButton />
        </section>
      </div>
    </div>
  );
}
