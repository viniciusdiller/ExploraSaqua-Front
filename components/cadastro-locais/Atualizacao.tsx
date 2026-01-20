"use client";

import React, { useState, useEffect } from "react";
import {
  Form,
  Input,
  Button,
  Upload,
  Select,
  message,
  Row,
  Col,
  Checkbox,
} from "antd";
import { UploadOutlined } from "@ant-design/icons";
import type { UploadFile } from "antd/es/upload/interface";
import { toast } from "sonner";
import { solicitarAtualizacaoLocal } from "@/lib/api";
import dynamic from "next/dynamic";
import "react-quill/dist/quill.snow.css";

const ReactQuill = dynamic(() => import("react-quill"), { ssr: false });

const COLORS = {
  primary: "#017db9",
  secondary: "#a8cf45",
  tertiary: "#d04798",
};

const categoriasLocais = [
  "Compras",
  "Emergências",
  "Escolas",
  "Espaços Culturais",
  "Eventos Locais",
  "Feiras e Produtores Rurais",
  "Hospedagens",
  "Lazer e Esporte",
  "Mulheres e Crianças",
  "Pontos Turísticos",
  "Praias e Lagoas",
  "Restaurantes e Lanchonetes",
  "Supermercados",
  "Telefones Úteis",
  "Transporte Público",
  "Trilhas",
];

const campoLabels: { [key: string]: string } = {
  prefeitura: "Nome da Prefeitura",
  secretaria: "Nome da Secretaria",
  responsavelProjeto: "Responsável pelo Projeto",
  nomeProjeto: "Nome do Projeto",
  categoria: "Categoria do Projeto",
  linkProjeto: "Link do Projeto",
  venceuPspe: "Prêmio Sebrae",
  escala: "Avaliação de Impacto",
  emailContato: "E-mail de Contato",
  descricaoDiferencial: "Briefing do Projeto",
  descricao: "Descrição detalhada",
  confirmacao: "Caixa de Confirmação",
  projetoId: "ID do Projeto",
};

const { Option } = Select;
const { TextArea } = Input;

const quillModules = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ["bold", "italic", "underline", "strike"],
    [{ list: "ordered" }, { list: "bullet" }],
    [{ align: [] }],
    ["link"],
    ["clean"],
  ],
};

interface AtualizacaoProps {
  onSuccess: (title: string, subTitle: string) => void;
}

const Atualizacao: React.FC<AtualizacaoProps> = ({ onSuccess }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [logoFileList, setLogoFileList] = useState<UploadFile[]>([]);
  const [oficioFileList, setOficioFileList] = useState<UploadFile[]>([]);
  const [portfolioFileList, setPortfolioFileList] = useState<UploadFile[]>([]);
  const [quillTextLength, setQuillTextLength] = useState(0);

  const MAX_QUILL_LENGTH = 5000;

  // Tradução da Toolbar do Quill
  useEffect(() => {
    const translateQuillToolbar = () => {
      const toolbar = document.querySelector(".ql-toolbar");
      if (!toolbar) return false;
      const translations: { [key: string]: string } = {
        ".ql-bold": "Negrito",
        ".ql-italic": "Itálico",
        ".ql-underline": "Sublinhado",
        ".ql-strike": "Riscado",
        '.ql-list[value="ordered"]': "Lista ordenada",
        '.ql-list[value="bullet"]': "Lista com marcadores",
        ".ql-link": "Inserir link",
        ".ql-clean": "Remover formatação",
      };
      Object.entries(translations).forEach(([selector, title]) => {
        const el = toolbar.querySelector(selector) as HTMLElement;
        if (el) el.title = title;
      });
      return (
        (toolbar.querySelector(".ql-bold") as HTMLElement)?.title === "Negrito"
      );
    };
    const intervalId = setInterval(() => {
      if (translateQuillToolbar()) clearInterval(intervalId);
    }, 200);
    return () => clearInterval(intervalId);
  }, []);

  const stripEmojis = (value: string) => {
    if (!value) return "";
    return value.replace(
      /([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g,
      ""
    );
  };

  const maskId = (value: string) => value.replace(/\D/g, "");

  const getQuillTextLength = (value: string) => {
    if (typeof window === "undefined" || !value || value === "<p><br></p>")
      return 0;
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = value;
    return (tempDiv.textContent || tempDiv.innerText || "").trim().length;
  };

  const customUploadAction = async (options: any) => {
    const { onSuccess, onError, file } = options;
    setTimeout(() => {
      try {
        onSuccess(file);
      } catch (err) {
        onError(new Error("Erro no upload simulado"));
      }
    }, 500);
  };

  const onFinishFailed = (errorInfo: any) => {
    if (!errorInfo.errorFields || errorInfo.errorFields.length === 0) return;
    const labelsComErro = errorInfo.errorFields
      .map((field: any) => {
        const fieldName = field.name[0];
        return campoLabels[fieldName] || fieldName;
      })
      .filter(
        (value: string, index: number, self: string[]) =>
          self.indexOf(value) === index
      );

    if (labelsComErro.length > 0) {
      const plural = labelsComErro.length > 1;
      const mensagem = `Por favor, preencha ${
        plural ? "os campos obrigatórios" : "o campo obrigatório"
      }: ${labelsComErro.join(", ")}.`;
      toast.error(mensagem);
    } else {
      toast.error("Por favor, verifique os campos obrigatórios.");
    }
  };

  const handleFormValuesChange = (changedValues: any) => {
    if (changedValues.hasOwnProperty("descricao")) {
      const length = getQuillTextLength(changedValues.descricao);
      setQuillTextLength(length);
    }
  };

  const handleUpdateSubmit = async (values: any) => {
    setLoading(true);
    try {
      const { projetoId, ...updateData } = values;
      if (!projetoId) {
        message.error("O ID do projeto é obrigatório para a atualização.");
        setLoading(false);
        return;
      }

      const formData = new FormData();

      Object.entries(updateData).forEach(([key, value]) => {
        if (key === "descricao" && (value === "<p><br></p>" || value === ""))
          return;

        if (
          value &&
          key !== "logo" &&
          key !== "projeto" &&
          key !== "venceuPspe"
        ) {
          if (Array.isArray(value)) {
            formData.append(key, value.join(", "));
          } else {
            formData.append(key, value as string);
          }
        }
      });

      if (updateData.venceuPspe !== undefined) {
        formData.append("venceuPspe", String(updateData.venceuPspe));
      }

      if (logoFileList.length > 0 && logoFileList[0].originFileObj) {
        formData.append("logo", logoFileList[0].originFileObj);
      }
      if (oficioFileList.length > 0 && oficioFileList[0].originFileObj) {
        formData.append("oficio", oficioFileList[0].originFileObj);
      }
      portfolioFileList.forEach((file) => {
        if (file.originFileObj) {
          formData.append("imagens", file.originFileObj);
        }
      });

      await solicitarAtualizacaoLocal(projetoId, formData);
      onSuccess(
        "Atualização enviada com sucesso!",
        "Recebemos suas alterações. Elas serão analisadas e aplicadas em seu perfil em breve."
      );
    } catch (error: any) {
      message.error(
        error.message || "Ocorreu um erro ao enviar a atualização."
      );
    } finally {
      setLoading(false);
    }
  };

  const commonTitle = (title: string) => (
    <h2
      className="relative text-2xl font-semibold text-gray-800 mb-6 pl-4 
        before:content-[''] before:absolute before:left-0 before:top-0 before:h-full before:w-1"
      style={{
        borderLeft: `4px solid ${COLORS.primary}`,
        background: `linear-gradient(90deg, ${COLORS.primary}0D, transparent)`,
      }}
    >
      <span style={{ color: COLORS.primary }}>{title}</span>
    </h2>
  );

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleUpdateSubmit}
      onValuesChange={handleFormValuesChange}
      autoComplete="off"
      onFinishFailed={onFinishFailed}
    >
      <section className="mb-8 border-t pt-4">
        {commonTitle("Identificação para Atualização")}
        <Row gutter={24}>
          <Col xs={24} md={12}>
            <Form.Item
              name="prefeitura"
              label="Nome da Prefeitura"
              rules={[{ required: true }]}
            >
              <Input
                onChange={(e) =>
                  form.setFieldsValue({
                    prefeitura: stripEmojis(e.target.value),
                  })
                }
              />
            </Form.Item>
            <Form.Item
              name="projetoId"
              label="ID do Projeto"
              rules={[{ required: true }]}
            >
              <Input
                inputMode="numeric"
                onChange={(e) =>
                  form.setFieldsValue({
                    projetoId: maskId(stripEmojis(e.target.value)),
                  })
                }
              />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item
              name="secretaria"
              label="Nome da Secretaria"
              rules={[{ required: true }]}
            >
              <Input
                onChange={(e) =>
                  form.setFieldsValue({
                    secretaria: stripEmojis(e.target.value),
                  })
                }
              />
            </Form.Item>
            <Form.Item
              name="responsavelProjeto"
              label="Responsável"
              rules={[{ required: true }]}
            >
              <Input
                onChange={(e) =>
                  form.setFieldsValue({
                    responsavelProjeto: stripEmojis(e.target.value),
                  })
                }
              />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={24}>
          <Col xs={24} md={12}>
            <Form.Item
              name="nomeProjeto"
              label="Nome do Projeto"
              rules={[{ required: true }]}
            >
              <Input
                onChange={(e) =>
                  form.setFieldsValue({
                    nomeProjeto: stripEmojis(e.target.value),
                  })
                }
              />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item
              name="emailContato"
              label="E-mail de Contato"
              rules={[{ required: true, type: "email" }]}
            >
              <Input
                onChange={(e) =>
                  form.setFieldsValue({
                    emailContato: stripEmojis(e.target.value),
                  })
                }
              />
            </Form.Item>
          </Col>
        </Row>
        <Form.Item
          name="oficio"
          label="Ofício de Requerimento"
          rules={[
            {
              required: true,
              validator: () =>
                oficioFileList.length > 0
                  ? Promise.resolve()
                  : Promise.reject(new Error("Obrigatório")),
            },
          ]}
        >
          <Upload
            customRequest={customUploadAction}
            fileList={oficioFileList}
            onChange={({ fileList }) => setOficioFileList(fileList)}
            listType="picture"
            maxCount={1}
            accept=".pdf,image/*"
            onRemove={() => {
              setOficioFileList([]);
              form.validateFields(["oficio"]);
            }}
          >
            <Button icon={<UploadOutlined />}>Carregar Ofício</Button>
          </Upload>
        </Form.Item>
      </section>

      <section className="mb-8 border-t pt-4">
        {commonTitle("Dados a Atualizar")}
        <p className="text-gray-600 mb-6">
          Preencha apenas o que deseja alterar.
        </p>

        <Form.Item label="Nova Logo">
          <Upload
            customRequest={customUploadAction}
            fileList={logoFileList}
            onChange={({ fileList }) => setLogoFileList(fileList)}
            listType="picture"
            maxCount={1}
            accept="image/*"
          >
            <Button icon={<UploadOutlined />}>Carregar Nova Logo</Button>
          </Upload>
        </Form.Item>

        <Form.Item name="descricaoDiferencial" label="Novo Briefing">
          <TextArea
            showCount
            maxLength={150}
            rows={2}
            onChange={(e) =>
              form.setFieldsValue({
                descricaoDiferencial: stripEmojis(e.target.value),
              })
            }
          />
        </Form.Item>

        <Form.Item
          name="descricao"
          label="Nova Descrição Detalhada"
          help={`${quillTextLength}/${MAX_QUILL_LENGTH}`}
        >
          <ReactQuill
            theme="snow"
            modules={quillModules}
            style={{ minHeight: "10px" }}
          />
        </Form.Item>

        <Form.Item
          name="outrasAlteracoes"
          label="Outras Alterações (Texto Livre)"
        >
          <TextArea
            rows={3}
            placeholder="Descreva mudanças em campos que não estão listados aqui."
            onChange={(e) =>
              form.setFieldsValue({
                outrasAlteracoes: stripEmojis(e.target.value),
              })
            }
          />
        </Form.Item>

        <Form.Item name="categoria" label="Nova Categoria (Opcional)">
          <Select placeholder="Alterar categoria" allowClear>
            {categoriasLocais.map((cat) => (
              <Option key={cat} value={cat}>
                {cat}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item name="venceuPspe" label="Venceu Prêmio Sebrae? (Opcional)">
          <Select placeholder="Não alterar" allowClear>
            <Option value={true}>Sim</Option>
            <Option value={false}>Não</Option>
          </Select>
        </Form.Item>

        <Form.Item label="Novas Imagens (Galeria)">
          <Upload
            customRequest={customUploadAction}
            fileList={portfolioFileList}
            onChange={({ fileList }) => setPortfolioFileList(fileList)}
            listType="picture"
            multiple
            maxCount={4}
            accept="image/*"
          >
            <Button icon={<UploadOutlined />}>Carregar Imagens</Button>
          </Upload>
        </Form.Item>

        <Form.Item
          name="confirmacao"
          valuePropName="checked"
          rules={[
            {
              validator: (_, val) =>
                val
                  ? Promise.resolve()
                  : Promise.reject(new Error("Confirme.")),
            },
          ]}
        >
          <Checkbox>Confirmo que as informações são verdadeiras.</Checkbox>
        </Form.Item>
      </section>

      <Form.Item>
        <Button
          type="primary"
          htmlType="submit"
          block
          loading={loading}
          style={{ height: 45, fontSize: "1rem" }}
        >
          Enviar Atualização
        </Button>
      </Form.Item>
    </Form>
  );
};

export default Atualizacao;
