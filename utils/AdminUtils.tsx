import React from "react";
import { Typography, Image, Button, Row, Col } from "antd";
import FormattedDescription from "@/components/FormattedDescription";

const { Text } = Typography;
const API_URL = process.env.NEXT_PUBLIC_API_URL;

export const fieldConfig: Record<string, { label: string; order: number; group: string }> = {
  nomeResponsavel: { label: "Nome do Responsável", order: 1, group: "identificacao" },
  cpfResponsavel: { label: "CPF do Responsável", order: 2, group: "identificacao" },
  emailResponsavel: { label: "E-mail do Responsável", order: 3, group: "identificacao" },
  contatoResponsavel: { label: "Contato do Responsável", order: 4, group: "identificacao" },
  
  localId: { label: "ID do Registro", order: 5, group: "identificacao" },
  nomeLocal: { label: "Nome do Estabelecimento", order: 6, group: "info" },
  categoria: { label: "Categoria", order: 7, group: "info" },
  contatoLocal: { label: "Telefone/Contato Local", order: 8, group: "info" },
  instagram: { label: "Instagram", order: 9, group: "info" },
  endereco: { label: "Endereço Completo", order: 10, group: "info" },
  descricao: { label: "Descrição Detalhada", order: 11, group: "info" },
  
  logoUrl: { label: "Logo Atual", order: 20, group: "info" },
  logo: { label: "Nova Logo", order: 21, group: "info" },
  localImg: { label: "Portfólio / Imagens", order: 22, group: "info" },
  
  alvaraFuncionamentoUrl: { label: "Alvará de Funcionamento", order: 23, group: "info" },
  alvaraVigilanciaUrl: { label: "Alvará da Vigilância", order: 24, group: "info" },
  
  latitude: { label: "Latitude", order: 30, group: "meta" },
  longitude: { label: "Longitude", order: 31, group: "meta" },
  status: { label: "Status do Processo", order: 32, group: "meta" },
  ativo: { label: "Publicado no Site", order: 33, group: "meta" },
  createdAt: { label: "Data de Submissão", order: 100, group: "meta" },
  updatedAt: { label: "Última Atualização", order: 101, group: "meta" },
};

export const getFullImageUrl = (path: string): string => {
  if (!path) return "";
  if (path.startsWith("http") || path.startsWith("blob:")) return path;
  const normalizedPath = path.replace(/\\/g, "/");
  const cleanPath = normalizedPath.startsWith("/") ? normalizedPath.substring(1) : normalizedPath;
  return `${API_URL}/${cleanPath}`;
};

export const renderValue = (key: string, value: any): React.ReactNode => {
  if (value === null || value === undefined || value === "") {
    return <Text type="secondary">Não informado</Text>;
  }

  // Links
  if (key === "linkLocal" || key === "website" || key === "instagram") {
    let href = String(value).trim();
    if (key === "instagram" && !href.includes("instagram.com") && !/^https?:\/\//i.test(href)) {
      href = `https://www.instagram.com/${href.replace(/^@/, "")}`;
    } else if (!/^https?:\/\//i.test(href)) {
      href = `https://${href}`;
    }
    return <a href={href} target="_blank" rel="noopener noreferrer" style={{ color: "#d6386d", textDecoration: "underline" }}>{String(value)}</a>;
  }

  // Textos longos
  if (key === "descricao") return <div className="prose prose-sm max-w-none prose-p:my-1" dangerouslySetInnerHTML={{ __html: value }} />;
  if (key === "descricaoDiferencial") return <FormattedDescription text={value} />;
  if (["motivo", "motivoExclusao", "outrasAlteracoes"].includes(key)) {
    return <Typography.Paragraph style={{ whiteSpace: "pre-wrap", margin: 0 }}>{String(value)}</Typography.Paragraph>;
  }

  // Datas e Booleanos
  if (key === "createdAt" || key === "updatedAt") {
    try {
      return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date(value));
    } catch { return String(value); }
  }
  if (key === "venceuPspe" || key === "ativo") {
    return (String(value).toLowerCase() === "true" || value === true) ? "Sim" : "Não";
  }

  // Imagens e Documentos
  if (["localImg", "imagens", "produtosImg"].includes(key) && Array.isArray(value)) {
    const imagesUrls = value.map(item => getFullImageUrl(typeof item === "string" ? item : item.url)).filter(Boolean);
    return (
      <Image.PreviewGroup>
        <Row gutter={[8, 8]}>
          {imagesUrls.map((url, i) => (
            <Col key={i}>
              <Image 
                src={url} 
                alt={`Img ${i}`} 
                width={80} 
                height={80} 
                style={{ objectFit: "cover", borderRadius: "4px" }} 
                fallback="/placeholder-logo.svg" 
              />
            </Col>
          ))}
        </Row>
      </Image.PreviewGroup>
    );
  }
  
  if (["logoUrl", "logo", "oficioUrl", "oficio", "alvaraFuncionamentoUrl", "alvaraVigilanciaUrl"].includes(key) && typeof value === "string") {
    const url = getFullImageUrl(value);
    if (url.toLowerCase().endsWith(".pdf")) return <Button type="primary" href={url} target="_blank" size="small">Visualizar PDF</Button>;
    return <Image src={url} alt="Mídia" width={150} />;
  }

  if (typeof value === "object" && value !== null) return JSON.stringify(value);
  return String(value);
};