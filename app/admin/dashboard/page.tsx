"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Row, Spin, message, Grid, ConfigProvider, Modal, Input, Typography } from "antd";
import { UserAddOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import { useRouter } from "next/navigation";
import { getPendingAdminRequests } from "@/lib/api";
import { Local } from "@/types/Interface-Local";
import AdminHeader from "@/components/admin/dashboard/AdminHeader";
import PendingListCard from "@/components/admin/dashboard/PendingListCard";
import LocalDetailsModal from "@/components/admin/dashboard/LocalDetailsModal";
import AdminLocalModal from "@/components/admin/AdminLocalModal";
import IndicationDetailsModal from "@/components/admin/dashboard/IndicationDetailsModal";

const { useBreakpoint } = Grid;
const { TextArea } = Input;

const COLORS = { primary: "#017DB9", secondary: "#007a73", tertiary: "#B4D55F" };
const DASHBOARD_PAGE_SIZE = 5;
const API_URL = process.env.NEXT_PUBLIC_API_URL;

interface PendingData {
  cadastros: Local[]; atualizacoes: Local[]; exclusoes: Local[];
}

const AdminDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<PendingData>({ cadastros: [], atualizacoes: [], exclusoes: [] });
  const [currentPages, setCurrentPages] = useState({ cadastros: 1, atualizacoes: 1, exclusoes: 1 });
  
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Local | null>(null);
  const [indicationModalVisible, setIndicationModalVisible] = useState(false);
  const [selectedIndication, setSelectedIndication] = useState<Local | null>(null);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [isRejectModalVisible, setIsRejectModalVisible] = useState(false);
  
  const [rejectionReason, setRejectionReason] = useState("");
  const [isActionLoading, setIsActionLoading] = useState(false);
  
  const router = useRouter();
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  const fetchData = useCallback(async () => {
    setLoading(true);
    const token = localStorage.getItem("admin_token");
    if (!token) { message.error("Acesso negado."); return router.push("/admin/login"); }
    try {
      setData(await getPendingAdminRequests(token));
      setCurrentPages({ cadastros: 1, atualizacoes: 1, exclusoes: 1 });
    } catch (error: any) {
      message.error(error.message || "Falha ao buscar dados.");
    } finally { setLoading(false); }
  }, [router]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleAction = async (action: "approve" | "reject", motivoRejeicao?: string) => {
    if (!selectedItem) return;
    setIsActionLoading(true);
    const token = localStorage.getItem("admin_token");

    try {
      const fetchOptions: RequestInit = { method: "POST", headers: { Authorization: `Bearer ${token}` } };
      if (action === "reject") {
        fetchOptions.headers = { ...fetchOptions.headers, "Content-Type": "application/json" };
        fetchOptions.body = JSON.stringify({ motivoRejeicao: motivoRejeicao || "" });
      }

      const response = await fetch(`${API_URL}/api/admin/${action}/${selectedItem.localId}`, fetchOptions);
      if (!response.ok) throw new Error((await response.json()).message || "Erro do servidor");

      message.success(`Ação executada com sucesso!`);
      setData(prev => {
        const newData = { ...prev };
        (Object.keys(newData) as Array<keyof PendingData>).forEach(key => {
          newData[key] = newData[key].filter(item => item.localId !== selectedItem.localId);
        });
        return newData;
      });

      setModalVisible(false); setIsRejectModalVisible(false); setSelectedItem(null); setRejectionReason("");
    } catch (error: any) { message.error(error.message); } 
    finally { setIsActionLoading(false); }
  };

  const handleEditAndApproveSubmit = async (values: any) => {
    if (!selectedItem) return;
    setIsActionLoading(true);
    const token = localStorage.getItem("admin_token");

    try {
      const response = await fetch(`${API_URL}/api/admin/edit-and-approve/${selectedItem.localId}`, {
        method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!response.ok) throw new Error((await response.json()).message);

      setIsEditModalVisible(false); setModalVisible(false); setSelectedItem(null); fetchData();
    } catch (error: any) { message.error(error.message); } 
    finally { setIsActionLoading(false); }
  };

  const handlePageChange = (listKey: keyof PendingData) => (page: number) => setCurrentPages(prev => ({ ...prev, [listKey]: page }));
  const showModal = (item: Local) => { setSelectedItem(item); setModalVisible(true); };
  const showIndicationModal = (item: Local) => { setSelectedIndication(item); setIndicationModalVisible(true); };

  return (
    <ConfigProvider theme={{ token: { colorPrimary: COLORS.primary, colorLink: COLORS.primary, borderRadius: 8 } }}>
      <div className="p-8">
        <Spin spinning={loading}>
          
          <AdminHeader isMobile={isMobile} primaryColor={COLORS.primary} />

          <Row gutter={[16, 16]}>
            <PendingListCard
              title="Novos Cadastros" icon={<UserAddOutlined style={{ color: "#52c41a" }} />}
              data={data.cadastros} currentPage={currentPages.cadastros} pageSize={DASHBOARD_PAGE_SIZE}
              onPageChange={handlePageChange("cadastros")} onShowDetails={showModal}
            />
            <PendingListCard
              title="Atualizações" icon={<EditOutlined style={{ color: "#1890ff" }} />}
              data={data.atualizacoes} currentPage={currentPages.atualizacoes} pageSize={DASHBOARD_PAGE_SIZE}
              onPageChange={handlePageChange("atualizacoes")} onShowDetails={showModal}
            />
            <PendingListCard
              title="Exclusões" icon={<DeleteOutlined style={{ color: "#f5222d" }} />}
              data={data.exclusoes} currentPage={currentPages.exclusoes} pageSize={DASHBOARD_PAGE_SIZE}
              onPageChange={handlePageChange("exclusoes")} onShowDetails={showModal}
            />
            {/* Nova box de Indicações (não-dono) - usa mesmo PendingListCard para exibir, mas com handler distinto */}
            <PendingListCard
              title="Indicações" icon={<UserAddOutlined style={{ color: "#fa8c16" }} />}
              data={[]} currentPage={1} pageSize={DASHBOARD_PAGE_SIZE}
              onPageChange={() => {}} onShowDetails={showIndicationModal}
            />
           </Row>
        </Spin>

        <LocalDetailsModal
          visible={modalVisible} selectedItem={selectedItem} isActionLoading={isActionLoading}
          primaryColor={COLORS.primary} onClose={() => setModalVisible(false)}
          onRejectClick={() => setIsRejectModalVisible(true)} onEditClick={() => setIsEditModalVisible(true)}
          onApproveDirect={() => handleAction("approve")}
        />

        <IndicationDetailsModal
          visible={indicationModalVisible}
          selectedItem={selectedIndication}
          isActionLoading={isActionLoading}
          primaryColor={COLORS.primary}
          onClose={() => setIndicationModalVisible(false)}
          onRejectClick={() => { /* comportamento específico de recusar indicação */ }}
          onApproveDirect={() => { /* comportamento específico de aprovar indicação */ }}
        />

        {isEditModalVisible && (
          <AdminLocalModal
            local={selectedItem} visible={isEditModalVisible} mode="edit-and-approve"
            onClose={(shouldRefresh) => { setIsEditModalVisible(false); if (shouldRefresh) { setModalVisible(false); fetchData(); } }}
            onEditAndApprove={handleEditAndApproveSubmit}
          />
        )}

        <Modal
          title="Confirmar Rejeição" open={isRejectModalVisible} confirmLoading={isActionLoading}
          okText="Confirmar Rejeição" cancelText="Voltar" okButtonProps={{ danger: true }}
          onCancel={() => { setIsRejectModalVisible(false); setRejectionReason(""); }}
          onOk={() => handleAction("reject", rejectionReason)}
        >
          <Typography.Text strong className="block mb-2">Por favor, informe o motivo da rejeição:</Typography.Text>
          <TextArea rows={4} value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} placeholder="Motivo..." />
        </Modal>
      </div>
    </ConfigProvider>
  );
};

export default AdminDashboard;