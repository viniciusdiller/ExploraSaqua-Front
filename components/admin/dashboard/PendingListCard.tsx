import React from "react";
import { Card, List, Button, Avatar, Pagination, Col, Empty } from "antd";
import { Local } from "@/types/Interface-Local";
import { getFullImageUrl } from "@/utils/AdminUtils";

interface PendingListCardProps {
  title: string;
  icon: React.ReactNode;
  data: Local[];
  currentPage: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onShowDetails: (item: Local) => void;
}

const PendingListCard: React.FC<PendingListCardProps> = ({ title, icon, data, currentPage, pageSize, onPageChange, onShowDetails }) => {
  const totalCount = data.length;
  const pagedData = data.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <Col xs={24} md={12} lg={8}>
      <Card
        title={
          <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            {icon} {title} ({totalCount})
          </span>
        }
      >
        {totalCount > 0 ? (
          <>
            <List
              dataSource={pagedData}
              renderItem={(item) => (
                <List.Item actions={[<Button type="link" onClick={() => onShowDetails(item)} key="details">Detalhes</Button>]}>
                  <List.Item.Meta
                    avatar={<Avatar src={getFullImageUrl(item.logoUrl || "")} icon={icon} />}
                    title={item.nomeLocal || (item as any).nome || "Local sem nome"}
                    description={`Responsável: ${item.nomeResponsavel || (item as any).responsavel || "Não informado"}`}
                  />
                </List.Item>
              )}
            />
            {totalCount > pageSize && (
              <div className="mt-4 text-center">
                <Pagination current={currentPage} pageSize={pageSize} total={totalCount} onChange={onPageChange} size="small" showSizeChanger={false} />
              </div>
            )}
          </>
        ) : (
          <Empty description="Nenhuma solicitação" />
        )}
      </Card>
    </Col>
  );
};

export default PendingListCard;