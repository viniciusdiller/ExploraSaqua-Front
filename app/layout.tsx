import type React from "react";
import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { Toaster } from "@/components/ui/sonner";
import { ConditionalFooter } from "@/components/conditional/ConditionalFooter";
import AccessibilityStyles from "@/components/acessibilidade/AccessibilityStyles";
import { ConditionalNavbar } from "@/components/conditional/ConditionalNavbar";
import { ConditionalAccessibility } from "@/components/conditional/ConditionalAccessibility";
import "react-quill/dist/quill.snow.css";
import "@/app/cadastro-locais/quill-styles.css";

import { ConfigProvider } from "antd";
import ptBR from "antd/locale/pt_BR";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
  variable: "--font-poppins",
});

export const metadata: Metadata = {
  title: "ExploreSaqua",
  description:
    "Descubra o comércio local, o turismo e os empreendedores de Saquarema no ExploreSaqua.",

  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon.png", type: "image/png", sizes: "192x192" },
      { url: "/favicon.png", type: "image/png", sizes: "512x512" },
    ],
    apple: "/apple-touch-icon.png",
  },
  manifest: "/manifest.json",

  // --- 3. OPEN GRAPH (WHATSAPP, FACEBOOK, LINKEDIN, ETC.) ---
  // TODO: preencher "url" com o domínio de produção assim que o site for publicado
  // (ainda não existe um domínio definido — não usar "aquitemods.saquarema.rj.gov.br",
  // que é o domínio de um projeto diferente).
  openGraph: {
    type: "website",
    locale: "pt_BR",
    title: "ExploreSaqua",
    description:
      "Descubra o comércio local, o turismo e os empreendedores de Saquarema no ExploreSaqua.",
    images: [
      {
        url: "/logos/Logo-ExploreSaqua.png",
        width: 1200,
        height: 630,
        alt: "Logo ExploreSaqua",
      },
    ],
    siteName: "ExploreSaqua",
  },

  // --- 4. TWITTER CARDS (ESPECÍFICO DO TWITTER) ---
  twitter: {
    card: "summary_large_image",
    title: "ExploreSaqua",
    description: "Descubra o comércio local, o turismo e os empreendedores de Saquarema.",
    images: ["/logos/Logo-ExploreSaqua.png"],
  },
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <head>
        <AccessibilityStyles />
      </head>
      <body
        className={`${poppins.variable} bg-white flex flex-col min-h-screen`}
      >
        {/* "url" e "logo" ficam de fora até existir um domínio de produção definido —
            JSON-LD exige URLs absolutas, e usar um domínio de outro projeto seria pior
            do que omitir o campo. */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "ExploreSaqua",
            }),
          }}
        />
        <ConfigProvider
          locale={ptBR}
          theme={{
            token: {
              // cor principal global alterada conforme solicitado
              colorPrimary: "#0b6d9c",
              colorLink: "#3C6AB2",
            },
          }}
        >
          <AuthProvider>
            <ConditionalNavbar />
            <main className="flex-grow">{children}</main>
            <ConditionalFooter />
            <Toaster richColors />
            <ConditionalAccessibility />
          </AuthProvider>
        </ConfigProvider>
      </body>
    </html>
  );
}
