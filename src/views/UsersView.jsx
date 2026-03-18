import React, { useState, useMemo, useCallback } from 'react';
import { Plus, Edit2, X, Shield, Users, AlertCircle, CheckCircle, Key, CheckSquare, Square } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import Button from '../components/Button';
import Badge from '../components/Badge';
import Input from '../components/Input';
import Card from '../components/Card';
import Table from '../components/Table';
import PageHeader from '../components/PageHeader';

// 💡 โมดูลทั้งหมดในระบบ สำหรับนำไปสร้างตารางสิทธิ์ (Permission Matrix)
const SYSTEM_MODULES = [
  { key: 'DASHBOARD', label: 'ภาพรวมระบบ (Dashboard)' },
  { key: 'MEMBERS', label: 'จัดการสมาชิกและบัตร' },
  { key: 'VENDORS', label: 'ร้านค้าและเมนูอาหาร' },
  { key: 'FINANCE', label: 'การเงินและการชำระเงิน' },
  { key: 'PROMO', label: 'โปรโมชั่นและสวัสดิการ' },
  { key: 'SYSTEM', label: 'ตั้งค่าระบบและอุปกรณ์' }
];

export default function UsersView() {
  const { t } = useTranslation();

  const [subTab, setSubTab] = useState('users'); 
  const [alertMsg, setAlertMsg] = useState({ type: '', text: '' });

  // --- MOCK DATA (แทนที่ด้วย API ของจริง) ---
  const [users, setUsers] = useState([
    { id: 1, username: 'admin', fullName: 'Super Administrator', role: 'System Admin', status: 'ACTIVE' },
    { id: 2, username: 'cashier01', fullName: 'สมศรี ใจดี', role: 'Cashier', status: 'ACTIVE' },
    { id: 3, username: 'manager_a', fullName: 'ผู้จัดการ เอ', role: 'Store Manager', status: 'INACTIVE' }
  ]);

  const [roles, setRoles] = useState([
    { id: 1, name: 'System Admin', usersCount: 1, isSystem: true },
    { id: 2, name: 'Store Manager', usersCount: 1, isSystem: false },
    { id: 3, name: 'Cashier', usersCount: 5, isSystem: false }
  ]);

  // --- Modals State ---
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add');

  const [userForm, setUserForm] = useState({ username: '', password: '', fullName: '', role: '', isActive: true });
  
  // 💡 State สำหรับเก็บสิทธิ์ (Permissions) เป็น Object แบบ { MODULE_ACTION: boolean }
  const [roleForm, setRoleForm] = useState({ name: '', permissions: {} });

  const showBanner = (type, message) => {
    setAlertMsg({ type, text: message });
    setTimeout(() => setAlertMsg({ type: '', text: '' }), 4000);
  };

  // ==========================================
  // 🟢 Handlers (Users)
  // ==========================================
  const openUserModal = (user = null) => {
    setModalMode(user ? 'edit' : 'add');
    setUserForm(user ? { ...user, password: '' } : { username: '', password: '', fullName: '', role: '', isActive: true });
    setIsUserModalOpen(true);
  };

  const handleUserSubmit = (e) => {
    e.preventDefault();
    showBanner('success', modalMode === 'edit' ? 'อัปเดตข้อมูลผู้ใช้สำเร็จ' : 'สร้างผู้ใช้ใหม่สำเร็จ');
    setIsUserModalOpen(false);
  };

  // ==========================================
  // 🟢 Handlers (Roles & Permissions Matrix)
  // ==========================================
  const openRoleModal = (role = null) => {
    setModalMode(role ? 'edit' : 'add');
    
    // จำลองการดึงสิทธิ์เก่ามาโชว์ (ถ้าเป็น Admin ให้ติ๊กถูกหมด)
    let initialPerms = {};
    if (role && role.name === 'System Admin') {
      SYSTEM_MODULES.forEach(m => {
        initialPerms[`${m.key}_VIEW`] = true; initialPerms[`${m.key}_ADD`] = true;
        initialPerms[`${m.key}_EDIT`] = true; initialPerms[`${m.key}_DELETE`] = true;
      });
    }

    setRoleForm({ name: role ? role.name : '', permissions: initialPerms });
    setIsRoleModalOpen(true);
  };

  const togglePermission = (moduleKey, action) => {
    const permKey = `${moduleKey}_${action}`;
    setRoleForm(prev => ({
      ...prev,
      permissions: { ...prev.permissions, [permKey]: !prev.permissions[permKey] }
    }));
  };

  const handleRoleSubmit = (e) => {
    e.preventDefault();
    console.log("Permissions to Save:", roleForm.permissions); // ดูค่าที่จะส่งไป API
    showBanner('success', modalMode === 'edit' ? 'อัปเดตกลุ่มสิทธิ์สำเร็จ' : 'สร้างกลุ่มสิทธิ์สำเร็จ');
    setIsRoleModalOpen(false);
  };

  // ==========================================
  // 🟢 Table Columns
  // ==========================================
  const userColumns = [
    { header: t('users.colUsername'), accessor: 'username', render: (u) => <div className="font-bold text-slate-800 flex items-center gap-2"><Key size={14} className="text-slate-400"/> {u.username}</div> },
    { header: t('users.colFullName'), accessor: 'fullName', render: (u) => <span className="text-sm text-slate-600">{u.fullName}</span> },
    { header: t('users.colRole'), accessor: 'role', render: (u) => <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-md border border-indigo-100">{u.role}</span> },
    { header: t('users.colStatus'), accessor: 'status', align: 'center', render: (u) => <Badge status={u.status} /> },
    { header: t('users.colAction'), align: 'right', render: (u) => <Button variant="ghost" icon={Edit2} onClick={() => openUserModal(u)} /> }
  ];

  const roleColumns = [
    { header: 'Role Name', accessor: 'name', render: (r) => <span className="font-bold text-slate-800 flex items-center gap-2"><Shield size={16} className={r.isSystem ? 'text-amber-500' : 'text-slate-400'}/> {r.name}</span> },
    { header: 'Active Users', accessor: 'usersCount', align: 'center', render: (r) => <span className="font-bold text-slate-600">{r.usersCount}</span> },
    { header: t('users.colAction'), align: 'right', render: (r) => <Button variant="ghost" icon={Edit2} onClick={() => openRoleModal(r)} disabled={r.isSystem} title={r.isSystem ? 'System Roles cannot be edited' : 'Edit Role'} /> }
  ];

  return (
    <div className="max-w-7xl mx-auto flex flex-col h-[calc(100vh-100px)] p-4 space-y-4">
      {alertMsg.text && (
        <div className="border-l-4 p-4 rounded-r-xl flex items-center gap-3 animate-in fade-in bg-emerald-50 border-emerald-500 shrink-0 shadow-sm">
          <CheckCircle className="text-emerald-500" size={20} />
          <p className="text-sm font-bold text-emerald-700">{alertMsg.text}</p>
        </div>
      )}

      {/* TABS */}
      <div className="flex gap-2 bg-slate-200/50 p-1 rounded-xl w-max shrink-0">
        <button onClick={() => setSubTab('users')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${subTab === 'users' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>{t('users.tabUsers')}</button>
        <button onClick={() => setSubTab('roles')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${subTab === 'roles' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>{t('users.tabRoles')}</button>
      </div>

      <PageHeader 
        title={t('users.title') || 'User & Role Management'}
        subtitle={t('users.subtitle') || 'จัดการผู้ใช้งานและสิทธิ์ในระบบ'}
        actions={<Button variant="primary" icon={Plus} onClick={() => subTab === 'users' ? openUserModal() : openRoleModal()}>{subTab === 'users' ? t('users.addUser') : t('users.addRole')}</Button>}
      />

      <Card className="flex flex-col flex-1 overflow-hidden shadow-sm border border-slate-200 bg-white">
        <div className="flex-1 overflow-auto p-1">
          {subTab === 'users' ? (
            <Table columns={userColumns} data={users} emptyMessage="No users found." />
          ) : (
            <Table columns={roleColumns} data={roles} emptyMessage="No roles found." />
          )}
        </div>
      </Card>

      {/* 👤 MODAL: USER FORM */}
      {isUserModalOpen && (
        <div className="fixed inset-0 z-[60] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in duration-200">
            <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50">
              <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2"><Users className="text-emerald-500"/> {modalMode === 'add' ? t('users.addUser') : t('common.edit')}</h3>
              <button type="button" onClick={() => setIsUserModalOpen(false)} className="text-slate-400 hover:text-rose-500"><X size={20} /></button>
            </div>
            <form onSubmit={handleUserSubmit} className="p-6 space-y-4">
              <Input label={t('users.colUsername')} value={userForm.username} onChange={e => setUserForm({...userForm, username: e.target.value})} required disabled={modalMode === 'edit'} />
              <Input label="Password" type="password" value={userForm.password} onChange={e => setUserForm({...userForm, password: e.target.value})} required={modalMode === 'add'} placeholder={modalMode === 'edit' ? '(ปล่อยว่างถ้าไม่ต้องการเปลี่ยน)' : ''} />
              <Input label={t('users.colFullName')} value={userForm.fullName} onChange={e => setUserForm({...userForm, fullName: e.target.value})} required />
              
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">{t('users.colRole')}</label>
                <select className="w-full border border-slate-200 rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20" value={userForm.role} onChange={e => setUserForm({...userForm, role: e.target.value})} required>
                  <option value="" disabled>-- เลือกกลุ่มสิทธิ์ --</option>
                  {roles.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
                </select>
              </div>

              {modalMode === 'edit' && (
                <div className="space-y-1 pt-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">{t('common.status')}</label>
                  <select className="w-full border border-slate-200 rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20" value={userForm.isActive ? 'ACTIVE' : 'INACTIVE'} onChange={e => setUserForm({...userForm, isActive: e.target.value === 'ACTIVE'})}>
                    <option value="ACTIVE">ACTIVE (ใช้งานได้)</option>
                    <option value="INACTIVE">INACTIVE (ระงับบัญชี)</option>
                  </select>
                </div>
              )}
              <div className="flex gap-2 pt-4 border-t border-slate-100">
                <Button type="button" variant="secondary" className="flex-1" onClick={() => setIsUserModalOpen(false)}>{t('common.cancel')}</Button>
                <Button type="submit" variant="primary" className="flex-1">{t('common.save')}</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 🛡️ MODAL: ROLE & PERMISSION MATRIX */}
      {isRoleModalOpen && (
        <div className="fixed inset-0 z-[60] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in duration-200 flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50 shrink-0">
              <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2"><Shield className="text-emerald-500"/> {modalMode === 'add' ? t('users.addRole') : 'แก้ไขกลุ่มสิทธิ์'}</h3>
              <button type="button" onClick={() => setIsRoleModalOpen(false)} className="text-slate-400 hover:text-rose-500"><X size={20} /></button>
            </div>

            <form onSubmit={handleRoleSubmit} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-6 pb-2 shrink-0">
                <Input label="ชื่อกลุ่มสิทธิ์ (Role Name)" value={roleForm.name} onChange={e => setRoleForm({...roleForm, name: e.target.value})} required placeholder="เช่น ผู้จัดการสาขา, แคชเชียร์" />
              </div>
              
              {/* 💡 Permission Matrix Table */}
              <div className="p-6 pt-2 flex-1 overflow-auto">
                <p className="text-xs font-bold text-slate-500 uppercase mb-3">{t('users.roleMatrix')}</p>
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="py-3 px-4 font-bold text-slate-600">Module / Menu</th>
                        <th className="py-3 px-2 text-center font-bold text-slate-600">{t('users.permView')}</th>
                        <th className="py-3 px-2 text-center font-bold text-slate-600">{t('users.permAdd')}</th>
                        <th className="py-3 px-2 text-center font-bold text-slate-600">{t('users.permEdit')}</th>
                        <th className="py-3 px-2 text-center font-bold text-rose-600">{t('users.permDelete')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {SYSTEM_MODULES.map(module => (
                        <tr key={module.key} className="hover:bg-slate-50/50">
                          <td className="py-3 px-4 font-medium text-slate-800">{module.label}</td>
                          {['VIEW', 'ADD', 'EDIT', 'DELETE'].map(action => {
                            const isChecked = roleForm.permissions[`${module.key}_${action}`];
                            return (
                              <td key={action} className="py-3 px-2 text-center">
                                <button 
                                  type="button"
                                  onClick={() => togglePermission(module.key, action)}
                                  className={`p-1 rounded transition-colors ${isChecked ? (action === 'DELETE' ? 'text-rose-500' : 'text-emerald-500') : 'text-slate-300 hover:text-slate-400'}`}
                                >
                                  {isChecked ? <CheckSquare size={20} /> : <Square size={20} />}
                                </button>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex gap-2 p-6 border-t border-slate-100 shrink-0 bg-slate-50">
                <Button type="button" variant="secondary" className="flex-1" onClick={() => setIsRoleModalOpen(false)}>{t('common.cancel')}</Button>
                <Button type="submit" variant="primary" className="flex-[2]">{t('common.save')}</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}