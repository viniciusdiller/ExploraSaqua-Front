"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getLocaisByCategoria } from "@/lib/api";
import { Local } from "@/types/Interface-Local";
import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ArrowLeft, MapPin, Compass, PlusCircle } from "lucide-react";
import { categoryColors, getCategoryColor } from "@/types/Interface-Local";

export default function CategoriaPage() {
  const { slug } = useParams() as { slug: string };
  const [locais, setLocais] = useState<Local[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLocais = async () => {
      try {
        setLoading(true);
        const data = await getLocaisByCategoria(slug);
        setLocais(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Erro ao buscar locais:", error);
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchLocais();
    }
  }, [slug]);

  const bgGradient = getCategoryColor(slug);

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header da Categoria */}
      <div
        className={`w-full py-16 bg-gradient-to-r ${bgGradient} text-white text-center shadow-lg relative`}
      >
        <Link
          href="/"
          className="absolute top-6 left-6 text-white/80 hover:text-white transition-colors bg-white/10 hover:bg-white/20 p-2 rounded-full backdrop-blur-sm"
        >
          <ArrowLeft size={24} />
        </Link>
        <h1 className="text-4xl font-bold capitalize drop-shadow-md tracking-tight">
          {slug.replace("-", " ")}
        </h1>
        <p className="mt-2 text-white/90 font-medium text-lg">
          Explore o melhor de Saquarema
        </p>
      </div>

      <div className="container mx-auto px-4 -mt-8 relative z-10">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-72 w-full rounded-2xl" />
            ))}
          </div>
        ) : locais.length === 0 ? (
          /* --- ÁREA DE "SUGERIR LOCAL" REFATORADA --- */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center justify-center py-16 px-4"
          >
            <div className="bg-white rounded-3xl shadow-xl p-8 md:p-12 max-w-2xl w-full text-center border border-gray-100 relative overflow-hidden">
              {/* Elemento Decorativo de Fundo */}
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#017db9] via-[#a8cf45] to-[#d04798]" />
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-[#017db9]/5 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-[#d04798]/5 rounded-full blur-3xl pointer-events-none" />

              {/* Ícone Principal */}
              <div className="mb-6 inline-flex items-center justify-center w-20 h-20 rounded-full bg-blue-50 text-[#017db9] shadow-sm ring-4 ring-white">
                <Compass size={40} strokeWidth={1.5} />
              </div>

              {/* Textos */}
              <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-3">
                Esta área ainda está inexplorada!
              </h2>
              <p className="text-gray-600 text-lg mb-8 max-w-md mx-auto leading-relaxed">
                Nenhum local foi encontrado nesta categoria ainda. Você conhece
                algum lugar incrível que deveria estar aqui?
              </p>

              {/* Botão de Ação */}
              <Link href="/cadastro-locais">
                <Button
                  size="lg"
                  className="bg-[#017DB9] hover:bg-[#016fa3] text-white rounded-full px-8 h-12 text-base font-semibold shadow-lg shadow-blue-200 transition-all hover:scale-105 group"
                >
                  <PlusCircle className="mr-2 h-5 w-5 group-hover:rotate-90 transition-transform duration-300" />
                  Seja o primeiro a sugerir
                </Button>
              </Link>

              <p className="mt-6 text-sm text-gray-400">
                Ajude a construir o guia definitivo de Saquarema.
              </p>
            </div>
          </motion.div>
        ) : (
          /* ------------------------------------------ */

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {locais.map((local, index) => (
              <motion.div
                key={local.localId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Link href={`/categoria/${slug}/${local.localId}`}>
                  <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group h-full flex flex-col border border-gray-100">
                    <div className="relative h-56 w-full overflow-hidden">
                      <Image
                        src={local.logoUrl || "/placeholder.jpg"}
                        alt={local.nome}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-700"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-60" />
                      <div className="absolute bottom-3 left-4 right-4">
                        <span className="inline-block px-2 py-1 bg-white/20 backdrop-blur-md rounded-md text-xs text-white border border-white/30">
                          {slug.replace("-", " ")}
                        </span>
                      </div>
                    </div>

                    <div className="p-5 flex flex-col flex-grow">
                      <h3 className="text-xl font-bold text-gray-800 mb-2 group-hover:text-[#017DB9] transition-colors">
                        {local.nome}
                      </h3>
                      <div className="flex items-center text-gray-500 text-sm mb-3">
                        <MapPin size={14} className="mr-1 text-[#d04798]" />
                        <span className="truncate">
                          {local.bairro || "Saquarema"}
                        </span>
                      </div>
                      <p className="text-gray-600 text-sm line-clamp-3 flex-grow leading-relaxed">
                        {local.descricao}
                      </p>

                      {/* Rodapé do Card */}
                      <div className="flex items-center justify-between mt-5 pt-4 border-t border-gray-50">
                        <span className="text-xs font-medium text-gray-400">
                          Por: {local.criadoPor || "ExploreSaqua"}
                        </span>
                        <span className="text-sm font-semibold text-[#017DB9] flex items-center gap-1 group/btn">
                          Ver mais{" "}
                          <ArrowLeft
                            size={14}
                            className="rotate-180 group-hover/btn:translate-x-1 transition-transform"
                          />
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
