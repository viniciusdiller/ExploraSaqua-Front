"use client";
import React from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { HelpCircle, MapPin } from "lucide-react";
import FaleConoscoButton from "@/components/FaleConoscoButton";
import Link from "next/link";
import Image from "next/image";

export default function FAQPage() {
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
                  Perguntas Frequentes (FAQ)
                </span>
              </h1>
              <p className="text-gray-700 leading-relaxed text-lg">
                Tire suas dúvidas sobre o <strong>ExploraSaqua</strong>, como
                encontrar os melhores lugares da cidade, sugerir novos locais e
                divulgar seu negócio.
              </p>
              <p className="text-gray-700 leading-relaxed text-lg mt-4">
                Sua pergunta não está listada? Sinta-se à vontade para falar
                conosco! Estamos disponíveis no link 'Contato' no rodapé ou no
                botão flutuante de WhatsApp.
              </p>
            </div>
            <div className="mt-8 md:mt-0 md:w-1/3 flex-shrink-0 flex items-center justify-center">
              {/* Ícone ou Logo alusivo a dúvidas/mapa */}
              <div className="relative">
                <HelpCircle
                  size={150}
                  className="text-[#017DB9] opacity-20"
                  strokeWidth={1}
                />
                <MapPin
                  size={60}
                  className="text-[#007a73] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-80"
                />
              </div>
            </div>
          </div>
        </section>

        {/* --- SEÇÃO DE PERGUNTAS GERAIS --- */}
        <section className="mb-8 border-t-2 pt-8">
          <h2 className="text-3xl font-bold text-left mb-10">
            <span className="bg-gradient-to-r from-[#017DB9] to-[#007a73] bg-clip-text text-transparent">
              Sobre o ExploraSaqua
            </span>
          </h2>

          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1">
              <AccordionTrigger className="text-lg text-left font-semibold hover:text-[#017DB9]">
                O que é a plataforma ExploraSaqua?
              </AccordionTrigger>
              <AccordionContent className="text-gray-700 leading-relaxed text-base">
                O <strong>#ExploraSaqua</strong> é o guia digital definitivo de
                Saquarema. Uma iniciativa para conectar moradores e turistas aos
                melhores pontos turísticos, serviços, comércios e experiências
                que nossa cidade tem a oferecer. É um espaço colaborativo onde
                você descobre e compartilha o que Saquarema tem de melhor.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2">
              <AccordionTrigger className="text-lg text-left font-semibold hover:text-[#017DB9]">
                A plataforma é gratuita?
              </AccordionTrigger>
              <AccordionContent className="text-gray-700 leading-relaxed text-base">
                Sim! Tanto para usuários que buscam informações quanto para
                empreendedores que desejam cadastrar seus locais. O objetivo é
                fomentar o turismo e a economia local de forma acessível a
                todos.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3">
              <AccordionTrigger className="text-lg text-left font-semibold hover:text-[#017DB9]">
                Quais tipos de locais posso encontrar aqui?
              </AccordionTrigger>
              <AccordionContent className="text-gray-700 leading-relaxed text-base">
                Você encontra de tudo: desde <strong>pontos turísticos</strong>{" "}
                famosos e <strong>praias</strong>, até{" "}
                <strong>restaurantes</strong>, <strong>hotéis</strong>, serviços
                essenciais (como farmácias e escolas), eventos culturais e
                comércios locais diversos.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </section>

        {/* --- SEÇÃO DE CADASTRO E SUGESTÃO --- */}
        <section className="mb-8 border-t-2 pt-8">
          <h2 className="text-3xl font-bold text-left mb-10">
            <span className="bg-gradient-to-r from-[#017DB9] to-[#007a73] bg-clip-text text-transparent">
              Sugerir e Gerenciar Locais
            </span>
          </h2>

          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-4">
              <AccordionTrigger className="text-lg text-left font-semibold hover:text-[#017DB9]">
                Quem pode sugerir um novo local?
              </AccordionTrigger>
              <AccordionContent className="text-gray-700 leading-relaxed text-base">
                Qualquer pessoa! Se você é dono de um estabelecimento, pode
                cadastrá-lo para ganhar visibilidade. Se você é um visitante e
                descobriu um lugar incrível que não está no mapa, também pode
                sugeri-lo para ajudar outras pessoas.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-5">
              <AccordionTrigger className="text-lg text-left font-semibold hover:text-[#017DB9]">
                Como faço para CADASTRAR um local na plataforma?
              </AccordionTrigger>
              <AccordionContent className="text-gray-700 leading-relaxed text-base">
                1. Você precisa ter um cadastro de usuário e estar logado. Se
                não tiver,{" "}
                <Link
                  href="/cadastro"
                  className="text-[#017DB9] font-bold underline hover:text-[#005f8d]"
                >
                  clique aqui para se cadastrar
                </Link>
                .
                <br />
                2. Acesse a página{" "}
                <Link
                  href="/sugerir-local"
                  className="text-[#017DB9] font-bold underline hover:text-[#005f8d]"
                >
                  "Sugerir Local"
                </Link>{" "}
                no menu do seu perfil.
                <br />
                3. Preencha o formulário com as informações do local (Nome,
                Categoria, Endereço, Descrição) e adicione fotos atraentes.
                <br />
                4. Após o envio, sua sugestão passará por uma rápida moderação
                da nossa equipe antes de ser publicada.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-6">
              <AccordionTrigger className="text-lg text-left font-semibold hover:text-[#017DB9]">
                Como posso ATUALIZAR as informações do meu negócio?
              </AccordionTrigger>
              <AccordionContent className="text-gray-700 leading-relaxed text-base">
                Se você é o proprietário ou o autor do cadastro, pode solicitar
                a edição através do painel de usuário ou na própria página do
                local clicando em "Sugerir Edição". Nossa equipe verificará as
                alterações para manter a qualidade das informações.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-7">
              <AccordionTrigger className="text-lg text-left font-semibold hover:text-[#017DB9]">
                Como funcionam as avaliações?
              </AccordionTrigger>
              <AccordionContent className="text-gray-700 leading-relaxed text-base">
                Usuários cadastrados podem avaliar os locais com notas
                (estrelas) e comentários. Isso ajuda a comunidade a identificar
                os melhores serviços e experiências. Comentários ofensivos ou
                que violem nossas diretrizes serão removidos pela moderação.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </section>

        <FaleConoscoButton />
      </div>
    </div>
  );
}
