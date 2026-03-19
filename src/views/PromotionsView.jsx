import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Edit2, X, Tags, AlertCircle, CheckCircle, Megaphone, Calendar, Clock, Users, Store, Package } from 'lucide-react';
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
  const [vendors, setVendors] = useState([]);   // 💡 เก็บรายชื่อร้านค้า
  const [products, setProducts] = useState([]); // 💡 เก็บรายชื่อสินค้า
  
  const [isLoading, setIsLoading] = useState(false);
  const [alertMsg, setAlertMsg] = useState({ type: '', text: '' });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  
  const initialForm = { 
    id: '', name: '', type: 'TOPUP_BONUS', condition: '', minAmount: '', 
    rewardType: 'CASH_BONUS', rewardValue: '', startDate: '', endDate: '', startTime: '', endTime: '', 
    targetMemberType: 'ALL', isActive: true,
    // 💡 ขอบเขตโปรโมชั่น
    scopeType: 'ALL', selectedVendors: [], selectedProducts: []
  };
  const [formData, setFormData] = useState(initialForm);

  const showBanner = useCallback((type, message) => {
    setAlertMsg({ type, text: message });
    setTimeout(() => setAlertMsg({ type: '', text: '' }), type === 'error' ? 5000 : 3000);
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // 💡 โหลดทั้ง โปรโมชั่น, ร้านค้า และ สินค้า มารอไว้เลย
      const [promoRes, vendorRes, productRes] = await Promise.all([
        api.get('/api/v3/promotions', { headers: { 'x-tenant-id': '2' } }),
        api.get('/api/v3/vendors', { headers: { 'x-tenant-id': '2' } }),
        api.get('/api/v3/vendors/products?limit=500', { headers: { 'x-tenant-id': '2' } }) // ปรับ API ตามที่คุณมี
      ]);
      setPromos(promoRes.data);
      setVendors(vendorRes.data);
      setProducts(productRes.data?.data || productRes.data || []);
    } catch (error) { showBanner('error', 'โหลดข้อมูลไม่สำเร็จ'); } 
    finally { setIsLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const openAddModal = () => {
    setModalMode('add');
    setFormData(initialForm);
    setIsModalOpen(true);
  };

  const openEditModal = (p) => {
    setModalMode('edit');
    setFormData({
      id: p.id, name: p.name, type: p.type, condition: p.condition, minAmount: p.minAmount || '', 
      rewardType: p.rewardType, rewardValue: p.rewardValue || '', 
      startDate: p.startDate || '', endDate: p.endDate || '', startTime: p.startTime || '', endTime: p.endTime || '', 
      targetMemberType: p.targetMemberType || 'ALL', isActive: p.status === 'ACTIVE',
      // 💡 ดึง Scope มาแสดง
      scopeType: p.scopeType || 'ALL',
      selectedVendors: p.selectedVendors || [],
      selectedProducts: p.selectedProducts || []
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Validate Scope
    if (formData.scopeType === 'SPECIFIC_VENDOR' && formData.selectedVendors.length === 0) {
      return showBanner('error', 'กรุณาเลือกร้านค้าอย่างน้อย 1 ร้าน');
    }
    if (formData.scopeType === 'SPECIFIC_PRODUCT' && formData.selectedProducts.length === 0) {
      return showBanner('error', 'กรุณาเลือกเมนูอย่างน้อย 1 รายการ');
    }

    try {
      const isEdit = modalMode === 'edit';
      const url = isEdit ? `/api/v3/promotions/${formData.id}` : `/api/v3/promotions`;
      await api({ method: isEdit ? 'patch' : 'post', url, data: formData, headers: { 'x-tenant-id': '2' } });
      
      showBanner('success', isEdit ? 'อัปเดตแคมเปญสำเร็จ' : 'สร้างแคมเปญสำเร็จ');
      setIsModalOpen(false);
      fetchData(); // ดึงข้อมูลใหม่
    } catch (error) { showBanner('error', 'บันทึกข้อมูลล้มเหลว'); }
  };

  const isExpired = (endDate) => endDate && new Date(endDate) < new Date(new Date().setHours(0,0,0,0));
  const blockInvalidChar = (e) => ['e', 'E', '+', '-'].includes(e.key) && e.preventDefault();

  // 💡 ฟังก์ชัน Toggle Checkbox
  const toggleSelection = (type, id) => {
    const key = type === 'VENDOR' ? 'selectedVendors' : 'selectedProducts';
    setFormData(prev => ({
      ...prev,
      [key]: prev[key].includes(id) ? prev[key].filter(itemId => itemId !== id) : [...prev[key], id]
    }));
  };

  const columns = [
    { 
      header: t('promos.colName') || 'ชื่อแคมเปญ', 
      render: (p) => (
        <div className="flex items-center gap-2">
          <Tags size={16} className={isExpired(p.endDate) || p.status !== 'ACTIVE' ? "text-slate-400" : "text-emerald-500"}/>
          <div>
            <div className={`font-bold ${isExpired(p.endDate) || p.status !== 'ACTIVE' ? "text-slate-500" : "text-slate-800"}`}>{p.name}</div>
            <div className="flex flex-wrap gap-1 mt-1">
              <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md uppercase inline-block">{p.type.replace('_', ' ')}</span>
              {p.type === 'MEMBER_DISCOUNT' && p.targetMemberType !== 'ALL' && (
                <span className="text-[10px] font-bold text-blue-600 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md uppercase flex items-center gap-1"><Users size={10}/> {p.targetMemberType}</span>
              )}
              {/* 💡 โชว์ป้ายขอบเขตในตาราง */}
              {p.scopeType === 'SPECIFIC_VENDOR' && <span className="text-[10px] font-bold text-purple-600 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-md flex items-center gap-1"><Store size={10}/> {p.selectedVendors.length} ร้าน</span>}
              {p.scopeType === 'SPECIFIC_PRODUCT' && <span className="text-[10px] font-bold text-orange-600 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-md flex items-center gap-1"><Package size={10}/> {p.selectedProducts.length} เมนู</span>}
            </div>
          </div>
        </div>
      ) 
    },
    { header: t('promos.colCondition') || 'เงื่อนไข', accessor: 'condition', render: (p) => <span className="text-sm text-slate-600">{p.condition}</span> },
    { header: t('promos.colReward') || 'รางวัล', align: 'right', render: (p) => <span className={`text-sm font-bold ${isExpired(p.endDate) || p.status !== 'ACTIVE' ? 'text-slate-500' : 'text-emerald-600'}`}>{p.rewardType === 'POINT' ? `+${p.rewardValue} Pts` : `฿ ${p.rewardValue}`}</span> },
    { header: t('promos.colUsed') || 'ใช้ไป', accessor: 'used', align: 'center', render: (p) => <span className="font-bold text-slate-700">{p.used}</span> },
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

      {/* 📝 MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in duration-200">
            <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50">
              <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                <Megaphone className="text-emerald-500" size={20}/>
                {modalMode === 'add' ? 'สร้างแคมเปญใหม่' : 'แก้ไขแคมเปญ'}
              </h3>
              <button type="button" onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-rose-500"><X size={20} /></button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
              
              {/* === ส่วนที่ 1: ข้อมูลทั่วไป === */}
              <div className="space-y-4">
                <h4 className="font-bold text-slate-800 border-b pb-2">1. ข้อมูลแคมเปญ</h4>
                <Input label="ชื่อแคมเปญ" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required placeholder="เช่น สวัสดิการพนักงานโรงพยาบาล" />
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">ประเภทโปรโมชั่น</label>
                    <select className="w-full border border-slate-200 rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20" value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value})}>
                      <option value="TOPUP_BONUS">เติมเงินรับโบนัส (Top-up Bonus)</option>
                      <option value="VENDOR_DISCOUNT">ส่วนลดร้านค้า (Vendor Discount)</option>
                      <option value="MEMBER_DISCOUNT">ส่วนลดประเภทสมาชิก (Member Discount)</option>
                      <option value="TIME_DISCOUNT">ลดราคาตามช่วงเวลา (Happy Hour)</option>
                    </select>
                  </div>
                  
                  {formData.type === 'MEMBER_DISCOUNT' ? (
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-blue-600 uppercase flex items-center gap-1"><Users size={14}/> กลุ่มเป้าหมาย</label>
                      <select className="w-full border border-blue-200 bg-blue-50/50 rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500/20" value={formData.targetMemberType} onChange={(e) => setFormData({...formData, targetMemberType: e.target.value})}>
                        <option value="ALL">ทุกคน (ALL)</option>
                        <option value="STUDENT">STUDENT (นักเรียน/นักศึกษา)</option>
                        <option value="EMPLOYEE">EMPLOYEE (พนักงาน)</option>
                        <option value="VIP">VIP (ลูกค้าพิเศษ)</option>
                      </select>
                    </div>
                  ) : (
                    <Input label="เงื่อนไข (คำอธิบายสั้นๆ)" value={formData.condition} onChange={(e) => setFormData({...formData, condition: e.target.value})} placeholder="เช่น สั่งครบ 200 บ." />
                  )}
                </div>
              </div>

              {/* === 💡 ส่วนที่ 2: ขอบเขต (Scope) ที่เพิ่มเข้ามาใหม่ === */}
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <h4 className="font-bold text-slate-800 border-b pb-2 flex items-center gap-2">2. ขอบเขตการใช้งาน <span className="text-[10px] bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full">ใหม่</span></h4>
                <div className="flex flex-wrap gap-4">
                  <label className="flex items-center gap-2 cursor-pointer text-sm font-bold text-slate-700">
                    <input type="radio" className="w-4 h-4 text-emerald-600" name="scope" checked={formData.scopeType === 'ALL'} onChange={() => setFormData({...formData, scopeType: 'ALL'})} />
                    ใช้ได้กับทุกร้าน และ ทุกเมนู
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-sm font-bold text-slate-700">
                    <input type="radio" className="w-4 h-4 text-emerald-600" name="scope" checked={formData.scopeType === 'SPECIFIC_VENDOR'} onChange={() => setFormData({...formData, scopeType: 'SPECIFIC_VENDOR'})} />
                    เฉพาะร้านค้าที่กำหนด
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-sm font-bold text-slate-700">
                    <input type="radio" className="w-4 h-4 text-emerald-600" name="scope" checked={formData.scopeType === 'SPECIFIC_PRODUCT'} onChange={() => setFormData({...formData, scopeType: 'SPECIFIC_PRODUCT'})} />
                    เฉพาะเมนูที่กำหนด
                  </label>
                </div>

                {/* กล่องเลือกร้านค้า */}
                {formData.scopeType === 'SPECIFIC_VENDOR' && (
                  <div className="p-3 border border-slate-200 rounded-xl bg-slate-50 max-h-40 overflow-y-auto space-y-2 animate-in slide-in-from-top-2">
                    <div className="text-xs font-bold text-slate-500 mb-2">ติ๊กเลือกร้านค้าที่เข้าร่วมโปรโมชั่นนี้:</div>
                    {vendors.length === 0 ? <div className="text-sm text-slate-400">ไม่มีข้อมูลร้านค้า</div> : vendors.map(v => (
                      <label key={v.id} className="flex items-center gap-3 p-2 bg-white rounded-lg border border-slate-200 cursor-pointer hover:border-emerald-400">
                        <input type="checkbox" className="w-4 h-4 rounded text-emerald-600" checked={formData.selectedVendors.includes(v.id)} onChange={() => toggleSelection('VENDOR', v.id)} />
                        <span className="text-sm font-bold text-slate-700">{v.name} <span className="text-xs font-normal text-slate-400">({v.id})</span></span>
                      </label>
                    ))}
                  </div>
                )}

                {/* กล่องเลือกสินค้า */}
                {formData.scopeType === 'SPECIFIC_PRODUCT' && (
                  <div className="p-3 border border-slate-200 rounded-xl bg-slate-50 max-h-48 overflow-y-auto space-y-2 animate-in slide-in-from-top-2">
                    <div className="text-xs font-bold text-slate-500 mb-2">ติ๊กเลือกเมนูที่เข้าร่วมโปรโมชั่นนี้:</div>
                    {products.length === 0 ? <div className="text-sm text-slate-400">ไม่มีข้อมูลเมนูอาหาร</div> : products.map(p => (
                      <label key={p.id} className="flex items-center gap-3 p-2 bg-white rounded-lg border border-slate-200 cursor-pointer hover:border-emerald-400">
                        <input type="checkbox" className="w-4 h-4 rounded text-emerald-600" checked={formData.selectedProducts.includes(p.id)} onChange={() => toggleSelection('PRODUCT', p.id)} />
                        <span className="text-sm font-bold text-slate-700">{p.name} <span className="text-[10px] px-1 bg-slate-100 rounded text-slate-500 ml-1">{p.vendorName || p.vendorId}</span></span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* === ส่วนที่ 3: รางวัล === */}
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <h4 className="font-bold text-slate-800 border-b pb-2">3. เงื่อนไขและรางวัล</h4>
                <div className="grid grid-cols-2 gap-4">
                  <Input label="ยอดขั้นต่ำที่ต้องถึง (฿)" type="number" required min="0" step="1" value={formData.minAmount} onChange={(e) => setFormData({ ...formData, minAmount: e.target.value === '' ? '' : Number(e.target.value) })} onKeyDown={blockInvalidChar} />
                  <Input label="มูลค่ารางวัล" type="number" required min="0" step="1" value={formData.rewardValue} onChange={(e) => setFormData({ ...formData, rewardValue: e.target.value === '' ? '' : Number(e.target.value) })} onKeyDown={blockInvalidChar} />
                  <div className="col-span-2 flex gap-4">
                    <div className="flex-1 space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase">ประเภทรางวัลที่จะได้รับ</label>
                      <select className="w-full border border-slate-200 rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20" value={formData.rewardType} onChange={(e) => setFormData({...formData, rewardType: e.target.value})}>
                        <option value="DISCOUNT_CASH">ส่วนลดเงินสด (฿)</option>
                        <option value="DISCOUNT_PERCENT">ส่วนลดเปอร์เซ็นต์ (%)</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* วันที่ และ ปุ่มบันทึก (เหมือนเดิม) */}
              <div className="flex gap-2 pt-6 border-t border-slate-100 mt-6">
                <Button type="button" variant="secondary" className="flex-1" onClick={() => setIsModalOpen(false)}>ยกเลิก</Button>
                <Button type="submit" variant="primary" className="flex-1">บันทึกข้อมูล</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}