"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import {
  ArrowLeft,
  Search,
  MapPin,
  Compass,
  PlusCircle,
  ArrowLeft as ArrowIcon,
} from "lucide-react";
import { Spin, Empty, Pagination } from "antd";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import ModernCarousel from "@/components/ModernCarousel";
// import { getLocaisByCategoria } from "@/lib/api"; // <-- Importação Real (Comentada)
import { Local, getCategoryColor } from "@/types/Interface-Local"; // Importando getCategoryColor
import { categories } from "@/app/page";

const PROJETOS_PER_PAGE = 8;

// --- CORES ---
const COLORS = {
  primary: "#017db9",
  secondary: "#a8cf45",
  tertiary: "#d04798",
};

// --- MOCK DATA (DADOS FALSOS PARA VISUALIZAÇÃO) ---
const MOCK_LOCAIS: Local[] = [
  {
    localId: 1,
    slug: "igreja-nossa-senhora-de-nazareth",
    createdAt: new Date(),
    updatedAt: new Date(),
    criadoPor: "admin",
    status: "aprovado",
    aprovado: true,
    nome: "Igreja de Nossa Senhora de Nazareth",
    descricao: "O principal cartão postal de Saquarema.",
    descricaoDiferencial:
      "Localizada no alto do morro, oferece uma vista incrível da cidade e do mar.",
    categoria: "Pontos Turísticos",
    logoUrl: "/placeholder_igreja.jpg",
    bairro: "Centro",
    responsavel: "Paróquia Local",
    visualizacoes: 1500,
    media: 4.8,
    countAvaliacoes: 320,
  },
  {
    localId: 2,
    slug: "praia-de-itauna",
    createdAt: new Date(),
    updatedAt: new Date(),
    criadoPor: "admin",
    status: "aprovado",
    aprovado: true,
    nome: "Praia de Itaúna",
    descricao: "O Maracanã do Surf.",
    descricaoDiferencial: "Famosa mundialmente por suas ondas perfeitas.",
    categoria: "Praias e Lagoas",
    logoUrl: null,
    bairro: "Itaúna",
    responsavel: "Prefeitura",
    visualizacoes: 5000,
    media: 5.0,
    countAvaliacoes: 850,
  },
];

interface CategoryData {
  id: string;
  title: string;
  description: string;
  backgroundimg?: string;
  [key: string]: any;
}

export default function CategoriaPage() {
  const params = useParams();
  const slug = params.slug as string;
  const router = useRouter();

  const [locais, setLocais] = useState<Local[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState<string | null>(null);

  const category = useMemo(
    () => categories.find((cat) => cat.id === slug) as CategoryData | undefined,
    [slug]
  );

  // Obtém o gradiente baseado no slug da categoria
  const bgGradient = getCategoryColor(slug);

  const getImageUrl = (url?: string | null) => {
    if (!url) return "/Logo_aquitemods.png";
    if (!url.startsWith("http")) return url;
    return url;
  };

  useEffect(() => {
    if (slug) {
      const fetchLocais = async () => {
        setIsLoading(true);
        setError(null);
        setCurrentPage(1);

        /* ---------------------------------------------------------
           CÓDIGO REAL (BACKEND) - COMENTADO
           ---------------------------------------------------------
        try {
          const data = await getLocaisByCategoria(slug);
          setLocais(Array.isArray(data) ? data : []);
        } catch (err: any) {
          setError(err.message || "Falha ao carregar os locais.");
        } finally {
          setIsLoading(false);
        }
        --------------------------------------------------------- */

        // ---------------------------------------------------------
        // CÓDIGO MOCK (SIMULAÇÃO) - ATIVO
        // ---------------------------------------------------------
        setTimeout(() => {
          const categoriasComDados = [
            "pontos-turisticos",
            "restaurantes",
            "praias",
          ];
          if (categoriasComDados.includes(slug)) {
            setLocais([...MOCK_LOCAIS, ...MOCK_LOCAIS]);
          } else {
            setLocais([]);
          }
          setIsLoading(false);
        }, 1000);
        // ---------------------------------------------------------
      };
      fetchLocais();
    }
  }, [slug]);

  const filteredLocais = useMemo(
    () =>
      locais.filter((local) =>
        local.nome.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    [locais, searchTerm]
  );

  const paginatedLocais = useMemo(() => {
    const startIndex = (currentPage - 1) * PROJETOS_PER_PAGE;
    const endIndex = startIndex + PROJETOS_PER_PAGE;
    return filteredLocais.slice(startIndex, endIndex);
  }, [filteredLocais, currentPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Fallback para título
  const displayTitle = category?.title || slug?.replace("-", " ");

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Empty description={error}>
          <Button onClick={() => router.push("/")} className="bg-[#017db9]">
            Voltar ao Início
          </Button>
        </Empty>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* --- HEADER HERO (RESTAURADO COM GRADIENTE) --- */}
      <div
        className={`w-full py-16 bg-gradient-to-r ${bgGradient} text-white text-center shadow-lg relative overflow-hidden`}
      >
        {/* Botão Voltar */}
        <Link
          href="/"
          className="absolute top-6 left-6 text-white/80 hover:text-white transition-colors bg-white/10 hover:bg-white/20 p-2 rounded-full backdrop-blur-sm z-20"
        >
          <ArrowLeft size={24} />
        </Link>

        {/* Conteúdo do Header */}
        <div className="container mx-auto px-4 relative z-10">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-4xl font-bold capitalize drop-shadow-md tracking-tight"
          >
            {displayTitle}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mt-2 text-white/90 font-medium text-lg max-w-2xl mx-auto"
          >
            {category?.description || "Explore o melhor de Saquarema"}
          </motion.p>
        </div>

        {/* Efeito decorativo sutil */}
        <div className="absolute top-0 left-0 w-full h-full bg-white/5 pointer-events-none" />
      </div>
      {/* ----------------------------------------------- */}

      <main className="container mx-auto px-4 py-8 lg:px-12 xl:px-24">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* === COLUNA ESQUERDA (3/5): LISTA DE LOCAIS === */}
          <div className="flex flex-col lg:col-span-3">
            {/* Barra de Título e Pesquisa */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4 }}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6"
            >
              <h2
                className="text-2xl font-bold text-gray-800 tracking-tight border-l-4 pl-3"
                style={{ borderColor: COLORS.tertiary }}
              >
                Locais Encontrados
              </h2>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Pesquisar..."
                  className="pl-9 rounded-full shadow-sm border-gray-200 focus-visible:ring-[#017db9]"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </motion.div>

            {/* CONTEÚDO DA LISTA */}
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-72 w-full rounded-2xl" />
                ))}
              </div>
            ) : filteredLocais.length === 0 ? (
              /* --- CARD "ÁREA INEXPLORADA" (Dentro da coluna esquerda) --- */
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-3xl shadow-lg p-8 md:p-10 text-center border border-gray-100 relative overflow-hidden mt-4"
              >
                {/* Efeitos de fundo */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#017db9] via-[#a8cf45] to-[#d04798]" />
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#017db9]/5 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-[#d04798]/5 rounded-full blur-3xl pointer-events-none" />

                <div className="mb-6 inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-50 text-[#017db9] shadow-sm ring-4 ring-white">
                  <Compass size={32} strokeWidth={1.5} />
                </div>

                <h3 className="text-xl md:text-2xl font-bold text-gray-800 mb-3">
                  Esta área ainda está inexplorada!
                </h3>
                <p className="text-gray-600 text-base mb-8 max-w-md mx-auto leading-relaxed">
                  Não encontramos locais nesta categoria no momento (Modo Mock).
                  Conhece algum lugar incrível que deveria estar aqui?
                </p>

                <Link href="/cadastro-locais">
                  <Button
                    size="lg"
                    className="bg-[#017DB9] hover:bg-[#016fa3] text-white rounded-full px-8 h-12 text-base font-semibold shadow-md transition-all hover:scale-105 group"
                  >
                    <PlusCircle className="mr-2 h-5 w-5 group-hover:rotate-90 transition-transform duration-300" />
                    Sugerir Local
                  </Button>
                </Link>
              </motion.div>
            ) : (
              /* --------------------------------------------------------- */

              <>
                <div className="space-y-4 pb-1 sm:grid sm:grid-cols-2 sm:gap-6 sm:space-y-0">
                  {paginatedLocais.map((local, index) => (
                    <Link
                      href={`/categoria/${slug}/${encodeURIComponent(
                        local.nome
                      )}`}
                      key={local.localId}
                      className="block group h-full"
                    >
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="relative bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col h-full overflow-hidden border border-gray-100"
                      >
                        {/* Imagem */}
                        <div className="relative h-48 w-full overflow-hidden bg-gray-100">
                          <Image
                            src={getImageUrl(local.logoUrl)}
                            alt={local.nome}
                            fill
                            className="object-cover transition-transform duration-700 group-hover:scale-110"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60" />
                          <div className="absolute bottom-3 left-3 flex items-center text-white/90 text-xs font-medium bg-black/30 backdrop-blur-md px-2 py-1 rounded-md border border-white/20">
                            <MapPin size={12} className="mr-1" />
                            <span className="truncate max-w-[150px]">
                              {local.bairro || "Saquarema"}
                            </span>
                          </div>
                        </div>

                        {/* Conteúdo */}
                        <div className="p-4 flex flex-col flex-grow">
                          <h3 className="text-lg font-bold text-gray-800 mb-2 line-clamp-2 group-hover:text-[#017db9] transition-colors">
                            {local.nome}
                          </h3>
                          <p className="text-gray-600 text-sm line-clamp-3 mb-4 flex-grow leading-relaxed">
                            {local.descricaoDiferencial}
                          </p>
                          <div className="pt-3 border-t border-gray-50 flex justify-between items-center text-xs text-gray-400">
                            <span>Por: {local.responsavel || "Admin"}</span>
                            <span className="font-semibold text-[#017db9] flex items-center gap-1 group/btn">
                              Detalhes{" "}
                              <ArrowIcon
                                size={12}
                                className="rotate-180 group-hover/btn:translate-x-1 transition-transform"
                              />
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    </Link>
                  ))}
                </div>

                {/* Paginação */}
                {filteredLocais.length > PROJETOS_PER_PAGE && (
                  <div className="flex justify-center mt-10">
                    <Pagination
                      current={currentPage}
                      pageSize={PROJETOS_PER_PAGE}
                      total={filteredLocais.length}
                      onChange={handlePageChange}
                      showSizeChanger={false}
                      itemRender={(page, type, element) => {
                        if (type === "page" && page === currentPage) {
                          return (
                            <span
                              style={{
                                backgroundColor: COLORS.primary,
                                color: "white",
                                borderRadius: "8px",
                                padding: "0 8px",
                                border: "none",
                              }}
                            >
                              {page}
                            </span>
                          );
                        }
                        return element;
                      }}
                    />
                  </div>
                )}
              </>
            )}
          </div>

          {/* === COLUNA DIREITA (2/5): CARROSSEL E BANNER === */}
          <div className="lg:col-span-2 lg:sticky lg:top-8 h-fit space-y-6">
            {/* Banner de Chamada */}
            <div className="bg-gradient-to-br from-[#017db9] to-[#015f8d] rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-2xl pointer-events-none"></div>
              <h3 className="font-bold text-xl mb-2 relative z-10">
                Tem uma sugestão?
              </h3>
              <p className="text-sm text-white/90 mb-5 relative z-10 leading-relaxed">
                Ajude a expandir nosso guia cadastrando novos locais e serviços.
              </p>
              <Link href="/cadastro-locais">
                <Button className="w-full bg-white text-[#017db9] hover:bg-gray-50 font-bold border-none shadow-sm">
                  Cadastrar Local
                </Button>
              </Link>
            </div>

            {/* Carrossel */}
            <div>
              <div className="mb-4 flex items-center gap-2">
                <Compass className="text-[#d04798]" size={20} />
                <div>
                  <h2 className="text-lg font-bold text-gray-800">
                    Continue Explorando
                  </h2>
                  <p className="text-gray-500 text-xs">
                    Outras categorias interessantes
                  </p>
                </div>
              </div>

              <div className="w-full h-[350px] md:h-[400px] rounded-2xl shadow-md overflow-hidden bg-white border border-gray-100">
                <ModernCarousel currentCategoryId={slug} />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
