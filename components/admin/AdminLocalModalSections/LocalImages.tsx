import React from "react";
import { Row, Col, Typography, Image as AntdImage, Button, Popconfirm, message, Tag } from "antd";
import { CloseOutlined, QuestionCircleOutlined } from "@ant-design/icons";

const { Title } = Typography;

interface LocalImagesProps {
  colors: { primary: string };
  currentLogo: string | null;
  logoToDelete: boolean;
  currentPortfolio: any[];
  portfolioToDelete: string[];
  getFullImageUrl: (path: string) => string;
  setLogoToDelete: (val: boolean) => void;
  setCurrentLogo: (val: string | null) => void;
  setPortfolioToDelete: React.Dispatch<React.SetStateAction<string[]>>;
  setCurrentPortfolio: React.Dispatch<React.SetStateAction<any[]>>;
}

export const LocalImages: React.FC<LocalImagesProps> = ({
  colors,
  currentLogo,
  logoToDelete,
  currentPortfolio,
  portfolioToDelete,
  getFullImageUrl,
  setLogoToDelete,
  setCurrentLogo,
  setPortfolioToDelete,
  setCurrentPortfolio,
}) => {
  return (
    <>
      <Title level={5} className="mt-4" style={{ color: colors.primary }}>
        Gerenciamento de Imagens
      </Title>

      <Row gutter={16}>
        <Col span={12}>
          <Title level={5} style={{ fontSize: "16px" }}>Logo</Title>
          {currentLogo ? (
            <div style={{ position: "relative", width: "fit-content" }}>
              <AntdImage
                src={getFullImageUrl(currentLogo)}
                alt="Logo"
                style={{ width: 150, height: 150, objectFit: "cover", border: "1px solid #d9d9d9", borderRadius: "8px" }}
                fallback="/placeholder-logo.svg"
              />
              <Popconfirm
                title="Remover esta logo?"
                okText="Remover"
                cancelText="Cancelar"
                okType="danger"
                placement="topRight"
                icon={<QuestionCircleOutlined style={{ color: "red" }} />}
                onConfirm={() => {
                  setLogoToDelete(true);
                  setCurrentLogo(null);
                  message.info("Logo marcada para remoção.");
                }}
              >
                <Button
                  type="primary"
                  danger
                  icon={<CloseOutlined />}
                  style={{ position: "absolute", top: 5, right: 5 }}
                  size="small"
                  title="Remover Logo"
                />
              </Popconfirm>
            </div>
          ) : (
            <p>{logoToDelete ? "Logo será removida ao salvar." : "Nenhuma logo."}</p>
          )}
        </Col>

        <Col span={12}>
          <Title level={5} style={{ fontSize: "16px" }}>Portfólio (Galeria)</Title>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
            {currentPortfolio.length > 0 ? (
              currentPortfolio.map((img: any, index: number) => {
                const urlStr = typeof img === "string" ? img : img.url;
                if (!urlStr) return null;

                return (
                  <div key={index} style={{ position: "relative", width: "fit-content" }}>
                    <AntdImage
                      src={getFullImageUrl(urlStr)}
                      alt="Img"
                      style={{ width: 100, height: 100, objectFit: "cover", border: "1px solid #d9d9d9", borderRadius: "8px" }}
                      fallback="/placeholder-logo.svg"
                    />
                    <Popconfirm
                      title="Remover imagem?"
                      okText="Remover"
                      cancelText="Cancelar"
                      okType="danger"
                      placement="topRight"
                      icon={<QuestionCircleOutlined style={{ color: "red" }} />}
                      onConfirm={() => {
                        setPortfolioToDelete((prev) => [...prev, urlStr]);
                        setCurrentPortfolio((prev) =>
                          prev.filter((i: any) => (typeof i === 'string' ? i : i.url) !== urlStr)
                        );
                        message.info("Imagem marcada para remoção.");
                      }}
                    >
                      <Button
                        type="primary"
                        danger
                        icon={<CloseOutlined />}
                        style={{ position: "absolute", top: 5, right: 5 }}
                        size="small"
                      />
                    </Popconfirm>
                  </div>
                );
              })
            ) : (
              <p>Nenhuma imagem no portfólio.</p>
            )}
            {portfolioToDelete.length > 0 && (
              <Tag color="red" style={{ marginTop: 10, width: "100%" }}>
                {portfolioToDelete.length} imagem(ns) serão removidas.
              </Tag>
            )}
          </div>
        </Col>
      </Row>
    </>
  );
};