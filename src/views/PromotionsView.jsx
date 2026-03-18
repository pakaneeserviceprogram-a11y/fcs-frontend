import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Edit2, X, Tags, AlertCircle, CheckCircle, Megaphone, Calendar, Clock } from 'lucide-react';
//import api from 'api';
import { useTranslation } from 'react-i18next';

import Button from '../components/Button';
import Badge from '../components/Badge';
import Input from '../components/Input';
import Card from '../components/Card';
import Table from '../components/Table';
import PageHeader from '../components/PageHeader';
import api from '../utils/api';
export default function PromotionsView() {
  const { t } = useTranslation();

  const [promos, setPromos] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [alertMsg, setAlertMsg] = useState({ type: '', text: '' });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  
  // 💡 1. เพิ่ม startTime และ endTime เข้ามาในค่าเริ่มต้น
  const initialForm = { 
    id: '', name: '', type: 'TOPUP_BONUS', condition: '', 
    rewardType: 'CASH_BONUS', rewardValue: 0, 
    startDate: '', endDate: '', startTime: '', endTime: '', 
    isActive: true 
  };
  const [formData, setFormData] = useState(initialForm);

  const showBanner = useCallback((type, message) => {
    setAlertMsg({ type, text: message });
    setTimeout(() => setAlertMsg({ type: '', text: '' }), type === 'error' ? 5000 : 3000);
  }, []);

  const fetchPromos = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/api/v3/promotions', { headers: { 'x-tenant-id': '2' } });
      setPromos(res.data);
    } catch (error) { showBanner('error', 'ดึงข้อมูลโปรโมชั่นล้มเหลว'); } 
    finally { setIsLoading(false); }
  };

  useEffect(() => { fetchPromos(); }, []);

  const openAddModal = () => {
    setModalMode('add');
    setFormData(initialForm);
    setIsModalOpen(true);
  };

  const openEditModal = (p) => {
    setModalMode('edit');
    setFormData({
      id: p.id, name: p.name, type: p.type, condition: p.condition, 
      rewardType: p.rewardType, rewardValue: p.rewardValue, 
      startDate: p.startDate || '', endDate: p.endDate || '', 
      // 💡 2. ดึงค่าเวลามาแสดงผลตอนแก้ไข
      startTime: p.startTime || '', endTime: p.endTime || '', 
      isActive: p.status === 'ACTIVE'
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const isEdit = modalMode === 'edit';
      const url = isEdit ? `/api/v3/promotions/${formData.id}` : `/api/v3/promotions`;
      await api({ method: isEdit ? 'patch' : 'post', url, data: formData, headers: { 'x-tenant-id': '2' } });
      
      showBanner('success', isEdit ? 'อัปเดตแคมเปญสำเร็จ' : 'สร้างแคมเปญสำเร็จ');
      setIsModalOpen(false);
      fetchPromos();
    } catch (error) { showBanner('error', 'บันทึกข้อมูลล้มเหลว'); }
  };

  const isExpired = (endDate) => {
    if (!endDate) return false;
    return new Date(endDate) < new Date(new Date().setHours(0,0,0,0));
  };

  const columns = [
    { 
      header: t('promos.colName') || 'ชื่อแคมเปญ', 
      render: (p) => (
        <div className="flex items-center gap-2">
          <Tags size={16} className={isExpired(p.endDate) || p.status !== 'ACTIVE' ? "text-slate-400" : "text-emerald-500"}/>
          <div>
            <div className={`font-bold ${isExpired(p.endDate) || p.status !== 'ACTIVE' ? "text-slate-500" : "text-slate-800"}`}>{p.name}</div>
            <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md uppercase mt-1 inline-block">{p.type.replace('_', ' ')}</span>
          </div>
        </div>
      ) 
    },
    { header: t('promos.colCondition') || 'เงื่อนไข', accessor: 'condition', render: (p) => <span className="text-sm text-slate-600">{p.condition}</span> },
    { 
      header: t('promos.colReward') || 'รางวัล', align: 'right', 
      render: (p) => <span className={`text-sm font-bold ${isExpired(p.endDate) || p.status !== 'ACTIVE' ? 'text-slate-500' : 'text-emerald-600'}`}>{p.rewardType === 'POINT' ? `+${p.rewardValue} Pts` : `฿ ${p.rewardValue}`}</span> 
    },
    { 
      header: t('promos.colPeriod') || 'ระยะเวลาโปรโมชั่น', 
      render: (p) => (
        <div className="flex flex-col text-xs text-slate-500">
           <div className="flex items-center gap-1 font-medium"><Calendar size={12}/> {p.startDate ? p.startDate : 'เริ่มใช้งานทันที'}</div>
           <div className="flex items-center gap-1 ml-4 mt-0.5">
             ถึง {p.endDate ? <span className={isExpired(p.endDate) ? 'text-rose-500 font-bold' : 'text-slate-700 font-bold'}>{p.endDate}</span> : <span className="text-slate-400">ไม่มีกำหนด</span>}
           </div>
           {/* 💡 3. แถมให้: โชว์เวลา Happy Hour ในตารางให้เห็นชัดๆ */}
           {p.type === 'TIME_DISCOUNT' && p.startTime && p.endTime && (
             <div className="flex items-center gap-1 ml-4 mt-1 text-indigo-600 font-bold">
               <Clock size={12} /> {p.startTime} - {p.endTime} น.
             </div>
           )}
        </div>
      ) 
    },
    { header: t('promos.colUsed') || 'จำนวนสิทธิ์ที่ใช้', accessor: 'used', align: 'center', render: (p) => <span className="font-bold text-slate-700">{p.used}</span> },
    { header: t('common.status') || 'สถานะ', accessor: 'status', align: 'center', render: (p) => <Badge status={isExpired(p.endDate) ? 'EXPIRED' : p.status} /> },
    { header: t('common.action') || 'จัดการ', align: 'right', render: (p) => <Button variant="ghost" icon={Edit2} onClick={() => openEditModal(p)} /> }
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
        title={t('promos.title') || 'โปรโมชั่นและแคมเปญ'}
        subtitle={t('promos.subtitle') || 'จัดการโปรโมชั่น ส่วนลด และโบนัสเติมเงินเพื่อกระตุ้นยอดขาย'}
        actions={<Button variant="primary" icon={Plus} onClick={openAddModal}>{t('promos.create') || 'สร้างแคมเปญ'}</Button>}
      />

      <Card className="flex flex-col flex-1 overflow-hidden shadow-sm border border-slate-200 bg-white">
        <div className="flex-1 overflow-auto p-1">
          <Table columns={columns} data={promos} isLoading={isLoading} emptyMessage={t('promos.empty') || 'ยังไม่มีโปรโมชั่นในระบบ'} />
        </div>
      </Card>

      {/* 📝 MODAL สร้าง/แก้ไข โปรโมชั่น */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in duration-200">
            <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50">
              <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                <Megaphone className="text-emerald-500" size={20}/>
                {modalMode === 'add' ? (t('promos.create') || 'สร้างแคมเปญใหม่') : (t('common.edit') || 'แก้ไขแคมเปญ')}
              </h3>
              <button type="button" onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-rose-500"><X size={20} /></button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <Input label={t('promos.colName') || 'ชื่อแคมเปญ'} value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required placeholder="เช่น Happy Hour บ่าย 3" />
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">ประเภทโปรโมชั่น</label>
                  <select className="w-full border border-slate-200 rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20" value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value})}>
                    <option value="TOPUP_BONUS">เติมเงินรับโบนัส (Top-up Bonus)</option>
                    <option value="VENDOR_DISCOUNT">ส่วนลดร้านค้า (Vendor Discount)</option>
                    <option value="TIME_DISCOUNT">ลดราคาตามช่วงเวลา (Happy Hour)</option>
                  </select>
                </div>
                <Input label="เงื่อนไข (คำอธิบายสั้นๆ)" value={formData.condition} onChange={(e) => setFormData({...formData, condition: e.target.value})} placeholder="เช่น สั่งครบ 200 บ." />
              </div>

              {/* แสดงช่องเลือกเวลา เฉพาะตอนที่เลือกเป็น Happy Hour เท่านั้น */}
              {formData.type === 'TIME_DISCOUNT' && (
                <div className="grid grid-cols-2 gap-4 p-4 bg-indigo-50/50 rounded-xl border border-indigo-100 animate-in slide-in-from-top-2">
                   <Input label="เวลาเริ่ม (Start Time)" type="time" value={formData.startTime} onChange={(e) => setFormData({...formData, startTime: e.target.value})} required />
                   <Input label="เวลาสิ้นสุด (End Time)" type="time" value={formData.endTime} onChange={(e) => setFormData({...formData, endTime: e.target.value})} required />
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4 p-4 bg-emerald-50/50 rounded-xl border border-emerald-100">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-emerald-700 uppercase">ประเภทรางวัลที่จะได้รับ</label>
                  <select className="w-full border border-slate-200 rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20" value={formData.rewardType} onChange={(e) => setFormData({...formData, rewardType: e.target.value})}>
                    {formData.type === 'TOPUP_BONUS' ? (
                      <>
                        <option value="CASH_BONUS">เงินโบนัส (฿)</option>
                        <option value="POINT">พอยท์สะสม (Pts)</option>
                      </>
                    ) : (
                      <>
                        <option value="DISCOUNT_PERCENT">ส่วนลดเปอร์เซ็นต์ (%)</option>
                        <option value="DISCOUNT_CASH">ส่วนลดเงินสด (฿)</option>
                      </>
                    )}
                  </select>
                </div>
                <Input label="มูลค่ารางวัล" type="number" required min="0" step="1" value={formData.rewardValue} onChange={(e) => setFormData({...formData, rewardValue: Number(e.target.value)})} />
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                 <div className="space-y-1">
                   <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1"><Calendar size={12}/> วันที่เริ่มโปรโมชั่น</label>
                   <input type="date" className="w-full border border-slate-200 rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500/20" value={formData.startDate} onChange={(e) => setFormData({...formData, startDate: e.target.value})} />
                 </div>
                 <div className="space-y-1">
                   <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1"><Calendar size={12}/> วันสิ้นสุด (ปล่อยว่าง=ไม่จำกัด)</label>
                   <input type="date" min={formData.startDate} className="w-full border border-slate-200 rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500/20" value={formData.endDate} onChange={(e) => setFormData({...formData, endDate: e.target.value})} />
                 </div>
              </div>

              {modalMode === 'edit' && (
                <div className="space-y-1 pt-2 border-t border-slate-100">
                  <label className="text-xs font-bold text-slate-500 uppercase">สถานะการใช้งาน</label>
                  <select className="w-full border border-slate-200 rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20" value={formData.isActive ? 'ACTIVE' : 'INACTIVE'} onChange={(e) => setFormData({...formData, isActive: e.target.value === 'ACTIVE'})}>
                    <option value="ACTIVE">ACTIVE (เปิดใช้งาน)</option>
                    <option value="INACTIVE">INACTIVE (ระงับชั่วคราว)</option>
                  </select>
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <Button type="button" variant="secondary" className="flex-1" onClick={() => setIsModalOpen(false)}>{t('common.cancel') || 'ยกเลิก'}</Button>
                <Button type="submit" variant="primary" className="flex-1">{t('common.save') || 'บันทึก'}</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}