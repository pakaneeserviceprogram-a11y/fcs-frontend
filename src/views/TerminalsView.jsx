import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Edit2, X, MonitorSmartphone, AlertCircle, CheckCircle, Store, CreditCard, LayoutDashboard, Printer, FileText, Wifi, PowerOff } from 'lucide-react';
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
  const [vendors, setVendors] = useState([]); 
  const [isLoading, setIsLoading] = useState(false);
  const [alertMsg, setAlertMsg] = useState({ type: '', text: '' });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  
  // 💡 เพิ่ม autoPrint และ taxMachineId ลงใน State เริ่มต้น
  const initialForm = { 
    id: '', name: '', type: 'CASHIER', vendorId: '', 
    autoPrint: true, taxMachineId: '', isActive: true 
  };
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
      vendorId: device.vendorId || '', 
      autoPrint: device.autoPrintReceipt !== false, // 💡 ดึงค่าเครื่องพิมพ์
      taxMachineId: device.taxMachineId || '',      // 💡 ดึงเลขเครื่องภาษี
      isActive: device.isActive
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
      await api({ method: isEdit ? 'patch' : 'post', url, data: formData, headers: { 'x-tenant-id': '2' } });
      
      showBanner('success', isEdit ? 'อัปเดตเครื่องสำเร็จ' : 'ลงทะเบียนเครื่องใหม่สำเร็จ');
      setIsModalOpen(false);
      fetchData();
    } catch (error) { 
      showBanner('error', error.response?.data?.message || 'บันทึกข้อมูลล้มเหลว'); 
    }
  };

  const columns = [
    { 
      header: t('terminals.colName') || 'เครื่อง / อุปกรณ์', 
      render: (t) => (
        <div>
          <div className="font-bold text-slate-800 text-sm">{t.name}</div>
          <div className="text-xs text-slate-500 font-mono mt-0.5">{t.id}</div>
          {t.type === 'VENDOR' && t.vendorName && <div className="text-[11px] text-indigo-600 font-bold mt-1 flex items-center gap-1"><Store size={12}/> ร้าน: {t.vendorName}</div>}
        </div>
      ) 
    },
    { 
      header: 'ประเภท', 
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
      header: 'การตั้งค่า',
      render: (t) => (
        <div className="flex flex-col gap-1 text-[11px]">
          <span className={`flex items-center gap-1 ${t.autoPrintReceipt !== false ? 'text-emerald-600 font-bold' : 'text-slate-400'}`}>
            <Printer size={12}/> {t.autoPrintReceipt !== false ? 'พิมพ์ใบเสร็จอัตโนมัติ' : 'ไม่พิมพ์ใบเสร็จ'}
          </span>
          {t.taxMachineId && (
            <span className="flex items-center gap-1 text-slate-600 font-mono">
              <FileText size={12}/> {t.taxMachineId}
            </span>
          )}
        </div>
      )
    },
    { 
      header: 'การเชื่อมต่อ (ระบบ)', align: 'center', 
      render: (t) => (
        <span className={`flex items-center justify-center gap-1.5 text-xs font-bold ${t.isOnline ? 'text-emerald-600' : 'text-slate-400'}`}>
          {t.isOnline ? <Wifi size={14}/> : <PowerOff size={14}/>}
          {t.isOnline ? 'ONLINE' : 'OFFLINE'}
        </span>
      ) 
    },
    { 
      header: 'สถานะ (แอดมิน)', align: 'center', 
      render: (t) => <Badge status={t.isActive ? 'ACTIVE' : 'INACTIVE'} />
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
        subtitle="ตรวจสอบการเชื่อมต่อ ตั้งค่าการพิมพ์ และลงทะเบียนอุปกรณ์ POS"
        actions={<Button variant="primary" icon={Plus} onClick={openAddModal}>{t('terminals.create') || 'Register Device'}</Button>}
      />

      <Card className="flex flex-col flex-1 overflow-hidden shadow-sm border border-slate-200 bg-white">
        <div className="flex-1 overflow-auto p-1">
          <Table columns={columns} data={terminals} isLoading={isLoading} emptyMessage={t('terminals.empty')} />
        </div>
      </Card>

      {/* 📝 MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in duration-200">
            <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50">
              <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                <MonitorSmartphone className="text-indigo-500" size={20}/>
                {modalMode === 'add' ? t('terminals.create') : t('common.edit')}
              </h3>
              <button type="button" onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-rose-500"><X size={20} /></button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              
              <div className="grid grid-cols-2 gap-4">
                 <Input label={t('terminals.formId')} value={formData.id} onChange={(e) => setFormData({...formData, id: e.target.value})} required disabled={modalMode === 'edit'} placeholder="Ex. T-01" />
                 <Input label={t('terminals.formName')} value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required placeholder="เช่น จุดแลกเงิน 1" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">{t('terminals.formType')}</label>
                  <select className="w-full border border-slate-200 rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20" value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value})}>
                    <option value="CASHIER">CASHIER (แคชเชียร์)</option>
                    <option value="VENDOR">VENDOR (แท็บเล็ตร้านค้า)</option>
                    <option value="KIOSK">KIOSK (ตู้เติมเงิน)</option>
                  </select>
                </div>
                {/* 💡 Dropdown เลือกร้านค้า โชว์เฉพาะ VENDOR */}
                {formData.type === 'VENDOR' ? (
                  <div className="space-y-1 animate-in slide-in-from-right-2 duration-300">
                    <label className="text-xs font-bold text-indigo-600 uppercase flex items-center gap-1"><Store size={14}/> {t('terminals.formVendor')}</label>
                    <select className="w-full border border-indigo-200 bg-indigo-50/30 rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20" value={formData.vendorId} onChange={(e) => setFormData({...formData, vendorId: e.target.value})} required>
                      <option value="" disabled>-- เลือกร้านค้า --</option>
                      {vendors.map(v => <option key={v.id} value={v.id}>[{v.id}] {v.name}</option>)}
                    </select>
                  </div>
                ) : <div/>} 
              </div>

              {/* 💡 กล่องตั้งค่าการพิมพ์ และ ภาษี */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-4 mt-2">
                 
                 {/* สวิตช์เปิดปิดเครื่องพิมพ์ */}
                 <label className="flex items-start gap-3 cursor-pointer">
                    <div className="relative flex items-center pt-1">
                      <input 
                        type="checkbox" 
                        className="w-5 h-5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500" 
                        checked={formData.autoPrint} 
                        onChange={(e) => setFormData({...formData, autoPrint: e.target.checked})} 
                      />
                    </div>
                    <div>
                      <span className="text-sm font-bold text-slate-800 flex items-center gap-1"><Printer size={16}/> พิมพ์ใบเสร็จอัตโนมัติ</span>
                      <span className="text-[11px] text-slate-500 mt-0.5 block leading-relaxed">
                        ถ้าไม่เลือก เครื่อง POS จุดนี้จะทำรายการโดยไม่สั่งพิมพ์กระดาษ
                      </span>
                    </div>
                  </label>

                  {/* รหัสเครื่องสรรพากร */}
                  <Input 
                    label="รหัสเครื่อง POS สรรพากร (Tax Machine ID)" 
                    value={formData.taxMachineId} 
                    onChange={(e) => setFormData({...formData, taxMachineId: e.target.value})} 
                    placeholder="เว้นว่างไว้ หากไม่ใช่เครื่องออกใบกำกับภาษีเต็มรูป" 
                  />
              </div>

              {modalMode === 'edit' && (
                <div className="space-y-1 pt-2 border-t border-slate-100">
                  <label className="text-xs font-bold text-slate-500 uppercase">สิทธิ์การเข้าใช้งานระบบ (แอดมินตั้งค่า)</label>
                  <select className="w-full border border-slate-200 rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20" value={formData.isActive ? 'ACTIVE' : 'INACTIVE'} onChange={(e) => setFormData({...formData, isActive: e.target.value === 'ACTIVE'})}>
                    <option value="ACTIVE">อนุญาตให้ใช้งาน (ACTIVE)</option>
                    <option value="INACTIVE">ระงับการใช้งาน (INACTIVE)</option>
                  </select>
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <Button type="button" variant="secondary" className="flex-1" onClick={() => setIsModalOpen(false)}>{t('common.cancel')}</Button>
                <Button type="submit" variant="primary" className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white">{t('common.save')}</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}