"use client";

import { motion } from "framer-motion";
import { 
  ExternalLink, 
  Search, 
  TrendingUp, 
  ShieldCheck,
  MousePointerClick,
  Cookie,
  MapPin,
  Utensils,
  ShoppingBag,
  Store,
  Briefcase
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

// Funcionalidades para o MEI (Atualizado: Sem nota fiscal)
const meiFeatures = [
  {
    title: "Vitrine Digital",
    description: "Exponha seus produtos e serviços para milhares de moradores e turistas de Saquarema.",
    icon: Store,
    color: "from-blue-500 to-cyan-500",
  },
  {
    title: "Consulta de Alvarás",
    description: "Verifique a situação cadastral e licenças do seu negócio de forma simples e digital.",
    icon: Search,
    color: "from-[#a8cf45] to-green-600",
  },
  {
    title: "Crescimento Local",
    description: "Aumente sua rede de contatos e participe do ecossistema de negócios da cidade.",
    icon: TrendingUp,
    color: "from-orange-400 to-red-500",
  },
  {
    title: "Formalização",
    description: "Orientações sobre como manter seu negócio em dia com as normas municipais.",
    icon: Briefcase,
    color: "from-purple-500 to-indigo-600",
  },
];

// O que o Cliente encontra
const clientFeatures = [
  {
    title: "Doces & Salgados",
    description: "Encontre os melhores doces caseiros, bolos e salgados artesanais da região.",
    icon: Cookie,
    color: "from-pink-400 to-rose-500",
  },
  {
    title: "Serviços Locais",
    description: "Contrate profissionais de confiança: de eletricistas a designers locais.",
    icon: MapPin,
    color: "from-emerald-400 to-teal-500",
  },
  {
    title: "Gastronomia",
    description: "Descubra novos sabores em lanchonetes e micro-restaurantes de bairro.",
    icon: Utensils,
    color: "from-amber-400 to-orange-500",
  },
  {
    title: "Apoio ao Pequeno",
    description: "Apoie a economia da nossa cidade comprando de quem produz em Saquarema.",
    icon: ShoppingBag,
    color: "from-indigo-400 to-blue-500",
  },
];

export default function MeisSaquaPage() {
  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gray-100 to-white pt-12 pb-20">
      <div className="container mx-auto px-4 max-w-6xl">
        
        {/* Cabeçalho Principal */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl md:text-6xl font-bold text-gray-800 mb-6">
            Portal{" "}
            <span className="bg-gradient-to-r from-[#017DB9] to-[#a8cf45] bg-clip-text text-transparent">
              MEI de Saqua
            </span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed font-medium">
            O ponto de encontro entre o talento local e quem valoriza o que é da nossa terra.
          </p>
        </motion.div>

        {/* SEÇÃO: PARA O EMPREENDEDOR */}
        <div className="mb-24">
          <div className="flex items-center gap-3 mb-10">
            <div className="h-10 w-2 bg-[#017DB9] rounded-full" />
            <h2 className="text-3xl font-bold text-gray-800">Para o Microempreendedor</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {meiFeatures.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="group relative overflow-hidden rounded-3xl bg-white shadow-lg p-8 border border-gray-100 hover:shadow-2xl transition-all duration-300"
                >
                  <div className={`inline-flex p-4 rounded-2xl bg-gradient-to-br ${feature.color} mb-6 text-white shadow-lg group-hover:scale-110 transition-transform`}>
                    <Icon size={28} />
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 mb-3">{feature.title}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{feature.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* SEÇÃO: PARA O CLIENTE */}
        <div className="mb-24">
          <div className="flex items-center gap-3 mb-10">
            <div className="h-10 w-2 bg-pink-500 rounded-full" />
            <h2 className="text-3xl font-bold text-gray-800">O que você encontra como Cliente</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {clientFeatures.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="group relative overflow-hidden rounded-3xl bg-white/40 backdrop-blur-md shadow-md p-8 border-2 border-transparent hover:border-pink-200 hover:bg-white transition-all duration-300"
                >
                  <div className={`inline-flex p-4 rounded-2xl bg-gradient-to-br ${feature.color} mb-6 text-white shadow-lg group-hover:rotate-6 transition-transform`}>
                    <Icon size={28} />
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 mb-3">{feature.title}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{feature.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Banner de Ação Final */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[2.5rem] p-12 md:p-20 shadow-2xl border border-blue-50 text-center relative overflow-hidden"
        >
          <div className="relative z-10">
            <h2 className="text-4xl font-bold text-gray-800 mb-8">Tudo em um só lugar</h2>
            <p className="text-gray-600 mb-12 text-xl max-w-2xl mx-auto">
              Acesse a plataforma oficial da Prefeitura para gerenciar seu negócio ou 
              conhecer os talentos da nossa cidade.
            </p>
            
            <Link href="https://meidesaqua.saquarema.rj.gov.br/" target="_blank">
              <Button className="bg-[#017DB9] hover:bg-blue-700 text-white text-xl px-16 py-10 rounded-3xl flex items-center gap-4 transition-all transform hover:scale-105 shadow-2xl mx-auto">
                Visitar Portal MEI de Saqua
                <ExternalLink size={26} />
              </Button>
            </Link>
          </div>
          
          <div className="absolute -left-20 -top-20 w-80 h-80 bg-[#a8cf45]/10 rounded-full blur-3xl" />
        </motion.div>

      </div>
    </div>
  );
}