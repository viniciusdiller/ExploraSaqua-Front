"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Form,
  Input,
  Button,
  Upload,
  Select,
  message,
  Spin,
  Row,
  Col,
  Result,
  Checkbox,
  Radio,
  ConfigProvider,
} from "antd";
import { UploadOutlined, ArrowLeftOutlined } from "@ant-design/icons";
import type { UploadFile } from "antd/es/upload/interface";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  cadastrarLocal,
  solicitarAtualizacaoLocal,
  solicitarExclusaoLocal,
} from "@/lib/api";
import dynamic from "next/dynamic";
import { Slider } from "@/components/ui/slider";
import "react-quill/dist/quill.snow.css";
import "@/app/cadastro-locais/quill-styles.css";

const ReactQuill = dynamic(() => import("react-quill"), { ssr: false });

// --- DEFINIÇÃO DE CORES ---
const COLORS = {
  primary: "#017db9", // Azul
  secondary: "#a8cf45", // Verde
  tertiary: "#d04798", // Rosa
};

// Novas categorias genéricas para substituir as ODS
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
  motivo: "Motivo da exclusão",
};

const { Option } = Select;
const { TextArea } = Input;

type FlowStep = "initial" | "register" | "update" | "delete" | "submitted";

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

const CadastroProjetoPage: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [logoFileList, setLogoFileList] = useState<UploadFile[]>([]);
  const [oficioFileList, setOficioFileList] = useState<UploadFile[]>([]);
  const [portfolioFileList, setPortfolioFileList] = useState<UploadFile[]>([]);
  const [flowStep, setFlowStep] = useState<FlowStep>("initial");

  const [submittedMessage, setSubmittedMessage] = useState({
    title: "",
    subTitle: "",
  });
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const toastShownRef = useRef(false);

  const [quillTextLength, setQuillTextLength] = useState(0);
  const MAX_QUILL_LENGTH = 5000;

  const [sliderValue, setSliderValue] = useState(0);
  const escalaValue = Form.useWatch("escala", form);

  useEffect(() => {
    if (escalaValue !== undefined) {
      setSliderValue(escalaValue);
    }
  }, [escalaValue]);

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

  const handleFormValuesChange = (changedValues: any) => {
    if (changedValues.hasOwnProperty("descricao")) {
      const length = getQuillTextLength(changedValues.descricao);
      setQuillTextLength(length);
    }
  };

  const handleOficioChange = ({ fileList }: { fileList: UploadFile[] }) =>
    setOficioFileList(fileList);
  const handleLogoChange = ({ fileList }: { fileList: UploadFile[] }) =>
    setLogoFileList(fileList);
  const handlePortfolioChange = ({ fileList }: { fileList: UploadFile[] }) =>
    setPortfolioFileList(fileList);

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      if (!toastShownRef.current) {
        toast.error("Você precisa estar logado para gerenciar projetos.");
        toastShownRef.current = true;
      }
      router.push("/login");
    }
  }, [user, isLoading, router]);

  // Toolbar translation logic remains the same
  useEffect(() => {
    if (flowStep === "register" || flowStep === "update") {
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
          (toolbar.querySelector(".ql-bold") as HTMLElement)?.title ===
          "Negrito"
        );
      };
      const intervalId = setInterval(() => {
        if (translateQuillToolbar()) clearInterval(intervalId);
      }, 200);
      return () => clearInterval(intervalId);
    }
  }, [flowStep]);

  if (isLoading || !user) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="flex items-center space-x-3">
          <p className="text-xl font-medium" style={{ color: COLORS.primary }}>
            Verificando autenticação
          </p>
          <div className="flex space-x-1.5">
            <span
              className="h-2.5 w-2.5 rounded-full animate-bounce [animation-delay:-0.3s]"
              style={{ backgroundColor: COLORS.secondary }}
            ></span>
            <span
              className="h-2.5 w-2.5 rounded-full animate-bounce [animation-delay:-0.15s]"
              style={{ backgroundColor: COLORS.secondary }}
            ></span>
            <span
              className="h-2.5 w-2.5 rounded-full animate-bounce"
              style={{ backgroundColor: COLORS.secondary }}
            ></span>
          </div>
        </div>
      </div>
    );
  }

  const maskId = (value: string) => value.replace(/\D/g, "");

  const resetAll = () => {
    form.resetFields();
    setLogoFileList([]);
    setOficioFileList([]);
    setPortfolioFileList([]);
    setFlowStep("initial");
    setQuillTextLength(0);
    setSliderValue(0);
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
          // Tratamento genérico para arrays e strings
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

      setSubmittedMessage({
        title: "Cadastro realizado com sucesso!",
        subTitle: "Sua solicitação foi recebida e será analisada em breve.",
      });
      setFlowStep("submitted");
    } catch (error: any) {
      message.error(
        error.message || "Ocorreu um erro. Por favor, tente novamente."
      );
    } finally {
      setLoading(false);
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
      setSubmittedMessage({
        title: "Atualização enviada com sucesso!",
        subTitle:
          "Recebemos suas alterações. Elas serão analisadas e aplicadas em seu perfil em breve.",
      });
      setFlowStep("submitted");
    } catch (error: any) {
      message.error(
        error.message || "Ocorreu um erro ao enviar a atualização."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSubmit = async (values: any) => {
    setLoading(true);
    try {
      const {
        projetoId,
        nomeProjeto,
        motivo,
        prefeitura,
        secretaria,
        emailContato,
      } = values;

      if (
        !projetoId ||
        !nomeProjeto ||
        !motivo ||
        !prefeitura ||
        !secretaria ||
        !emailContato
      ) {
        message.error("Todos os campos do formulário são obrigatórios.");
        setLoading(false);
        return;
      }

      const dadosParaEnviar = {
        projetoId,
        nomeProjeto,
        motivo,
        prefeitura,
        secretaria,
        emailContato,
      };

      await solicitarExclusaoLocal(projetoId, dadosParaEnviar);

      setSubmittedMessage({
        title: "Solicitação de exclusão recebida!",
        subTitle:
          "Sua solicitação foi registrada. A remoção do seu perfil será processada em breve.",
      });
      setFlowStep("submitted");
    } catch (error: any) {
      message.error(
        error.message || "Ocorreu um erro ao solicitar a exclusão."
      );
    } finally {
      setLoading(false);
    }
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

  const renderInitialChoice = () => (
    <>
      <h1
        className="text-4xl font-extrabold mb-6 inline-block pb-2"
        style={{
          borderBottom: `4px solid ${COLORS.tertiary}`,
          color: COLORS.primary,
        }}
      >
        PORTAL DE PROJETOS
      </h1>
      <p className="text-gray-700 leading-relaxed text-lg mt-4 mb-8">
        Bem-vindo ao <strong>Portal de Projetos</strong>! Este é o espaço
        oficial para gerenciar iniciativas que transformam a nossa cidade. Aqui,
        você pode cadastrar, atualizar ou remover projetos de forma centralizada
        e transparente.
      </p>
      <section className="flex flex-col border-t pt-6">
        <Form.Item
          layout="vertical"
          label={
            <span className="text-lg font-semibold" style={{ color: "#333" }}>
              O que você deseja fazer hoje?
            </span>
          }
        >
          <Select
            placeholder="Selecione uma ação"
            onChange={(value) => {
              form.resetFields();
              setQuillTextLength(0);
              setFlowStep(value as FlowStep);
            }}
            size="large"
            style={{ width: "100%" }}
          >
            <Option value="register">Cadastrar novo projeto</Option>
            <Option value="update">Atualizar projeto existente</Option>
            <Option value="delete">Excluir projeto da plataforma</Option>
          </Select>
        </Form.Item>
      </section>
    </>
  );

  const renderRegisterForm = () => (
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
                onChange={handleOficioChange}
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

        {/* Escala (Slider) - Genérica */}
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
                onChange={handleLogoChange}
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
                onChange={handlePortfolioChange}
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

  const renderUpdateForm = () => (
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
            onChange={handleOficioChange}
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
            onChange={handleLogoChange}
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
            onChange={handlePortfolioChange}
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

  const renderDeleteForm = () => (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleDeleteSubmit}
      autoComplete="off"
    >
      <section className="mb-8 border-t pt-4">
        {commonTitle("Exclusão de Projeto")}
        <p className="text-red-700 bg-red-50 p-4 rounded-md mb-6">
          <b>Atenção:</b> Ação permanente.
        </p>
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
        <Row gutter={24}>
          <Col span={12}>
            <Form.Item
              name="prefeitura"
              label="Prefeitura"
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
          </Col>
          <Col span={12}>
            <Form.Item
              name="secretaria"
              label="Secretaria"
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
          </Col>
        </Row>
        <Row gutter={24}>
          <Col span={12}>
            <Form.Item
              name="nomeProjeto"
              label="Projeto"
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
          <Col span={12}>
            <Form.Item
              name="emailContato"
              label="E-mail"
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
        <Form.Item name="motivo" label="Motivo">
          <TextArea
            rows={3}
            onChange={(e) =>
              form.setFieldsValue({ motivo: stripEmojis(e.target.value) })
            }
          />
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
          <Checkbox>Entendo que esta ação é irreversível.</Checkbox>
        </Form.Item>
      </section>
      <Form.Item>
        <Button
          type="primary"
          danger
          htmlType="submit"
          block
          loading={loading}
          style={{ height: 45 }}
        >
          Confirmar Exclusão
        </Button>
      </Form.Item>
    </Form>
  );

  const renderSuccess = () => (
    <Result
      status="success"
      title={submittedMessage.title}
      subTitle={submittedMessage.subTitle}
      extra={[
        <Button
          type="primary"
          key="console"
          onClick={resetAll}
          className="mb-6"
        >
          Voltar ao Início
        </Button>,
      ]}
    />
  );

  const renderContent = () => {
    switch (flowStep) {
      case "register":
        return renderRegisterForm();
      case "update":
        return renderUpdateForm();
      case "delete":
        return renderDeleteForm();
      case "submitted":
        return renderSuccess();
      default:
        return renderInitialChoice();
    }
  };

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: COLORS.primary,
          colorLink: COLORS.primary,
          colorSuccess: COLORS.secondary,
          borderRadius: 8,
        },
        components: {
          Button: {
            colorPrimary: COLORS.primary,
            algorithm: true,
            colorPrimaryHover: COLORS.tertiary,
          },
          Input: {
            activeBorderColor: COLORS.secondary,
            hoverBorderColor: COLORS.primary,
          },
          Select: {
            colorPrimary: COLORS.secondary,
          },
        },
      }}
    >
      <div
        className="min-h-screen py-20 px-6 sm:px-12"
        style={{
          background: `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.tertiary} 100%)`,
        }}
      >
        <div className="max-w-5xl mx-auto bg-white rounded-3xl shadow-lg p-10 sm:p-16">
          <Spin spinning={loading} tip="Processando...">
            {flowStep !== "initial" && flowStep !== "submitted" && (
              <Button
                type="text"
                icon={<ArrowLeftOutlined />}
                onClick={resetAll}
                className="mb-6"
              >
                Voltar ao início
              </Button>
            )}
            {renderContent()}
          </Spin>
        </div>
      </div>
    </ConfigProvider>
  );
};

export default CadastroProjetoPage;
