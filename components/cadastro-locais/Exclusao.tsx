"use client";

import React, { useState } from "react";
import { Form, Input, Button, message, Row, Col, Checkbox, Divider } from "antd";
import { solicitarExclusaoLocal } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { MailOutlined, PhoneOutlined, IdcardOutlined, ShopOutlined, ExclamationCircleOutlined } from "@ant-design/icons";

const { TextArea } = Input;

const COLORS = {
  primary: "#017db9",
  danger: "#ff4d4f",
};

interface ExclusaoProps {
  onSuccess: (title: string, subTitle: string) => void;
}

// Função de Máscara de Telefone
const formatPhone = (value: string) => {
  return value
    .replace(/\D/g, "")
    .replace(/(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d)/, "$1-$2")
    .replace(/(-\d{4})\d+?$/, "$1");
};

const Exclusao: React.FC<ExclusaoProps> = ({ onSuccess }) => {
  const { user } = useAuth();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const stripEmojis = (value: string) => {
    if (!value) return "";
    return value.replace(
      /([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g,
      "",
    );
  };

  const maskId = (value: string) => value.replace(/\D/g, "");

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

  const handleDeleteSubmit = async (values: any) => {
    if (!user?.token) {
      message.error("Sessão inválida. Faça login novamente.");
      return;
    }

    setLoading(true);
    try {
      const {
        projetoId,
        nomeLocal,
        motivo,
        emailContato,
        contatoResponsavel,
        nomeResponsavel
      } = values;

      // Limpeza do telefone antes de enviar
      const cleanPhone = contatoResponsavel?.replace(/\D/g, "");

      const dadosParaEnviar = {
        projetoId,
        nomeLocal,
        motivo,
        emailResponsavel: emailContato,
        contatoResponsavel: cleanPhone,
        nomeResponsavel
      };

      await solicitarExclusaoLocal(projetoId, dadosParaEnviar, user.token);

      onSuccess(
        "Solicitação de exclusão recebida!",
        "Sua solicitação foi registrada e será analisada pela moderação administrativa.",
      );
    } catch (error: any) {
      message.error(
        error.message || "Ocorreu um erro ao solicitar a exclusão.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleDeleteSubmit}
      autoComplete="off"
    >
      <section className="mb-8 border-t pt-4">
        {commonTitle("Solicitar Remoção de Local")}
        
        <div className="bg-red-50 border border-red-100 p-4 rounded-lg mb-6 flex gap-3">
          <ExclamationCircleOutlined className="text-red-500 mt-1" />
          <p className="text-red-800 text-sm m-0">
            <b>Atenção:</b> Esta ação solicita a exclusão definitiva do estabelecimento da plataforma. Apenas o proprietário legal pode realizar este pedido.
          </p>
        </div>

        <Row gutter={24}>
          <Col xs={24} md={12}>
            <Form.Item
              name="projetoId"
              label="ID do Estabelecimento"
              rules={[{ required: true, message: "Obrigatório" }]}
            >
              <Input
                prefix={<IdcardOutlined className="text-gray-400" />}
                placeholder="Ex: 123"
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
              name="nomeLocal"
              label="Nome do Estabelecimento"
              rules={[{ required: true, message: "Obrigatório" }]}
            >
              <Input
                prefix={<ShopOutlined className="text-gray-400" />}
                placeholder="Nome conforme cadastrado"
                onChange={(e) =>
                  form.setFieldsValue({
                    nomeLocal: stripEmojis(e.target.value),
                  })
                }
              />
            </Form.Item>
          </Col>
        </Row>

        <Divider className="my-4">Dados do Proprietário</Divider>

        <Row gutter={24}>
          <Col xs={24} md={24}>
            <Form.Item
              name="nomeResponsavel"
              label="Nome Completo do Responsável"
              rules={[{ required: true, message: "Obrigatório" }]}
            >
              <Input
                placeholder="Seu nome completo"
                onChange={(e) =>
                  form.setFieldsValue({
                    nomeResponsavel: stripEmojis(e.target.value),
                  })
                }
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={24}>
          <Col xs={24} md={12}>
            <Form.Item
              name="emailContato"
              label="E-mail para Contato"
              rules={[{ required: true, type: "email", message: "Insira um e-mail válido" }]}
            >
              <Input
                prefix={<MailOutlined className="text-gray-400" />}
                placeholder="seuemail@exemplo.com"
                onChange={(e) =>
                  form.setFieldsValue({
                    emailContato: stripEmojis(e.target.value),
                  })
                }
              />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item
              name="contatoResponsavel"
              label="Telefone Celular"
              rules={[{ required: true, message: "Obrigatório" }]}
            >
              <Input
                prefix={<PhoneOutlined className="text-gray-400" />}
                placeholder="(22) 99999-9999"
                maxLength={15}
                onChange={(e) => {
                  const maskedValue = formatPhone(e.target.value);
                  form.setFieldsValue({ contatoResponsavel: maskedValue });
                }}
              />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item 
          name="motivo" 
          label="Motivo da Exclusão"
          rules={[{ required: true, message: "Por favor, descreva o motivo" }]}
        >
          <TextArea
            rows={3}
            placeholder="Descreva brevemente por que deseja remover este local (ex: encerramento de atividades)."
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
                  : Promise.reject(new Error("Confirme a declaração")),
            },
          ]}
        >
          <Checkbox>
            Declaro que sou o proprietário legal deste estabelecimento e desejo removê-lo.
          </Checkbox>
        </Form.Item>
      </section>

      <Form.Item>
        <Button
          type="primary"
          danger
          htmlType="submit"
          block
          loading={loading}
          style={{ height: 50, borderRadius: "8px", fontWeight: "bold" }}
        >
          Confirmar Solicitação de Exclusão
        </Button>
      </Form.Item>
    </Form>
  );
};

export default Exclusao;