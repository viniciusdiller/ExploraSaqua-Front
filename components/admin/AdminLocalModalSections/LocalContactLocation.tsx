import React from "react";
import { Form, Input, Row, Col, Typography } from "antd";
import { CompassOutlined } from "@ant-design/icons";

const { Title } = Typography;

interface LocalContactLocationProps {
  colors: { primary: string };
  handleAddressBlur: () => Promise<void>;
}

export const LocalContactLocation: React.FC<LocalContactLocationProps> = ({ colors, handleAddressBlur }) => {
  return (
    <>
      <Title level={5} className="mt-4" style={{ color: colors.primary }}>
        Contato e Links
      </Title>

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item name="emailContato" label="Email de Contato" rules={[{ required: true, type: "email" }]}>
            <Input />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name="linkLocal" label="Link Oficial" rules={[{ required: false, type: "url" }]}>
            <Input placeholder="http://..." />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item name="website" label="Site da Prefeitura/Entidade" rules={[{ type: "url" }]}>
            <Input placeholder="http://..." />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name="instagram" label="Instagram" rules={[{ type: "url" }]}>
            <Input placeholder="http://instagram.com/..." />
          </Form.Item>
        </Col>
      </Row>

      <Title level={5} className="mt-4" style={{ color: colors.primary }}>
        Localização
      </Title>
      
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item name="endereco" label="Endereço" help="Digite e clique fora para buscar as coordenadas.">
            <Input onBlur={handleAddressBlur} />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name="bairro" label="Bairro">
            <Input />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item name="latitude" label="Latitude">
            <Input type="number" step="any" prefix={<CompassOutlined />} placeholder="-22.9242" />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name="longitude" label="Longitude">
            <Input type="number" step="any" prefix={<CompassOutlined />} placeholder="-42.5089" />
          </Form.Item>
        </Col>
      </Row>
    </>
  );
};