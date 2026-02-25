import React from "react";
import { Alert, Typography } from "antd";

interface LocalAlertsProps {
  local: any;
  outrasAlteracoes: string | null;
}

export const LocalAlerts: React.FC<LocalAlertsProps> = ({ local, outrasAlteracoes }) => {
  return (
    <>
      {local?.status === 'pendente_exclusao' && (
        <Alert
          message="Atenção: Solicitação de Exclusão"
          description="O proprietário deseja remover este local da plataforma. Ao salvar ou aprovar por aqui, você apenas atualiza os dados, mas pode confirmar a exclusão pelo painel."
          type="error"
          showIcon
          className="mb-4"
        />
      )}
      
      {local?.status === 'pendente_atualizacao' && !outrasAlteracoes && (
        <Alert
          message="Solicitação de Atualização"
          description="Revise os novos dados enviados (incluindo imagens) antes de aprovar."
          type="info"
          showIcon
          className="mb-4"
        />
      )}

      {outrasAlteracoes && (
        <Alert
          message="Solicitação de 'Outras Alterações' do Usuário"
          description={
            <Typography.Paragraph pre-wrap>
              {outrasAlteracoes}
            </Typography.Paragraph>
          }
          type="warning"
          showIcon
          className="mb-4"
        />
      )}
    </>
  );
};