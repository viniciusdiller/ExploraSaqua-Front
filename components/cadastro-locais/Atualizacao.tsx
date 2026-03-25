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
  Divider,
} from "antd";
import { 
  UploadOutlined, 
  IdcardOutlined, 
  ShopOutlined, 
  MailOutlined,
  EnvironmentOutlined,
  SearchOutlined,
  FileProtectOutlined,
  SafetyCertificateOutlined
} from "@ant-design/icons";
import type { UploadFile } from "antd/es/upload/interface";
import { toast } from "sonner";
import { solicitarAtualizacaoLocal } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import dynamic from "next/dynamic";
import "react-quill/dist/quill.snow.css";

// Importação Dinâmica dos componentes pesados/Browser-only
const ReactQuill = dynamic(() => import("react-quill"), { ssr: false });
const LocationPicker = dynamic(() => import("@/components/map/LocationPicker"), { 
  ssr: false,
  loading: () => <div className="h-[350px] bg-gray-100 animate-pulse flex items-center justify-center rounded-lg">A carregar mapa...</div>
});

const COLORS = {
  primary: "#017db9",
  secondary: "#a8cf45",
};

const categoriasLocais = [
  { label: "Comércio & Lojas", value: "comercio-e-lojas" },
  { label: "Educação & Capacitação", value: "educacao-e-capacitacao" },
  { label: "Emergências", value: "emergencias" },
  { label: "Esportes", value: "esportes" },
  { label: "Eventos & Agenda", value: "eventos-e-agenda" },
  { label: "Hospedagem", value: "hospedagem" },
  { label: "Indústria", value: "industria" },
  { label: "Mei de Saquá", value: "mei-de-saqua" },
  { label: "Saúde & Bem-estar", value: "saude-e-bem-estar" },
  { label: "Serviços Públicos", value: "servicos-publicos" },
  { label: "Supermercado & Feiras", value: "supermercado-e-feiras" },
  { label: "Turismo & Lazer", value: "turismo-e-lazer" },
  { label: "Utilidades & Informações Gerais", value: "utilidades-e-informacoes-gerais" },
];

const { Option } = Select;
const { TextArea } = Input;

const quillModules = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ["bold", "italic", "underline"],
    [{ list: "ordered" }, { list: "bullet" }],
    ["link", "clean"],
  ],
};

interface AtualizacaoProps {
  onSuccess: (title: string, subTitle: string) => void;
}

const Atualizacao: React.FC<AtualizacaoProps> = ({ onSuccess }) => {
  const { user } = useAuth();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [searchingAddress, setSearchingAddress] = useState(false);
  
  // Estados para ficheiros
  const [logoFileList, setLogoFileList] = useState<UploadFile[]>([]);
  const [portfolioFileList, setPortfolioFileList] = useState<UploadFile[]>([]);
  const [vigilanciaFileList, setVigilanciaFileList] = useState<UploadFile[]>([]);
  const [funcionamentoFileList, setFuncionamentoFileList] = useState<UploadFile[]>([]);
  
  const [quillTextLength, setQuillTextLength] = useState(0);
  const [mapPosition, setMapPosition] = useState<{ lat: number; lng: number } | null>(null);

  const MAX_QUILL_LENGTH = 5000;

  const maskId = (value: string) => value.replace(/\D/g, "");

  const getQuillTextLength = (value: string) => {
    if (typeof window === "undefined" || !value || value === "<p><br></p>") return 0;
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = value;
    return (tempDiv.textContent || tempDiv.innerText || "").trim().length;
  };

  const handleMapLocationSelect = (lat: number, lng: number, address?: string) => {
    setMapPosition({ lat, lng });
    form.setFieldsValue({ latitude: lat, longitude: lng });
    if (address) form.setFieldsValue({ endereco: address });
  };

  const handleAddressSearch = async () => {
    const endereco = form.getFieldValue("endereco");
    if (!endereco) return toast.error("Digite o novo endereço para procurar.");

    setSearchingAddress(true);
    try {
      const query = endereco.toLowerCase().includes("saquarema") ? endereco : `${endereco}, Saquarema, RJ, Brasil`;
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`);
      const data = await response.json();

      if (data && data.length > 0) {
        const { lat, lon } = data[0];
        const newPos = { lat: parseFloat(lat), lng: parseFloat(lon) };
        setMapPosition(newPos);
        form.setFieldsValue({ latitude: newPos.lat, longitude: newPos.lng });
        toast.success("Endereço localizado!");
      } else {
        toast.error("Endereço não encontrado.");
      }
    } catch (error) {
      toast.error("Erro na procura.");
    } finally {
      setSearchingAddress(false);
    }
  };

  const handleUpdateSubmit = async (values: any) => {
    if (!user?.token) {
      message.error("Sessão inválida. Faça login novamente.");
      return;
    }

    setLoading(true);
    try {
      const { projetoId, ...updateData } = values;
      const formData = new FormData();

      // Envia campos de texto
      Object.entries(updateData).forEach(([key, value]) => {
        if (value && !["logo", "imagens", "vigilancia", "funcionamento"].includes(key)) {
          formData.append(key, String(value));
        }
      });

      // Anexar ficheiros se existirem
      if (logoFileList[0]?.originFileObj) formData.append("logo", logoFileList[0].originFileObj);
      if (vigilanciaFileList[0]?.originFileObj) formData.append("vigilancia_sanitaria", vigilanciaFileList[0].originFileObj);
      if (funcionamentoFileList[0]?.originFileObj) formData.append("alvara_funcionamento", funcionamentoFileList[0].originFileObj);
      
      portfolioFileList.forEach((file) => {
        if (file.originFileObj) formData.append("imagens", file.originFileObj);
      });

      await solicitarAtualizacaoLocal(projetoId, formData, user.token);
      onSuccess("Atualização enviada!", "A sua solicitação (incluindo novos documentos, se houver) será analisada pela moderação.");
    } catch (error: any) {
      message.error(error.message || "Erro ao solicitar atualização.");
    } finally {
      setLoading(false);
    }
  };

  const commonTitle = (title: string) => (
    <h2 className="text-xl font-bold mb-6 pl-4 border-l-4" style={{ borderColor: COLORS.primary, color: COLORS.primary }}>
      {title}
    </h2>
  );

  return (
    <Form form={form} layout="vertical" onFinish={handleUpdateSubmit} onValuesChange={(changed) => changed.descricao && setQuillTextLength(getQuillTextLength(changed.descricao))}>
      
      {/* IDENTIFICAÇÃO */}
      <section className="mb-8 border-t pt-4">
        {commonTitle("Identificação do Estabelecimento")}
        <Row gutter={24}>
          <Col xs={24} md={12}>
            <Form.Item name="projetoId" label="ID do Estabelecimento (Obrigatório)" rules={[{ required: true }]}>
              <Input prefix={<IdcardOutlined />} placeholder="Ex: 15" onChange={(e) => form.setFieldsValue({ projetoId: maskId(e.target.value) })} />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item name="nomeLocal" label="Nome Fantasia Atual" rules={[{ required: true }]}>
              <Input prefix={<ShopOutlined />} placeholder="Como o local está registado" />
            </Form.Item>
          </Col>
        </Row>
      </section>

      {/* NOVOS DOCUMENTOS */}
      <section className="mb-8 border-t pt-4 bg-blue-50/30 p-5 rounded-2xl border border-blue-100">
        {commonTitle("Atualizar Alvarás (Opcional)")}
        <p className="text-gray-500 mb-6 text-sm">Carregue apenas se desejar substituir os documentos atuais.</p>
        <Row gutter={24}>
          <Col xs={24} md={12}>
            <Form.Item name="vigilancia" label="Novo Alvará Vigilância Sanitária">
              <Upload 
                listType="picture" maxCount={1} fileList={vigilanciaFileList}
                onChange={({ fileList }) => setVigilanciaFileList(fileList)}
                customRequest={({ onSuccess }) => onSuccess!("ok")}
              >
                <Button icon={<SafetyCertificateOutlined />} block>Substituir Vigilância</Button>
              </Upload>
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item name="funcionamento" label="Novo Alvará de Funcionamento">
              <Upload 
                listType="picture" maxCount={1} fileList={funcionamentoFileList}
                onChange={({ fileList }) => setFuncionamentoFileList(fileList)}
                customRequest={({ onSuccess }) => onSuccess!("ok")}
              >
                <Button icon={<FileProtectOutlined />} block>Substituir Funcionamento</Button>
              </Upload>
            </Form.Item>
          </Col>
        </Row>
      </section>

      {/* RESTANTE DOS DADOS */}
      <section className="mb-8 border-t pt-4">
        {commonTitle("O que deseja atualizar?")}
        
        <Divider orientation="left" plain>Nova Localização</Divider>
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-6">
          <Row gutter={12} align="bottom">
            <Col flex="auto">
              <Form.Item name="endereco" label="Novo Endereço Completo" style={{ marginBottom: 0 }}>
                <Input placeholder="Rua, Número, Bairro..." onPressEnter={(e) => { e.preventDefault(); handleAddressSearch(); }} />
              </Form.Item>
            </Col>
            <Col>
              <Button icon={<SearchOutlined />} onClick={handleAddressSearch} loading={searchingAddress} className="mt-8">Procurar</Button>
            </Col>
          </Row>
          <div className="mt-4 h-[300px] rounded-lg overflow-hidden border border-gray-300">
            <LocationPicker position={mapPosition} onLocationSelect={handleMapLocationSelect} />
          </div>
          <div className="hidden">
            <Form.Item name="latitude"><Input /></Form.Item>
            <Form.Item name="longitude"><Input /></Form.Item>
          </div>
        </div>

        <Divider orientation="left" plain>Informações e Mídia</Divider>
        <Form.Item name="categoria" label="Alterar Categoria">
          <Select placeholder="Selecione se desejar mudar" allowClear>
            {categoriasLocais.map(cat => <Option key={cat.value} value={cat.value}>{cat.label}</Option>)}
          </Select>
        </Form.Item>

        <Form.Item name="descricao" label="Nova Descrição" help={`${quillTextLength}/${MAX_QUILL_LENGTH}`}>
          <ReactQuill theme="snow" modules={quillModules} placeholder="Atualize os detalhes do local..." />
        </Form.Item>

        <Row gutter={24}>
          <Col xs={24} md={12}>
            <Form.Item label="Nova Logo">
              <Upload listType="picture" maxCount={1} fileList={logoFileList} onChange={({ fileList }) => setLogoFileList(fileList)} customRequest={({ onSuccess }) => onSuccess!("ok")}>
                <Button icon={<UploadOutlined />} block>Carregar Logo</Button>
              </Upload>
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item label="Novas Fotos">
              <Upload listType="picture" multiple maxCount={4} fileList={portfolioFileList} onChange={({ fileList }) => setPortfolioFileList(fileList)} customRequest={({ onSuccess }) => onSuccess!("ok")}>
                <Button icon={<UploadOutlined />} block>Carregar Fotos</Button>
              </Upload>
            </Form.Item>
          </Col>
        </Row>

        <Form.Item name="confirmacao" valuePropName="checked" rules={[{ validator: (_, val) => val ? Promise.resolve() : Promise.reject(new Error("Confirme a veracidade.")) }]}>
          <Checkbox>Declaro que sou o proprietário legal e estas informações são reais.</Checkbox>
        </Form.Item>
      </section>

      <Button type="primary" htmlType="submit" block loading={loading} style={{ height: 50, fontSize: "1.1rem" }}>
        Solicitar Atualização de Dados
      </Button>
    </Form>
  );
};

export default Atualizacao;