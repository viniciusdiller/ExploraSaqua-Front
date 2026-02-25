import React from "react";
import { Form, Input, Select, Rate, Typography, Spin } from "antd";
import dynamic from "next/dynamic";
import "react-quill/dist/quill.snow.css";

const ReactQuill = dynamic(() => import("react-quill"), {
  ssr: false,
  loading: () => (
    <Spin size="large" style={{ display: "block", margin: "20px auto", minHeight: "150px" }} />
  ),
});

const { Title } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const quillModules = {
  toolbar: [
    [{ header: "1" }, { header: "2" }],
    [{ list: "ordered" }, { list: "bullet" }],
    ["bold", "italic", "underline", "strike"],
    [{ color: [] }, { background: [] }],
    [{ align: [] }],
    ["link"],
    ["clean"],
  ],
};

interface LocalDetailsProps {
  colors: { primary: string };
}

export const LocalDetails: React.FC<LocalDetailsProps> = ({ colors }) => {
  return (
    <>
      <Title level={5} className="mt-4" style={{ color: colors.primary }}>
        Detalhes
      </Title>

      <Form.Item name="descricaoDiferencial" label="Briefing (Resumo)" rules={[{ required: true }]}>
        <TextArea rows={2} maxLength={150} showCount />
      </Form.Item>

      <Form.Item name="descricao" label="Descrição Completa" rules={[{ required: true }]} className="quill-editor-container">
        <ReactQuill
          theme="snow"
          modules={quillModules}
          placeholder="Descreva o local em detalhes..."
          style={{ minHeight: "10px" }}
        />
      </Form.Item>

      <Form.Item name="venceuPspe" label="Venceu o Prêmio PSPE?" rules={[{ required: true, message: "Selecione uma opção" }]}>
        <Select placeholder="Selecione uma opção">
          <Option value={true}>Sim</Option>
          <Option value={false}>Não</Option>
        </Select>
      </Form.Item>

      <Form.Item name="escala" label="Nota de Impacto (0-10)" help="Nota de impacto fornecida pelo usuário no cadastro.">
        <Rate count={10} disabled />
      </Form.Item>
    </>
  );
};