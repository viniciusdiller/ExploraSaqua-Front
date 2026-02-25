import React from "react";
import { Typography, Button } from "antd";
import { DatabaseOutlined, CommentOutlined, HomeOutlined } from "@ant-design/icons";
import Link from "next/link";

const { Title } = Typography;

interface AdminHeaderProps {
  isMobile: boolean;
  primaryColor: string;
}

const AdminHeader: React.FC<AdminHeaderProps> = ({ isMobile, primaryColor }) => {
  return (
    <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-4">
      <Title level={isMobile ? 3 : 2} className="m-0 md:text-left text-center" style={{ color: primaryColor }}>
        Painel de Administração
      </Title>

      <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
        <Link href="/" passHref target="_blank" rel="noopener noreferrer">
          <Button icon={<HomeOutlined />} size="large" className={isMobile ? "w-full" : ""}>
            Ir para Home
          </Button>
        </Link>
      </div>

      <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
        <Link href="/admin/locais-ativos" passHref>
          <Button type="primary" icon={<DatabaseOutlined />} size="large" className={isMobile ? "w-full" : ""}>
            Gerenciar Locais Ativos
          </Button>
        </Link>
        <Link href="/admin/comentarios" passHref>
          <Button icon={<CommentOutlined />} size="large" style={{ backgroundColor: primaryColor, color: "#fff" }} className={isMobile ? "w-full" : ""}>
            Gerenciar Comentários
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default AdminHeader;