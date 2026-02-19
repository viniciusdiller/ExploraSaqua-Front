"use client";

import React, { useState, useEffect } from "react";
import FaleConoscoButton from "@/components/FaleConoscoButton";
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

// IMPORTANDO OS DADOS E A TIPAGEM
import { LOCAIS_DESAFIO, LocalDesafio } from "@/lib/locais-explore";

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

export default function EspacoExplorePage() {
  const [unlockedLocais, setUnlockedLocais] = useState<string[]>([]);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{
    id: string;
    message: string;
    type: "success" | "error";
  } | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("explora_saqua_badges");
    if (saved) {
      setUnlockedLocais(JSON.parse(saved));
    }
  }, []);

  // Agora tipamos usando a interface LocalDesafio que criamos
  const handleCheckIn = (local: LocalDesafio) => {
    setLoadingId(local.id);
    setFeedback(null);

    if (!navigator.geolocation) {
      setFeedback({
        id: local.id,
        message: "Geolocalização não suportada.",
        type: "error",
      });
      setLoadingId(null);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userLat = position.coords.latitude;
        const userLng = position.coords.longitude;
        const distanceMeters = getDistanceFromLatLonInM(
          userLat,
          userLng,
          local.lat,
          local.lng,
        );

        if (distanceMeters <= 300) {
          // Raio de 300 metros
          const newUnlocked = [...unlockedLocais, local.id];
          setUnlockedLocais(newUnlocked);
          localStorage.setItem(
            "explora_saqua_badges",
            JSON.stringify(newUnlocked),
          );
          setFeedback({
            id: local.id,
            message: "Check-in confirmado com sucesso!",
            type: "success",
          });
        } else {
          setFeedback({
            id: local.id,
            message: `Você está a ${Math.round(distanceMeters)}m. Aproxime-se do local!`,
            type: "error",
          });
        }
        setLoadingId(null);
      },
      (error) => {
        setFeedback({
          id: local.id,
          message: "Ative o GPS do seu dispositivo.",
          type: "error",
        });
        setLoadingId(null);
      },
      { enableHighAccuracy: true },
    );
  };

  const progress = Math.round(
    (unlockedLocais.length / LOCAIS_DESAFIO.length) * 100,
  );
  const isCompleted = unlockedLocais.length === LOCAIS_DESAFIO.length;

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
            <div className="flex justify-between items-center mb-3">
              <span className="text-gray-700 text-lg font-medium">
                Locais Visitados
              </span>
              <span className="text-2xl font-bold bg-gradient-to-r from-[#017DB9] to-[#007a73] bg-clip-text text-transparent">
                {progress}%
              </span>
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
          <h2 className="text-3xl font-semibold text-left mb-10">
            <span className="bg-gradient-to-r from-[#017DB9] to-[#007a73] bg-clip-text text-transparent">
              Desafios Disponíveis
            </span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {LOCAIS_DESAFIO.map((local) => {
              const isUnlocked = unlockedLocais.includes(local.id);

              return (
                <div
                  key={local.id}
                  className={`flex flex-col justify-between p-6 rounded-2xl border transition-all duration-300 ${
                    isUnlocked
                      ? "border-[#007a73] bg-[#f0f9f8]"
                      : "border-gray-200 bg-white hover:border-[#017DB9] hover:shadow-md"
                  }`}
                >
                  <div className="mb-4">
                    <h3 className="text-xl font-bold text-gray-800">
                      {local.nome}
                    </h3>
                    {isUnlocked && (
                      <div className="inline-flex items-center gap-1 mt-2 text-[#007a73] text-sm font-semibold bg-[#e6f7f6] px-3 py-1 rounded-full">
                        <MapPin size={14} /> Desbloqueado
                      </div>
                    )}
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
                          {local.nome}
                        </DialogTitle>
                      </DialogHeader>

                      <div className="flex flex-col gap-4 mt-2">
                        {/* Imagem do Local */}
                        <div className="w-full h-48 rounded-xl overflow-hidden bg-gray-100">
                          <img
                            src={local.imagem}
                            alt={local.nome}
                            className="w-full h-full object-cover"
                          />
                        </div>

                        {/* Descrição */}
                        <DialogDescription className="text-gray-700 text-base leading-relaxed">
                          {local.descricao}
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
                                Etiqueta: {local.etiqueta}
                              </div>
                            </div>
                          ) : (
                            <div className="flex flex-col gap-3">
                              <div className="flex flex-col sm:flex-row gap-3">
                                {/* Botão Traçar Rota */}
                                <Button
                                  asChild
                                  variant="outline"
                                  className="w-full sm:w-1/2 flex items-center justify-center gap-2 border-blue-200 text-[#017DB9] hover:bg-blue-50 py-6 rounded-xl"
                                >
                                  <a
                                    href={`https://www.google.com/maps/dir/?api=1&destination=${local.lat},${local.lng}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    <Navigation size={18} />
                                    Traçar Rota
                                  </a>
                                </Button>

                                {/* Botão Validar Localização */}
                                <button
                                  onClick={() => handleCheckIn(local)}
                                  disabled={loadingId === local.id}
                                  className="w-full sm:w-1/2 bg-[#017DB9] hover:bg-[#007a73] text-white font-semibold py-3 px-4 rounded-xl transition-colors disabled:opacity-70 flex justify-center items-center gap-2"
                                >
                                  {loadingId === local.id ? (
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
                              {feedback?.id === local.id && (
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
            })}
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
