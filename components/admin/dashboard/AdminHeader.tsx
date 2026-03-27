import React from "react";
import { Typography, Button, Dropdown } from "antd";
import { CommentOutlined, HomeOutlined, MenuOutlined, UserAddOutlined, AppstoreOutlined } from "@ant-design/icons";
import Link from "next/link";

const { Title } = Typography;

interface AdminHeaderProps {
  isMobile: boolean;
  primaryColor: string;
}

const AdminHeader: React.FC<AdminHeaderProps> = ({ isMobile, primaryColor }) => {
  const actionItems = [
    {
      key: "comentarios",
      icon: <CommentOutlined />,
      label: <Link href="/admin/comentarios">Gerenciar Comentários</Link>,
    },
    {
      key: "locais",
      icon: <AppstoreOutlined />,
      label: <Link href="/admin/locais?view=todos">Gerenciar Locais</Link>,
    },
    {
      key: "usuarios",
      icon: <UserAddOutlined />,
      label: <Link href="/admin/users">Gerenciar Usuários</Link>,
    },
  ];

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
        <Dropdown menu={{ items: actionItems }} trigger={["click"]} placement="bottomRight">
          <Button
            icon={<MenuOutlined />}
            size="large"
            style={{ backgroundColor: primaryColor, color: "#fff" }}
            className={isMobile ? "w-full" : ""}
          >
            Gerenciar
          </Button>
        </Dropdown>
      </div>
    </div>
  );
};

export default AdminHeader;