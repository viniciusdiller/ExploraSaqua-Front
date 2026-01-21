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
} from "@ant-design/icons";
import type { UploadFile } from "antd/es/upload/interface";
import { toast } from "sonner";
import { cadastrarLocal } from "@/lib/api";
import dynamic from "next/dynamic";
import "react-quill/dist/quill.snow.css";

// Importação do Componente de Mapa
import LocationPicker from "@/components/map/LocationPicker";

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

// Labels atualizados para feedback de erro
const campoLabels: { [key: string]: string } = {
  nomeResponsavel: "Nome do Responsável",
  cpfResponsavel: "CPF do Responsável",
  nomeFantasia: "Nome do Local",
  categoria: "Categoria",
  contatoLocal: "Contato/Telefone",
  endereco: "Endereço",
  latitude: "Latitude",
  longitude: "Longitude",
  descricao: "Descrição",
  instagram: "Instagram",
  confirmacao: "Confirmação",
};

const { Option } = Select;

// Configuração simplificada do Editor de Texto
const quillModules = {
  toolbar: [
    [{ header: [1, 2, false] }],
    ["bold", "italic", "underline"],
    [{ list: "ordered" }, { list: "bullet" }],
    ["clean"],
  ],
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
      const formData = new FormData();

      // Mapeamento direto para os campos do DB
      const camposTexto = [
        "nomeFantasia",
        "categoria",
        "nomeResponsavel",
        "cpfResponsavel",
        "contatoLocal",
        "endereco",
        "descricao",
        "instagram",
        "latitude",
        "longitude",
      ];

      camposTexto.forEach((key) => {
        if (values[key] !== undefined && values[key] !== null) {
          formData.append(key, String(values[key]));
        }
      });

      // Uploads
      if (logoFileList.length > 0 && logoFileList[0].originFileObj) {
        formData.append("logo", logoFileList[0].originFileObj);
      }
      portfolioFileList.forEach((file) => {
        if (file.originFileObj) {
          formData.append("imagens", file.originFileObj);
        }
      });

      await cadastrarLocal(formData);

      onSuccess(
        "Local cadastrado com sucesso!",
        "Seu cadastro foi enviado para análise.",
      );
    } catch (error: any) {
      message.error(error.message || "Erro ao cadastrar. Verifique os dados.");
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
      {/* SEÇÃO 1: RESPONSÁVEL */}
      <section className="mb-8 border-t pt-4">
        {commonTitle("Responsável")}
        <Row gutter={24}>
          <Col xs={24} md={12}>
            <Form.Item
              name="nomeResponsavel"
              label="Nome Completo do Responsável"
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
              label="CPF do Responsável"
              rules={[{ required: true, message: "Obrigatório" }]}
            >
              <Input
                prefix={<IdcardOutlined className="text-gray-400" />}
                placeholder="000.000.000-00"
                maxLength={14}
              />
            </Form.Item>
          </Col>
        </Row>
      </section>

      {/* SEÇÃO 2: DADOS DO LOCAL */}
      <section className="mb-8 border-t pt-4">
        {commonTitle("Dados do Local")}
        <Row gutter={24}>
          <Col xs={24} md={12}>
            <Form.Item
              name="nomeFantasia"
              label="Nome do Local (Fantasia)"
              rules={[{ required: true, message: "Obrigatório" }]}
            >
              <Input
                placeholder="Ex: Restaurante da Praia"
                onChange={(e) =>
                  form.setFieldsValue({
                    nomeFantasia: stripEmojis(e.target.value),
                  })
                }
              />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item
              name="categoria"
              label="Categoria Principal"
              rules={[{ required: true, message: "Selecione uma categoria" }]}
            >
              <Select placeholder="Selecione...">
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
              name="contatoLocal"
              label="Telefone / WhatsApp"
              rules={[{ required: true, message: "Obrigatório para contato" }]}
            >
              <Input
                prefix={<PhoneOutlined className="text-gray-400" />}
                placeholder="(22) 99999-9999"
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
                help="Digite o endereço e clique na lupa para posicionar no mapa."
                style={{ marginBottom: 0 }}
              >
                <Input
                  onPressEnter={(e) => {
                    e.preventDefault();
                    handleAddressSearch();
                  }}
                  onChange={(e) =>
                    form.setFieldsValue({
                      endereco: stripEmojis(e.target.value),
                    })
                  }
                />
              </Form.Item>
            </Col>
            <Col>
              <Button
                icon={<SearchOutlined />}
                onClick={handleAddressSearch}
                loading={searchingAddress}
                className="mb-0 mt-8" // Ajuste visual
              >
                Buscar
              </Button>
            </Col>
          </Row>

          <div className="mt-4 h-[350px]">
            <LocationPicker
              position={mapPosition}
              onLocationSelect={handleMapLocationSelect}
            />
          </div>

          {/* Hidden Fields */}
          <div className="hidden">
            <Form.Item name="latitude">
              <Input />
            </Form.Item>
            <Form.Item name="longitude">
              <Input />
            </Form.Item>
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
          />
        </Form.Item>

        {/* UPLOADS */}
        <Row gutter={24}>
          <Col xs={24} md={12}>
            <Form.Item label="Logo (Capa)" help="1 imagem (.jpg, .png)">
              <Upload
                customRequest={customUploadAction}
                fileList={logoFileList}
                onChange={({ fileList }) => setLogoFileList(fileList)}
                listType="picture-card"
                maxCount={1}
                accept="image/*"
                showUploadList={{ showPreviewIcon: false }}
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
            <Form.Item label="Galeria de Fotos" help="Até 4 imagens">
              <Upload
                customRequest={customUploadAction}
                fileList={portfolioFileList}
                onChange={({ fileList }) => setPortfolioFileList(fileList)}
                listType="picture-card"
                multiple
                maxCount={4}
                accept="image/*"
                showUploadList={{ showPreviewIcon: false }}
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
          rules={[
            {
              validator: (_, val) =>
                val
                  ? Promise.resolve()
                  : Promise.reject("Confirme a veracidade."),
            },
          ]}
        >
          <Checkbox>Declaro que as informações são verdadeiras.</Checkbox>
        </Form.Item>
      </section>

      <Form.Item>
        <Button
          type="primary"
          htmlType="submit"
          block
          loading={loading}
          size="large"
          className="bg-[#017db9] hover:bg-[#016fa0]"
        >
          Cadastrar Local
        </Button>
      </Form.Item>
    </Form>
  );
};

export default Cadastro;
