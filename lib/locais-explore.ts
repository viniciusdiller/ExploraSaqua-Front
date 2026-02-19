// lib/locais-desafio.ts

export interface LocalDesafio {
  id: string;
  nome: string;
  descricao: string;
  lat: number;
  lng: number;
  etiqueta: string;
  imagem: string;
}

export const LOCAIS_DESAFIO: LocalDesafio[] = [
  {
    id: "igreja-nazareth",
    nome: "Igreja de N. Sra. de Nazareth",
    descricao:
      "Erguida no alto do promontório, esta igreja histórica é o principal mirante da cidade com vista para a Praia da Vila e Itaúna.",
    lat: -22.936618,
    lng: -42.492821,
    etiqueta: "Explorador da Fé",
    imagem: "/explore/igreja.png",
  },
  {
    id: "praia-itauna",
    nome: "Praia de Itaúna",
    descricao:
      "O Maracanã do Surf! Conhecida mundialmente por suas ondas perfeitas e por sediar etapas do mundial de surf (WSL).",
    lat: -22.93647,
    lng: -42.47654,
    etiqueta: "Explorador das Ondas",
    imagem: "/explore/praia.png",
  },
  {
    id: "mirante-cruz",
    nome: "Mirante do Morro da Cruz",
    descricao:
      "O ponto ideal para uma vista panorâmica de toda a geografia da cidade, englobando a imensa lagoa e o oceano.",
    lat: -22.9242,
    lng: -42.515,
    etiqueta: "Explorador das Alturas",
    imagem: "/placeholder-user.jpg",
  },
  {
    id: "centro-volei",
    nome: "Centro de Voleibol (CBV)",
    descricao:
      "A casa das seleções brasileiras de vôlei. Um espaço que respira esporte olímpico às margens da Lagoa de Saquarema.",
    lat: -22.9215,
    lng: -42.485,
    etiqueta: "Espírito Olímpico",
    imagem: "/placeholder-user.jpg",
  },
];
