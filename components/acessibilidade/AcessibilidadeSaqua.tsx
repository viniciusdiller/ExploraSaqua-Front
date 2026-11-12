"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { atualizarMenu, type OpcoesMenuAcessibilidade } from "@/lib/acessibilidade";

const OPCOES: OpcoesMenuAcessibilidade = {
  cor: "#017AB7",
  corEscura: "#015E8E",
  suave: "#E1F1F9",
};

/**
 * Menu de acessibilidade (Libras, ajustes de leitura e ouvir a página),
 * igual ao da Agenda Saquarema. Não aparece no /admin.
 */
export default function AcessibilidadeSaqua() {
  const pathname = usePathname();

  useEffect(() => {
    atualizarMenu(document, pathname ?? "/", OPCOES);
  }, [pathname]);

  return null;
}
