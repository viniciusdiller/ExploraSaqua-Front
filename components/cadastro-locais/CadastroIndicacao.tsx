"use client";

import React, { useState } from "react";
import { Modal, Form, Input, Button, Select, Row, Col, message } from "antd";
import { UserOutlined, IdcardOutlined, PhoneOutlined, MailOutlined, EnvironmentOutlined, SearchOutlined } from "@ant-design/icons";
import dynamic from "next/dynamic";
import { toast } from "sonner";
import { cadastrarLocal } from "@/lib/api";

const { Option } = Select;

const LocationPicker = dynamic(() => import("@/components/map/LocationPicker"), { ssr: false, loading: () => <div className="h-[200px] bg-gray-100 animate-pulse rounded-lg"/>});

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

const formatCPF = (value: string) =>
  value
    .replace(/\D/g, "")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})/, "$1-$2")
    .replace(/(-\d{2})\d+?$/, "$1");

const formatPhone = (value: string) =>
  value
    .replace(/\D/g, "")
    .replace(/(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d)/, "$1-$2")
    .replace(/(-\d{4})\d+?$/, "$1");

const stripEmojis = (value: string) => {
  if (!value) return "";
  return value.replace(/([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g, "");
};

interface Props {
  visible?: boolean;
  onClose?: () => void;
  onSuccess?: (title: string, subtitle: string) => void;
  mode?: "modal" | "page"; // novo: modo de exibição
}

export default function CadastroIndicacao({ visible, onClose, onSuccess, mode = "modal" }: Props) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [mapPosition, setMapPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [searching, setSearching] = useState(false);

  const handleMapLocationSelect = (lat: number, lng: number, address?: string) => {
    setMapPosition({ lat, lng });
    form.setFieldsValue({ latitude: lat, longitude: lng });
    if (address) form.setFieldsValue({ endereco: address });
  };

  const handleAddressSearch = async () => {
    const endereco = form.getFieldValue("endereco");
    if (!endereco) return toast.error("Digite um endereço para buscar.");
    setSearching(true);
    try {
      const query = endereco.toLowerCase().includes("saquarema") ? endereco : `${endereco}, Saquarema, RJ, Brasil`;
      const resp = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`);
      const data = await resp.json();
      if (data && data.length > 0) {
        const { lat, lon } = data[0];
        const pos = { lat: parseFloat(lat), lng: parseFloat(lon) };
        setMapPosition(pos);
        form.setFieldsValue({ latitude: pos.lat, longitude: pos.lng });
        toast.success("Endereço encontrado. Ajuste o pino se necessário.");
      } else {
        toast.error("Endereço não encontrado.");
      }
    } catch (e) {
      toast.error("Erro ao buscar endereço.");
    } finally {
      setSearching(false);
    }
  };

  const handleFinish = async (values: any) => {
    setLoading(true);
    try {
      const formData = new FormData();

      // Campos básicos
      if (values.nomeLocal) formData.append("nomeLocal", stripEmojis(values.nomeLocal));
      if (values.categoria) formData.append("categoria", values.categoria);
      if (values.endereco) formData.append("endereco", stripEmojis(values.endereco));
      if (values.descricao) formData.append("descricao", values.descricao);

      const lat = values.latitude || (mapPosition && mapPosition.lat);
      const lng = values.longitude || (mapPosition && mapPosition.lng);
      if (lat) formData.append("latitude", String(lat));
      if (lng) formData.append("longitude", String(lng));

      // Indicador (quem está indicando)
      const cleanCPF = values.cpfResponsavel ? values.cpfResponsavel.replace(/\D/g, "") : "";
      const cleanPhoneResp = values.contatoResponsavel ? values.contatoResponsavel.replace(/\D/g, "") : "";

      if (values.nomeResponsavel) formData.append("nomeResponsavel", stripEmojis(values.nomeResponsavel));
      if (cleanCPF) formData.append("cpfResponsavel", cleanCPF);
      if (values.emailContato) formData.append("emailContato", values.emailContato);
      if (cleanPhoneResp) formData.append("contatoResponsavel", cleanPhoneResp);

      // Campos que o admin espera para indicações
      if (values.nomeResponsavel) formData.append("indicadorNome", stripEmojis(values.nomeResponsavel));
      if (values.emailContato) formData.append("indicadorEmail", values.emailContato);
      if (values.contatoResponsavel) formData.append("indicadorContato", values.contatoResponsavel);

      // Telefone do Local (limpo)
      const cleanPhoneLocal = values.contatoLocal ? values.contatoLocal.replace(/\D/g, "") : "";
      if (cleanPhoneLocal) formData.append("contatoLocal", cleanPhoneLocal);

      formData.append("tipoCadastro", "indication");

      await cadastrarLocal(formData);

      form.resetFields();
      onSuccess?.("Indicação enviada!", "Agradecemos, nossa equipe irá avaliar a indicação.");
      onClose?.();
    } catch (err: any) {
      message.error(err?.message || "Erro ao enviar indicação.");
    } finally {
      setLoading(false);
    }
  };

  const formContent = (
    <Form form={form} layout="vertical" onFinish={handleFinish} autoComplete="off">
      <h3 className="text-lg font-semibold">Quem está indicando?</h3>
      <Row gutter={12}>
        <Col xs={24} md={12}>
          <Form.Item name="nomeResponsavel" label="Nome Completo" rules={[{ required: true, message: "Obrigatório" }]}>
            <Input prefix={<UserOutlined />} placeholder="Seu nome completo" onChange={(e) => form.setFieldsValue({ nomeResponsavel: stripEmojis(e.target.value) })} />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item name="cpfResponsavel" label="CPF" rules={[{ required: true, message: "Obrigatório" }]}>
            <Input prefix={<IdcardOutlined />} placeholder="000.000.000-00" maxLength={14} onChange={(e) => form.setFieldsValue({ cpfResponsavel: formatCPF(e.target.value) })} />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={12}>
        <Col xs={24} md={12}>
          <Form.Item name="emailContato" label="E-mail de Contato" rules={[{ required: true, message: "Obrigatório" }, { type: "email", message: "Digite um e-mail válido" }]}>
            <Input prefix={<MailOutlined />} placeholder="exemplo@dominio.com" />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item name="contatoResponsavel" label="Telefone" rules={[{ required: true, message: "Obrigatório" }]}>
            <Input prefix={<PhoneOutlined />} placeholder="(00) 00000-0000" maxLength={15} onChange={(e) => form.setFieldsValue({ contatoResponsavel: formatPhone(e.target.value) })} />
          </Form.Item>
        </Col>
      </Row>

      <h3 className="text-lg font-semibold">Dados do Local</h3>
      <Row gutter={12}>
        <Col xs={24} md={12}>
          <Form.Item name="nomeLocal" label="Nome do Local" rules={[{ required: true, message: "Obrigatório" }]}>
            <Input placeholder="Ex: Restaurante da Praia" onChange={(e) => form.setFieldsValue({ nomeLocal: stripEmojis(e.target.value) })} />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item name="categoria" label="Categoria Principal" rules={[{ required: true, message: "Selecione" }]}>
            <Select placeholder="Selecione...">{categoriasLocais.map((c) => <Option key={c} value={c}>{c}</Option>)}</Select>
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={12}>
        <Col xs={24} md={12}>
          <Form.Item name="contatoLocal" label="Telefone / WhatsApp do Local" rules={[{ required: true, message: "Obrigatório" }] }>
            <Input
              prefix={<PhoneOutlined />}
              placeholder="(22) 99999-9999"
              maxLength={15}
              onChange={(e) => form.setFieldsValue({ contatoLocal: formatPhone(e.target.value) })}
            />
          </Form.Item>
        </Col>
        <Col xs={24} md={12} />
      </Row>

      <Form.Item name="descricao" label="Descrição (opcional)" className="mt-2">
        <Input.TextArea rows={3} placeholder="Horários, observações..." />
      </Form.Item>

      <Form.Item name="endereco" label="Endereço Completo" help="Busque e ajuste o pino no mapa." style={{ marginBottom: 0 }}>
        <Input onPressEnter={(e) => { e.preventDefault(); handleAddressSearch(); }} onChange={(e) => form.setFieldsValue({ endereco: stripEmojis(e.target.value) })} />
      </Form.Item>
      <div className="flex justify-end mb-2">
        <Button icon={<SearchOutlined />} onClick={handleAddressSearch} loading={searching} size="small">Buscar</Button>
      </div>

      {/* Container com fundo branco apenas para o mapa */}
      <div className="bg-white p-4 rounded-xl mb-4 shadow-sm">
        <div className="h-[240px]">
          <LocationPicker position={mapPosition} onLocationSelect={handleMapLocationSelect} />
        </div>
      </div>


      {/* Botão de envio posicionado abaixo da descrição (full width) */}
      <div className="mb-6 mt-4">
        <Form.Item>
          <div className="flex justify-center">
            <Button type="primary" size="large" htmlType="submit" loading={loading} className="w-full max-w-xl">
              Enviar Indicação
            </Button>
          </div>
        </Form.Item>
      </div>

      <div className="hidden">
        <Form.Item name="latitude"><Input /></Form.Item>
        <Form.Item name="longitude"><Input /></Form.Item>
      </div>

      {/* Para modo modal, mantemos botão Cancelar ao lado do envio caso necessário */}
      {mode === "modal" && (
        <Form.Item>
          <div className="flex gap-2 justify-end">
            <Button onClick={onClose}>Cancelar</Button>
          </div>
        </Form.Item>
      )}
    </Form>
  );

  // Renderiza como página (sem modal) ou como modal
  if (mode === "page") {
    return (
      <div>
        <h1 className="text-3xl font-bold mb-6" style={{ color: "#017db9" }}>Indicar um Local</h1>
        {formContent}
      </div>
    );
  }

  return (
    <Modal
      open={visible}
      onCancel={onClose}
      footer={null}
      width={800}
      title="Indicar um Local"
    >
      {formContent}
    </Modal>
  );
}
