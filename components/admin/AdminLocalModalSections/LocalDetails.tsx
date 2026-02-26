import React from "react";
import { Form, Input, Typography, Spin } from "antd";
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

      <Form.Item
        name="descricao"
        label="Descrição Completa"
        rules={[{ required: true, message: "A descrição completa é obrigatória." }]}
        className="quill-editor-container"
      >
        <ReactQuill
          theme="snow"
          modules={quillModules}
          placeholder="Descreva o local em detalhes..."
          style={{ minHeight: 120 }}
        />
      </Form.Item>
    </>
  );
};

export default LocalDetails;