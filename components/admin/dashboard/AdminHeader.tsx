import React from "react";
import { Typography, Button } from "antd";
import { CommentOutlined, HomeOutlined, MenuOutlined } from "@ant-design/icons";
import Link from "next/link";

const { Title } = Typography;

interface AdminHeaderProps {
  isMobile: boolean;
  primaryColor: string;
}

const AdminHeader: React.FC<AdminHeaderProps> = ({ isMobile, primaryColor }) => {
  return (
    <div className="flex items-center mb-6 gap-4">
      {/* Left: title (keeps responsive centering via Title props) */}
      <div className="flex-1">
        <Title level={isMobile ? 3 : 2} className="m-0 md:text-left text-center" style={{ color: primaryColor }}>
          Painel de Administração
        </Title>
      </div>

      {/* Center: Home button (centralizado) */}
      <div className="flex-1 flex justify-center">
        <Link href="/" passHref target="_blank" rel="noopener noreferrer">
          <Button icon={<HomeOutlined />} size="large" className={isMobile ? "w-full max-w-xs" : ""}>
            Ir para Home
          </Button>
        </Link>
      </div>

      {/* Right: actions */}
      <div className="flex-1 flex justify-end items-center gap-2">
        <Link href="/admin/comentarios" passHref>
          <Button icon={<CommentOutlined />} size="large" style={{ backgroundColor: primaryColor, color: "#fff" }} className={isMobile ? "w-full" : ""}>
            Gerenciar Comentários
          </Button>
        </Link>

        {/* Como há apenas uma página de locais agora, usamos botão direto para /admin/locais */}
        <Link href="/admin/locais?view=todos" passHref>
          <Button icon={<MenuOutlined />} size="large" style={{ backgroundColor: primaryColor, color: "#fff" }} className={isMobile ? "w-full" : ""}>
            Gerenciar Locais
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default AdminHeader;