import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Gift, Wallet, Calendar, Users, Clock, RefreshCw, X, AlertCircle, CheckCircle, Info, Edit2 } from 'lucide-react';
//import api from 'api';
import { useTranslation } from 'react-i18next';

import Button from '../components/Button';
import Input from '../components/Input';
import PageHeader from '../components/PageHeader';
import api from '../utils/api';
export default function WelfareView() {
  const { t } = useTranslation();

  const [rules, setRules] = useState([]);
  const [cardGroups, setCardGroups] = useState([]); 
  const [isLoading, setIsLoading] = useState(false);
  const [alertMsg, setAlertMsg] = useState({ type: '', text: '' });
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, title: '', message: '', confirmText: '', type: 'primary', onConfirm: null });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add'); 
  
  // 💡 เพิ่ม state สำหรับรองรับ วัน, เดือน, และวันหยุด
  const initialForm = { 
    id: '', name: '', amount: 0, target: '', 
    scheduleType: 'MANUAL', scheduleTime: '', 
    actionDays: '1,2,3,4,5', // ค่าเริ่มต้น จ-ศ
    actionDate: 99, // ค่าเริ่มต้น สิ้นเดือน
    skipHolidays: true,
    isActive: true 
  };
  const [formData, setFormData] = useState(initialForm);

  const getHeaders = () => ({ 'x-tenant-id': '2' });

  const showBanner = useCallback((type, message) => {
    setAlertMsg({ type, text: message });
    setTimeout(() => setAlertMsg({ type: '', text: '' }), type === 'error' ? 5000 : 3000);
  }, []);

  const showError = useCallback((error, customMsg) => {
    let message = customMsg || "เกิดข้อผิดพลาดในการดำเนินการ";
    if (error?.response) {
      if (error.response.status === 401) message = "ไม่ได้รับอนุญาต (Unauthorized)";
      else message = error.response.data?.message || `Error: ${error.response.status}`;
    } else if (typeof error === 'string') message = error;
    showBanner('error', message);
  }, [showBanner]);

  // ==========================================
  // 🟢 Fetch Data
  // ==========================================
  const fetchCardGroups = async () => {
    try {
      const res = await api.get('/api/v3/members/groups', { headers: getHeaders() });
      setCardGroups(res.data);
    } catch (error) {}
  };

  const fetchRules = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/api/v3/welfare', { headers: getHeaders() });
      setRules(res.data);
    } catch (error) { showError(error, "ไม่สามารถดึงข้อมูลได้"); } 
    finally { setIsLoading(false); }
  };

  useEffect(() => { 
    fetchRules(); 
    fetchCardGroups(); 
  }, []);

  // ==========================================
  // 🟢 Handlers
  // ==========================================
  const openAddModal = () => {
    setModalMode('add');
    setFormData(initialForm);
    setIsModalOpen(true);
  };

  const openEditModal = (rule) => {
    setModalMode('edit');
    // 💡 ดึงค่าจาก API กลับมาแสดงในฟอร์มให้ถูกต้อง
    setFormData({
      id: rule.id,
      name: rule.name,
      amount: rule.amount,
      target: rule.target,
      scheduleType: rule.scheduleType,
      scheduleTime: rule.scheduleTime || '',
      actionDays: rule.actionDays || '1,2,3,4,5',
      actionDate: rule.actionDate || 99,
      skipHolidays: rule.skipHolidays !== null ? rule.skipHolidays : true,
      isActive: rule.status === 'ACTIVE'
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.target) return showBanner('error', 'กรุณาเลือกกลุ่มเป้าหมาย');

    try {
      if (modalMode === 'add') {
        await api.post('/api/v3/welfare', formData, { headers: getHeaders() });
        showBanner('success', 'สร้างกฎสวัสดิการใหม่สำเร็จ!');
      } else {
        await api.patch(`/api/v3/welfare/${formData.id}`, formData, { headers: getHeaders() });
        showBanner('success', 'อัปเดตกฎสวัสดิการสำเร็จ!');
      }
      setIsModalOpen(false);
      fetchRules();
    } catch (error) { showError(error, "ไม่สามารถบันทึกข้อมูลได้"); }
  };

  const executeRule = async (ruleId) => {
    try {
      const res = await api.post(`/api/v3/welfare/${ruleId}/execute`, {}, { headers: getHeaders() });
      showBanner('success', res.data?.message || 'สั่งจ่ายสำเร็จ!');
      fetchRules();
    } catch (error) { showError(error, "สั่งจ่ายไม่สำเร็จ"); }
    setConfirmDialog({ isOpen: false });
  };

  const promptExecute = (ruleId, ruleName) => {
    setConfirmDialog({
      isOpen: true, title: 'ยืนยันการสั่งจ่ายทันที',
      message: `สั่งจ่ายสวัสดิการตามกฎ "${ruleName}" ทันที ยืนยันหรือไม่?`,
      confirmText: 'สั่งจ่ายเงิน', type: 'primary',
      onConfirm: () => executeRule(ruleId)
    });
  };

  // 💡 ตัวช่วยจัดการเลือกวันของระบบ (จันทร์-อาทิตย์)
  const toggleDay = (dayVal) => {
    let currentDays = formData.actionDays ? formData.actionDays.split(',') : [];
    if (currentDays.includes(dayVal)) {
      currentDays = currentDays.filter(d => d !== dayVal);
    } else {
      currentDays.push(dayVal);
    }
    setFormData({...formData, actionDays: currentDays.join(',')});
  };

  return (
    <div className="max-w-7xl mx-auto flex flex-col h-[calc(100vh-100px)] p-4 space-y-4">
      
      {alertMsg.text && (
        <div className={`border-l-4 p-4 rounded-r-xl flex items-center gap-3 animate-in fade-in duration-300 shadow-sm shrink-0 ${alertMsg.type === 'error' ? 'bg-rose-50 border-rose-500' : 'bg-emerald-50 border-emerald-500'}`}>
          {alertMsg.type === 'error' ? <AlertCircle className="text-rose-500" size={20} /> : <CheckCircle className="text-emerald-500" size={20} />}
          <p className={`text-sm font-bold ${alertMsg.type === 'error' ? 'text-rose-700' : 'text-emerald-700'}`}>{alertMsg.text}</p>
          <button onClick={() => setAlertMsg({ type: '', text: '' })} className="ml-auto opacity-50"><X size={16} /></button>
        </div>
      )}

      <PageHeader 
        title="จัดการสวัสดิการอัตโนมัติ"
        subtitle="ตั้งค่ากฎการจ่ายเงินสวัสดิการ (Welfare Auto-Topup)"
        actions={<Button variant="primary" icon={Plus} onClick={openAddModal}>สร้างกฎใหม่</Button>}
      />

      <div className="flex-1 overflow-y-auto pr-2 space-y-4 pb-10">
        {isLoading ? (
          <div className="text-center py-10"><RefreshCw className="animate-spin text-emerald-500 mx-auto mb-2"/> <p className="text-slate-500">Loading...</p></div>
        ) : rules.length === 0 ? (
          <div className="text-center py-10 bg-white rounded-2xl border border-slate-200 border-dashed text-slate-400">ยังไม่มีกฎสวัสดิการ</div>
        ) : (
          rules.map((rule) => {
            const groupTarget = cardGroups.find(g => g.id.toString() === rule.target);
            const displayTarget = groupTarget ? groupTarget.name : (rule.target === 'ALL' ? 'ทุกคนในระบบ (All)' : rule.target);

            return (
              <div key={rule.id} className={`bg-white border rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${rule.status === 'ACTIVE' ? 'border-slate-200' : 'border-slate-200 opacity-60'}`}>
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-lg ${rule.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}><Gift size={24} /></div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                      {rule.name}
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${rule.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{rule.status}</span>
                    </h3>
                    <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-slate-600">
                      <span className="flex items-center gap-1 font-bold text-emerald-600"><Wallet size={14}/> ฿ {rule.amount.toFixed(2)}</span>
                      <span className="flex items-center gap-1 font-medium"><Calendar size={14} className="text-slate-400"/> {rule.schedule}</span>
                      <span className="flex items-center gap-1 font-medium"><Users size={14} className="text-slate-400"/> กลุ่มเป้าหมาย: <span className="text-amber-700 font-bold px-1.5 py-0.5 bg-amber-50 rounded border border-amber-100">{displayTarget}</span></span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-3 w-full md:w-auto border-t md:border-t-0 border-slate-100 pt-4 md:pt-0">
                  <div className="text-xs font-medium text-slate-400 flex items-center gap-1"><Clock size={12}/> ทำงานล่าสุด: {rule.lastRun}</div>
                  <div className="flex gap-2 w-full md:w-auto">
                    <button className="flex-1 md:flex-none px-3 py-1.5 border border-slate-200 text-slate-600 rounded-lg text-sm font-bold hover:bg-slate-50 transition-colors flex items-center justify-center gap-1" onClick={() => openEditModal(rule)}>
                      <Edit2 size={14} /> แก้ไข
                    </button>
                    {rule.status === 'ACTIVE' && (
                      <button onClick={() => promptExecute(rule.id, rule.name)} className="flex-1 md:flex-none px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-sm font-bold hover:bg-blue-100 transition-colors flex items-center justify-center gap-1">
                        <RefreshCw size={14} /> สั่งจ่ายทันที
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 📝 MODAL: CREATE/EDIT FORM */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg my-auto animate-in zoom-in duration-200">
            <div className="p-6 border-b bg-slate-50 flex justify-between items-center rounded-t-2xl sticky top-0 z-10">
              <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2"><Gift className="text-emerald-500"/> {modalMode === 'add' ? 'สร้างกฎสวัสดิการใหม่' : 'แก้ไขกฎสวัสดิการ'}</h3>
              <button type="button" onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <Input label="ชื่อกฎสวัสดิการ" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required autoFocus placeholder="เช่น ค่าอาหารพนักงาน จ.-ศ." />
              
              <div className="grid grid-cols-2 gap-4">
                <Input label="จำนวนเงิน (฿)" type="number" min="0" step="1" value={formData.amount} onChange={(e) => setFormData({...formData, amount: Number(e.target.value)})} required />
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">กลุ่มเป้าหมาย</label>
                  <select required value={formData.target} onChange={(e) => setFormData({...formData, target: e.target.value})} className="w-full border border-slate-200 rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 bg-slate-50 text-slate-800">
                    <option value="" disabled>-- เลือกกลุ่ม --</option>
                    <option value="ALL">ทุกคนในระบบ (All)</option>
                    {cardGroups.map(group => <option key={group.id} value={group.id.toString()}>🎁 {group.name}</option>)}
                  </select>
                </div>
              </div>

              {/* 🟢 การตั้งค่าเวลา (Schedule) */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-indigo-700 uppercase">รอบการทำงาน</label>
                    <select required value={formData.scheduleType} onChange={(e) => setFormData({...formData, scheduleType: e.target.value})} className="w-full border border-slate-200 rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20">
                      <option value="MANUAL">MANUAL (แอดมินกดจ่ายเอง)</option>
                      <option value="DAILY">DAILY (รายวัน)</option>
                      <option value="WEEKLY">WEEKLY (รายสัปดาห์)</option>
                      <option value="MONTHLY">MONTHLY (รายเดือน)</option>
                    </select>
                  </div>
                  
                  {formData.scheduleType !== 'MANUAL' && (
                    <Input label="เวลาที่ระบบทำงานอัตโนมัติ" type="time" value={formData.scheduleTime} onChange={(e) => setFormData({...formData, scheduleTime: e.target.value})} required />
                  )}
                </div>

                {/* 💡 เงื่อนไขย่อย: แสดงตามประเภทที่เลือก และเช็คค่าจาก state จริงๆ */}
                {formData.scheduleType === 'DAILY' && (
                  <div className="space-y-2 animate-in slide-in-from-top-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">เลือกวันทำงาน (ถ้าไม่ติ๊ก เสาร์-อาทิตย์ ระบบจะไม่จ่าย)</label>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { l: 'จ.', v: '1' }, { l: 'อ.', v: '2' }, { l: 'พ.', v: '3' }, 
                        { l: 'พฤ.', v: '4' }, { l: 'ศ.', v: '5' }, { l: 'ส.', v: '6' }, { l: 'อา.', v: '0' }
                      ].map((day) => {
                        const isChecked = formData.actionDays?.split(',').includes(day.v);
                        return (
                          <label key={day.v} className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-lg cursor-pointer transition-colors ${isChecked ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-slate-200 hover:bg-slate-100'}`}>
                            <input type="checkbox" className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500" checked={isChecked} onChange={() => toggleDay(day.v)} />
                            <span className={`text-sm font-bold ${isChecked ? 'text-emerald-800' : 'text-slate-600'}`}>{day.l}</span>
                          </label>
                        )
                      })}
                    </div>
                  </div>
                )}

                {formData.scheduleType === 'WEEKLY' && (
                  <div className="space-y-1 animate-in slide-in-from-top-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">จ่ายทุกๆ วัน</label>
                    <select className="w-full border border-slate-200 rounded-lg p-2.5 text-sm outline-none" value={formData.actionDays} onChange={e => setFormData({...formData, actionDays: e.target.value})}>
                      <option value="1">วันจันทร์</option>
                      <option value="2">วันอังคาร</option>
                      <option value="3">วันพุธ</option>
                      <option value="4">วันพฤหัสบดี</option>
                      <option value="5">วันศุกร์</option>
                      <option value="6">วันเสาร์</option>
                      <option value="0">วันอาทิตย์</option>
                    </select>
                  </div>
                )}

                {formData.scheduleType === 'MONTHLY' && (
                  <div className="space-y-1 animate-in slide-in-from-top-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">จ่ายทุกๆ วันที่ของเดือน</label>
                    <select className="w-full border border-slate-200 rounded-lg p-2.5 text-sm outline-none" value={formData.actionDate} onChange={e => setFormData({...formData, actionDate: Number(e.target.value)})}>
                      <option value="1">วันที่ 1</option>
                      <option value="15">วันที่ 15</option>
                      <option value="25">วันที่ 25</option>
                      <option value="99">วันสุดท้ายของเดือน (End of Month)</option>
                    </select>
                  </div>
                )}

                {/* 💡 Toggle ข้ามวันหยุด */}
                {formData.scheduleType !== 'MANUAL' && (
                  <label className="flex items-center gap-3 pt-2 cursor-pointer mt-2">
                    <div className="relative">
                      <input type="checkbox" className="sr-only peer" checked={formData.skipHolidays} onChange={e => setFormData({...formData, skipHolidays: e.target.checked})} />
                      <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                    </div>
                    <span className="text-sm font-bold text-slate-700">ไม่จ่ายในวันหยุดนักขัตฤกษ์ (Skip Holidays)</span>
                  </label>
                )}
              </div>

              {/* 💡 สถานะเปิด/ปิดใช้งาน */}
              {modalMode === 'edit' && (
                <div className="space-y-1 pt-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">สถานะกฎสวัสดิการ</label>
                  <select className="w-full border border-slate-200 rounded-lg p-2.5 text-sm outline-none" value={formData.isActive ? 'true' : 'false'} onChange={(e) => setFormData({...formData, isActive: e.target.value === 'true'})}>
                    <option value="true">ACTIVE (ใช้งาน)</option>
                    <option value="false">INACTIVE (ระงับชั่วคราว)</option>
                  </select>
                </div>
              )}

              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <Button type="button" variant="secondary" className="flex-1" onClick={() => setIsModalOpen(false)}>ยกเลิก</Button>
                <Button variant="primary" className="flex-1" type="submit">บันทึกข้อมูล</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ⚠️ Custom Confirm Modal */}
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in duration-200 text-center p-6">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${confirmDialog.type === 'danger' ? 'bg-rose-100 text-rose-500' : 'bg-emerald-100 text-emerald-500'}`}>
              <AlertCircle size={32} />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">{confirmDialog.title}</h3>
            <p className="text-sm text-slate-500 mb-6">{confirmDialog.message}</p>
            <div className="flex gap-3">
              <Button type="button" variant="secondary" className="flex-1" onClick={() => setConfirmDialog({ isOpen: false })}>ยกเลิก</Button>
              <Button type="button" variant="primary" className={`flex-1 ${confirmDialog.type === 'danger' ? 'bg-rose-500 hover:bg-rose-600 focus:ring-rose-500/20' : 'bg-blue-600 hover:bg-blue-700'}`} onClick={confirmDialog.onConfirm}>
                {confirmDialog.confirmText}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}