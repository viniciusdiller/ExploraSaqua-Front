import React from "react";
import { Form, Input, Select, Row, Col, Typography, Button, FormInstance } from "antd";

const { Title } = Typography;
const { Option } = Select;

interface LocalMainInfoProps {
  categorias: string[];
  local: any;
  getFullImageUrl: (path: string) => string;
  colors: { primary: string; secondary: string };
  form?: FormInstance<any>;
}

const formatCPF = (raw: string) => {
  if (!raw) return "";
  const digits = String(raw).replace(/\D/g, "").slice(0,11);
  return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, (_, a, b, c, d) => `${a}.${b}.${c}-${d}`) || digits;
};

const formatPhone = (raw: string) => {
  if (!raw) return "";
  const digits = String(raw).replace(/\D/g, "");
  if (digits.length === 11) return digits.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
  if (digits.length === 10) return digits.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
  return digits;
};

export const LocalMainInfo: React.FC<LocalMainInfoProps> = ({ categorias, local, getFullImageUrl, colors, form }) => {
  return (
    <>
      <Title level={5} className="mt-4" style={{ color: colors.primary }}>
        Informações do Local
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
          <Form.Item name="localId" label="ID do Registro">
            <Input disabled />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name="contatoLocal" label="Telefone do Local">
            <Input onBlur={() => {
              if (!form) return;
              const v = form.getFieldValue('contatoLocal');
              form.setFieldsValue({ contatoLocal: formatPhone(v) });
            }} />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={24}>
          <Form.Item name="endereco" label="Endereço Completo">
            <Input />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item name="instagram" label="Instagram">
            <Input />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={24}>
          <Form.Item label="Documentos (Alvarás/Ofícios)">
            <div style={{ display: 'flex', gap: 12 }}>
              {local?.alvaraVigilanciaUrl ? (
                <Button onClick={() => window.open(getFullImageUrl(local.alvaraVigilanciaUrl), '_blank')}>
                  Visualizar Alvará Vigilância
                </Button>
              ) : null}

              {local?.alvaraFuncionamentoUrl ? (
                <Button onClick={() => window.open(getFullImageUrl(local.alvaraFuncionamentoUrl), '_blank')}>
                  Visualizar Alvará Funcionamento
                </Button>
              ) : null}

              {!local?.alvaraVigilanciaUrl && !local?.alvaraFuncionamentoUrl && (
                <span style={{ color: 'red' }}>Nenhum documento anexado.</span>
              )}
            </div>
          </Form.Item>
        </Col>
      </Row>

      <Title level={5} className="mt-4" style={{ color: colors.primary }}>
        Informações do Responsável
      </Title>

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item name="responsavel" label="Nome do Responsável" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item name="cpfResponsavel" label="CPF do Responsável">
            <Input onBlur={() => {
              if (!form) return;
              const v = form.getFieldValue('cpfResponsavel');
              form.setFieldsValue({ cpfResponsavel: formatCPF(v) });
            }} />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name="emailContato" label="E-mail do Responsável" rules={[{ type: 'email', message: 'Email inválido' }]}>
            <Input />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item name="contatoResponsavel" label="Telefone do Responsável">
            <Input onBlur={() => {
              if (!form) return;
              const v = form.getFieldValue('contatoResponsavel');
              form.setFieldsValue({ contatoResponsavel: formatPhone(v) });
            }} />
          </Form.Item>
        </Col>
      </Row>
    </>
  );
};

export default LocalMainInfo;