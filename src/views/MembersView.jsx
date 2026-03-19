import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Plus, Edit2, X, Upload, CreditCard, Search, Save, 
  Link as LinkIcon, AlertCircle, CheckCircle, Trash2, Building, Users
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

import Button from '../components/Button';
import Badge from '../components/Badge';
import PageHeader from '../components/PageHeader';
import Card from '../components/Card';
import Input from '../components/Input';
import Table from '../components/Table';
import api from '../utils/api'; 

export default function MembersView() {
  const { t } = useTranslation();

  const [subTab, setSubTab] = useState('members'); 
  const [isLoading, setIsLoading] = useState(false);
  
  // --- Modals ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [isDeptModalOpen, setIsDeptModalOpen] = useState(false); 
  const [isTypeModalOpen, setIsTypeModalOpen] = useState(false); 
  const [isAddCardModalOpen, setIsAddCardModalOpen] = useState(false);
  const [isBinding, setIsBinding] = useState(false);
  
  const [alertMsg, setAlertMsg] = useState({ type: '', text: '' }); 
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, title: '', message: '', confirmText: '', type: 'primary', onConfirm: null });

  // --- Data States ---
  const [members, setMembers] = useState([]);
  const [cards, setCards] = useState([]);
  const [groups, setGroups] = useState([]);
  const [cardGroups, setCardGroups] = useState([]); 
  const [departments, setDepartments] = useState([]); 
  const [memberTypes, setMemberTypes] = useState([]); 
  const [cardStats, setCardStats] = useState({ total: 0, active: 0, available: 0, inactive: 0 });
  
  // --- Search States ---
  const [searchTerm, setSearchTerm] = useState(''); 
  const [cardSearch, setCardSearch] = useState(''); 
  const [deptSearch, setDeptSearch] = useState(''); 
  const [groupSearch, setGroupSearch] = useState(''); 
  const [typeSearch, setTypeSearch] = useState(''); 

  // --- Sort States ---
  const [memberSortConfig, setMemberSortConfig] = useState({ key: null, direction: 'asc' });
  const [cardSortConfig, setCardSortConfig] = useState({ key: null, direction: 'asc' });
  const [deptSortConfig, setDeptSortConfig] = useState({ key: null, direction: 'asc' });
  const [groupSortConfig, setGroupSortConfig] = useState({ key: null, direction: 'asc' });
  const [typeSortConfig, setTypeSortConfig] = useState({ key: null, direction: 'asc' });
  
  // --- Form States (💡 เพิ่ม groupId ใน Form) ---
  const [bindData, setBindData] = useState({ memberCode: '', rfid: '' });
  const [addCardForm, setAddCardForm] = useState({ rfid: '' });
  
  const initialMemberForm = { id: '', code: '', name: '', type: '', department: '', groupId: '', status: 'ACTIVE' };
  const [memberForm, setMemberForm] = useState(initialMemberForm);
  const [groupForm, setGroupForm] = useState({ id: '', name: '' });
  const [deptForm, setDeptForm] = useState({ id: '', name: '', groupId: '' }); 
  const [typeForm, setTypeForm] = useState({ id: '', name: '', groupId: '' }); 
  
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalItems: 0, itemsPerPage: 20 });

  // ==========================================
  // 🟢 Alerts & Notifications
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
  // 🟢 Fetch Data Functions
  // ==========================================
  const fetchCardGroups = async () => { try { const res = await api.get('/api/v3/members/groups'); setCardGroups(res.data); setGroups(res.data); } catch (e) {} };
  const fetchDepartments = async () => { try { const res = await api.get('/api/v3/members/departments'); setDepartments(res.data); } catch (e) {} };
  const fetchMemberTypes = async () => { try { const res = await api.get('/api/v3/members/types'); setMemberTypes(res.data || []); } catch (e) {} };

  const fetchMembers = async (page = 1) => {
    setIsLoading(true);
    try {
      const res = await api.get('/api/v3/members', { params: { search: searchTerm, page: page, limit: pagination.itemsPerPage } });
      const { data, meta } = res.data;
      const normalizedMembers = (Array.isArray(data) ? data : []).map(m => ({
        ...m, id: m.id || m.MemberID, code: m.code || m.MemberCode, name: m.name || m.FullName,
        type: m.type || m.MemberType, status: m.status || m.Status, rfids: m.rfids || [], groupId: m.groupId || m.GroupID
      }));
      setMembers(normalizedMembers);
      if (meta) setPagination(prev => ({ ...prev, ...meta }));
    } catch (error) { showError(error, "ไม่สามารถดึงข้อมูลสมาชิกได้"); setMembers([]); } 
    finally { setIsLoading(false); }
  };

  const fetchCards = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/api/v3/cards', { params: { search: cardSearch, page: 1, limit: 100 } });
      const fetchedCards = (Array.isArray(res.data?.data) ? res.data.data : []).map(c => ({ uid: c.uid || c.CardUID, linkedTo: c.linkedTo || (c.Member ? c.Member.FullName : null), cash: c.cash || c.CashBalance || 0, status: c.status || c.Status }));
      setCards(fetchedCards);
      const stats = fetchedCards.reduce((acc, curr) => {
        acc.total++;
        if (curr.status === 'ACTIVE') acc.active++;
        if (curr.status === 'AVAILABLE') acc.available++;
        if (['FROZEN', 'LOST', 'INACTIVE'].includes(curr.status)) acc.inactive++;
        return acc;
      }, { total: 0, active: 0, available: 0, inactive: 0 });
      setCardStats(stats);
    } catch (error) { showError(error, "ไม่สามารถดึงข้อมูลบัตรได้"); setCards([]); } 
    finally { setIsLoading(false); }
  };

  useEffect(() => { const delayDebounceFn = setTimeout(() => { if (subTab === 'members') fetchMembers(1); }, 500); return () => clearTimeout(delayDebounceFn); }, [searchTerm]);
  
  useEffect(() => {
    fetchCardGroups(); 
    fetchDepartments(); 
    fetchMemberTypes(); 
    if (subTab === 'members') fetchMembers(pagination.currentPage);
    else if (subTab === 'cards' || subTab === 'cards_bind') { fetchCards(); if (members.length === 0) fetchMembers(); }
  }, [subTab, pagination.currentPage, cardSearch]);

  // ==========================================
  // 🟢 Handlers (Submit & Delete)
  // ==========================================
  const handleSubmitMember = async (e) => {
    e.preventDefault();
    try {
      const isEdit = !!memberForm.id;
      const url = isEdit ? `/api/v3/members/${memberForm.id}` : `/api/v3/members`;
      await api({ method: isEdit ? 'patch' : 'post', url, data: memberForm });
      setIsModalOpen(false); showBanner('success', 'บันทึกสำเร็จ'); fetchMembers();
    } catch (error) { showError(error); }
  };

  const handleAddCard = async (e) => { e.preventDefault(); try { await api.post('/api/v3/cards', { cardUid: addCardForm.rfid }); showBanner('success', `เพิ่มบัตรสำเร็จ`); setIsAddCardModalOpen(false); fetchCards(); } catch (error) { showError(error); } };
  
  const handleBindCard = async (e) => { 
    e.preventDefault(); 
    const member = members.find(m => m.code === bindData.memberCode); 
    if (!member) return; 
    setIsBinding(true); 
    try { 
      await api.patch(`/api/v3/members/${member.id}/bind-card`, { rfid: bindData.rfid }); 
      setBindData({ memberCode: '', rfid: '' });
      setSubTab('cards'); 
      showBanner('success', 'ผูกบัตรสำเร็จ!'); 
      fetchCards(); 
      fetchMembers(); 
    } catch (error) { showError(error); } 
    finally { setIsBinding(false); } 
  };
  
  const promptToggleCard = (uid, currentStatus) => { 
    setConfirmDialog({ isOpen: true, title: 'ยืนยัน', message: `ยืนยันการ${currentStatus === 'ACTIVE' ? 'ระงับ' : 'เปิดใช้งาน'}บัตร?`, confirmText: 'ยืนยัน', type: currentStatus === 'ACTIVE' ? 'danger' : 'primary', onConfirm: async () => { try { await api.patch(`/api/v3/cards/${uid}/status`, { status: currentStatus === 'ACTIVE' ? 'FROZEN' : 'ACTIVE' }); showBanner('success', 'เปลี่ยนสถานะสำเร็จ'); fetchCards(); } catch (e) { showError(e); } setConfirmDialog({ isOpen: false }); } }); 
  };

  const handleSubmitGroup = async (e) => { e.preventDefault(); try { const isEdit = !!groupForm.id; const url = isEdit ? `/api/v3/members/groups/${groupForm.id}` : `/api/v3/members/groups`; await api({ method: isEdit ? 'patch' : 'post', url, data: { name: groupForm.name } }); setIsGroupModalOpen(false); showBanner('success', 'บันทึกสำเร็จ'); fetchCardGroups(); } catch (error) { showError(error); } };
  const promptDeleteGroup = (id, name) => { setConfirmDialog({ isOpen: true, title: 'ลบข้อมูล', message: `ลบ "${name}"?`, confirmText: 'ลบทิ้ง', type: 'danger', onConfirm: async () => { try { await api.delete(`/api/v3/members/groups/${id}`); showBanner('success', 'ลบสำเร็จ'); fetchCardGroups(); } catch (e) { showError(e); } setConfirmDialog({ isOpen: false }); } }); };
  
  // 💡 Submit: Departments (ส่ง groupId ไปด้วย)
  const handleSubmitDept = async (e) => { 
    e.preventDefault(); 
    try { 
      const isEdit = !!deptForm.id; 
      const url = isEdit ? `/api/v3/members/departments/${deptForm.id}` : `/api/v3/members/departments`; 
      await api({ method: isEdit ? 'patch' : 'post', url, data: { name: deptForm.name, groupId: deptForm.groupId || null } }); 
      setIsDeptModalOpen(false); showBanner('success', 'บันทึกสำเร็จ'); fetchDepartments(); 
    } catch (error) { showError(error); } 
  };
  const promptDeleteDept = (id, name) => { setConfirmDialog({ isOpen: true, title: 'ลบข้อมูล', message: `ลบ "${name}"?`, confirmText: 'ลบทิ้ง', type: 'danger', onConfirm: async () => { try { await api.delete(`/api/v3/members/departments/${id}`); showBanner('success', 'ลบสำเร็จ'); fetchDepartments(); } catch (e) { showError(e); } setConfirmDialog({ isOpen: false }); } }); };

  // 💡 Submit: Member Types (ส่ง groupId ไปด้วย)
  const handleSubmitType = async (e) => {
    e.preventDefault();
    try {
      const isEdit = !!typeForm.id;
      const url = isEdit ? `/api/v3/members/types/${typeForm.id}` : `/api/v3/members/types`;
      await api({ method: isEdit ? 'patch' : 'post', url, data: { name: typeForm.name, groupId: typeForm.groupId || null } });
      setIsTypeModalOpen(false); showBanner('success', 'บันทึกสำเร็จ'); fetchMemberTypes();
    } catch (error) { showError(error); }
  };
  const promptDeleteType = (id, name) => {
    setConfirmDialog({ isOpen: true, title: 'ลบข้อมูล', message: `คุณต้องการลบ "${name}" ใช่หรือไม่?`, confirmText: 'ลบทิ้ง', type: 'danger', onConfirm: async () => { try { await api.delete(`/api/v3/members/types/${id}`); showBanner('success', 'ลบสำเร็จ'); fetchMemberTypes(); } catch (e) { showError(e); } setConfirmDialog({ isOpen: false }); } });
  };

  // ==========================================
  // 🟢 Data Processing (Sort & Filter)
  // ==========================================
  const genericSort = (key, config, setConfig) => { let direction = 'asc'; if (config.key === key && config.direction === 'asc') direction = 'desc'; setConfig({ key, direction }); };
  const sortArray = (arr, config) => { if (!config.key) return arr; return [...arr].sort((a, b) => { let aVal = a[config.key]; let bVal = b[config.key]; if (typeof aVal === 'string') aVal = aVal.toLowerCase(); if (typeof bVal === 'string') bVal = bVal.toLowerCase(); return aVal < bVal ? (config.direction === 'asc' ? -1 : 1) : aVal > bVal ? (config.direction === 'asc' ? 1 : -1) : 0; }); };

  const processedMembers = useMemo(() => sortArray(members, memberSortConfig), [members, memberSortConfig]);
  const processedCards = useMemo(() => sortArray(cards, cardSortConfig), [cards, cardSortConfig]);
  const processedDepartments = useMemo(() => { let list = departments; if (deptSearch) list = list.filter(d => d.name?.toLowerCase().includes(deptSearch.toLowerCase())); return sortArray(list, deptSortConfig); }, [departments, deptSearch, deptSortConfig]);
  const processedGroups = useMemo(() => { let list = groups; if (groupSearch) list = list.filter(g => g.name?.toLowerCase().includes(groupSearch.toLowerCase())); return sortArray(list, groupSortConfig); }, [groups, groupSearch, groupSortConfig]);
  const processedTypes = useMemo(() => { let list = memberTypes; if (typeSearch) list = list.filter(t => t.name?.toLowerCase().includes(typeSearch.toLowerCase())); return sortArray(list, typeSortConfig); }, [memberTypes, typeSearch, typeSortConfig]);

  // ==========================================
  // 🟢 Table Columns Config
  // ==========================================
  const memberColumns = [
    { header: t('members.colIdentity'), accessor: 'code', key: 'code', render: (m) => (<div className="flex flex-col"><span className="font-bold text-slate-800">{m.code}</span><span className="text-sm text-slate-500">{m.name}</span></div>) },
    { header: t('members.colType'), accessor: 'type', key: 'type', render: (m) => {
        // 💡 เช็คว่าคนนี้มีกลุ่มสวัสดิการเฉพาะตัวไหม ถ้าไม่มี ให้ขึ้น (Auto)
        const groupName = cardGroups.find(g => g.id === Number(m.groupId))?.name;
        return (
          <div className="flex flex-col gap-1 items-start">
            <div className="flex gap-1">
              <span className={`inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold border bg-blue-50 text-blue-700 border-blue-200`}>{m.type || 'N/A'}</span>
              {groupName && <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">🎁 {groupName}</span>}
            </div>
            <span className="text-[11px] text-slate-500 font-medium">แผนก: <span className="text-slate-700">{m.department || '-'}</span></span>
          </div>
        );
    }},
    { header: t('members.colCard'), accessor: 'rfids', key: 'rfids', render: (m) => (m.rfids && m.rfids.length > 0 ? <div className="flex flex-col gap-1.5">{m.rfids.map((rfid, index) => (<span key={index} className="bg-slate-100 px-2 py-1 rounded border border-slate-200 flex w-max items-center gap-1.5 font-mono text-sm text-slate-600"><CreditCard size={14} className="text-emerald-500"/> {rfid}</span>))}</div> : <span className="text-slate-400 italic text-sm flex items-center gap-1"><AlertCircle size={14}/> {t('members.unlinked')}</span>) },
    { header: t('members.colStatus'), accessor: 'status', key: 'status', align: 'center', render: (m) => <Badge status={m.status || 'ACTIVE'} /> },
    { header: t('members.colAction'), align: 'right', render: (m) => (
        <div className="flex justify-end gap-1">
          <Button variant="ghost" icon={LinkIcon} title={t('members.bindCardBtn')} className="text-indigo-500 hover:text-indigo-700 hover:bg-indigo-50" onClick={() => { setBindData({ memberCode: m.code, rfid: '' }); setSubTab('cards_bind'); }} />
          <Button variant="ghost" icon={Edit2} title={t('common.edit') || 'Edit'} onClick={() => { setMemberForm({ id: m.id, code: m.code, name: m.name, type: m.type, department: m.department || '', groupId: m.groupId || '', status: m.status || 'ACTIVE' }); setIsModalOpen(true); }} />
        </div>
      )
    }
  ];

  const cardColumns = [ 
    { header: t('members.colUid'), accessor: 'uid', key: 'uid', render: (c) => <span className="font-bold text-slate-700">{c.uid}</span> }, 
    { header: t('members.colHolder'), accessor: 'linkedTo', key: 'linkedTo', render: (c) => <span className="text-slate-600">{c.linkedTo || '--'}</span> }, 
    { header: t('members.colBalance'), accessor: 'cash', key: 'cash', align: 'right', render: (c) => <span className="font-bold text-emerald-600">฿{c.cash.toLocaleString()}</span> }, 
    { header: t('members.colStatus'), accessor: 'status', key: 'status', align: 'center', render: (c) => <Badge status={c.status} /> }, 
    { header: t('members.colAction'), align: 'right', render: (c) => (<button onClick={() => promptToggleCard(c.uid, c.status)} className={`text-xs font-bold px-3 py-1.5 rounded-lg border ${c.status === 'ACTIVE' ? 'text-rose-500 border-rose-100 hover:bg-rose-50' : 'text-emerald-500 border-emerald-100 hover:bg-emerald-50'}`}>{c.status === 'ACTIVE' ? t('members.btnFreeze') : t('members.btnActivate')}</button>)} 
  ];
  
  const groupColumns = [ 
    { header: t('members.colGroupId'), accessor: 'id', key: 'id', render: (g) => <span className="text-slate-500">#{g.id}</span> }, 
    { header: t('members.colGroupName'), accessor: 'name', key: 'name', render: (g) => <span className="font-bold text-amber-700 flex items-center gap-2"><CreditCard size={16}/> {g.name}</span> }, 
    { header: t('members.colAction'), align: 'right', render: (g) => (<div className="flex justify-end gap-1"><Button variant="ghost" icon={Edit2} onClick={() => { setGroupForm({ id: g.id, name: g.name }); setIsGroupModalOpen(true); }} /><Button variant="ghost" icon={Trash2} className="text-rose-500 hover:bg-rose-50" onClick={() => promptDeleteGroup(g.id, g.name)} /></div>)} 
  ];
  
  // 💡 เพิ่มการแสดงผล Group ที่ผูกไว้ ในตารางแผนก
  const deptColumns = [ 
    { header: t('members.colDeptId'), accessor: 'id', key: 'id', render: (d) => <span className="text-slate-500">#{d.id}</span> }, 
    { header: t('members.colDeptName'), accessor: 'name', key: 'name', render: (d) => (
      <div className="flex flex-col">
        <span className="font-bold text-slate-800 flex items-center gap-2"><Building size={16} className="text-emerald-500"/> {d.name}</span>
        {d.groupId && <span className="text-[10px] mt-1 w-max font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">🎁 {cardGroups.find(g => g.id === Number(d.groupId))?.name}</span>}
      </div>
    )}, 
    { header: t('members.colAction'), align: 'right', render: (d) => (<div className="flex justify-end gap-1"><Button variant="ghost" icon={Edit2} onClick={() => { setDeptForm({ id: d.id, name: d.name, groupId: d.groupId || '' }); setIsDeptModalOpen(true); }} /><Button variant="ghost" icon={Trash2} className="text-rose-500 hover:bg-rose-50" onClick={() => promptDeleteDept(d.id, d.name)} /></div>)} 
  ];
  
  // 💡 เพิ่มการแสดงผล Group ที่ผูกไว้ ในตารางประเภทสมาชิก
  const typeColumns = [ 
    { header: 'รหัสอ้างอิง', accessor: 'id', key: 'id', render: (t) => <span className="text-slate-500">#{t.id}</span> }, 
    { header: 'ประเภทสมาชิก', accessor: 'name', key: 'name', render: (t) => (
      <div className="flex flex-col">
        <span className="font-bold text-blue-700 flex items-center gap-2"><Users size={16}/> {t.name}</span>
        {t.groupId && <span className="text-[10px] mt-1 w-max font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">🎁 {cardGroups.find(g => g.id === Number(t.groupId))?.name}</span>}
      </div>
    )}, 
    { header: t('common.action'), align: 'right', render: (t) => (<div className="flex justify-end gap-1"><Button variant="ghost" icon={Edit2} onClick={() => { setTypeForm({ id: t.id, name: t.name, groupId: t.groupId || '' }); setIsTypeModalOpen(true); }} /><Button variant="ghost" icon={Trash2} className="text-rose-500 hover:bg-rose-50" onClick={() => promptDeleteType(t.id, t.name)} /></div>)} 
  ];

  // ==========================================
  // 🟢 RENDER UI
  // ==========================================
  return (
    <div className="max-w-7xl mx-auto flex flex-col h-[calc(100vh-100px)] p-4 space-y-4">
      {alertMsg.text && (
        <div className={`border-l-4 p-4 rounded-r-xl flex items-center gap-3 animate-in fade-in shrink-0 shadow-sm ${alertMsg.type === 'error' ? 'bg-rose-50 border-rose-500' : 'bg-emerald-50 border-emerald-500'}`}>
          <AlertCircle size={20} className={alertMsg.type === 'error' ? 'text-rose-500' : 'text-emerald-500'} />
          <p className={`text-sm font-bold ${alertMsg.type === 'error' ? 'text-rose-700' : 'text-emerald-700'}`}>{alertMsg.text}</p>
          <button onClick={() => setAlertMsg({ type: '', text: '' })} className="ml-auto opacity-50 hover:opacity-100"><X size={16} /></button>
        </div>
      )}

      {/* 🟢 TABS */}
      <div className="flex flex-wrap gap-2 bg-slate-200/50 p-1 rounded-xl w-max shrink-0">
        <button onClick={() => setSubTab('members')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${subTab === 'members' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>{t('members.tabMembers')}</button>
        <button onClick={() => setSubTab('cards')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${ (subTab === 'cards' || subTab === 'cards_bind') ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-700' }`}>{t('members.tabCards')}</button>
        <button onClick={() => setSubTab('types')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${subTab === 'types' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>🏷️ ประเภทสมาชิก</button>
        <button onClick={() => setSubTab('departments')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${subTab === 'departments' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>{t('members.tabDepartments')}</button>
        <button onClick={() => setSubTab('groups')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${subTab === 'groups' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>{t('members.tabGroups')}</button>
      </div>

      <PageHeader
        title={ subTab === 'members' ? t('members.titleMembers') : subTab === 'cards' || subTab === 'cards_bind' ? t('members.titleCards') : subTab === 'types' ? 'ประเภทสมาชิก' : subTab === 'departments' ? t('members.titleDepartments') : t('members.titleGroups') }
        actions={
          subTab === 'members' ? (
            <div className="flex gap-2">
              <Button variant="secondary" icon={Upload} onClick={() => showBanner('info', 'ฟังก์ชันนำเข้ายังไม่เปิดใช้งาน')}>{t('members.import')}</Button>
              <Button variant="primary" icon={Plus} onClick={() => { setMemberForm({ ...initialMemberForm, type: memberTypes[0]?.name || '' }); setIsModalOpen(true); }}>{t('members.addMember')}</Button>
            </div>
          ) : subTab === 'groups' ? (
            <Button variant="primary" icon={Plus} onClick={() => { setGroupForm({ id: '', name: '' }); setIsGroupModalOpen(true); }}>{t('members.addGroup')}</Button>
          ) : subTab === 'departments' ? (
            <Button variant="primary" icon={Plus} onClick={() => { setDeptForm({ id: '', name: '', groupId: '' }); setIsDeptModalOpen(true); }}>{t('members.addDept')}</Button>
          ) : subTab === 'types' ? (
            <Button variant="primary" icon={Plus} onClick={() => { setTypeForm({ id: '', name: '', groupId: '' }); setIsTypeModalOpen(true); }}>สร้างประเภทสมาชิก</Button>
          ) : null
        }
      />

      <Card className="flex flex-col flex-1 overflow-hidden shadow-sm border border-slate-200 bg-white">
        
        {/* --- VIEW: MEMBERS --- */}
        {subTab === 'members' && (
          <div className="flex flex-col h-full">
            <div className="p-4 border-b border-slate-100 shrink-0">
              <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none" placeholder={t('members.searchMember')} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              </div>
            </div>
            <div className="flex-1 overflow-auto p-1">
               <Table columns={memberColumns} data={processedMembers} isLoading={isLoading} emptyMessage={t('members.empty')} onSort={(key) => genericSort(key, memberSortConfig, setMemberSortConfig)} sortConfig={memberSortConfig} />
            </div>
          </div>
        )}

        {/* --- VIEW: CARDS --- */}
        {subTab === 'cards' && (
          <div className="flex flex-col h-full p-4 space-y-4">
             <div className="grid grid-cols-1 md:grid-cols-4 gap-4 shrink-0">
              {[
                { label: t('members.statTotalCards'), value: cardStats.total, color: 'text-slate-600' },
                { label: t('members.statActiveCards'), value: cardStats.active, color: 'text-emerald-600' },
                { label: t('members.statAvailableCards'), value: cardStats.available, color: 'text-blue-600' },
                { label: t('members.statInactiveCards'), value: cardStats.inactive, color: 'text-rose-600' },
              ].map((stat, i) => (
                <div key={i} className="p-4 rounded-2xl border border-slate-100 bg-slate-50">
                  <div className="text-xs font-bold uppercase text-slate-400 mb-1">{stat.label}</div>
                  <div className={`text-2xl font-black ${stat.color}`}>{stat.value.toLocaleString()}</div>
                </div>
              ))}
            </div>

            <div className="flex flex-col md:flex-row gap-3 justify-between shrink-0">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none" placeholder={t('members.searchCard')} value={cardSearch} onChange={(e) => setCardSearch(e.target.value)} />
              </div>
              <div className="flex gap-2">
                <Button variant="primary" icon={Plus} onClick={() => { setAddCardForm({ rfid: '' }); setIsAddCardModalOpen(true); }}>{t('members.addCard')}</Button>
                <Button variant="primary" icon={LinkIcon} className="bg-indigo-600 hover:bg-indigo-700" onClick={() => setSubTab('cards_bind')}>{t('members.bindCardBtn')}</Button>
              </div>
            </div>
            <div className="flex-1 overflow-auto border border-slate-100 rounded-2xl shadow-sm">
               <Table columns={cardColumns} data={processedCards} isLoading={isLoading} emptyMessage={t('members.emptyCards')} onSort={(key) => genericSort(key, cardSortConfig, setCardSortConfig)} sortConfig={cardSortConfig} />
            </div>
          </div>
        )}

        {/* --- VIEW: BIND CARD --- */}
        {subTab === 'cards_bind' && (
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-xl mx-auto py-10 px-4 w-full">
              <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xl space-y-6">
                 <h2 className="text-xl font-bold flex items-center gap-2"><LinkIcon className="text-indigo-500" /> {t('members.bindTitle')}</h2>
                 <form onSubmit={handleBindCard} className="space-y-5">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase">{t('members.bindSelectMember')}</label>
                      <select className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none text-sm" value={bindData.memberCode} onChange={(e) => setBindData({...bindData, memberCode: e.target.value})} required>
                        <option value="">{t('members.bindSearchPlaceholder')}</option>
                        {members.map(m => (<option key={m.id} value={m.code}>[{m.code}] {m.name}</option>))}
                      </select>
                    </div>
                    <Input label={t('members.bindCardInput')} placeholder={t('members.bindCardInputPlaceholder')} value={bindData.rfid} onChange={(e) => setBindData({...bindData, rfid: e.target.value})} required autoFocus />
                    <div className="flex gap-2 pt-2">
                      <Button type="button" variant="secondary" className="flex-1" onClick={() => setSubTab('cards')}>{t('common.cancel') || 'Cancel'}</Button>
                      <Button type="submit" variant="primary" className="flex-[2] bg-indigo-600 hover:bg-indigo-700" disabled={isBinding}>{t('members.btnConfirmBind')}</Button>
                    </div>
                 </form>
              </div>
            </div>
          </div>
        )}

        {/* --- VIEW: DEPARTMENTS --- */}
        {subTab === 'departments' && (
          <div className="flex flex-col h-full">
             <div className="p-4 border-b border-slate-100 shrink-0">
              <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none" placeholder={t('members.searchDept') || "ค้นหาแผนก..."} value={deptSearch} onChange={(e) => setDeptSearch(e.target.value)} />
              </div>
            </div>
            <div className="flex-1 overflow-auto p-4">
               <Table columns={deptColumns} data={processedDepartments} isLoading={isLoading} emptyMessage={t('members.emptyDepts')} onSort={(key) => genericSort(key, deptSortConfig, setDeptSortConfig)} sortConfig={deptSortConfig} />
            </div>
          </div>
        )}

        {/* --- VIEW: GROUPS --- */}
        {subTab === 'groups' && (
          <div className="flex flex-col h-full">
            <div className="p-4 border-b border-slate-100 shrink-0">
              <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none" placeholder={t('members.searchGroup') || "ค้นหากลุ่มบัตร..."} value={groupSearch} onChange={(e) => setGroupSearch(e.target.value)} />
              </div>
            </div>
            <div className="flex-1 overflow-auto p-4">
              <Table columns={groupColumns} data={processedGroups} isLoading={isLoading} emptyMessage={t('members.emptyGroups')} onSort={(key) => genericSort(key, groupSortConfig, setGroupSortConfig)} sortConfig={groupSortConfig} />
            </div>
          </div>
        )}

        {/* --- VIEW: MEMBER TYPES --- */}
        {subTab === 'types' && (
          <div className="flex flex-col h-full">
             <div className="p-4 border-b border-slate-100 shrink-0">
              <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none" placeholder="ค้นหาประเภทสมาชิก..." value={typeSearch} onChange={(e) => setTypeSearch(e.target.value)} />
              </div>
            </div>
            <div className="flex-1 overflow-auto p-4">
               <Table columns={typeColumns} data={processedTypes} isLoading={isLoading} emptyMessage="ไม่มีข้อมูลประเภทสมาชิก" onSort={(key) => genericSort(key, typeSortConfig, setTypeSortConfig)} sortConfig={typeSortConfig} />
            </div>
          </div>
        )}
      </Card>

      {/* 💳 MODAL: เพิ่มบัตรใหม่ */}
      {isAddCardModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in duration-200">
             <div className="p-6 border-b bg-slate-50 flex justify-between items-center">
                <h3 className="text-lg font-bold flex items-center gap-2"><CreditCard className="text-emerald-500" /> {t('members.modalCardTitle')}</h3>
                <button type="button" onClick={() => setIsAddCardModalOpen(false)} className="text-slate-400"><X size={20}/></button>
             </div>
             <form onSubmit={handleAddCard} className="p-6 space-y-4">
                <Input label={t('members.formCardUid')} value={addCardForm.rfid} onChange={(e) => setAddCardForm({ rfid: e.target.value })} placeholder={t('members.formCardUidPlaceholder')} required autoFocus />
                <div className="flex gap-2 pt-2">
                   <Button type="button" variant="secondary" className="flex-1" onClick={() => setIsAddCardModalOpen(false)}>{t('common.cancel') || 'Cancel'}</Button>
                   <Button type="submit" variant="primary" className="flex-1">{t('members.btnSaveCard')}</Button>
                </div>
             </form>
          </div>
        </div>
      )}

      {/* 👤 MODAL: เพิ่ม/แก้ไขสมาชิก (รายบุคคล) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in duration-200">
            <div className="p-6 border-b bg-slate-50 flex justify-between items-center">
              <h3 className="text-xl font-bold text-slate-800">{memberForm.id ? t('members.modalMemberTitleEdit') : t('members.modalMemberTitleAdd')}</h3>
              <button type="button" onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
            </div>
            <form onSubmit={handleSubmitMember} className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <Input label={t('members.formMemberCode')} value={memberForm.code} onChange={(e) => setMemberForm({...memberForm, code: e.target.value})} required disabled={!!memberForm.id} />
                <Input label={t('members.formMemberName')} value={memberForm.name} onChange={(e) => setMemberForm({...memberForm, name: e.target.value})} required />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">{t('members.formMemberType')}</label>
                  <select className="w-full border border-slate-200 rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20" value={memberForm.type} onChange={(e) => setMemberForm({...memberForm, type: e.target.value})}>
                    {memberTypes.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
                  </select>
                </div>
                
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">{t('members.formMemberDept')}</label>
                  <select className="w-full border border-slate-200 rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20" value={memberForm.department} onChange={(e) => setMemberForm({...memberForm, department: e.target.value})}>
                    <option value="">{t('members.selectDeptNone')}</option>
                    {departments.map(dep => (<option key={dep.id} value={dep.name}>{dep.name}</option>))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-amber-600 uppercase">สวัสดิการเฉพาะบุคคล</label>
                  <select className="w-full border border-amber-200 bg-amber-50/30 rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-amber-500/20 text-amber-800" value={memberForm.groupId} onChange={(e) => setMemberForm({...memberForm, groupId: e.target.value})}>
                    {/* 💡 เปลี่ยนคำอธิบาย Default ให้สอดคล้องกับระบบ Inheritance */}
                    <option value="">-- อิงตามแผนก/ประเภท (ค่าเริ่มต้น) --</option>
                    {cardGroups.map(group => (<option key={group.id} value={group.id}>🎁 {group.name}</option>))}
                  </select>
                </div>
              </div>

              <div className="space-y-1 w-1/3">
                <label className="text-xs font-bold text-slate-500 uppercase">{t('members.formMemberStatus')}</label>
                <select className="w-full border border-slate-200 rounded-lg p-2.5 text-sm outline-none" value={memberForm.status} onChange={(e) => setMemberForm({...memberForm, status: e.target.value})}>
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="INACTIVE">INACTIVE</option>
                  <option value="RESIGNED">RESIGNED</option>
                </select>
              </div>

              <div className="flex gap-3 pt-2 border-t border-slate-100 mt-6 pt-6">
                <Button type="button" variant="secondary" className="flex-1" onClick={() => setIsModalOpen(false)}>{t('common.cancel') || 'Cancel'}</Button>
                <Button variant="primary" className="flex-1" icon={Save} type="submit">{t('common.save') || 'Save'}</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 🏢 MODAL: เพิ่ม/แก้ไขแผนก */}
      {isDeptModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
           <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in duration-200">
             <div className="p-6 border-b bg-slate-50 flex justify-between items-center">
                <h3 className="text-lg font-bold flex items-center gap-2"><Building className="text-emerald-500" size={20}/> {deptForm.id ? t('members.modalDeptTitleEdit') : t('members.modalDeptTitleAdd')}</h3>
                <button type="button" onClick={() => setIsDeptModalOpen(false)} className="text-slate-400"><X size={20}/></button>
             </div>
             <form onSubmit={handleSubmitDept} className="p-6 space-y-4">
                <Input label={t('members.formDeptName')} value={deptForm.name} onChange={(e) => setDeptForm({...deptForm, name: e.target.value})} required autoFocus placeholder={t('members.formDeptPlaceholder')} />
                
                {/* 💡 เพิ่ม Dropdown ผูกกลุ่มสวัสดิการระดับแผนก */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-amber-600 uppercase flex items-center gap-1">🎁 กลุ่มสวัสดิการ (ระดับแผนก)</label>
                  <select className="w-full border border-amber-200 bg-amber-50/30 rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-amber-500/20 text-amber-800" value={deptForm.groupId} onChange={(e) => setDeptForm({...deptForm, groupId: e.target.value})}>
                    <option value="">-- ไม่รับสวัสดิการ --</option>
                    {cardGroups.map(group => (<option key={group.id} value={group.id}>{group.name}</option>))}
                  </select>
                </div>

                <div className="flex gap-2 pt-2 border-t border-slate-100 mt-4">
                   <Button type="button" variant="secondary" className="flex-1" onClick={() => setIsDeptModalOpen(false)}>{t('common.cancel') || 'Cancel'}</Button>
                   <Button type="submit" variant="primary" className="flex-1">{t('common.save') || 'Save'}</Button>
                </div>
             </form>
           </div>
        </div>
      )}

      {/* 💡 MODAL: เพิ่ม/แก้ไข ประเภทสมาชิก */}
      {isTypeModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
           <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in duration-200">
             <div className="p-6 border-b bg-slate-50 flex justify-between items-center">
                <h3 className="text-lg font-bold flex items-center gap-2"><Users className="text-blue-500" size={20}/> {typeForm.id ? 'แก้ไขประเภทสมาชิก' : 'สร้างประเภทสมาชิก'}</h3>
                <button type="button" onClick={() => setIsTypeModalOpen(false)} className="text-slate-400"><X size={20}/></button>
             </div>
             <form onSubmit={handleSubmitType} className="p-6 space-y-4">
                <Input label="ชื่อประเภทสมาชิก (เช่น VIP, ALUMNI)" value={typeForm.name} onChange={(e) => setTypeForm({...typeForm, name: e.target.value})} required autoFocus />
                
                {/* 💡 เพิ่ม Dropdown ผูกกลุ่มสวัสดิการระดับประเภทสมาชิก */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-amber-600 uppercase flex items-center gap-1">🎁 กลุ่มสวัสดิการ (ระดับประเภท)</label>
                  <select className="w-full border border-amber-200 bg-amber-50/30 rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-amber-500/20 text-amber-800" value={typeForm.groupId} onChange={(e) => setTypeForm({...typeForm, groupId: e.target.value})}>
                    <option value="">-- ไม่รับสวัสดิการ --</option>
                    {cardGroups.map(group => (<option key={group.id} value={group.id}>{group.name}</option>))}
                  </select>
                </div>

                <div className="flex gap-2 pt-2 border-t border-slate-100 mt-4">
                   <Button type="button" variant="secondary" className="flex-1" onClick={() => setIsTypeModalOpen(false)}>{t('common.cancel') || 'Cancel'}</Button>
                   <Button type="submit" variant="primary" className="flex-1 bg-blue-600 hover:bg-blue-700 border-none">{t('common.save') || 'Save'}</Button>
                </div>
             </form>
           </div>
        </div>
      )}

      {/* 👥 MODAL: เพิ่ม/แก้ไขกลุ่ม (สวัสดิการ) */}
      {isGroupModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
           <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in duration-200">
             <div className="p-6 border-b bg-slate-50 flex justify-between items-center">
                <h3 className="text-lg font-bold flex items-center gap-2"><CreditCard className="text-amber-600" size={20}/> {groupForm.id ? t('members.modalGroupTitleEdit') : t('members.modalGroupTitleAdd')}</h3>
                <button type="button" onClick={() => setIsGroupModalOpen(false)} className="text-slate-400"><X size={20}/></button>
             </div>
             <form onSubmit={handleSubmitGroup} className="p-6 space-y-4">
                <Input label={t('members.formGroupName')} value={groupForm.name} onChange={(e) => setGroupForm({...groupForm, name: e.target.value})} required placeholder={t('members.formGroupPlaceholder')} />
                <div className="flex gap-2 pt-2">
                   <Button type="button" variant="secondary" className="flex-1" onClick={() => setIsGroupModalOpen(false)}>{t('common.cancel') || 'Cancel'}</Button>
                   <Button type="submit" variant="primary" className="flex-1">{t('common.save') || 'Save'}</Button>
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
              <Button type="button" variant="secondary" className="flex-1" onClick={() => setConfirmDialog({ isOpen: false })}>{t('common.cancel') || 'Cancel'}</Button>
              <Button type="button" variant="primary" className={`flex-1 ${confirmDialog.type === 'danger' ? 'bg-rose-500 hover:bg-rose-600 focus:ring-rose-500/20' : ''}`} onClick={confirmDialog.onConfirm}>
                {confirmDialog.confirmText}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}