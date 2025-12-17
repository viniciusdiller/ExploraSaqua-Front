"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getLocaisByCategoria } from "@/lib/api"; // Função renomeada
import { Local } from "@/types/Interface-Local"; // Interface renomeada
import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ArrowLeft, MapPin } from "lucide-react";
import { categoryColors, getCategoryColor } from "@/types/Interface-Local"; // Cores do ExploraSaqua

export default function CategoriaPage() {
  const { slug } = useParams() as { slug: string };
  const [locais, setLocais] = useState<Local[]>([]);
  const [loading, setLoading] = useState(true);

  // Decodifica slug amigável (ex: "pontos-turisticos") se necessário
  // No ExploraSaqua, o ID da categoria já é o slug.

  useEffect(() => {
    const fetchLocais = async () => {
      try {
        setLoading(true);
        // Chama a API simulada ou real
        const data = await getLocaisByCategoria(slug);
        // Se a API retornar array vazio ou erro, tratamos aqui
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
          className="absolute top-6 left-6 text-white/80 hover:text-white transition-colors"
        >
          <ArrowLeft size={32} />
        </Link>
        <h1 className="text-4xl font-bold capitalize drop-shadow-md">
          {slug.replace("-", " ")}
        </h1>
        <p className="mt-2 text-white/90 font-medium">
          Explore as melhores opções em Saquarema
        </p>
      </div>

      <div className="container mx-auto px-4 -mt-8 relative z-10">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-64 w-full rounded-xl" />
            ))}
          </div>
        ) : locais.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-10 text-center">
            <h3 className="text-xl text-gray-600">
              Nenhum local encontrado nesta categoria ainda.
            </h3>
            <p className="text-gray-400 mt-2">
              Seja o primeiro a sugerir um local!
            </p>
            <Link href="/sugerir-local">
              <Button className="mt-4 bg-[#017DB9]">Sugerir Local</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {locais.map((local, index) => (
              <motion.div
                key={local.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Link href={`/categoria/${slug}/${local.id}`}>
                  <div className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 group h-full flex flex-col">
                    <div className="relative h-48 w-full overflow-hidden">
                      <Image
                        src={local.imagemCapa || "/placeholder.jpg"}
                        alt={local.nome}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                    <div className="p-5 flex flex-col flex-grow">
                      <h3 className="text-xl font-bold text-gray-800 mb-2">
                        {local.nome}
                      </h3>
                      <p className="text-gray-600 text-sm line-clamp-3 mb-4 flex-grow">
                        {local.descricao}
                      </p>

                      {/* Rodapé do Card */}
                      <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-100">
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                          {local.autorNome || "ExploraSaqua"}
                        </span>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-[#017DB9] hover:bg-blue-50"
                        >
                          Ver detalhes
                        </Button>
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
