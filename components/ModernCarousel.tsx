"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Compass } from "lucide-react";
import { useRouter } from "next/navigation";
import { categories } from "@/app/page";

// --- PALETA DE CORES ---
const COLORS = {
  primary: "#017db9", // Azul
  secondary: "#a8cf45", // Verde
  tertiary: "#d04798", // Rosa
};

// Interface ajustada para garantir tipagem
interface CategoryData {
  id: string;
  title: string;
  // Adicionei opcional caso a categoria não tenha imagem definida na lista original
  backgroundimg?: string;
  [key: string]: any;
}

interface ModernCarouselProps {
  currentCategoryId: string;
  interval?: number;
}

export default function ModernCarousel({
  currentCategoryId,
  interval = 5000,
}: ModernCarouselProps) {
  const [current, setCurrent] = useState(0);
  const [displaySlides, setDisplaySlides] = useState<CategoryData[]>([]);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Filtra a categoria atual para não mostrá-la no carrossel de sugestões
    const otherCategories = categories.filter(
      (cat) => cat.id !== currentCategoryId
    );

    // Embaralha e pega os 5 primeiros
    const shuffled = [...otherCategories].sort(() => 0.5 - Math.random());
    setDisplaySlides(shuffled.slice(0, 5));
  }, [currentCategoryId]);

  const resetTimeout = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  };

  useEffect(() => {
    if (displaySlides.length === 0) return;

    resetTimeout();
    timeoutRef.current = setTimeout(() => {
      setCurrent((prevIndex) =>
        prevIndex === displaySlides.length - 1 ? 0 : prevIndex + 1
      );
    }, interval);

    return () => resetTimeout();
  }, [current, interval, displaySlides]);

  const handleRedirect = (categoryId: string) => {
    router.push(`/categoria/${categoryId}`);
  };

  const goToSlide = (index: number) => setCurrent(index);

  const prevSlide = () => {
    if (displaySlides.length === 0) return;
    setCurrent(current === 0 ? displaySlides.length - 1 : current - 1);
  };

  const nextSlide = () => {
    if (displaySlides.length === 0) return;
    setCurrent(current === displaySlides.length - 1 ? 0 : current + 1);
  };

  if (displaySlides.length === 0) {
    return null;
  }

  return (
    // Borda atualizada para a cor Primária
    <div
      className="relative w-full h-full rounded-2xl overflow-hidden border shadow-sm"
      style={{ borderColor: COLORS.primary }}
    >
      <div
        className="flex transition-transform duration-700 ease-in-out h-full"
        style={{ transform: `translateX(-${current * 100}%)` }}
      >
        {displaySlides.map((slide, idx) => (
          <div key={idx} className="min-w-full h-full relative flex-shrink-0">
            <Image
              src={slide.backgroundimg || "/Logo_aquitemods.png"}
              alt={slide.title}
              fill
              className="object-cover w-full h-full object-center"
              sizes="(max-width: 768px) 100vw, 50vw"
              priority={idx === 0}
            />
            {/* Gradiente de sobreposição para melhorar leitura do texto */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>

            <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 w-full px-4 text-center z-10 flex flex-col items-center gap-3">
              <span className="text-white/80 text-xs uppercase tracking-widest font-semibold drop-shadow-md">
                Descubra também
              </span>
              <button
                onClick={() => handleRedirect(slide.id)}
                className="group relative overflow-hidden rounded-full px-8 py-3 font-bold text-white shadow-lg transition-all duration-300 hover:scale-105 active:scale-95"
                style={{
                  background: COLORS.primary, // Cor base azul
                }}
              >
                {/* Efeito de hover mudando para a cor Terciária (Rosa) */}
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{ background: COLORS.tertiary }}
                />

                <span className="relative z-10 flex items-center gap-2 text-sm md:text-base">
                  <Compass size={18} />
                  {slide.title}
                </span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Indicadores (Dots) */}
      <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 flex gap-2 z-10">
        {displaySlides.map((_, idx) => (
          <button
            key={idx}
            onClick={() => goToSlide(idx)}
            className="w-2.5 h-2.5 rounded-full transition-all duration-300 shadow-sm"
            style={{
              backgroundColor:
                current === idx ? COLORS.secondary : "rgba(255, 255, 255, 0.5)",
              transform: current === idx ? "scale(1.2)" : "scale(1)",
            }}
            aria-label={`Ir para slide ${idx + 1}`}
          ></button>
        ))}
      </div>

      {/* Botão Anterior */}
      <button
        onClick={prevSlide}
        className="absolute left-3 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full z-10 shadow-md backdrop-blur-sm transition-all hover:scale-110"
        aria-label="Slide anterior"
      >
        <ChevronLeft className="w-5 h-5" style={{ color: COLORS.primary }} />
      </button>

      {/* Botão Próximo */}
      <button
        onClick={nextSlide}
        className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full z-10 shadow-md backdrop-blur-sm transition-all hover:scale-110"
        aria-label="Próximo slide"
      >
        <ChevronRight className="w-5 h-5" style={{ color: COLORS.primary }} />
      </button>
    </div>
  );
}
