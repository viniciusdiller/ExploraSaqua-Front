"use client";

import Link from "next/link";
import {
  ArrowLeft,
  Loader2,
  Globe,
  Instagram,
  SearchX,
  CalendarDays,
  Share2,
  Link as LinkIcon,
  MapPin,
  Navigation,
} from "lucide-react";
import GoogleMapEmbed from "@/components/map/GoogleMapEmbed";
import React, { useState, useEffect, useRef, Suspense, useMemo } from "react";
import { TiltImage } from "@/components/ui/TiltImage";
import "leaflet/dist/leaflet.css";
import Image from "next/image";
import {
  getLocalByNome,
  deleteReview,
  formatarDataParaMesAno,
  registerShareClick,
} from "@/lib/api";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
} from "@/components/ui/pagination";
import { motion, useInView } from "framer-motion";
import ImageGrid from "@/components/ProjectImages";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useParams } from "next/navigation";
import FormattedDescription from "@/components/FormattedDescription";
import AvaliacaoModal from "@/components/Pop-up Coments";
import { ReviewComment } from "@/components/ReviewComments";
import DOMPurify from "dompurify";
import { Local } from "@/types/Interface-Local";

// --- PALETA DE CORES ---
const COLORS = {
  primary: "#017db9",
  secondary: "#a8cf45",
  tertiary: "#d04798",
};

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// --- UTILS ---
const normalizeImagePath = (filePath: string) => {
  if (!filePath) return "";
  let normalized = filePath.replace(/\\/g, "/");
  const uploadsIndex = normalized.indexOf("uploads/");
  if (uploadsIndex !== -1) {
    normalized = normalized.substring(uploadsIndex);
  }
  if (normalized.startsWith("/")) {
    normalized = normalized.substring(1);
  }
  return normalized;
};

// --- COMPONENTES VISUAIS ---

const CustomStarIcon = ({
  fillPercentage = "100%",
}: {
  fillPercentage?: string;
}) => {
  const uniqueId = `grad-${Math.random()}`;
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-yellow-400"
    >
      <defs>
        <linearGradient id={uniqueId}>
          <stop offset="0%" stopColor="currentColor" />
          <stop offset={fillPercentage} stopColor="currentColor" />
          <stop
            offset={fillPercentage}
            stopColor="transparent"
            stopOpacity="1"
          />
        </linearGradient>
      </defs>
      <polygon
        points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"
        fill={`url(#${uniqueId})`}
        stroke="currentColor"
      />
    </svg>
  );
};

export const StarRating = ({ rating }: { rating: number }) => {
  const totalStars = 5;
  return (
    <div className="flex items-center">
      {[...Array(totalStars)].map((_, index) => {
        const starValue = index + 1;
        let fillPercentage = "0%";
        if (starValue <= rating) fillPercentage = "100%";
        else if (starValue - 1 < rating && starValue > rating)
          fillPercentage = `${(rating - index) * 100}%`;
        return <CustomStarIcon key={index} fillPercentage={fillPercentage} />;
      })}
    </div>
  );
};

// --- ANIMAÇÕES ---
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.2 } },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { duration: 0.5, ease: "easeOut" as const },
  },
};

function AnimatedSection({ children }: { children: React.ReactNode }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });
  return (
    <motion.section
      ref={ref}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={itemVariants}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      {children}
    </motion.section>
  );
}

// --- CONTEÚDO DA PÁGINA ---

function LocalPageContent() {
  const params = useParams();
  const { user } = useAuth();

  const categorySlug = params.slug as string;
  const nomeDoLocal = decodeURIComponent(params.nome as string);
  const [local, setLocal] = useState<Local | null>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [reviewToDelete, setReviewToDelete] = useState<number | null>(null);
  const [descricaoExpandida, setDescricaoExpandida] = useState(false);
  const [modalState, setModalState] = useState<{
    open: boolean;
    parentId: number | null;
  }>({ open: false, parentId: null });

  const sobreLocalRef = useRef<HTMLElement | null>(null);
  const headerRef = useRef<HTMLElement | null>(null);

  const handleCopyLink = async () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link copiado!", {
        description: "Perfil copiado para a área de transferência.",
        duration: 3000,
      });
      try {
        await registerShareClick();
      } catch (error) {
        console.error(error);
      }
    }
  };

  const fetchLocalData = async () => {
    if (!nomeDoLocal) {
      setIsLoading(false);
      return;
    }
    try {
      const detailsData = await getLocalByNome(nomeDoLocal);
      const localEncontrado = Array.isArray(detailsData)
        ? detailsData[0]
        : detailsData;

      if (localEncontrado && (localEncontrado.localId || localEncontrado.id)) {
        setLocal(localEncontrado);
        setReviews(localEncontrado.avaliacoes || []);
      } else {
        setLocal(null);
        setReviews([]);
      }
    } catch (error) {
      console.error("Erro ao buscar local:", error);
      setLocal(null);
    }
  };

  useEffect(() => {
    const initialFetch = async () => {
      setIsLoading(true);
      await fetchLocalData();
      setIsLoading(false);
    };
    initialFetch();
  }, [nomeDoLocal]);

  const cleanHtmlDescricao = useMemo(() => {
    if (typeof window !== "undefined" && local?.descricao) {
      return DOMPurify.sanitize(local.descricao);
    }
    return "";
  }, [local?.descricao]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center p-8 bg-white rounded-2xl shadow-lg max-w-md w-full">
          <Loader2
            className="mx-auto h-16 w-16 animate-spin mb-4"
            style={{ color: COLORS.tertiary }}
          />
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            Carregando Local...
          </h1>
          <p className="text-gray-600">Aguarde um momento.</p>
        </div>
      </div>
    );
  }

  if (!local) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center p-4 bg-gray-50">
        <div className="bg-white p-8 rounded-2xl shadow-md">
          <SearchX className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Local Não Encontrado
          </h2>
          <p className="text-gray-600 mb-6 max-w-sm">
            O local não existe ou foi removido.
          </p>
          <Button
            asChild
            className="rounded-full px-6 font-semibold shadow-md transition-all hover:scale-105"
            style={{
              background: `linear-gradient(to bottom right, ${COLORS.tertiary}, ${COLORS.primary})`,
              color: "white",
            }}
          >
            <Link href="/">Voltar para Início</Link>
          </Button>
        </div>
      </div>
    );
  }

  const handleDeleteClick = (avaliacaoId: number) => {
    if (!user?.token) {
      toast.error("Faça login para excluir.");
      return;
    }
    setReviewToDelete(avaliacaoId);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!reviewToDelete || !user?.token) {
      setIsDeleteDialogOpen(false);
      return;
    }
    try {
      await deleteReview(reviewToDelete, user.token);
      toast.success("Comentário excluído!");
      fetchLocalData();
    } catch (error: any) {
      toast.error(error.message || "Erro ao excluir.");
    } finally {
      setIsDeleteDialogOpen(false);
      setReviewToDelete(null);
    }
  };

  const handleNewReviewClick = () => {
    if (!user) {
      toast.error("Faça login para avaliar.");
      return;
    }
    setModalState({ open: true, parentId: null });
  };

  const handleReplyClick = (parentId: number) => {
    if (!user) {
      toast.error("Faça login para responder.");
      return;
    }
    setModalState({ open: true, parentId: parentId });
  };

  const closeModal = () => setModalState({ open: false, parentId: null });
  const handleReviewSubmit = () => {
    fetchLocalData();
    closeModal();
  };

  const rating = local.media || 0;

  // Ajuste para localImg (array de objetos {id, url})
  const portfolioImages = (local.localImg || []).map(
    (image: any, index: number) => ({
      id: `${local.localId}-${index}`,
      img: `${API_URL}/${normalizeImagePath(image.url)}`,
    }),
  );

  const hasLocation = local?.latitude && local?.longitude;

  const formatInstagramUrl = (handleOrUrl: string | undefined) => {
    if (!handleOrUrl) return "#";
    const val = handleOrUrl.trim();
    if (val.includes("instagram.com") || /^https?:\/\//i.test(val)) {
      return /^https?:\/\//i.test(val) ? val : `https://${val}`;
    }
    return `https://www.instagram.com/${val.replace(/^@/, "")}`;
  };

  // Se ainda houver lógica de ODS

  const REVIEWS_PER_PAGE = 4;
  const totalPages = Math.ceil(reviews.length / REVIEWS_PER_PAGE);
  const paginatedReviews = reviews.slice(
    (currentPage - 1) * REVIEWS_PER_PAGE,
    currentPage * REVIEWS_PER_PAGE,
  );

  return (
    <div
      className="min-h-screen"
      style={{
        background: `linear-gradient(to bottom right, ${COLORS.tertiary}, ${COLORS.primary})`,
      }}
    >
      {/* --- HEADER STICKY --- */}
      <motion.header
        ref={headerRef}
        className="sticky top-0 z-20"
        initial={{ y: "-100%", opacity: 0 }}
        animate={{ y: "0%", opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <div className="bg-white/80 backdrop-blur-md border-b border-gray-200/80">
          <div className="relative w-full px-4 sm:px-6 py-3 flex items-center justify-between">
            <Link
              href={`/categoria/${categorySlug}`}
              className="flex items-center gap-1.5 text-sm text-gray-600 transition-colors p-2 rounded-lg -ml-3 sm:ml-8 md:ml-12 lg:ml-36 hover:text-opacity-80"
            >
              <div
                className="flex items-center gap-1.5"
                style={{ color: COLORS.tertiary }}
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="font-medium">Voltar</span>
              </div>
            </Link>
            <h1 className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-md font-semibold text-gray-800 truncate px-4 max-w-[30%] sm:max-w-[40%] text-center pointer-events-none">
              {local.nome}
            </h1>
            <button
              onClick={handleCopyLink}
              className="flex items-center gap-1.5 text-sm text-gray-600 transition-colors p-2 rounded-lg -mr-3 sm:mr-8 md:mr-12 lg:mr-36"
              title="Copiar link do perfil"
            >
              <div
                className="flex items-center gap-1.5"
                style={{ color: COLORS.primary }}
              >
                <span className="font-medium">Compartilhar</span>
                <Share2 className="w-4 h-4" />
              </div>
            </button>
          </div>
        </div>
      </motion.header>

      {/* --- MAIN CONTENT --- */}
      <motion.main
        className="w-full p-4 md:p-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.4 }}
      >
        <div className="space-y-8">
          {/* --- INFO PRINCIPAL --- */}
          <motion.section
            className="bg-white p-6 rounded-3xl shadow-lg md:mx-auto md:max-w-[85%]"
            variants={itemVariants}
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
              <div className="md:col-span-2 flex flex-col">
                <div className="mb-6 text-center md:text-left">
                  <div className="flex flex-col miletrezentos:flex-row">
                    <h2
                      className="text-3xl font-bold text-gray-900 mb-2 border-l-4 pl-3"
                      style={{ borderColor: COLORS.tertiary }}
                    >
                      {local.nome}
                    </h2>
                  </div>
                  <div className="flex items-center justify-center md:justify-start gap-2">
                    <StarRating rating={rating} />
                    <span className="text-gray-700 font-semibold">
                      {rating.toFixed(1)}
                    </span>
                    <span className="text-gray-500 text-sm">
                      ({reviews.length} avaliações)
                    </span>
                    {local.createdAt && (
                      <div className="hidden sm:flex items-center text-sm text-gray-500 border-l-2 border-gray-300 pl-4">
                        <CalendarDays className="h-4 w-4 mr-2" />
                        <span>
                          Membro desde{" "}
                          {formatarDataParaMesAno(local.createdAt.toString())}
                        </span>
                      </div>
                    )}
                  </div>
                  {local.createdAt && (
                    <div className="flex items-center text-sm text-gray-500 border-l-2 border-gray-300 pl-4 mt-4 sm:hidden justify-center">
                      <CalendarDays className="h-4 w-4 mr-2" />
                      <span>
                        Membro desde{" "}
                        {formatarDataParaMesAno(local.createdAt.toString())}
                      </span>
                    </div>
                  )}
                </div>

                <div className="text-gray-700 leading-relaxed md:pl-2">
                  <FormattedDescription text={local.descricao} />
                </div>

                <div className="hidden quinhentos:flex flex-col md:flex-row md:items-center md:justify-between gap-6 mt-6">
                  <div className="flex items-center gap-6">
                    {local.instagram && (
                      <a
                        href={formatInstagramUrl(local.instagram)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-gray-600 transition-colors"
                        style={{ color: COLORS.tertiary }}
                      >
                        <div className="w-9 h-9 rounded-full flex items-center justify-center bg-[#d04798]/10">
                          <Instagram size={18} strokeWidth={2} />
                        </div>
                        <span className="text-sm font-medium">Instagram</span>
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {/* Logo / Imagem */}
              <div className="flex items-center justify-center md:col-span-1">
                <div className="relative w-48 h-48 md:w-56 md:h-56 desktop:w-64 desktop:h-64 bg-white rounded-2xl flex items-center justify-center p-4 overflow-hidden border border-gray-100 shadow-sm">
                  <TiltImage
                    src={
                      (local.logoUrl &&
                        `${API_URL}/${normalizeImagePath(local.logoUrl)}`) ||
                      "/logos/Logo_Explore.png"
                    }
                    alt={`Logo de ${local.nome}`}
                    width={500}
                    height={500}
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>

              {/* Links Mobile */}
              <div className="quinhentos:hidden flex flex-col items-center justify-center gap-6 mt-6 col-span-full">
                <div className="flex items-center gap-6">
                  {local.instagram && (
                    <a
                      href={formatInstagramUrl(local.instagram)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-gray-600"
                      style={{ color: COLORS.tertiary }}
                    >
                      <div className="w-9 h-9 rounded-full bg-[#d04798]/10 flex items-center justify-center">
                        <Instagram size={18} />
                      </div>
                      <span className="text-sm font-medium">Instagram</span>
                    </a>
                  )}
                </div>
              </div>
            </div>
          </motion.section>

          {/* --- DESCRIÇÃO --- */}
          {local.descricao && (
            <motion.section
              ref={sobreLocalRef}
              className="relative bg-white p-6 rounded-3xl shadow-lg md:mx-auto md:max-w-[85%] space-y-4 mb-8"
              initial="hidden"
              animate="visible"
              variants={itemVariants}
            >
              <div className="flex items-center flex-wrap gap-x-3 gap-y-2 mb-4">
                <h3
                  className="text-2xl font-bold text-gray-900 border-l-4 pl-3"
                  style={{ borderColor: COLORS.tertiary }}
                >
                  Sobre o Local
                </h3>
              </div>

              <div>
                <div
                  className={`relative overflow-hidden transition-all duration-300 ease-in-out ${
                    descricaoExpandida ? "max-h-none" : "max-h-24"
                  }`}
                >
                  <div
                    className="prose prose-sm md:prose-base max-w-none text-gray-700 leading-relaxed md:pl-2 break-words prose-p:my-0"
                    dangerouslySetInnerHTML={{ __html: cleanHtmlDescricao }}
                  />
                  {!descricaoExpandida && (
                    <div className="absolute bottom-0 left-0 w-full h-8 bg-gradient-to-t from-white to-transparent pointer-events-none"></div>
                  )}
                </div>
                <button
                  onClick={() => {
                    setDescricaoExpandida(!descricaoExpandida);
                    if (descricaoExpandida) {
                      const headerHeight = headerRef.current?.offsetHeight || 0;
                      const sectionTop = sobreLocalRef.current?.offsetTop || 0;
                      window.scrollTo({
                        top: sectionTop - headerHeight - 20,
                        behavior: "smooth",
                      });
                    }
                  }}
                  className="text-md font-bold mt-2 md:pl-2 hover:underline transition-colors"
                  style={{ color: COLORS.tertiary }}
                >
                  {descricaoExpandida ? "Ler menos" : "Ler mais"}
                </button>
              </div>

              {local.endereco && (
                <div className="flex items-center gap-3 bg-gray-50 p-4 rounded-lg border border-gray-200 shadow-sm mt-2">
                  <MapPin className="flex-shrink-0 text-gray-500" size={20} />
                  <span className="text-gray-700 font-medium">
                    {local.endereco}
                  </span>
                </div>
              )}
            </motion.section>
          )}

          {/* --- MAPA --- */}
          {hasLocation && (
            <AnimatedSection>
              <div className="bg-white p-6 rounded-3xl shadow-lg md:mx-auto md:max-w-[85%] mb-8">
                <div className="flex items-center justify-between mb-6">
                  <h3
                    className="text-2xl font-bold text-gray-900 border-l-4 pl-3"
                    style={{ borderColor: COLORS.tertiary }}
                  >
                    Como Chegar
                  </h3>

                  {/* Botão que abre o App de Mapas do celular */}
                  <Button
                    asChild
                    variant="outline"
                    className="gap-2 border-blue-200 text-blue-700 hover:bg-blue-50"
                  >
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${local.latitude},${local.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Navigation size={16} />
                      Traçar Rota
                    </a>
                  </Button>
                </div>

                {/* O Iframe do Google Maps */}
                <div className="h-[400px] w-full relative z-0">
                  <GoogleMapEmbed
                    latitude={Number(local.latitude)}
                    longitude={Number(local.longitude)}
                  />
                </div>

                {/* Endereço por escrito abaixo */}
                {local.endereco && (
                  <div className="mt-4 bg-gray-50 p-4 rounded-xl flex items-start gap-3 border border-gray-100">
                    <MapPin
                      className="text-red-500 flex-shrink-0 mt-1"
                      size={20}
                    />
                    <div>
                      <p className="text-gray-900 font-medium">Endereço:</p>
                      <p className="text-gray-600">{local.endereco}</p>
                    </div>
                  </div>
                )}
              </div>
            </AnimatedSection>
          )}

          {/* --- PORTFÓLIO --- */}
          {Array.isArray(portfolioImages) &&
            portfolioImages.some((item) => item && item.img) && (
              <AnimatedSection>
                <div className="bg-white p-6 rounded-3xl shadow-lg md:mx-auto md:max-w-[85%]">
                  <div>
                    <h3
                      className="text-2xl font-bold text-gray-900 mb-2 border-l-4 pl-3"
                      style={{ borderColor: COLORS.tertiary }}
                    >
                      Galeria
                    </h3>
                    <p className="text-sm text-gray-600">
                      Clique em uma imagem para ampliar
                    </p>
                  </div>
                  <div className="bg-gray-50 p-4 sm:p-6 rounded-2xl shadow-md border border-gray-200 mt-4">
                    <ImageGrid items={portfolioImages} />
                  </div>
                </div>
              </AnimatedSection>
            )}

          {/* --- AVALIAÇÕES --- */}
          <AnimatedSection>
            <div className="bg-white p-6 rounded-3xl shadow-md md:mx-auto md:max-w-[85%]">
              <h3
                className="text-2xl font-bold text-gray-900 mb-6 border-l-4 pl-3"
                style={{ borderColor: COLORS.tertiary }}
              >
                Avaliações
              </h3>
              <Button
                onClick={handleNewReviewClick}
                className="rounded-full px-6 font-semibold shadow-md transition-all hover:scale-105 mb-4"
                style={{
                  background: `linear-gradient(to bottom right, ${COLORS.tertiary}, ${COLORS.primary})`,
                  color: "white",
                }}
              >
                Deixe sua avaliação
              </Button>

              <div className="space-y-4">
                {reviews.length > 0 ? (
                  <>
                    <div className="space-y-4">
                      {paginatedReviews
                        .slice()
                        .reverse()
                        .map((review) => (
                          <ReviewComment
                            key={review.avaliacoesId}
                            review={review}
                            onReplyClick={handleReplyClick}
                            onDeleteClick={handleDeleteClick}
                            currentUser={user}
                            allowReply={true}
                          />
                        ))}
                    </div>
                    {totalPages > 1 && (
                      <div className="pt-4 flex justify-end rounded-lg">
                        <Pagination>
                          <PaginationContent>
                            {[...Array(totalPages)].map((_, i) => (
                              <PaginationItem key={i}>
                                <PaginationLink
                                  href="#"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    setCurrentPage(i + 1);
                                  }}
                                  isActive={currentPage === i + 1}
                                  className={
                                    currentPage === i + 1 ? "text-white" : ""
                                  }
                                  style={
                                    currentPage === i + 1
                                      ? {
                                          backgroundColor: COLORS.tertiary,
                                          borderColor: COLORS.tertiary,
                                        }
                                      : {}
                                  }
                                >
                                  {i + 1}
                                </PaginationLink>
                              </PaginationItem>
                            ))}
                          </PaginationContent>
                        </Pagination>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-gray-500 text-center py-4">
                    Seja o primeiro a avaliar este local!
                  </p>
                )}
              </div>

              {/* Modal de Confirmação de Exclusão */}
              <AlertDialog
                open={isDeleteDialogOpen}
                onOpenChange={setIsDeleteDialogOpen}
              >
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta ação não pode ser desfeita.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel
                      onClick={() => setReviewToDelete(null)}
                      className="rounded-full"
                    >
                      Cancelar
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleConfirmDelete}
                      className="rounded-full bg-red-600 hover:bg-red-700 text-white"
                    >
                      Sim, excluir
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </AnimatedSection>
        </div>
      </motion.main>

      {local && (
        <AvaliacaoModal
          isOpen={modalState.open}
          onClose={closeModal}
          parentId={modalState.parentId}
          projetoId={local.localId} // ID atualizado
          onReviewSubmit={handleReviewSubmit}
        />
      )}
    </div>
  );
}

// --- Wrapper com Suspense ---
export default function LocalPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
          <p>Carregando...</p>
        </div>
      }
    >
      <LocalPageContent />
    </Suspense>
  );
}
