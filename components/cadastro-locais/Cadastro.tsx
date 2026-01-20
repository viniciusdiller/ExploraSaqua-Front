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
  Radio,
} from "antd";
import { UploadOutlined } from "@ant-design/icons";
import type { UploadFile } from "antd/es/upload/interface";
import { toast } from "sonner";
import { cadastrarLocal } from "@/lib/api";
import dynamic from "next/dynamic";
import { Slider } from "@/components/ui/slider";
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

interface CadastroProps {
  onSuccess: (title: string, subTitle: string) => void;
}

const Cadastro: React.FC<CadastroProps> = ({ onSuccess }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [logoFileList, setLogoFileList] = useState<UploadFile[]>([]);
  const [oficioFileList, setOficioFileList] = useState<UploadFile[]>([]);
  const [portfolioFileList, setPortfolioFileList] = useState<UploadFile[]>([]);
  const [quillTextLength, setQuillTextLength] = useState(0);
  const [sliderValue, setSliderValue] = useState(0);

  const MAX_QUILL_LENGTH = 5000;
  const escalaValue = Form.useWatch("escala", form);

  useEffect(() => {
    if (escalaValue !== undefined) {
      setSliderValue(escalaValue);
    }
  }, [escalaValue]);

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

  const validateQuill = (required: boolean) => (_: any, value: string) => {
    const textContentLength = getQuillTextLength(value);
    if (required && textContentLength === 0) {
      return Promise.reject(new Error("Por favor, descreva seu projeto!"));
    }
    if (textContentLength > MAX_QUILL_LENGTH) {
      return Promise.reject(
        new Error(
          `A descrição não pode ter mais de ${MAX_QUILL_LENGTH} caracteres.`
        )
      );
    }
    return Promise.resolve();
  };

  const handleRegisterSubmit = async (values: any) => {
    setLoading(true);
    try {
      const formData = new FormData();
      Object.entries(values).forEach(([key, value]) => {
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
      formData.append("venceuPspe", String(values.venceuPspe));

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

      await cadastrarLocal(formData);

      onSuccess(
        "Cadastro realizado com sucesso!",
        "Sua solicitação foi recebida e será analisada em breve."
      );
    } catch (error: any) {
      message.error(
        error.message || "Ocorreu um erro. Por favor, tente novamente."
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
      onFinish={handleRegisterSubmit}
      onValuesChange={handleFormValuesChange}
      autoComplete="off"
      onFinishFailed={onFinishFailed}
    >
      <section className="mb-8 border-t pt-4">
        {commonTitle("Informações do Responsável")}
        <Row gutter={24}>
          <Col xs={24} md={12}>
            <Form.Item
              name="prefeitura"
              label="Nome da Prefeitura"
              rules={[
                { required: true, message: "Insira o nome da Prefeitura!" },
              ]}
            >
              <Input
                placeholder="Ex: Prefeitura Municipal de..."
                onChange={(e) =>
                  form.setFieldsValue({
                    prefeitura: stripEmojis(e.target.value),
                  })
                }
              />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item
              name="secretaria"
              label="Nome da Secretaria"
              rules={[
                {
                  required: true,
                  message: "O Nome da Secretaria é obrigatório!",
                },
              ]}
            >
              <Input
                placeholder="Ex: Secretaria de Obras"
                onChange={(e) =>
                  form.setFieldsValue({
                    secretaria: stripEmojis(e.target.value),
                  })
                }
              />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={24}>
          <Col xs={24} md={12}>
            <Form.Item
              name="responsavelProjeto"
              label="Responsável pelo Projeto"
              rules={[
                { required: true, message: "Insira o nome do responsável!" },
              ]}
            >
              <Input
                placeholder="Nome do Responsável Principal"
                onChange={(e) =>
                  form.setFieldsValue({
                    responsavelProjeto: stripEmojis(e.target.value),
                  })
                }
              />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item
              name="oficio"
              label="Ofício de Requerimento"
              rules={[
                {
                  required: true,
                  message: "O envio do Ofício é obrigatório!",
                  validator: () =>
                    oficioFileList.length > 0
                      ? Promise.resolve()
                      : Promise.reject(new Error("Obrigatório!")),
                },
              ]}
              help="Anexe o documento de ofício (.pdf) com anuência do secretário."
            >
              <Upload
                customRequest={customUploadAction}
                fileList={oficioFileList}
                onChange={({ fileList }) => setOficioFileList(fileList)}
                listType="picture"
                maxCount={1}
                accept=".pdf,image/png, image/jpg,image/jpeg"
                onRemove={() => {
                  setOficioFileList([]);
                  form.validateFields(["oficio"]);
                }}
              >
                <Button icon={<UploadOutlined />}>Carregar Ofício</Button>
              </Upload>
            </Form.Item>
          </Col>
        </Row>
      </section>

      <section className="mb-8 border-t pt-4">
        {commonTitle("Informações do Projeto")}
        <Row gutter={24}>
          <Col xs={24} md={12}>
            <Form.Item
              name="nomeProjeto"
              label="Nome do Projeto"
              rules={[
                { required: true, message: "Insira o nome do seu Projeto!" },
              ]}
            >
              <Input
                placeholder="Ex: Projeto Reciclar"
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
              name="categoria"
              label="Categoria do Projeto"
              rules={[{ required: true, message: "Selecione uma categoria!" }]}
            >
              <Select placeholder="Selecione a categoria principal">
                {categoriasLocais.map((cat) => (
                  <Option key={cat} value={cat}>
                    {cat}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={24}>
          <Col xs={24} md={12}>
            <Form.Item
              name="linkProjeto"
              label="Link do Projeto"
              rules={[
                {
                  required: true,
                  message: "Por favor, insira o link do projeto!",
                },
              ]}
            >
              <Input
                placeholder="Link oficial ou repositório"
                onChange={(e) =>
                  form.setFieldsValue({
                    linkProjeto: stripEmojis(e.target.value),
                  })
                }
              />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item
              name="venceuPspe"
              label="Vencedor do Prêmio Sebrae?"
              initialValue={false}
            >
              <Radio.Group>
                <Radio value={true}>Sim</Radio>
                <Radio value={false}>Não</Radio>
              </Radio.Group>
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          rules={[{ required: true, message: "Por favor, avalie o impacto!" }]}
          name="escala"
          label="Em uma escala de 0 a 10, como você avalia o impacto potencial deste projeto para a comunidade local?"
          className="mt-6"
        >
          <>
            <Slider
              value={[sliderValue]}
              max={10}
              step={1}
              onValueChange={(value) => {
                setSliderValue(value[0]);
                form.setFieldsValue({ escala: value[0] });
              }}
            />
            <div
              className="text-center font-bold text-lg mt-2"
              style={{ color: COLORS.primary }}
            >
              {sliderValue}
            </div>
          </>
        </Form.Item>
      </section>

      <section className="mb-8 border-t pt-4">
        {commonTitle("Contato e Localização")}
        <Form.Item
          name="emailContato"
          label="E-mail de Contato"
          rules={[
            {
              required: true,
              message: "O e-mail é obrigatório!",
              type: "email",
            },
          ]}
        >
          <Input
            placeholder="contato@email.com"
            onChange={(e) =>
              form.setFieldsValue({ emailContato: stripEmojis(e.target.value) })
            }
          />
        </Form.Item>
        <Form.Item name="endereco" label="Endereço Físico (Opcional)">
          <Input
            placeholder="Rua, Bairro, Nº"
            onChange={(e) =>
              form.setFieldsValue({ endereco: stripEmojis(e.target.value) })
            }
          />
        </Form.Item>
      </section>

      <section className="mb-8 border-t pt-5">
        {commonTitle("Descrição do Projeto")}
        <Form.Item
          name="descricaoDiferencial"
          label="Briefing do Projeto"
          rules={[{ required: true, message: "Faça um resumo do projeto!" }]}
        >
          <TextArea
            showCount
            maxLength={150}
            rows={2}
            placeholder="Resumo curto (até 150 caracteres)"
            onChange={(e) =>
              form.setFieldsValue({
                descricaoDiferencial: stripEmojis(e.target.value),
              })
            }
          />
        </Form.Item>

        <Form.Item
          name="descricao"
          label="Descrição detalhada"
          rules={[
            {
              validator: validateQuill(true),
              required: true,
              message: "Descreva seu projeto!",
            },
          ]}
          help={
            <div className="flex justify-end w-full">
              <span
                className={
                  quillTextLength > MAX_QUILL_LENGTH
                    ? "text-red-500"
                    : "text-gray-500"
                }
              >
                {quillTextLength}/{MAX_QUILL_LENGTH}
              </span>
            </div>
          }
        >
          <ReactQuill
            theme="snow"
            modules={quillModules}
            placeholder="Detalhe o funcionamento e objetivos do projeto..."
            style={{ minHeight: "10px" }}
          />
        </Form.Item>

        <Row gutter={24}>
          <Col xs={24} md={12}>
            <Form.Item name="website" label="Site da Prefeitura (Opcional)">
              <Input
                placeholder="https://..."
                onChange={(e) =>
                  form.setFieldsValue({ website: stripEmojis(e.target.value) })
                }
              />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item name="instagram" label="Instagram (Opcional)">
              <Input
                placeholder="@perfil"
                onChange={(e) =>
                  form.setFieldsValue({
                    instagram: stripEmojis(e.target.value),
                  })
                }
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={24}>
          <Col xs={24} md={12}>
            <Form.Item
              label="Logo do Projeto"
              help="Envie 1 imagem (.jpg, .png)"
            >
              <Upload
                customRequest={customUploadAction}
                fileList={logoFileList}
                onChange={({ fileList }) => setLogoFileList(fileList)}
                listType="picture"
                maxCount={1}
                accept="image/*"
              >
                <Button icon={<UploadOutlined />}>Carregar Logo</Button>
              </Upload>
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item label="Galeria de Imagens" help="Envie até 4 imagens">
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
          </Col>
        </Row>

        <Form.Item
          name="confirmacao"
          valuePropName="checked"
          rules={[
            {
              validator: (_, val) =>
                val
                  ? Promise.resolve()
                  : Promise.reject(new Error("Confirme a caixa.")),
            },
          ]}
        >
          <Checkbox>
            Confirmo que as informações são verdadeiras e estou ciente do uso
            dos dados para divulgação.
          </Checkbox>
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
          Enviar Cadastro
        </Button>
      </Form.Item>
    </Form>
  );
};

export default Cadastro;
