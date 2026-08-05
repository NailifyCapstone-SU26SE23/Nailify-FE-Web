import { useLanguage } from '../../../../shared/hooks/useLanguage';
import { Modal, Form, Input, Select, Button, message } from 'antd';
import { useEffect, useState } from 'react';
import { chairManagementService } from '../services/chairManagementService';
import toast from 'react-hot-toast';

const { Option } = Select;

export default function ChairFormModal({
  open,
  onClose,
  chair,
  initialChairName,
  salonId,
  salons = [],
  onSuccess
}) {
  const { t } = useLanguage();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      if (chair) {
        form.setFieldsValue({
          chairName: chair.chairName,
          status: chair.status,
        });
      } else {
        form.resetFields();
        form.setFieldsValue({ status: 'Active', salonId: salonId, chairName: initialChairName || '' });
      }
    }
  }, [open, chair, initialChairName, salonId, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      if (chair) {
        // Update
        await chairManagementService.updateChair(chair.chairId, {
          chairName: values.chairName,
          status: values.status,
        });
        toast.success(t('adminChairs.chairUpdatedSuccess'));
      } else {
        // Create
        if (!values.salonId) {
          toast.error(t('adminChairs.pleaseSelectSalon'));
          return;
        }
        await chairManagementService.createChair({
          salonId: values.salonId,
          chairName: values.chairName,
          status: values.status,
        });
        toast.success(t('adminChairs.chairCreatedSuccess'));
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error(error);
      toast.error(error.message || t('adminChairs.failedToSaveChair'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={
        <div className="text-lg font-bold tracking-tight text-slate-900">
          {chair ? t("adminChairs.editChair") : t("adminChairs.addNewChair")}
        </div>
      }
      open={open}
      onCancel={onClose}
      footer={[
        <Button key="cancel" onClick={onClose} disabled={loading} className="rounded-xl border-slate-200 font-semibold">
          {t("adminChairs.cancel")}
        </Button>,
        <Button key="submit" type="primary" loading={loading} onClick={handleSubmit} className="rounded-xl bg-[#ea4f93] font-semibold hover:bg-[#d94685] border-none shadow-md shadow-[#ea4f93]/30">
          {chair ? t("adminChairs.updateChair") : t("adminChairs.createChair")}
        </Button>
      ]}
      className="[&_.ant-modal-content]:rounded-2xl [&_.ant-modal-content]:p-6"
      destroyOnClose
    >
      <Form form={form} layout="vertical" className="mt-6">
        <Form.Item
          label={<span className="text-[13px] font-bold text-slate-700 uppercase tracking-wide">{t("adminChairs.chairName")}</span>}
          name="chairName"
          rules={[{ required: true, message: t('adminChairs.pleaseInputName') }]}
        >
          <Input
            placeholder="e.g. 1A, 2B, 3C,..."
            className="rounded-xl border-slate-200 py-2.5 hover:border-[#ea4f93] focus:border-[#ea4f93] focus:ring-1 focus:ring-[#ea4f93]/20"
          />
        </Form.Item>

        {!chair && (
          <Form.Item
            label={<span className="text-[13px] font-bold text-slate-700 uppercase tracking-wide">{t("adminChairs.salon")}</span>}
            name="salonId"
            rules={[{ required: true, message: t('adminChairs.pleaseSelectSalon') }]}
          >
            <Select
              className="[&_.ant-select-selector]:rounded-xl [&_.ant-select-selector]:border-slate-200 hover:[&_.ant-select-selector]:border-[#ea4f93] focus:[&_.ant-select-selector]:border-[#ea4f93]"
              size="large"
              placeholder={t("adminChairs.selectSalon")}
            >
              {salons.map(s => (
                <Option key={s.id || s.salonId} value={s.id || s.salonId}>{s.name}</Option>
              ))}
            </Select>
          </Form.Item>
        )}

        <Form.Item
          label={<span className="text-[13px] font-bold text-slate-700 uppercase tracking-wide">{t("adminChairs.status")}</span>}
          name="status"
          rules={[{ required: true, message: t('adminChairs.pleaseSelectStatus') }]}
        >
          <Select
            className="[&_.ant-select-selector]:rounded-xl [&_.ant-select-selector]:border-slate-200 hover:[&_.ant-select-selector]:border-[#ea4f93] focus:[&_.ant-select-selector]:border-[#ea4f93]"
            size="large"
          >
            <Option value="Active">
              <span className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                <span className="font-semibold text-emerald-700">{t("adminChairs.active")}</span>
              </span>
            </Option>
            <Option value="Inactive">
              <span className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-slate-400"></span>
                <span className="font-semibold text-slate-600">{t("adminChairs.inactive")}</span>
              </span>
            </Option>
            <Option value="Maintenance">
              <span className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-amber-500"></span>
                <span className="font-semibold text-amber-700">{t("adminChairs.maintenance")}</span>
              </span>
            </Option>
          </Select>
        </Form.Item>
      </Form>
    </Modal>
  );
}
