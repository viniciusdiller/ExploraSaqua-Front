"use client";

import React, { useState } from "react";
import { Form, Input, Button, message, Row, Col, Checkbox } from "antd";
import { solicitarExclusaoLocal } from "@/lib/api";

const { TextArea } = Input;

const COLORS = {
  primary: "#017db9",
};

interface ExclusaoProps {
  onSuccess: (title: string, subTitle: string) => void;
}

const Exclusao: React.FC<ExclusaoProps> = ({ onSuccess }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const stripEmojis = (value: string) => {
    if (!value) return "";
    return value.replace(
      /([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g,
      ""
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

      onSuccess(
        "Solicitação de exclusão recebida!",
        "Sua solicitação foi registrada. A remoção do seu perfil será processada em breve."
      );
    } catch (error: any) {
      message.error(
        error.message || "Ocorreu um erro ao solicitar a exclusão."
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
};

export default Exclusao;
