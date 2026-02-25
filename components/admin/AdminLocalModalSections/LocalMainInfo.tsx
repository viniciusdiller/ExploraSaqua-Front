import React from "react";
import { Form, Input, Select, Row, Col, Typography, Button } from "antd";

const { Title } = Typography;
const { Option } = Select;

interface LocalMainInfoProps {
  categorias: string[];
  local: any;
  getFullImageUrl: (path: string) => string;
  colors: { primary: string; secondary: string };
}

export const LocalMainInfo: React.FC<LocalMainInfoProps> = ({ categorias, local, getFullImageUrl, colors }) => {
  return (
    <>
      <Title level={5} className="mt-4" style={{ color: colors.primary }}>
        Informações Principais
      </Title>

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item name="nome" label="Nome do Local" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name="categoria" label="Categoria" rules={[{ required: true }]}>
            <Select placeholder="Selecione a categoria">
              {categorias.map((cat) => (
                <Option key={cat} value={cat}>{cat}</Option>
              ))}
            </Select>
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item name="prefeitura" label="Prefeitura / Entidade" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name="secretaria" label="Secretaria / Departamento" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item name="responsavel" label="Responsável Legal" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
        </Col>

        <Col span={12}>
          <Form.Item name="oficio" label="Alvará / Ofício Anexado" rules={[{ required: false }]}>
            {local?.oficioUrl || local?.alvaraFuncionamentoUrl ? (
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <Button
                  onClick={() => {
                    const url = local.alvaraFuncionamentoUrl || local.oficioUrl;
                    if (url) window.open(getFullImageUrl(url), "_blank");
                  }}
                  style={{ borderColor: colors.secondary, color: colors.secondary }}
                >
                  Visualizar Documento
                </Button>
              </div>
            ) : (
              <span style={{ color: "red" }}>Nenhum documento anexado.</span>
            )}
          </Form.Item>
        </Col>
      </Row>
    </>
  );
};