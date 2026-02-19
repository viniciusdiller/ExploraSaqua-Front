"use client";

import React from "react";
import CarouselSobre from "@/components/CarouselSobre";
import { MapPin } from "lucide-react";
import FaleConoscoButton from "@/components/FaleConoscoButton";
import Link from "next/link";
import Image from "next/image";

export default function SobreExploraSaquaPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#017DB9] to-[#007a73] py-20 px-6 sm:px-12">
      <div className="max-w-5xl mx-auto bg-white rounded-3xl shadow-lg p-10 sm:p-16">
        {/* --- CABEÇALHO --- */}
        <section className="mb-8">
          <div className="md:flex md:items-center md:gap-8 lg:gap-12">
            <div className="md:w-2/3">
              <h1
                className="text-4xl font-extrabold mb-6 inline-block pb-2
                  bg-gradient-to-r from-[#017DB9] to-[#007a73]
                  bg-no-repeat
                  [background-position:0_100%]
                  [background-size:100%_4px]"
              >
                <span className="bg-gradient-to-r from-[#017DB9] to-[#007a73] bg-clip-text text-transparent">
                  ExploraSaqua
                </span>
              </h1>
              <p className="text-gray-700 leading-relaxed text-lg">
                O {""}
                <span className="bg-gradient-to-r from-[#017DB9] to-[#007a73] bg-clip-text text-transparent font-bold">
                  #ExploraSaqua{" "}
                </span>
                é o seu guia definitivo para descobrir o melhor de{" "}
                <strong>Saquarema</strong>. Uma iniciativa pensada para conectar
                moradores e visitantes aos encantos, serviços e oportunidades
                que nossa cidade oferece.
              </p>
              <p className="text-gray-700 leading-relaxed text-lg mt-4">
                A plataforma nasce com o propósito de reunir, sistematizar e
                facilitar o acesso a informações sobre{" "}
                <strong>
                  turismo, gastronomia, serviços essenciais e lazer
                </strong>
                , promovendo o desenvolvimento econômico local e valorizando o
                que é nosso.
              </p>
              <p className="text-gray-700 leading-relaxed text-lg mt-4">
                Mais do que um guia comercial, o {""}
                <span className="bg-gradient-to-r from-[#017DB9] to-[#007a73] bg-clip-text text-transparent font-bold">
                  #ExploraSaqua{" "}
                </span>
                é um ecossistema de descoberta, onde cada esquina, cada trilha e
                cada negócio local ganha visibilidade e se conecta com quem
                procura qualidade e experiências únicas.
              </p>
            </div>
            <div className="mt-8 md:mt-0 md:w-1/3 flex-shrink-0">
              {/* Você pode manter o carrossel se ele tiver imagens genéricas ou de Saquarema */}
              <CarouselSobre />
            </div>
          </div>
        </section>

        {/* --- O QUE É / CONTEXTO --- */}
        <section className="mb-8 border-t pt-8">
          <h2 className="text-3xl font-semibold text-left mb-10">
            <span className="bg-gradient-to-r from-[#017DB9] to-[#007a73] bg-clip-text text-transparent">
              Conectando Você a Saquarema
            </span>
          </h2>
          <p className="text-gray-700 leading-relaxed text-lg mt-4">
            A criação do {""}
            <span className="bg-gradient-to-r from-[#017DB9] to-[#007a73] bg-clip-text text-transparent font-bold">
              #ExploraSaqua{" "}
            </span>{" "}
            surge da necessidade de centralizar as informações da cidade em um
            único lugar, acessível e moderno.
          </p>
          <p className="text-gray-700 leading-relaxed text-lg mt-4">
            Saquarema é rica em belezas naturais, cultura e empreendedorismo. No
            entanto, muitas vezes, moradores e turistas desconhecem a vasta gama
            de opções disponíveis. O <strong>ExploraSaqua</strong> vem para
            preencher essa lacuna, servindo como uma vitrine digital para
            pequenos e grandes negócios, pontos turísticos e serviços de
            utilidade pública.
          </p>
          <p className="text-gray-700 leading-relaxed text-lg mt-4">
            Seja para encontrar a <strong>melhor moqueca da região</strong>,
            descobrir uma <strong>trilha escondida</strong>, localizar uma{" "}
            <strong>farmácia de plantão</strong> ou encontrar uma{" "}
            <strong>escola para seu filho</strong>, o ExploraSaqua é o seu ponto
            de partida.
          </p>

          <p className="text-gray-700 leading-relaxed text-lg mt-4">
            A plataforma valoriza a identidade local, incentivando o consumo
            dentro do município e fortalecendo a economia criativa. É a
            tecnologia trabalhando a favor do desenvolvimento local e da
            qualidade de vida de todos que amam Saquarema.
          </p>
        </section>

        {/* --- RECURSOS / OBJETIVO --- */}
        <section className="mb-8 border-t pt-8">
          <h2 className="text-2xl font-semibold mb-3">
            <span className="bg-gradient-to-r from-[#017DB9] to-[#007a73] bg-clip-text text-transparent">
              Objetivo e Funcionalidades
            </span>
          </h2>
          <p className="text-gray-700 leading-relaxed text-lg mt-4">
            A plataforma {""}
            <span className="bg-gradient-to-r from-[#017DB9] to-[#007a73] bg-clip-text text-transparent font-bold">
              #ExploraSaqua{" "}
            </span>{" "}
            tem como principal objetivo identificar, catalogar e divulgar locais
            de interesse em diversas categorias.
          </p>
          <p className="text-gray-700 leading-relaxed text-lg mt-4">
            Cada local cadastrado possui informações detalhadas, fotos,
            localização e avaliações, permitindo que o usuário tome decisões
            informadas e descubra novas experiências.
          </p>
          <p className="text-gray-700 leading-relaxed text-lg mt-4">
            Além disso, a plataforma visa:
          </p>
          <ul className="mt-3 list-disc list-inside text-gray-700 leading-relaxed text-lg space-y-2">
            <li>
              Facilitar a <strong>busca por serviços e lazer</strong> no
              município;
            </li>
            <li>
              Dar visibilidade a{" "}
              <strong>microempreendedores e negócios locais</strong>;
            </li>
            <li>
              Promover o <strong>turismo consciente</strong> e a valorização do
              patrimônio natural;
            </li>
            <li>
              Engajar a comunidade através de{" "}
              <strong>avaliações e sugestões</strong> de novos locais;
            </li>
            <li>
              Centralizar{" "}
              <strong>telefones úteis e serviços de emergência</strong> para
              rápido acesso.
            </li>
          </ul>
        </section>

        {/* --- IMPORTÂNCIA --- */}
        <section className="mb-8 border-t pt-8">
          <h2 className="text-2xl font-semibold text-[#007a73] mb-3">
            <span className="bg-gradient-to-r from-[#017DB9] to-[#007a73] bg-clip-text text-transparent">
              Por que usar o ExploraSaqua?
            </span>
          </h2>
          <p className="text-gray-700 leading-relaxed text-lg mt-4">
            Em um mundo cada vez mais digital, ter a informação na palma da mão
            é essencial. Para o <strong>morador</strong>, é a facilidade de
            encontrar serviços no seu bairro. Para o <strong>turista</strong>, é
            a segurança de roteiros confiáveis e dicas valiosas.
          </p>
          <p className="text-gray-700 leading-relaxed text-lg mt-4">
            O {""}
            <span className="bg-gradient-to-r from-[#017DB9] to-[#007a73] bg-clip-text text-transparent font-bold">
              #ExploraSaqua{" "}
            </span>{" "}
            oferece:
          </p>

          <ul className="mt-3 list-disc list-inside text-gray-700 leading-relaxed text-lg space-y-2">
            <li>
              <strong>Geolocalização e Mapas</strong> para você chegar onde
              precisa;
            </li>
            <li>
              <strong>Filtros por Categoria</strong> para encontrar exatamente o
              que procura;
            </li>
            <li>
              <strong>Atualizações constantes</strong> colaborativas;
            </li>
            <li>
              <strong>Inclusão Digital</strong> para pequenos comerciantes que
              ganham uma vitrine online.
            </li>
          </ul>
        </section>

        {/* --- CATEGORIAS --- */}
        <section className="mb-8 border-t pt-8">
          <h2 className="text-2xl font-semibold text-[#007a73] mb-3">
            <span className="bg-gradient-to-r from-[#017DB9] to-[#007a73] bg-clip-text text-transparent">
              O que você vai encontrar
            </span>
          </h2>
          <p className="text-gray-700 leading-relaxed text-lg">
            O{" "}
            <span className="bg-gradient-to-r from-[#017DB9] to-[#007a73] bg-clip-text text-transparent font-bold">
              #ExploraSaqua
            </span>{" "}
            cobre diversas áreas de interesse:
          </p>
          <ul className="mt-3 list-disc list-inside text-gray-700 leading-relaxed text-lg space-y-2">
            <li>
              <span className="text-orange-500 font-semibold">Gastronomia</span>
              <strong> — Restaurantes, Lanchonetes e Bares:</strong> Sabores
              locais e internacionais.
            </li>
            <li>
              <span className="text-blue-500 font-semibold">Turismo</span>{" "}
              <strong>— Pontos Turísticos e Praias:</strong> As belezas naturais
              da Capital do Surf.
            </li>
            <li>
              <span className="text-green-600 font-semibold">Aventura</span>{" "}
              <strong>— Trilhas e Esportes:</strong> Para quem busca contato com
              a natureza.
            </li>
            <li>
              <span className="text-purple-600 font-semibold">Serviços</span>{" "}
              <strong>— Escolas, Saúde e Utilidade Pública:</strong> Informações
              essenciais para o dia a dia.
            </li>
            <li>
              <span className="text-yellow-600 font-semibold">Hospedagem</span>{" "}
              <strong>— Hotéis e Pousadas:</strong> Conforto para quem visita.
            </li>
          </ul>
        </section>

        {/* --- CHAMADA PARA AÇÃO --- */}
        <section className="mt-12 border-t pt-8">
          <h2 className="text-3xl font-bold text-center mb-10">
            <span className="bg-gradient-to-r from-[#017DB9] to-[#007a73] bg-clip-text text-transparent">
              Faça Parte dessa Descoberta!
            </span>
          </h2>
          <p className="text-gray-700 leading-relaxed text-lg text-center">
            Conhece um lugar incrível que não está aqui? Você é proprietário de
            um estabelecimento? Ajude-nos a construir o mapa mais completo de
            Saquarema.
          </p>

          <p className="text-gray-700 leading-relaxed text-lg mt-4 flex justify-center items-center gap-2">
            Explore, avalie e compartilhe com o{""}
            <span className="bg-gradient-to-r from-[#017DB9] to-[#007a73] bg-clip-text text-transparent font-bold">
              #ExploraSaqua.
            </span>
            <MapPin size={24} className="inline text-[#017DB9]" />
          </p>
        </section>

        {/* --- BOTÃO DE CADASTRO --- */}
        <section className="mt-12 border-t pt-8">
          <h2 className="text-3xl font-bold text-center mb-10">
            <span className="bg-gradient-to-r from-[#017DB9] to-[#007a73] bg-clip-text text-transparent">
              Divulgue seu Local ou Serviço!
            </span>
          </h2>
          <div className="flex justify-center">
            <Link
              href="/sugerir-local" // Rota atualizada conforme nossa refatoração
              className="group block text-center w-full sm:w-1/2 lg:w-1/3"
            >
              <div className="overflow-hidden rounded-lg border border-gray-200 group-hover:shadow-xl transition-shadow duration-300 bg-gray-50 p-4">
                {/* Substituir pelo LogoExplora.png quando disponível */}
                <Image
                  src="/logos/Logo_Explore.png"
                  alt="Logo Explore Saquá"
                  width={400}
                  height={300}
                  className="w-full h-auto object-contain transform duration-300 group-hover:scale-105"
                />
              </div>
              <p className="mt-3 text-md font-semibold text-gray-800 group-hover:text-[#017DB9] transition-colors duration-300">
                Cadastre um Local Agora
              </p>
            </Link>
          </div>
        </section>

        <FaleConoscoButton />
      </div>
    </div>
  );
}
