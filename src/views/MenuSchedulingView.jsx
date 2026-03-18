import React, { useState, useEffect, useCallback } from 'react';
import { Calendar as CalendarIcon, Coffee, Sun, Moon, Clock, Copy, Search, Plus, X, Save, AlertCircle, CheckCircle, RefreshCw, Store } from 'lucide-react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';

import Button from '../components/Button';
import Card from '../components/Card';
import api from '../utils/api';
export default function MenuSchedulingView() {
  const { t } = useTranslation();
  const todayStr = new Date().toISOString().split('T')[0];
  
  const [selectedDate, setSelectedDate] = useState(todayStr);
  
  // 💡 เลือกร้านค้า
  const [vendors, setVendors] = useState([]);
  const [selectedVendor, setSelectedVendor] = useState('');

  // 💡 เพิ่มแท็บ ALL_DAY
  const [activeShift, setActiveShift] = useState('ALL_DAY'); // ALL_DAY, BREAKFAST, LUNCH, DINNER
  
  const [allProducts, setAllProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [scheduledMenus, setScheduledMenus] = useState({ ALL_DAY: [], BREAKFAST: [], LUNCH: [], DINNER: [] });

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [alertMsg, setAlertMsg] = useState({ type: '', text: '' });
  
  // 💡 State สำหรับ Copy หลายวัน
  const [copyModalOpen, setCopyModalOpen] = useState(false);
  const [tempDateInput, setTempDateInput] = useState('');
  const [targetDates, setTargetDates] = useState([]);

  const getHeaders = () => ({ 'x-tenant-id': '2' });

  const showBanner = useCallback((type, message) => {
    setAlertMsg({ type, text: message });
    setTimeout(() => setAlertMsg({ type: '', text: '' }), 3000);
  }, []);

  // โหลดร้านค้าทั้งหมดตอนเริ่ม
  useEffect(() => {
    const fetchVendors = async () => {
      try {
        const res = await api.get('/api/v3/menu-schedules/vendors', { headers: getHeaders() });
        setVendors(res.data);
        if (res.data.length > 0) setSelectedVendor(res.data[0].VendorID);
      } catch (e) { showBanner('error', 'โหลดรายชื่อร้านค้าไม่สำเร็จ'); }
    };
    fetchVendors();
  }, [showBanner]);

  // โหลดเมนูและตาราง เมื่อร้านค้าหรือวันที่เปลี่ยน
  useEffect(() => {
    if (!selectedVendor) return;
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [prodRes, schedRes] = await Promise.all([
          api.get(`/api/v3/menu-schedules/products?vendorId=${selectedVendor}`, { headers: getHeaders() }),
          api.get(`/api/v3/menu-schedules?date=${selectedDate}&vendorId=${selectedVendor}`, { headers: getHeaders() })
        ]);
        setAllProducts(prodRes.data);
        setScheduledMenus(schedRes.data);
      } catch (e) { showBanner('error', 'โหลดข้อมูลไม่สำเร็จ'); }
      finally { setIsLoading(false); }
    };
    fetchData();
  }, [selectedDate, selectedVendor, showBanner]);

  const filteredProducts = allProducts.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.category.toLowerCase().includes(searchQuery.toLowerCase()));

  const addProductToShift = (product) => {
    if (scheduledMenus[activeShift].find(p => p.id === product.id)) return;
    setScheduledMenus(prev => ({ ...prev, [activeShift]: [...prev[activeShift], product] }));
  };

  const removeProductFromShift = (productId) => {
    setScheduledMenus(prev => ({ ...prev, [activeShift]: prev[activeShift].filter(p => p.id !== productId) }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const periods = ['ALL_DAY', 'BREAKFAST', 'LUNCH', 'DINNER'];
      await Promise.all(periods.map(period => 
        api.post('/api/v3/menu-schedules/bulk', {
          date: selectedDate, period: period, productIds: scheduledMenus[period].map(p => p.id), vendorId: selectedVendor
        }, { headers: getHeaders() })
      ));
      showBanner('success', `บันทึกตารางเมนูวันที่ ${selectedDate} สำเร็จ!`);
    } catch (e) { showBanner('error', 'บันทึกข้อมูลไม่สำเร็จ'); }
    finally { setIsSaving(false); }
  };

  // จัดการการเพิ่ม/ลบ วันที่ใน Modal Copy
  const addTargetDate = () => {
    if (!tempDateInput) return;
    if (!targetDates.includes(tempDateInput)) setTargetDates([...targetDates, tempDateInput]);
    setTempDateInput('');
  };
  const removeTargetDate = (dateToRemove) => setTargetDates(targetDates.filter(d => d !== dateToRemove));

  const handleCopySchedule = async () => {
    if (targetDates.length === 0) return showBanner('error', 'กรุณาระบุวันที่เป้าหมายอย่างน้อย 1 วัน');
    try {
      await api.post('/api/v3/menu-schedules/copy', {
        fromDate: selectedDate, targetDates: targetDates, vendorId: selectedVendor
      }, { headers: getHeaders() });
      setCopyModalOpen(false);
      showBanner('success', `คัดลอกตารางไปยัง ${targetDates.length} วันที่เลือกสำเร็จ!`);
    } catch (e) { showBanner('error', 'คัดลอกข้อมูลไม่สำเร็จ'); }
  };

  return (
    <div className="max-w-7xl mx-auto flex flex-col h-[calc(100vh-100px)] p-4 space-y-4">
      {alertMsg.text && (
        <div className={`border-l-4 p-4 rounded-r-xl flex items-center gap-3 animate-in fade-in shrink-0 shadow-sm ${alertMsg.type === 'error' ? 'bg-rose-50 border-rose-500' : 'bg-emerald-50 border-emerald-500'}`}>
          {alertMsg.type === 'error' ? <AlertCircle className="text-rose-500" size={20} /> : <CheckCircle className="text-emerald-500" size={20} />}
          <p className={`text-sm font-bold ${alertMsg.type === 'error' ? 'text-rose-700' : 'text-emerald-700'}`}>{alertMsg.text}</p>
          <button onClick={() => setAlertMsg({ type: '', text: '' })} className="ml-auto opacity-50"><X size={16} /></button>
        </div>
      )}

      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-5 rounded-2xl shadow-sm border border-slate-200 gap-4 shrink-0">
        <div>
          <h2 className="text-xl font-black text-slate-800 flex items-center gap-2"><CalendarIcon className="text-indigo-500"/> จัดตารางเมนูอาหาร</h2>
          <p className="text-sm text-slate-500 mt-1">กำหนดเมนูหมุนเวียนล่วงหน้า (เมนูยืนพื้น จะไม่แสดงในหน้านี้)</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
            <span className="text-sm font-bold text-slate-500 mr-2">วันที่จัดตาราง:</span>
            <input type="date" className="bg-transparent outline-none text-sm font-bold text-slate-800" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} />
          </div>
          <button onClick={() => { setTargetDates([]); setTempDateInput(''); setCopyModalOpen(true); }} className="flex items-center gap-2 px-4 py-2.5 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-xl font-bold hover:bg-indigo-100 text-sm transition-colors">
            <Copy size={16} /> คัดลอกตาราง
          </button>
          <Button variant="primary" icon={isSaving ? RefreshCw : Save} className={isSaving ? 'animate-pulse bg-indigo-600' : 'bg-indigo-600 hover:bg-indigo-700'} onClick={handleSave} disabled={isSaving || !selectedVendor}>
            {isSaving ? 'กำลังบันทึก...' : 'บันทึกตารางอาหาร'}
          </Button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row flex-1 gap-4 overflow-hidden">
        
        {/* 🏢 ฝั่งซ้าย: เลือกร้านค้า + คลังเมนู */}
        <Card className="w-full md:w-1/3 flex flex-col shadow-sm border border-slate-200 bg-white">
          <div className="p-4 border-b border-slate-200 bg-slate-50 shrink-0 space-y-4">
            
            {/* 💡 Dropdown เลือกร้านค้า */}
            <div className="space-y-1">
               <label className="text-xs font-bold text-slate-500 flex items-center gap-1 uppercase"><Store size={14}/> เลือกร้านค้าที่ต้องการจัดตาราง</label>
               <select className="w-full border border-slate-300 rounded-lg p-2.5 text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/20 bg-white" value={selectedVendor} onChange={(e) => setSelectedVendor(e.target.value)}>
                 {vendors.map(v => <option key={v.VendorID} value={v.VendorID}>{v.VendorName}</option>)}
               </select>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
              <input type="text" className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 rounded-lg text-sm outline-none" placeholder="ค้นหาเมนู..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-slate-50/50">
            {filteredProducts.map(p => (
              <div key={p.id} onClick={() => addProductToShift(p)} className="flex justify-between items-center p-3 bg-white border border-slate-200 rounded-xl hover:border-indigo-400 hover:shadow-md cursor-pointer group transition-all">
                <div className="overflow-hidden pr-2">
                  <div className="font-bold text-slate-800 text-sm truncate">{p.name}</div>
                  <div className="text-[11px] font-medium text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded w-max mt-1">{p.category}</div>
                </div>
                <button className="w-8 h-8 flex items-center justify-center shrink-0 bg-slate-50 text-slate-400 rounded-full group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors">
                  <Plus size={18} />
                </button>
              </div>
            ))}
            {filteredProducts.length === 0 && <div className="text-center text-slate-400 py-10 text-sm">ไม่พบเมนูหมุนเวียนของร้านนี้</div>}
          </div>
        </Card>

        {/* 🍽 ฝั่งขวา: ตารางอาหาร */}
        <Card className="w-full md:w-2/3 flex flex-col shadow-sm border border-slate-200 bg-white">
          <div className="flex p-2 bg-slate-100 border-b border-slate-200 shrink-0 gap-2 overflow-x-auto">
            {/* 💡 เพิ่มแท็บ ALL_DAY */}
            <button onClick={() => setActiveShift('ALL_DAY')} className={`flex-1 min-w-[100px] flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 py-2 sm:py-3 rounded-xl font-bold text-sm transition-all ${activeShift === 'ALL_DAY' ? 'bg-white text-emerald-600 shadow-sm ring-1 ring-slate-200' : 'text-slate-500 hover:bg-slate-200/50'}`}>
              <Clock size={18}/> ขายทั้งวัน <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full text-[10px]">{scheduledMenus.ALL_DAY.length}</span>
            </button>
            <button onClick={() => setActiveShift('BREAKFAST')} className={`flex-1 min-w-[100px] flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 py-2 sm:py-3 rounded-xl font-bold text-sm transition-all ${activeShift === 'BREAKFAST' ? 'bg-white text-amber-600 shadow-sm ring-1 ring-slate-200' : 'text-slate-500 hover:bg-slate-200/50'}`}>
              <Coffee size={18}/> มื้อเช้า <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full text-[10px]">{scheduledMenus.BREAKFAST.length}</span>
            </button>
            <button onClick={() => setActiveShift('LUNCH')} className={`flex-1 min-w-[100px] flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 py-2 sm:py-3 rounded-xl font-bold text-sm transition-all ${activeShift === 'LUNCH' ? 'bg-white text-rose-500 shadow-sm ring-1 ring-slate-200' : 'text-slate-500 hover:bg-slate-200/50'}`}>
              <Sun size={18}/> มื้อเที่ยง <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full text-[10px]">{scheduledMenus.LUNCH.length}</span>
            </button>
            <button onClick={() => setActiveShift('DINNER')} className={`flex-1 min-w-[100px] flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 py-2 sm:py-3 rounded-xl font-bold text-sm transition-all ${activeShift === 'DINNER' ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-slate-200' : 'text-slate-500 hover:bg-slate-200/50'}`}>
              <Moon size={18}/> มื้อเย็น <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full text-[10px]">{scheduledMenus.DINNER.length}</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-5 bg-slate-50/30">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-400"><RefreshCw className="animate-spin mb-2" size={24}/> กำลังโหลดตาราง...</div>
            ) : scheduledMenus[activeShift].length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                <div className={`p-4 rounded-full mb-3 ${activeShift === 'ALL_DAY' ? 'bg-emerald-100 text-emerald-500' : activeShift === 'BREAKFAST' ? 'bg-amber-100 text-amber-500' : activeShift === 'LUNCH' ? 'bg-rose-100 text-rose-500' : 'bg-indigo-100 text-indigo-500'}`}>
                  {activeShift === 'ALL_DAY' ? <Clock size={32}/> : activeShift === 'BREAKFAST' ? <Coffee size={32}/> : activeShift === 'LUNCH' ? <Sun size={32}/> : <Moon size={32}/>}
                </div>
                <p className="text-base font-bold text-slate-600">ยังไม่มีเมนูหมุนเวียนในมื้อนี้</p>
                <p className="text-sm mt-1">คลิกที่รายการอาหารด้านซ้ายมือ เพื่อเพิ่มเข้าสู่ตาราง</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3 content-start">
                {scheduledMenus[activeShift].map((item, index) => (
                  <div key={`${item.id}-${index}`} className="flex justify-between items-center p-3 bg-white border border-slate-200 rounded-xl shadow-sm border-l-4 animate-in zoom-in duration-200" 
                    style={{ borderLeftColor: activeShift === 'ALL_DAY' ? '#10b981' : activeShift === 'BREAKFAST' ? '#f59e0b' : activeShift === 'LUNCH' ? '#f43f5e' : '#6366f1' }}>
                    <div className="overflow-hidden pr-2">
                      <div className="font-bold text-slate-700 text-sm truncate">{item.name}</div>
                      <div className="text-[10px] text-slate-400 truncate">{item.category}</div>
                    </div>
                    <button onClick={() => removeProductFromShift(item.id)} className="p-1.5 text-slate-300 hover:bg-rose-50 hover:text-rose-500 rounded-lg transition-colors shrink-0">
                      <X size={16}/>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* 📅 MODAL: คัดลอกตาราง แบบหลายวัน (Multi-Date) */}
      {copyModalOpen && (
        <div className="fixed inset-0 z-[60] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in">
            <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <h3 className="font-bold text-lg text-indigo-800 flex items-center gap-2"><Copy size={20}/> คัดลอกตารางอาหาร</h3>
              <button onClick={() => setCopyModalOpen(false)} className="text-slate-400 hover:text-rose-500"><X size={20}/></button>
            </div>
            <div className="p-6 space-y-5">
              <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl text-sm text-indigo-700">
                ตารางเมนูของ <b>วันที่ {selectedDate}</b> จะถูกนำไปใส่ในวันที่เป้าหมายทั้งหมด (เฉพาะร้านค้าที่เลือก)
              </div>
              
              {/* เลือกวันที่เพิ่มทีละวัน */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">เพิ่มวันที่ต้องการนำตารางนี้ไปใช้ (เลือกได้หลายวัน)</label>
                <div className="flex gap-2">
                  <input type="date" className="flex-1 border border-slate-200 rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20" value={tempDateInput} onChange={e => setTempDateInput(e.target.value)} min={todayStr} />
                  <Button variant="secondary" onClick={addTargetDate}>เพิ่ม</Button>
                </div>
              </div>

              {/* แสดงกล่องวันที่ที่ถูกเลือก */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl min-h-[100px] flex flex-wrap gap-2 content-start">
                {targetDates.length === 0 ? (
                   <span className="text-sm text-slate-400 m-auto">ยังไม่ได้เลือกวันที่เป้าหมาย</span>
                ) : (
                  targetDates.map(d => (
                    <div key={d} className="flex items-center gap-2 bg-white border border-indigo-200 text-indigo-700 px-3 py-1.5 rounded-lg text-sm font-bold shadow-sm">
                      <CalendarIcon size={14}/> {d}
                      <button onClick={() => removeTargetDate(d)} className="text-indigo-300 hover:text-rose-500"><X size={14}/></button>
                    </div>
                  ))
                )}
              </div>

              <div className="flex gap-2 pt-2 border-t border-slate-100">
                <Button variant="secondary" className="flex-1" onClick={() => setCopyModalOpen(false)}>ยกเลิก</Button>
                <Button variant="primary" className="flex-1 bg-indigo-600 hover:bg-indigo-700" onClick={handleCopySchedule} disabled={targetDates.length === 0}>ยืนยันการคัดลอก</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}