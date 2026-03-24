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
import {
  UploadOutlined,
  EnvironmentOutlined,
  SearchOutlined,
  UserOutlined,
  PhoneOutlined,
  IdcardOutlined,
  InstagramOutlined,
  FileProtectOutlined,
  SafetyCertificateOutlined,
  MailOutlined,
} from "@ant-design/icons";
import type { UploadFile } from "antd/es/upload/interface";
import { toast } from "sonner";
import { cadastrarLocal } from "@/lib/api";
import dynamic from "next/dynamic";
import "react-quill/dist/quill.snow.css";

// Importação do Componente de Mapa
const LocationPicker = dynamic(() => import("@/components/map/LocationPicker"), { 
  ssr: false,
  loading: () => <div className="h-[350px] bg-gray-100 animate-pulse flex items-center justify-center rounded-lg border border-gray-200">Carregando mapa...</div>
});

const ReactQuill = dynamic(() => import("react-quill"), { ssr: false });

const COLORS = {
  primary: "#017db9",
  secondary: "#a8cf45",
};

const categoriasLocais = [
  "Comércio & Lojas",
  "Educação & Capacitação",
  "Emergências",
  "Esportes",
  "Eventos & Agenda",
  "Hospedagem",
  "Indústria",
  "Mei de Saquá",
  "Saúde & Bem-estar",
  "Serviços Públicos",
  "Supermercado & Feiras",
  "Turismo & Lazer",
  "Utilidades & Informações Gerais",
];

const { Option } = Select;

const quillModules = {
  toolbar: [
    [{ header: [1, 2, false] }],
    ["bold", "italic", "underline"],
    [{ list: "ordered" }, { list: "bullet" }],
    ["clean"],
  ],
};

const formatCPF = (value: string) => {
  return value
    .replace(/\D/g, "") // Remove tudo que não é dígito
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})/, "$1-$2")
    .replace(/(-\d{2})\d+?$/, "$1"); // Limita o tamanho
};

const formatPhone = (value: string) => {
  return value
    .replace(/\D/g, "")
    .replace(/(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d)/, "$1-$2")
    .replace(/(-\d{4})\d+?$/, "$1");
};

interface CadastroProps {
  onSuccess: (title: string, subTitle: string) => void;
}

const Cadastro: React.FC<CadastroProps> = ({ onSuccess }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [searchingAddress, setSearchingAddress] = useState(false);

  // Arquivos
  const [logoFileList, setLogoFileList] = useState<UploadFile[]>([]);
  const [portfolioFileList, setPortfolioFileList] = useState<UploadFile[]>([]);
  const [alvaraFileList, setAlvaraFileList] = useState<UploadFile[]>([]);
  const [vigilanciaFileList, setVigilanciaFileList] = useState<UploadFile[]>([]); // Novo estado para Vigilância

  // Controle de Texto
  const [quillTextLength, setQuillTextLength] = useState(0);
  const MAX_QUILL_LENGTH = 3000;

  // Controle do Mapa
  const [mapPosition, setMapPosition] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  // --- LÓGICA DO MAPA E ENDEREÇO ---
  const handleMapLocationSelect = (
    lat: number,
    lng: number,
    address?: string,
  ) => {
    setMapPosition({ lat, lng });
    form.setFieldsValue({ latitude: lat, longitude: lng });
    if (address) {
      form.setFieldsValue({ endereco: address });
    }
  };

  const handleAddressSearch = async () => {
    const endereco = form.getFieldValue("endereco");
    if (!endereco) return toast.error("Digite um endereço para buscar.");

    setSearchingAddress(true);
    try {
      const query = endereco.toLowerCase().includes("saquarema")
        ? endereco
        : `${endereco}, Saquarema, RJ, Brasil`;

      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&addressdetails=1&limit=1`,
      );
      const data = await response.json();

      if (data && data.length > 0) {
        const { lat, lon } = data[0];
        const newPos = { lat: parseFloat(lat), lng: parseFloat(lon) };
        setMapPosition(newPos);
        form.setFieldsValue({ latitude: newPos.lat, longitude: newPos.lng });
        toast.success("Endereço encontrado! Ajuste o pino se necessário.");
      } else {
        toast.error("Endereço não encontrado. Tente ser mais específico.");
      }
    } catch (error) {
      toast.error("Erro ao buscar endereço.");
    } finally {
      setSearchingAddress(false);
    }
  };

  // --- UTILITÁRIOS ---
  const stripEmojis = (value: string) => {
    if (!value) return "";
    return value.replace(
      /([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g,
      "",
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
    const { onSuccess } = options;
    setTimeout(() => onSuccess("ok"), 0);
  };

  // --- SUBMIT ---
  const handleRegisterSubmit = async (values: any) => {
    setLoading(true);
    try {
      // Se latitude/longitude não foram preenchidos pelo usuário (ou pelo mapa), tentamos geocodificar pelo endereço
      let latitude = values.latitude;
      let longitude = values.longitude;
      const endereco = values.endereco;

      if ((latitude === undefined || latitude === null || latitude === "" || longitude === undefined || longitude === null || longitude === "") && endereco) {
        try {
          const query = endereco.toLowerCase().includes("saquarema") ? endereco : `${endereco}, Saquarema, RJ, Brasil`;
          const response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&addressdetails=1&limit=1`,
          );
          const data = await response.json();

          if (data && data.length > 0) {
            latitude = parseFloat(data[0].lat);
            longitude = parseFloat(data[0].lon);
            // Atualiza o formulário para que o usuário veja os valores (e para consistência)
            form.setFieldsValue({ latitude, longitude });
            toast.success("Coordenadas preenchidas automaticamente a partir do endereço.");
          } else {
            message.warning("Não foi possível obter coordenadas a partir do endereço informado. Ajuste o pino no mapa.");
          }
        } catch (error) {
          console.error("Erro ao tentar geocodificar o endereço:", error);
          message.warning("Erro ao buscar coordenadas. Você pode ajustar a posição no mapa antes de enviar.");
        }
      }

      const formData = new FormData();

      const cleanCPF = values.cpfResponsavel.replace(/\D/g, "");
      const cleanPhoneLocal = values.contatoLocal?.replace(/\D/g, "") || "";
      const cleanPhoneResp = values.contatoResponsavel?.replace(/\D/g, "") || "";

      formData.append("cpfResponsavel", cleanCPF);
      formData.append("contatoLocal", cleanPhoneLocal);
      formData.append("contatoResponsavel", cleanPhoneResp);
      formData.append("emailContato", values.emailContato);

      const camposTexto = [
        "nomeLocal",
        "categoria",
        "emailResponsavel",
        "nomeResponsavel",
        "contatoResponsavel",
        "emailContato",
        "cpfResponsavel",
        "contatoLocal",
        "endereco",
        "descricao",
        "instagram",
        "latitude",
        "longitude",
      ];

      camposTexto.forEach((key) => {
        let val: any = values[key as keyof typeof values];
        if (key === "latitude") val = latitude;
        if (key === "longitude") val = longitude;
        if (val !== undefined && val !== null && val !== "") {
          formData.append(key, String(val));
        }
      });

      // sempre envia como cadastro de owner (proprietário)
      formData.append("tipoCadastro", "owner");

      // Uploads apenas para proprietários
      if (logoFileList.length > 0 && logoFileList[0].originFileObj) {
        formData.append("logo", logoFileList[0].originFileObj);
      }
      portfolioFileList.forEach((file) => {
        if (file.originFileObj) {
          formData.append("imagens", file.originFileObj);
        }
      });

      if (alvaraFileList.length > 0 && alvaraFileList[0].originFileObj) {
        formData.append("alvara_funcionamento", alvaraFileList[0].originFileObj);
      }
      if (vigilanciaFileList.length > 0 && vigilanciaFileList[0].originFileObj) {
        formData.append("vigilancia_sanitaria", vigilanciaFileList[0].originFileObj);
      }

      await cadastrarLocal(formData);

      onSuccess(
        "Cadastro de Proprietário Enviado!",
        "Sua solicitação será analisada pela nossa equipe administrativa.",
      );
    } catch (error: any) {
      message.error(error.message || "Erro ao cadastrar.");
    } finally {
      setLoading(false);
    }
  };

  const commonTitle = (title: string) => (
    <h2
      className="text-xl font-semibold text-gray-800 mb-4 pl-3 border-l-4"
      style={{ borderColor: COLORS.primary }}
    >
      {title}
    </h2>
  );

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleRegisterSubmit}
      onValuesChange={(changed) => {
        if (changed.descricao)
          setQuillTextLength(getQuillTextLength(changed.descricao));
      }}
      autoComplete="off"
    >
      <section className="mb-8 border-t pt-4">
        {commonTitle("Responsável pelo Estabelecimento")}
        <Row gutter={24}>
          <Col xs={24} md={12}>
            <Form.Item
              name="nomeResponsavel"
              label="Nome Completo"
              rules={[{ required: true, message: "Obrigatório" }]}
            >
              <Input
                prefix={<UserOutlined className="text-gray-400" />}
                placeholder="Seu nome completo"
                onChange={(e) =>
                  form.setFieldsValue({
                    nomeResponsavel: stripEmojis(e.target.value),
                  })
                }
              />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item
              name="cpfResponsavel"
              label="CPF"
              rules={[{ required: true, message: "Obrigatório" }]}
            >
              <Input
              prefix={<IdcardOutlined className="text-gray-400" />}
              placeholder="000.000.000-00"
              maxLength={14}
              onChange={(e) => {
             const maskedValue = formatCPF(e.target.value);
             form.setFieldsValue({ cpfResponsavel: maskedValue });
             }}
              />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={24}>
  {/* Campo de E-mail */}
  <Col xs={24} md={12}>
    <Form.Item
  name="emailContato"
  label="E-mail de Contato"
  rules={[
    { required: true, message: "Obrigatório" },
    { type: "email", message: "Insira um formato de e-mail válido" },
    {
      validator: async (_, value) => {
        if (!value || !value.includes("@")) return Promise.resolve();
        const dominio = value.split("@")[1];
        try {
          // Usamos uma API gratuita apenas para checar se o domínio é real
          const resp = await fetch(`https://open.kickbox.com/v1/disposable/${dominio}`);
          if (resp.status === 404) {
            return Promise.reject(new Error("Este provedor de e-mail não parece ser real."));
          }
          return Promise.resolve();
        } catch (e) {
          return Promise.resolve(); // Se a API falhar, não trava o usuário
        }
      }
    }
  ]}
>
      <Input
        prefix={<MailOutlined className="text-gray-400" />}
        placeholder="exemplo@dominio.com"
      />
    </Form.Item>
  </Col>

  {/* Campo de Telefone do Responsável com Máscara */}
  <Col xs={24} md={12}>
    <Form.Item
      name="contatoResponsavel"
      label="Telefone"
      rules={[{ required: true, message: "Obrigatório" }]}
    >
      <Input
        prefix={<PhoneOutlined className="text-gray-400" />}
        placeholder="(00) 00000-0000"
        maxLength={15}
        onChange={(e) => {
          const maskedValue = formatPhone(e.target.value);
          form.setFieldsValue({ contatoResponsavel: maskedValue });
        }}
      />
    </Form.Item>
  </Col>
</Row>      
    </section>

      {/* SEÇÃO DOCUMENTAÇÃO OBRIGATÓRIA (SÓ DONO) */}
      <section className="mb-8 border-t pt-4 bg-blue-50/40 p-5 rounded-2xl border border-blue-100">
          {commonTitle("Documentação Obrigatória")}
          <Row gutter={24}>
            <Col xs={24} md={12}>
              <Form.Item
                name="alvara_funcionamento"
                label="Alvará de Funcionamento "
                rules={[{ required: true, message: "O CCMEI é necessário." }]}
              >
                <Upload
                  customRequest={customUploadAction}
                  fileList={alvaraFileList}
                  onChange={({ fileList }) => setAlvaraFileList(fileList)}
                  maxCount={1}
                >
                  <Button icon={<FileProtectOutlined />} className="w-full text-left">Anexar Alvará de Funcionamento (PDF/Imagem)</Button>
                </Upload>
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="vigilancia_sanitaria"
                label="Alvará da Vigilância Sanitária"
                rules={[{ required: true, message: "O Alvará Sanitário é necessário." }]}
              >
                <Upload
                  customRequest={customUploadAction}
                  fileList={vigilanciaFileList}
                  onChange={({ fileList }) => setVigilanciaFileList(fileList)}
                  maxCount={1}
                >
                  <Button icon={<SafetyCertificateOutlined />} className="w-full text-left">Anexar Alvará Sanitário</Button>
                </Upload>
              </Form.Item>
            </Col>
          </Row>
        </section>

      {/* SEÇÃO DADOS DO LOCAL */}
      <section className="mb-8 border-t pt-4">
        {commonTitle("Dados do Local")}
        <Row gutter={24}>
          <Col xs={24} md={12}>
            <Form.Item
              name="nomeLocal"
              label="Nome do Local"
              rules={[{ required: true, message: "Obrigatório" }]}
            >
              <Input
                placeholder="Ex: Restaurante da Praia"
                onChange={(e) =>
                  form.setFieldsValue({
                    nomeLocal: stripEmojis(e.target.value),
                  })
                }
              />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item
              name="categoria"
              label="Categoria Principal"
              rules={[{ required: true, message: "Selecione" }]}
            >
              <Select placeholder="Selecione...">
                {categoriasLocais.map((cat) => (
                  <Option key={cat} value={cat}>{cat}</Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={24}>
          <Col xs={24} md={12}>
            <Form.Item
              name="contatoLocal"
              label="Telefone / WhatsApp"
              rules={[{ required: true, message: "Obrigatório" }]}
            >
            <Input
           prefix={<PhoneOutlined className="text-gray-400" />}
           placeholder="(22) 99999-9999"
           maxLength={15}
           onChange={(e) => {
           const maskedValue = formatPhone(e.target.value);
           form.setFieldsValue({ contatoLocal: maskedValue });
           }}
            />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item name="instagram" label="Instagram (Opcional)">
              <Input
                prefix={<InstagramOutlined className="text-gray-400" />}
                placeholder="@seulocal"
              />
            </Form.Item>
          </Col>
        </Row>

        {/* MAPA */}
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-6">
          <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <EnvironmentOutlined /> Localização
          </h3>
          <Row gutter={12} align="bottom">
            <Col flex="auto">
              <Form.Item
                name="endereco"
                label="Endereço Completo"
                rules={[{ required: true, message: "Obrigatório" }]}
                help="Busque e ajuste o pino no mapa."
                style={{ marginBottom: 0 }}
              >
                <Input
                  onPressEnter={(e) => { e.preventDefault(); handleAddressSearch(); }}
                  onChange={(e) => form.setFieldsValue({ endereco: stripEmojis(e.target.value) })}
                />
              </Form.Item>
            </Col>
            <Col>
              <Button icon={<SearchOutlined />} onClick={handleAddressSearch} loading={searchingAddress} className="mt-8">Buscar</Button>
            </Col>
          </Row>

          <div className="mt-4 h-[240px]">
            <LocationPicker
              position={mapPosition}
              onLocationSelect={handleMapLocationSelect}
            />
          </div>

          <div className="hidden">
            <Form.Item name="latitude"><Input /></Form.Item>
            <Form.Item name="longitude"><Input /></Form.Item>
          </div>
        </div>

        <Form.Item
          name="descricao"
          label="Descrição Detalhada / Sobre"
          rules={[{ required: true, message: "Descreva o local" }]}
          help={`${quillTextLength}/${MAX_QUILL_LENGTH}`}
        >
          <ReactQuill
            theme="snow"
            modules={quillModules}
            placeholder="Horários, diferenciais, história..."
            value={form.getFieldValue("descricao") || ""}
            onChange={(val: string) => {
              form.setFieldsValue({ descricao: val });
              setQuillTextLength(getQuillTextLength(val));
            }}
          />
        </Form.Item>

      {/* Botão de envio posicionado logo abaixo da descrição para ficar visível */}

      {/* UPLOADS DE IMAGENS */}
      <Row gutter={24}>
        <Col xs={24} md={12}>
          <Form.Item label="Logo (Capa)">
            <Upload
              customRequest={customUploadAction}
              fileList={logoFileList}
              onChange={({ fileList }) => setLogoFileList(fileList)}
              listType="picture-card"
              maxCount={1}
              accept="image/*"
            >
              {logoFileList.length < 1 && (
                <div>
                  <UploadOutlined />
                  <div style={{ marginTop: 8 }}>Logo</div>
                </div>
              )}
            </Upload>
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item label="Galeria de Fotos">
            <Upload
              customRequest={customUploadAction}
              fileList={portfolioFileList}
              onChange={({ fileList }) => setPortfolioFileList(fileList)}
              listType="picture-card"
              multiple
              maxCount={4}
              accept="image/*"
            >
              {portfolioFileList.length < 4 && (
                <div>
                  <UploadOutlined />
                  <div style={{ marginTop: 8 }}>Fotos</div>
                </div>
              )}
            </Upload>
          </Form.Item>
        </Col>
      </Row>


      <Form.Item
        name="confirmacao"
        valuePropName="checked"
        rules={[{ validator: (_, val) => val ? Promise.resolve() : Promise.reject("Confirme a veracidade.") }]}
      >
        <Checkbox>Declaro que as informações são verdadeiras.</Checkbox>
      </Form.Item>
      
      <Form.Item>
        <Button
          type="primary"
          htmlType="submit"
          block
          loading={loading}
          size="large"
          className="bg-[#017db9] hover:bg-[#016fa0] mb-6"
        >
          Cadastrar meu Estabelecimento
        </Button>
      </Form.Item>
    </section>
  </Form>
  );
};

export default Cadastro;