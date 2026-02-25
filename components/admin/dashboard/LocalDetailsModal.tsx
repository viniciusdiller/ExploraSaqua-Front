import React from "react";
import { Modal, Button, Descriptions, Typography, Table, Alert } from "antd";
import { CheckOutlined, CloseOutlined, EditOutlined } from "@ant-design/icons";
import { Local } from "@/types/Interface-Local";
import { fieldConfig, renderValue } from "@/utils/AdminUtils";

const { Title } = Typography;
const { Column } = Table;

export enum StatusLocal {
  PENDENTE_APROVACAO = "pendente",
  PENDENTE_ATUALIZACAO = "pendente_atualizacao",
  PENDENTE_EXCLUSAO = "pendente_exclusao",
  APROVADO = "aprovado",
  REJEITADO = "rejeitado",
}

interface LocalDetailsModalProps {
  visible: boolean;
  selectedItem: Local | null;
  isActionLoading: boolean;
  onClose: () => void;
  onRejectClick: () => void;
  onEditClick: () => void;
  onApproveDirect: () => void;
  primaryColor: string;
}

const LocalDetailsModal: React.FC<LocalDetailsModalProps> = ({
  visible, selectedItem, isActionLoading, onClose, onRejectClick, onEditClick, onApproveDirect, primaryColor
}) => {
  if (!selectedItem) return null;

  const renderDiffTable = (status: string, alertType: "info" | "error", title: string, keysToFilter: string[] = []) => {
    if (selectedItem.status !== status || !selectedItem.dados_atualizacao) return null;

    const keyMap: Record<string, { oldKey: string; labelKey: string }> = {
      logo: { oldKey: "logoUrl", labelKey: "logo" },
      imagens: { oldKey: "localImg", labelKey: "localImg" },
      oficio: { oldKey: "oficioUrl", labelKey: "oficio" },
      alvaraFuncionamento: { oldKey: "alvaraFuncionamentoUrl", labelKey: "alvaraFuncionamentoUrl" },
      alvaraVigilancia: { oldKey: "alvaraVigilanciaUrl", labelKey: "alvaraVigilanciaUrl" },
    };

    const diffDataAll = Object.entries(selectedItem.dados_atualizacao)
      .filter(([key]) => !keysToFilter.includes(key))
      .map(([key, newValue]) => {
        const mapping = keyMap[key];
        const oldKey = mapping ? mapping.oldKey : key;
        const labelKey = mapping ? mapping.labelKey : key;
        const oldValue = (selectedItem as any)[oldKey];
        let fieldLabel = fieldConfig[labelKey]?.label ?? fieldConfig[key]?.label ?? `Novo ${key}`;
        if (labelKey === "localImg") fieldLabel = "Portfólio";
        if (labelKey === "logo") fieldLabel = "Logo";
        if (key === "motivo") fieldLabel = "Motivo da Exclusão";

        return { key: oldKey, newKey: key, field: fieldLabel, oldValue, newValue };
      })
      .sort((a, b) => (fieldConfig[a.newKey]?.order ?? 999) - (fieldConfig[b.newKey]?.order ?? 999));

    const titleColor = alertType === "info" ? "#0050b3" : "#d4380d";

    return (
      <Alert
        type={alertType} showIcon className="mt-6" style={{ overflow: "hidden" }}
        message={<Title level={4} style={{ margin: 0, color: titleColor }}>{title}</Title>}
        description={
          <Table dataSource={diffDataAll} pagination={false} size="middle" bordered className="mt-4" scroll={{ x: true }} rowKey="newKey">
            <Column title="Campo" dataIndex="field" key="field" width={150} />
            <Column title="Valor Antigo" dataIndex="oldValue" key="oldValue" width={400} render={(val, record: any) => renderValue(record.key, val)} />
            <Column title="Valor Novo" dataIndex="newValue" key="newValue" width={450} render={(val, record: any) => renderValue(record.newKey, val)} />
          </Table>
        }
      />
    );
  };

  // Separação das entradas pelos seus grupos (definidos lá no AdminUtils.tsx)
  const allEntries = Object.entries(selectedItem).filter(([key]) => !["dados_atualizacao", "logoUrl", "localImg", "status"].includes(key) && fieldConfig[key]).sort(([keyA], [keyB]) => (fieldConfig[keyA]?.order ?? 999) - (fieldConfig[keyB]?.order ?? 999));
  
  const identificacaoEntries = allEntries.filter(([key]) => fieldConfig[key]?.group === "identificacao");
  const infoEntries = allEntries.filter(([key]) => fieldConfig[key]?.group === "info");
  const metaEntries = allEntries.filter(([key]) => fieldConfig[key]?.group === "meta"); // <-- Novo grupo de Metadados!

  return (
    <Modal
      title={`Detalhes de ${selectedItem.nomeLocal || (selectedItem as any).nome || "Local"}`}
      open={visible} onCancel={onClose} width={1000}
      footer={[
        <Button key="reject" onClick={onRejectClick} icon={<CloseOutlined />} danger loading={isActionLoading}>Recusar</Button>,
        selectedItem.status !== StatusLocal.PENDENTE_EXCLUSAO && (
          <Button key="edit" onClick={onEditClick} icon={<EditOutlined />} loading={isActionLoading}>Editar Informações</Button>
        ),
        selectedItem.status !== StatusLocal.PENDENTE_EXCLUSAO ? (
          <Button key="approve" type="primary" onClick={onApproveDirect} icon={<CheckOutlined />} loading={isActionLoading}>Aprovar Direto</Button>
        ) : (
          <Button key="approve_delete" type="primary" danger onClick={onApproveDirect} icon={<CheckOutlined />} loading={isActionLoading}>Confirmar Exclusão</Button>
        ),
      ]}
    >
      <Title level={4} className="mt-4" style={{ color: primaryColor }}>Identificação do Responsável / Registro</Title>
      <Descriptions bordered column={1} size="small">
        {identificacaoEntries.map(([key, value]) => (
          <Descriptions.Item key={key} label={fieldConfig[key]?.label}>{renderValue(key, value)}</Descriptions.Item>
        ))}
      </Descriptions>

      <Title level={4} className="mt-6" style={{ color: primaryColor }}>Informações do Local</Title>
      <Descriptions bordered column={1} size="small">
        {/* Renderiza a Logo se existir */}
        {selectedItem.logoUrl && (
          <Descriptions.Item label={fieldConfig.logoUrl.label}>
            {renderValue("logoUrl", selectedItem.logoUrl)}
          </Descriptions.Item>
        )}

        {/* Renderiza o Portfólio/Imagens se existirem */}
        {((selectedItem as any).produtosImg?.length > 0 || 
          (selectedItem as any).localImg?.length > 0 || 
          (selectedItem as any).imagens?.length > 0) && (
            <Descriptions.Item label="Portfólio / Imagens">
              {renderValue("produtosImg", 
                (selectedItem as any).produtosImg || 
                (selectedItem as any).localImg || 
                (selectedItem as any).imagens
              )}
            </Descriptions.Item>
        )}

        {infoEntries.map(([key, value]) => (
          <Descriptions.Item key={key} label={fieldConfig[key]?.label}>{renderValue(key, value)}</Descriptions.Item>
        ))}
      </Descriptions>

      {/* --- NOVA SEÇÃO DE METADADOS (Latitude, Longitude e Data) --- */}
      {metaEntries.length > 0 && (
        <>
          <Title level={4} className="mt-6" style={{ color: primaryColor }}>Metadados e Sistema</Title>
          <Descriptions bordered column={1} size="small">
            {metaEntries.map(([key, value]) => (
              <Descriptions.Item key={key} label={fieldConfig[key]?.label}>
                {renderValue(key, value)}
              </Descriptions.Item>
            ))}
          </Descriptions>
        </>
      )}

      {renderDiffTable(StatusLocal.PENDENTE_EXCLUSAO, "error", "Solicitação de Exclusão", ["localId", "confirmacao"])}
      {renderDiffTable(StatusLocal.PENDENTE_ATUALIZACAO, "info", "Dados para Atualizar", ["motivoExclusao"])}
    </Modal>
  );
};

export default LocalDetailsModal;