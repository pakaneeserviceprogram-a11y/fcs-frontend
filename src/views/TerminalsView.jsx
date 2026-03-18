import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Edit2, X, MonitorSmartphone, AlertCircle, CheckCircle, Info, Store, CreditCard, LayoutDashboard } from 'lucide-react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';

import Button from '../components/Button';
import Badge from '../components/Badge';
import Input from '../components/Input';
import Card from '../components/Card';
import Table from '../components/Table';
import PageHeader from '../components/PageHeader';
import api from '../utils/api';
export default function TerminalsView() {
  const { t } = useTranslation();

  const [terminals, setTerminals] = useState([]);
  const [vendors, setVendors] = useState([]); // 💡 เก็บรายชื่อร้านค้าเผื่อไว้ให้เลือก
  const [isLoading, setIsLoading] = useState(false);
  const [alertMsg, setAlertMsg] = useState({ type: '', text: '' });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const initialForm = { id: '', name: '', type: 'CASHIER', vendorId: '', isActive: true };
  const [formData, setFormData] = useState(initialForm);

  const showBanner = useCallback((type, message) => {
    setAlertMsg({ type, text: message });
    setTimeout(() => setAlertMsg({ type: '', text: '' }), type === 'error' ? 5000 : 3000);
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [termRes, venRes] = await Promise.all([
        api.get('/api/v3/terminals', { headers: { 'x-tenant-id': '2' } }),
        api.get('/api/v3/vendors', { headers: { 'x-tenant-id': '2' } })
      ]);
      setTerminals(termRes.data);
      setVendors(venRes.data);
    } catch (error) { showBanner('error', 'โหลดข้อมูลไม่สำเร็จ'); } 
    finally { setIsLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const openAddModal = () => {
    setModalMode('add');
    setFormData(initialForm);
    setIsModalOpen(true);
  };

  const openEditModal = (device) => {
    setModalMode('edit');
    setFormData({
      id: device.id, name: device.name, type: device.type, 
      vendorId: device.vendorId || '', isActive: device.isActive
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.type === 'VENDOR' && !formData.vendorId) {
      return showBanner('error', 'กรุณาเลือกร้านค้าสำหรับเครื่องประเภท VENDOR');
    }

    try {
      const isEdit = modalMode === 'edit';
      const url = isEdit ? `/api/v3/terminals/${formData.id}` : `/api/v3/terminals`;
      await axios({ method: isEdit ? 'patch' : 'post', url, data: formData, headers: { 'x-tenant-id': '2' } });
      
      showBanner('success', isEdit ? 'อัปเดตเครื่องสำเร็จ' : 'ลงทะเบียนเครื่องใหม่สำเร็จ');
      setIsModalOpen(false);
      fetchData();
    } catch (error) { 
      showBanner('error', error.response?.data?.message || 'บันทึกข้อมูลล้มเหลว'); 
    }
  };

  const columns = [
    { header: t('terminals.colId') || 'Device ID', accessor: 'id', render: (t) => <span className="font-mono text-sm text-slate-500">{t.id}</span> },
    { 
      header: t('terminals.colName') || 'Name', 
      render: (t) => (
        <div>
          <div className="font-bold text-slate-800">{t.name}</div>
          {t.type === 'VENDOR' && t.vendorName && <div className="text-xs text-indigo-500 font-medium mt-0.5 flex items-center gap-1"><Store size={12}/> {t.vendorName}</div>}
        </div>
      ) 
    },
    { 
      header: t('terminals.colType') || 'Type', 
      render: (t) => {
        let color = 'bg-slate-100 text-slate-600';
        let Icon = LayoutDashboard;
        if (t.type === 'CASHIER') { color = 'bg-blue-50 text-blue-700 border-blue-200'; Icon = CreditCard; }
        else if (t.type === 'VENDOR') { color = 'bg-indigo-50 text-indigo-700 border-indigo-200'; Icon = Store; }
        else if (t.type === 'KIOSK') { color = 'bg-purple-50 text-purple-700 border-purple-200'; Icon = MonitorSmartphone; }

        return <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-bold border ${color}`}><Icon size={12}/>{t.type}</span>;
      }
    },
    { 
      header: t('terminals.colStatus') || 'Status', align: 'center', 
      render: (t) => (
        <span className={`flex items-center justify-center gap-1.5 text-xs font-bold ${t.isActive ? 'text-emerald-600' : 'text-rose-500'}`}>
          <span className={`w-2 h-2 rounded-full ${t.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></span>
          {t.isActive ? 'ONLINE' : 'OFFLINE'}
        </span>
      ) 
    },
    { header: t('common.action'), align: 'right', render: (t) => <Button variant="ghost" icon={Edit2} onClick={() => openEditModal(t)} /> }
  ];

  return (
    <div className="max-w-7xl mx-auto flex flex-col h-[calc(100vh-100px)] p-4 space-y-4">
      {alertMsg.text && (
        <div className={`border-l-4 p-4 rounded-r-xl flex items-center gap-3 animate-in fade-in duration-300 shadow-sm shrink-0 ${alertMsg.type === 'error' ? 'bg-rose-50 border-rose-500' : 'bg-emerald-50 border-emerald-500'}`}>
          {alertMsg.type === 'error' ? <AlertCircle className="text-rose-500" size={20} /> : <CheckCircle className="text-emerald-500" size={20} />}
          <p className={`text-sm font-bold ${alertMsg.type === 'error' ? 'text-rose-700' : 'text-emerald-700'}`}>{alertMsg.text}</p>
          <button onClick={() => setAlertMsg({ type: '', text: '' })} className="ml-auto opacity-50 hover:opacity-100"><X size={16} /></button>
        </div>
      )}

      <PageHeader 
        title={t('terminals.title') || 'Devices & Terminals'}
        subtitle={t('terminals.subtitle') || 'ตรวจสอบและลงทะเบียนอุปกรณ์ POS'}
        actions={<Button variant="primary" icon={Plus} onClick={openAddModal}>{t('terminals.create') || 'Register Device'}</Button>}
      />

      <Card className="flex flex-col flex-1 overflow-hidden shadow-sm border border-slate-200 bg-white">
        <div className="flex-1 overflow-auto p-1">
          <Table columns={columns} data={terminals} isLoading={isLoading} emptyMessage={t('terminals.empty')} />
        </div>
      </Card>

      {/* MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in duration-200">
            <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50">
              <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                <MonitorSmartphone className="text-emerald-500" size={20}/>
                {modalMode === 'add' ? t('terminals.create') : t('common.edit')}
              </h3>
              <button type="button" onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-rose-500"><X size={20} /></button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <Input label={t('terminals.formId')} value={formData.id} onChange={(e) => setFormData({...formData, id: e.target.value})} required disabled={modalMode === 'edit'} placeholder="Ex. T-01, V-105-TAB" />
              <Input label={t('terminals.formName')} value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required placeholder="เช่น จุดแลกเงินประตู 1" />
              
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">{t('terminals.formType')}</label>
                <select className="w-full border border-slate-200 rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20" value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value})}>
                  <option value="CASHIER">CASHIER (จุดแคชเชียร์หลัก)</option>
                  <option value="VENDOR">VENDOR (แท็บเล็ต/POS ของร้านค้า)</option>
                  <option value="KIOSK">KIOSK (ตู้เติมเงินอัตโนมัติ)</option>
                </select>
              </div>

              {/* 💡 ถ้าเลือกเป็น VENDOR ให้โชว์ Dropdown เลือกร้านค้า */}
              {formData.type === 'VENDOR' && (
                <div className="space-y-1 animate-in slide-in-from-top-2 duration-300">
                  <label className="text-xs font-bold text-indigo-500 uppercase flex items-center gap-1"><Store size={14}/> {t('terminals.formVendor')}</label>
                  <select className="w-full border border-indigo-200 bg-indigo-50/30 rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20" value={formData.vendorId} onChange={(e) => setFormData({...formData, vendorId: e.target.value})} required>
                    <option value="" disabled>-- กรุณาเลือกร้านค้า --</option>
                    {vendors.map(v => <option key={v.id} value={v.id}>[{v.id}] {v.name}</option>)}
                  </select>
                </div>
              )}

              {modalMode === 'edit' && (
                <div className="space-y-1 pt-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">{t('common.status')}</label>
                  <select className="w-full border border-slate-200 rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20" value={formData.isActive ? 'ACTIVE' : 'INACTIVE'} onChange={(e) => setFormData({...formData, isActive: e.target.value === 'ACTIVE'})}>
                    <option value="ACTIVE">ONLINE (พร้อมใช้งาน)</option>
                    <option value="INACTIVE">OFFLINE (ระงับชั่วคราว)</option>
                  </select>
                </div>
              )}

              <div className="flex gap-2 pt-4 border-t border-slate-100">
                <Button type="button" variant="secondary" className="flex-1" onClick={() => setIsModalOpen(false)}>{t('common.cancel')}</Button>
                <Button type="submit" variant="primary" className="flex-1">{t('common.save')}</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}