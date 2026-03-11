import React from "react";
import { Modal, Button, Descriptions, Typography } from "antd";
import { CheckOutlined, CloseOutlined } from "@ant-design/icons";
import { Local } from "@/types/Interface-Local";
import { fieldConfig, renderValue } from "@/utils/AdminUtils";
import dynamic from "next/dynamic";
import "react-quill/dist/quill.snow.css";

const LocationPicker = dynamic(() => import("@/components/map/LocationPicker"), { ssr: false });

const { Title } = Typography;

interface IndicationDetailsModalProps {
  visible: boolean;
  selectedItem: Local | null;
  isActionLoading: boolean;
  onClose: () => void;
  onRejectClick: () => void;
  onApproveDirect: () => void;
  primaryColor: string;
}

const IndicationDetailsModal: React.FC<IndicationDetailsModalProps> = ({
  visible, selectedItem, isActionLoading, onClose, onRejectClick, onApproveDirect, primaryColor
}) => {
  if (!selectedItem) return null;

  // Apenas renderiza campos principais da indicação (quem indicou e dados do local sugerido)
  const infoKeys = [
    "nomeLocal", "nome", "descricao", "categoria", "endereco", "contatoLocal", "instagram", "localId",
  ];

  return (
    <Modal
      title={`Indicação: ${selectedItem.nomeLocal || selectedItem.nome || "Local"}`}
      open={visible} onCancel={onClose} width={900}
      footer={[
        <Button key="reject" onClick={onRejectClick} icon={<CloseOutlined />} danger loading={isActionLoading}>Recusar Indicação</Button>,
        <Button key="approve" type="primary" onClick={onApproveDirect} icon={<CheckOutlined />} loading={isActionLoading}>Aprovar Indicação</Button>
      ]}
    >
      <Title level={4} className="mt-4" style={{ color: primaryColor }}>Dados da Indicação</Title>
      <Descriptions bordered column={1} size="small">
        {infoKeys.map((key) => (
          selectedItem && (selectedItem as any)[key] !== undefined ? (
            <Descriptions.Item key={key} label={fieldConfig[key]?.label ?? key}>
              <div style={{ marginTop: 6 }}>{renderValue(key, (selectedItem as any)[key])}</div>
            </Descriptions.Item>
          ) : null
        ))}

        {(selectedItem as any).latitude && (selectedItem as any).longitude && (
          <Descriptions.Item key="map" label="Localização sugerida">
            <div style={{ marginTop: 6, height: 160, width: "100%", borderRadius: 8, overflow: "hidden" }}>
              <LocationPicker position={{ lat: Number((selectedItem as any).latitude), lng: Number((selectedItem as any).longitude) }} onLocationSelect={() => {}} />
            </div>
          </Descriptions.Item>
        )}
      </Descriptions>

      <Title level={4} className="mt-6" style={{ color: primaryColor }}>Dados do Indicador</Title>
      <Descriptions bordered column={1} size="small">
        <Descriptions.Item label="Nome do Indicador">{(selectedItem as any).indicadorNome || (selectedItem as any).nomeResponsavel || "Não informado"}</Descriptions.Item>
        <Descriptions.Item label="Contato do Indicador">{(selectedItem as any).indicadorContato || (selectedItem as any).contatoResponsavel || "Não informado"}</Descriptions.Item>
        <Descriptions.Item label="E-mail do Indicador">{(selectedItem as any).indicadorEmail || (selectedItem as any).emailResponsavel || "Não informado"}</Descriptions.Item>
      </Descriptions>

    </Modal>
  );
};

export default IndicationDetailsModal;
