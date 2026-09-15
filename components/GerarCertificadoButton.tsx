"use client";

import React, { useState } from "react";
import { Button, message } from "antd";
import { FilePdfOutlined } from "@ant-design/icons";
import jsPDF from "jspdf";

interface Props {
  nomeProjeto: string;
  nomeResponsavel?: string;
  ods: string; // Ex: "ODS 1", "ODS 4 - Educação..."
  dataCadastro: string | Date;
}

// --- CORES DO SISTEMA ---
const COLORS = {
  BLUE_TITLE: "#1F4E79", // Azul escuro para o título (Corporativo)
  BLUE_PROJECT: "#2F54EB", // Azul vibrante para o nome do projeto
  TEXT_BLACK: "#222222",
  TEXT_GRAY: "#555555",
  GREEN_BADGE: "#2E7D32", // Verde escuro padrão (fallback)
  LINE_GRAY: "#CCCCCC",
  // Cores ODS para a faixa superior
  ODS_STRIP: [
    "#E5243B",
    "#DDA63A",
    "#4C9F38",
    "#C5192D",
    "#FF3A21",
    "#26BDE2",
    "#FCC30B",
    "#A21942",
    "#FD6925",
    "#DD1367",
    "#FD9D24",
    "#BF8B2E",
    "#3F7E44",
    "#0A97D9",
    "#56C02B",
    "#00689D",
    "#19486A",
  ],
};

const GerarCertificadoButton: React.FC<Props> = ({
  nomeProjeto,
  ods,
  dataCadastro,
}) => {
  const [loading, setLoading] = useState(false);

  const loadImage = (src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.src = src;
      img.crossOrigin = "Anonymous";
      img.onload = () => resolve(img);
      img.onerror = () => {
        console.warn(`Imagem não encontrada: ${src}`);
        resolve(new Image());
      };
    });
  };

  const gerarPDF = async () => {
    setLoading(true);
    try {
      // 1. Configuração: A4 Paisagem (297mm x 210mm)
      const doc = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      });

      const width = doc.internal.pageSize.getWidth();
      const height = doc.internal.pageSize.getHeight();
      const centerX = width / 2;

      // 2. Carregar Logos
      const logoOdsImg = await loadImage("/logos/Logo-ExploreSaqua.png");

      // --- ELEMENTOS DE FUNDO (MARCA D'ÁGUA SUAVE) ---
      doc.setDrawColor(240, 240, 240);
      doc.setFillColor(252, 252, 252);

      // Formas geométricas abstratas no fundo
      doc.circle(30, height - 40, 60, "S");
      doc.circle(width - 30, 50, 70, "S");

      // Hexágonos simulados à esquerda
      const hexX = 20;
      const hexY = 100;
      doc.setLineWidth(0.5);
      doc.setDrawColor(230, 230, 230);
      for (let i = 0; i < 3; i++) {
        doc.circle(hexX + i * 15, hexY + (i % 2) * 10, 8, "S");
      }

      // --- 🌈 FAIXA SUPERIOR MULTICOLORIDA ---
      const stripHeight = 6;
      const segmentWidth = width / 17; // 17 ODS

      COLORS.ODS_STRIP.forEach((color, index) => {
        doc.setFillColor(color);
        doc.rect(index * segmentWidth, 0, segmentWidth + 1, stripHeight, "F");
      });

      let currentY = 25;

      // --- LOGOTIPO CENTRALIZADO ---
      if (logoOdsImg.width > 0) {
        const logoH = 25;
        const logoW = logoOdsImg.width * (logoH / logoOdsImg.height);
        doc.addImage(
          logoOdsImg,
          "PNG",
          centerX - logoW / 2,
          currentY,
          logoW,
          logoH
        );
        currentY += logoH + 15;
      } else {
        currentY += 30;
      }

      // --- TÍTULO PRINCIPAL ---
      doc.setFont("helvetica", "bold");
      doc.setFontSize(36);
      doc.setTextColor(COLORS.BLUE_TITLE);
      doc.text("CERTIFICADO DE IMPACTO", centerX, currentY, {
        align: "center",
      });

      // Linha fina abaixo do título
      currentY += 4;
      doc.setLineWidth(0.5);
      doc.setDrawColor(COLORS.BLUE_TITLE);
      doc.line(centerX - 80, currentY, centerX + 80, currentY);

      currentY += 15;

      // --- TEXTO INSTITUCIONAL ---
      doc.setFont("helvetica", "normal");
      doc.setFontSize(14);
      doc.setTextColor(COLORS.TEXT_BLACK);
      doc.text(
        "A plataforma ExploreSaqua certifica que o projeto",
        centerX,
        currentY,
        { align: "center" }
      );

      currentY += 15;

      // --- NOME DO PROJETO (DESTAQUE) ---
      doc.setFont("helvetica", "bold");
      doc.setFontSize(28);
      doc.setTextColor(COLORS.BLUE_PROJECT);
      const nomeSplit = doc.splitTextToSize(
        nomeProjeto.toUpperCase(),
        width - 40
      );
      doc.text(nomeSplit, centerX, currentY, { align: "center" });

      currentY += nomeSplit.length * 10 + 5;

      // --- TEXTO COMPLEMENTAR ---
      doc.setFont("helvetica", "normal");
      doc.setFontSize(14);
      doc.setTextColor(COLORS.TEXT_BLACK);
      doc.text(
        "contribui ativamente para o desenvolvimento sustentável do município",
        centerX,
        currentY,
        { align: "center" }
      );
      currentY += 7;
      doc.text("e participa diretamente da plataforma.", centerX, currentY, {
        align: "center",
      });

      currentY += 15;

      // --- BLOCO DA CATEGORIA (TARJA) ---
      // Lógica de cor baseada no número da ODS
      const getOdsColor = (odsText: string) => {
        const num = parseInt(odsText.replace(/\D/g, ""));
        return COLORS.ODS_STRIP[num - 1] || COLORS.GREEN_BADGE;
      };

      const badgeColor = getOdsColor(ods);

      doc.setFillColor(badgeColor);

      // Desenha a tarja arredondada
      const badgeWidth = 160; // Largura um pouco maior para caber nomes longos
      const badgeHeight = 14;
      const badgeX = centerX - badgeWidth / 2;

      doc.roundedRect(badgeX, currentY, badgeWidth, badgeHeight, 3, 3, "F");

      // --- CORREÇÃO: REMOVIDO O QUADRADO BRANCO (ÍCONE) QUE TAPAVA O TEXTO ---

      // Texto da Categoria (Branco, Negrito, Centralizado na tarja)
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      // Centralizado sem deslocamento extra
      const textoCategoria = ods.toUpperCase().includes("ODS")
        ? ods.toUpperCase()
        : `ODS: ${ods.toUpperCase()}`;
      doc.text(`CATEGORIA: ${textoCategoria}`, centerX, currentY + 9, {
        align: "center",
      });

      currentY += 25;

      // --- MENSAGEM DE AGRADECIMENTO ---
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.setTextColor(COLORS.TEXT_BLACK);
      const msg =
        "Agradecemos por fazer parte da plataforma ExploreSaqua e por fortalecer ações que transformam nossa realidade, alinhadas aos propósitos da Agenda 2030. Sua iniciativa é essencial para construirmos juntos um futuro mais sustentável.";
      const msgSplit = doc.splitTextToSize(msg, 180);
      doc.text(msgSplit, centerX, currentY, { align: "center" });

      // --- RODAPÉ ---
      const footerY = height - 20;

      // Data
      const dataFormatada = new Date(dataCadastro).toLocaleDateString("pt-BR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
      doc.setFontSize(10);
      doc.setTextColor(COLORS.TEXT_BLACK);
      doc.text(`Data de emissão: ${dataFormatada}`, 20, footerY);

      // Assinatura
      doc.setDrawColor(COLORS.LINE_GRAY);
      doc.setLineWidth(0.5);
      doc.line(width - 100, footerY - 5, width - 20, footerY - 5);

      doc.text(
        "Assinatura Digital – Equipe ExploreSaqua",
        width - 20,
        footerY,
        { align: "right" }
      );

      // 7. Salvar
      const nomeLimpo = nomeProjeto
        .replace(/[^a-z0-9]/gi, "_")
        .substring(0, 30);
      doc.save(`Certificado_Impacto_${nomeLimpo}.pdf`);
      message.success("Certificado baixado com sucesso!");
    } catch (error) {
      console.error("Erro PDF:", error);
      message.error("Erro ao gerar o certificado.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={gerarPDF}
      loading={loading}
      icon={<FilePdfOutlined />}
      className="bg-[#003399] text-white hover:!bg-[#002266] border-none"
    >
      Baixar Certificado
    </Button>
  );
};

export default GerarCertificadoButton;
