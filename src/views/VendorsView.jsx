import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Plus, Edit2, X, Store, ShoppingBag, Search, AlertCircle, CheckCircle, Info, Image as ImageIcon, UploadCloud } from 'lucide-react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';

import Button from '../components/Button';
import Badge from '../components/Badge';
import PageHeader from '../components/PageHeader';
import Card from '../components/Card';
import Input from '../components/Input';
import Table from '../components/Table';
import Pagination from '../components/Pagination';

export default function VendorsView() {
  const { t } = useTranslation();

  const [subTab, setSubTab] = useState('vendors'); 
  const [alertMsg, setAlertMsg] = useState({ type: '', text: '' }); 

  // --- Data States ---
  const [vendors, setVendors] = useState([]);
  const [products, setProducts] = useState([]);
  const [productPage, setProductPage] = useState(1);
  const [productMeta, setProductMeta] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // --- Filter & Sort States ---
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterVendor, setFilterVendor] = useState('ALL'); 
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  // --- Modal States ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [vendorForm, setVendorForm] = useState({ vendorId: '', name: '', gp: 0, isActive: true });
  
  // 💡 เพิ่ม isAlwaysAvailable ในฟอร์มสินค้า
  const [productForm, setProductForm] = useState({ 
    code: '', name: '', category: 'อาหารจานเดียว', price: 0, vendorId: '', 
    isAlwaysAvailable: false, // <-- เพิ่มตรงนี้
    isActive: true, imageFile: null, imagePreview: '' 
  });

  // ==========================================
  // 🟢 1. Alert System
  // ==========================================
  const showBanner = useCallback((type, message) => {
    setAlertMsg({ type, text: message });
    setTimeout(() => setAlertMsg({ type: '', text: '' }), type === 'error' ? 5000 : 3000);
  }, []);

  const showError = useCallback((error, customMsg) => {
    let message = customMsg || "เกิดข้อผิดพลาดในการดำเนินการ";
    if (error?.response) message = error.response.data?.message || `Error: ${error.response.status}`;
    else if (typeof error === 'string') message = error;
    showBanner('error', message);
  }, [showBanner]);

  // ==========================================
  // 🟢 2. Fetch Data
  // ==========================================
  const fetchVendors = async () => {
    setIsLoading(true);
    try {
      const res = await axios.get('http://localhost:3000/api/v3/vendors', { headers: { 'x-tenant-id': '2' } });
      setVendors(res.data);
    } catch (error) { showError(error, "ดึงข้อมูลร้านค้าล้มเหลว"); } 
    finally { setIsLoading(false); }
  };

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const res = await axios.get('http://localhost:3000/api/v3/vendors/products', { 
        headers: { 'x-tenant-id': '2' },
        params: {
          page: productPage,
          limit: 20,
          search: searchQuery,
          vendorId: filterVendor !== 'ALL' ? filterVendor : undefined 
        }
      });
      setProducts(res.data.data);
      setProductMeta(res.data.meta);
      if (vendors.length === 0) fetchVendors(); 
    } catch (error) { showError(error, "ดึงข้อมูลสินค้าล้มเหลว"); } 
    finally { setIsLoading(false); }
  };

  // ==========================================
  // 🟢 3. Effects & Tab Navigation
  // ==========================================
  useEffect(() => {
    if (subTab === 'products') {
      const delayDebounceFn = setTimeout(() => { fetchProducts(); }, 500); 
      return () => clearTimeout(delayDebounceFn);
    } else {
      fetchVendors();
    }
  }, [subTab, productPage, searchQuery, filterStatus, filterVendor]);

  const handleTabClick = (tab) => {
    setSubTab(tab);
    setSearchQuery('');
    setFilterStatus('ALL');
    setFilterVendor('ALL');
    setProductPage(1);
    setSortConfig({ key: null, direction: 'asc' });
  };

  const goToVendorProducts = (vendorId) => {
    setSubTab('products');
    setFilterVendor(vendorId); 
    setSearchQuery('');
    setProductPage(1);
  };

  // ==========================================
  // 🟢 4. Handlers (Modal & API)
  // ==========================================
  const openAddModal = () => {
    setModalMode('add');
    if (subTab === 'vendors') setVendorForm({ vendorId: '', name: '', gp: 0, isActive: true });
    else setProductForm({ 
      code: '', name: '', category: 'อาหารจานเดียว', price: 0, 
      vendorId: filterVendor !== 'ALL' ? filterVendor : (vendors[0]?.id || ''), 
      isAlwaysAvailable: false, // <-- เซ็ตค่าเริ่มต้น
      isActive: true, imageFile: null, imagePreview: '' 
    });
    setIsModalOpen(true);
  };

  const openEditModal = useCallback((data) => {
    setModalMode('edit');
    if (subTab === 'vendors') setVendorForm({ vendorId: data.id, name: data.name, gp: data.gp, isActive: data.status === 'ACTIVE' });
    else setProductForm({ 
      code: data.code, name: data.name, category: data.category, price: data.price, 
      vendorId: data.vendorId || data.VendorID || '', 
      isAlwaysAvailable: data.isAlwaysAvailable === true, // <-- ดึงค่าเดิมมาโชว์
      isActive: data.status === 'ACTIVE',
      imageFile: null, imagePreview: data.imageUrl || data.ImageURL || '' 
    });
    setIsModalOpen(true);
  }, [subTab]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 500000) { 
        return showBanner('error', 'ขนาดรูปภาพใหญ่เกินไป (ไม่ควรเกิน 500KB)');
      }
      setProductForm({ 
        ...productForm, 
        imageFile: file, 
        imagePreview: URL.createObjectURL(file) 
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (subTab === 'vendors') {
        const isEdit = modalMode === 'edit';
        const url = isEdit ? `http://localhost:3000/api/v3/vendors/${vendorForm.vendorId}` : `http://localhost:3000/api/v3/vendors`;
        await axios({ method: isEdit ? 'patch' : 'post', url, data: vendorForm, headers: { 'x-tenant-id': '2' } });
        showBanner('success', isEdit ? 'อัปเดตข้อมูลร้านค้าสำเร็จ' : 'เพิ่มร้านค้าใหม่สำเร็จ');
        fetchVendors();
      } else {
        const isEdit = modalMode === 'edit';
        const url = isEdit ? `http://localhost:3000/api/v3/vendors/products/${productForm.code}` : `http://localhost:3000/api/v3/vendors/products`;
        
        const formData = new FormData();
        formData.append('code', productForm.code);
        formData.append('name', productForm.name);
        formData.append('category', productForm.category);
        formData.append('price', productForm.price);
        formData.append('vendorId', productForm.vendorId);
        formData.append('isActive', productForm.isActive);
        // 💡 ส่งค่า isAlwaysAvailable ไปให้ API
        formData.append('isAlwaysAvailable', productForm.isAlwaysAvailable); 
        
        if (productForm.imageFile) {
          formData.append('image', productForm.imageFile);
        }
        
        await axios({ 
          method: isEdit ? 'patch' : 'post', 
          url, 
          data: formData, 
          headers: { 
            'x-tenant-id': '2',
            'Content-Type': 'multipart/form-data' 
          } 
        });
        
        showBanner('success', isEdit ? 'อัปเดตเมนูอาหารสำเร็จ' : 'เพิ่มเมนูอาหารสำเร็จ');
        fetchProducts();
      }
      setIsModalOpen(false);
    } catch (error) { 
      showError(error, "บันทึกข้อมูลล้มเหลว"); 
    }
  };

  // ==========================================
  // 🟢 5. Data Processing (Sort & Filter Fix)
  // ==========================================
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
  };

  const processedVendors = useMemo(() => {
    let list = [...vendors];
    if (searchQuery) {
      const term = searchQuery.toLowerCase();
      list = list.filter(v => (v.name?.toLowerCase().includes(term) || v.id?.toLowerCase().includes(term)));
    }
    if (filterStatus !== 'ALL') list = list.filter(v => v.status === filterStatus);
    
    if (sortConfig.key) {
      list.sort((a, b) => {
        let aVal = a[sortConfig.key]; let bVal = b[sortConfig.key];
        return aVal < bVal ? (sortConfig.direction === 'asc' ? -1 : 1) : aVal > bVal ? (sortConfig.direction === 'asc' ? 1 : -1) : 0;
      });
    }
    return list;
  }, [vendors, searchQuery, filterStatus, sortConfig]);

  const processedProducts = useMemo(() => {
    let list = [...products];
    if (filterVendor !== 'ALL') {
      list = list.filter(p => p.vendorId === filterVendor || p.VendorID === filterVendor);
    }
    if (filterStatus !== 'ALL') {
      list = list.filter(p => p.status === filterStatus);
    }
    if (sortConfig.key) {
      list.sort((a, b) => {
        let aVal = a[sortConfig.key]; let bVal = b[sortConfig.key];
        if(sortConfig.key === 'price') return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
        return aVal < bVal ? (sortConfig.direction === 'asc' ? -1 : 1) : aVal > bVal ? (sortConfig.direction === 'asc' ? 1 : -1) : 0;
      });
    }
    return list;
  }, [products, sortConfig, filterVendor, filterStatus]);

  // ==========================================
  // 🟢 6. Table Columns Config
  // ==========================================
  const vendorColumns = useMemo(() => [
    { header: t('vendors.colName'), accessor: 'name', key: 'name', render: (v) => (<div><div className="font-bold text-slate-800">{v.name}</div><div className="text-xs text-slate-400 font-mono mt-0.5">{v.id}</div></div>) },
    { header: t('vendors.colGp'), accessor: 'gp', key: 'gp', align: 'center', render: (v) => <span className="font-bold text-slate-600">{v.gp}%</span> },
    { 
      header: t('vendors.colLinked') || 'PRODUCTS LINKED', align: 'center', 
      render: (v) => {
        const count = v.productCount || 0;
        return (
          <button onClick={() => goToVendorProducts(v.id)} className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${ count > 0 ? 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100 ring-1 ring-indigo-200' : 'bg-slate-50 text-slate-400 hover:bg-slate-100 ring-1 ring-slate-200' }`} title="คลิกเพื่อดูเมนูของร้านนี้">
            {count} Items
          </button>
        );
      }
    },
    { header: t('vendors.colStatus'), accessor: 'status', key: 'status', align: 'center', render: (v) => <Badge status={v.status} /> },
    { header: t('vendors.colAction'), align: 'right', render: (v) => <Button variant="ghost" icon={Edit2} title={t('common.edit')} onClick={() => openEditModal(v)} /> }
  ], [t, openEditModal]);

  const productColumns = useMemo(() => [
    { header: t('vendors.colProdName'), accessor: 'name', key: 'name', render: (p) => (
      <div className="flex items-center gap-3">
        {p.imageUrl || p.ImageURL ? (
          <img src={p.imageUrl || p.ImageURL} alt={p.name} className="w-10 h-10 object-cover rounded-lg border border-slate-200 shadow-sm" />
        ) : (
          <div className="w-10 h-10 bg-slate-100 text-slate-400 flex items-center justify-center rounded-lg border border-slate-200 shadow-sm">
             <ImageIcon size={18} />
          </div>
        )}
        <div>
          <div className="font-bold text-slate-800 flex items-center gap-1">
            {p.name} 
            {/* 💡 โชว์ป้าย (Badge) เล็กๆ ถ้าเป็นเมนูยืนพื้น */}
            {p.isAlwaysAvailable && <span className="ml-1 px-1.5 py-0.5 rounded text-[9px] bg-amber-100 text-amber-700 uppercase">ยืนพื้น</span>}
          </div>
          <div className="text-xs text-slate-400 font-mono mt-0.5">{p.code}</div>
        </div>
      </div>
    )},
    { header: t('vendors.colCategory'), accessor: 'category', key: 'category', render: (p) => <span className="px-2.5 py-1 rounded text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-200">{p.category}</span> },
    { header: t('vendors.colName'), accessor: 'vendorName', key: 'vendorName', render: (p) => <span className="text-sm font-medium text-slate-600">{p.vendorName || p.vendor || '-'}</span> },
    { header: t('vendors.colPrice'), accessor: 'price', key: 'price', align: 'right', render: (p) => <span className="font-bold text-emerald-600 text-right">฿ {(p.price || 0).toLocaleString()}</span> },
    { header: t('vendors.colStatus'), accessor: 'status', key: 'status', align: 'center', render: (p) => <Badge status={p.status} /> },
    { header: t('vendors.colAction'), align: 'right', render: (p) => <Button variant="ghost" icon={Edit2} title={t('common.edit')} onClick={() => openEditModal(p)} /> }
  ], [t, openEditModal]);

  // ==========================================
  // 🟢 7. RENDER UI
  // ==========================================
  return (
    <div className="max-w-7xl mx-auto flex flex-col h-[calc(100vh-100px)] p-4 space-y-4">
      
      {/* ⚠️ Standard Banner */}
      {alertMsg.text && (
        <div className={`border-l-4 p-4 rounded-r-xl flex items-center gap-3 animate-in fade-in slide-in-from-top duration-300 shadow-sm shrink-0 
          ${alertMsg.type === 'error' ? 'bg-rose-50 border-rose-500' : alertMsg.type === 'success' ? 'bg-emerald-50 border-emerald-500' : 'bg-blue-50 border-blue-500'}`}>
          {alertMsg.type === 'error' && <AlertCircle className="text-rose-500" size={20} />}
          {alertMsg.type === 'success' && <CheckCircle className="text-emerald-500" size={20} />}
          {alertMsg.type === 'info' && <Info className="text-blue-500" size={20} />}
          <p className={`text-sm font-bold ${alertMsg.type === 'error' ? 'text-rose-700' : alertMsg.type === 'success' ? 'text-emerald-700' : 'text-blue-700'}`}>{alertMsg.text}</p>
          <button onClick={() => setAlertMsg({ type: '', text: '' })} className="ml-auto opacity-50 hover:opacity-100"><X size={16} /></button>
        </div>
      )}

      {/* TABS */}
      <div className="flex gap-2 bg-slate-200/50 p-1 rounded-xl w-max shrink-0">
        <button onClick={() => handleTabClick('vendors')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${subTab === 'vendors' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>🏪 {t('vendors.title')}</button>
        <button onClick={() => handleTabClick('products')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${subTab === 'products' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>🍔 {t('vendors.menuTitle')}</button>
      </div>

      <PageHeader 
        title={subTab === 'vendors' ? t('vendors.title') : t('vendors.menuTitle')}
        actions={<Button variant="primary" icon={Plus} onClick={openAddModal}>{subTab === 'vendors' ? t('vendors.addVendor') : t('vendors.addProduct')}</Button>}
      />

      <Card className="flex flex-col flex-1 overflow-hidden shadow-sm border border-slate-200 bg-white">
        
        {/* Toolbar */}
        <div className="flex flex-col md:flex-row gap-3 p-4 border-b border-slate-100 shrink-0">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="ค้นหาชื่อ หรือ รหัส..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            />
          </div>
          
          <div className="flex gap-2">
            {subTab === 'products' && (
              <select 
                value={filterVendor}
                onChange={(e) => { setFilterVendor(e.target.value); setProductPage(1); }}
                className="px-4 py-2.5 bg-indigo-50/50 border border-indigo-100 rounded-xl text-sm font-bold text-indigo-700 outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="ALL">{t('common.allVendors')}</option>
                {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
              </select>
            )}

            <select 
              value={filterStatus}
              onChange={(e) => { setFilterStatus(e.target.value); setProductPage(1); }}
              className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              <option value="ALL">{t('common.allStatus')}</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="INACTIVE">INACTIVE</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto p-1">
          {subTab === 'vendors' ? (
            <Table columns={vendorColumns} data={processedVendors} isLoading={isLoading} emptyMessage={t('vendors.empty')} onSort={handleSort} sortConfig={sortConfig} />
          ) : (
            <div className="flex flex-col h-full">
              <div className="flex-1">
                <Table columns={productColumns} data={processedProducts} isLoading={isLoading} emptyMessage={t('vendors.emptyProduct')} onSort={handleSort} sortConfig={sortConfig} />
              </div>
              <div className="shrink-0 pt-2 pb-4">
                <Pagination meta={productMeta} onPageChange={setProductPage} />
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in duration-200">
            <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50">
              <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                {subTab === 'vendors' ? <Store className="text-emerald-500" size={20}/> : <ShoppingBag className="text-emerald-500" size={20}/>}
                {modalMode === 'add' ? (subTab === 'vendors' ? t('vendors.addVendor') : t('vendors.addProduct')) : t('common.edit')}
              </h3>
              <button type="button" onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-rose-500"><X size={20} /></button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              
              {/* === Vendors Form === */}
              {subTab === 'vendors' && (
                <>
                  <Input label="Vendor ID" required disabled={modalMode === 'edit'} value={vendorForm.vendorId} onChange={(e) => setVendorForm({...vendorForm, vendorId: e.target.value})} placeholder="Ex. V-105" />
                  <Input label={t('vendors.colName')} required value={vendorForm.name} onChange={(e) => setVendorForm({...vendorForm, name: e.target.value})} />
                  <Input label={`${t('vendors.colGp')} (%)`} type="number" required min="0" max="100" step="0.01" value={vendorForm.gp} onChange={(e) => setVendorForm({...vendorForm, gp: Number(e.target.value)})} />
                  {modalMode === 'edit' && (
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase">{t('common.status')}</label>
                      <select className="w-full border border-slate-200 rounded-lg p-2.5 text-sm outline-none" value={vendorForm.isActive ? 'ACTIVE' : 'INACTIVE'} onChange={(e) => setVendorForm({...vendorForm, isActive: e.target.value === 'ACTIVE'})}>
                        <option value="ACTIVE">ACTIVE (เปิดใช้งาน)</option>
                        <option value="INACTIVE">INACTIVE (ระงับ)</option>
                      </select>
                    </div>
                  )}
                </>
              )}

              {/* === Products Form === */}
              {subTab === 'products' && (
                <div className="max-h-[60vh] overflow-y-auto pr-1 space-y-4">
                  
                  {/* ภาพสินค้า */}
                  <div className="flex flex-col items-center gap-2 mb-2">
                    <label className="text-xs font-bold text-slate-500 uppercase w-full text-left">{t('common.image')}</label>
                    <label className="w-32 h-32 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-100 hover:border-emerald-400 transition-colors overflow-hidden group">
                      {productForm.imagePreview ? (
                        <img src={productForm.imagePreview} alt="Preview" className="w-full h-full object-cover group-hover:opacity-80 transition-opacity" />
                      ) : (
                        <>
                          <UploadCloud size={24} className="text-slate-400 mb-1" />
                          <span className="text-[10px] font-bold text-slate-500">{t('common.uploadImage')}</span>
                        </>
                      )}
                      <input type="file" accept="image/jpeg, image/png, image/webp" className="hidden" onChange={handleImageChange} />
                    </label>
                    <p className="text-[10px] text-slate-400">แนะนำ: 1:1 จัตุรัส (ไม่เกิน 500KB)</p>
                  </div>

                  <Input label="รหัสสินค้า (Product Code)" required disabled={modalMode === 'edit'} value={productForm.code} onChange={(e) => setProductForm({...productForm, code: e.target.value})} placeholder="Ex. FD-001" />
                  <Input label="ชื่อเมนูอาหาร" required value={productForm.name} onChange={(e) => setProductForm({...productForm, name: e.target.value})} />
                  
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">ร้านค้าที่ขาย (Vendor)</label>
                    <select required value={productForm.vendorId} onChange={(e) => setProductForm({...productForm, vendorId: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none text-sm focus:ring-2 focus:ring-emerald-500/20">
                      <option value="" disabled>-- กรุณาเลือกร้านค้า --</option>
                      {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <Input label="หมวดหมู่" value={productForm.category} onChange={(e) => setProductForm({...productForm, category: e.target.value})} placeholder="เช่น อาหารจานเดียว" />
                    <Input label="ราคา (฿)" type="number" required min="0" step="1" value={productForm.price} onChange={(e) => setProductForm({...productForm, price: Number(e.target.value)})} />
                  </div>

                  {/* 💡 Checkbox เลือกเมนูยืนพื้น */}
                  <div className="p-4 mt-2 bg-indigo-50 border border-indigo-100 rounded-xl">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <div className="relative flex items-center pt-1">
                        <input 
                          type="checkbox" 
                          className="w-5 h-5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500" 
                          checked={productForm.isAlwaysAvailable} 
                          onChange={(e) => setProductForm({...productForm, isAlwaysAvailable: e.target.checked})} 
                        />
                      </div>
                      <div>
                        <span className="text-sm font-bold text-indigo-900 block">เป็นเมนูยืนพื้น (ขายทุกวัน และ ทั้งวัน)</span>
                        <span className="text-xs text-indigo-700 mt-0.5 block leading-relaxed">
                          ถ้าเลือก เมนูนี้จะแสดงที่หน้าร้านเสมอ โดยไม่ต้องไปตั้งค่าในหน้า "จัดตารางอาหาร"
                        </span>
                      </div>
                    </label>
                  </div>

                  {modalMode === 'edit' && (
                    <div className="space-y-1 pt-2 border-t border-slate-100">
                      <label className="text-xs font-bold text-slate-500 uppercase">{t('common.status')}</label>
                      <select className="w-full border border-slate-200 rounded-lg p-2.5 text-sm outline-none" value={productForm.isActive ? 'ACTIVE' : 'INACTIVE'} onChange={(e) => setProductForm({...productForm, isActive: e.target.value === 'ACTIVE'})}>
                        <option value="ACTIVE">ACTIVE (พร้อมขาย)</option>
                        <option value="INACTIVE">INACTIVE (หมด/งดขาย)</option>
                      </select>
                    </div>
                  )}
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