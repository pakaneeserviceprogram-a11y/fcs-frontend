import React, { useState } from 'react';
import { useTranslation } from 'react-i18next'; 
import { 
  LayoutDashboard, Users, Store, Gift, ShieldCheck, 
  MonitorSmartphone, Megaphone, Globe, CalendarDays, CreditCard 
} from 'lucide-react'; 

// นำเข้าหน้าจอต่างๆ
import VendorsView from './views/VendorsView'; 
import MembersView from './views/MembersView'; 
import WelfareView from './views/WelfareView'; 
import PromotionsView from './views/PromotionsView'; 
import TerminalsView from './views/TerminalsView';
import UsersView from './views/UsersView';
import MenuSchedulingView from './views/MenuSchedulingView'; 

export default function App() {
  const [activeTab, setActiveTab] = useState('vendors'); 
  const { t, i18n } = useTranslation(); 

  // ฟังก์ชันสำหรับกดสลับภาษา
  const toggleLanguage = () => {
    const newLang = i18n.language === 'th' ? 'en' : 'th';
    i18n.changeLanguage(newLang);
  };

  // 💡 ดึงชื่อ Title จาก i18n 100% (ไม่ต้องใส่ || ภาษาไทย แล้ว)
  const getPageTitle = () => {
    switch(activeTab) {
      case 'vendors': return t('menu.vendors');
      case 'members': return t('menu.members');
      case 'welfare': return t('menu.welfare');
      case 'promos': return t('menu.promos');
      case 'menuSchedules': return t('menu.menuSchedule'); // 💡 แก้ key ให้ตรงกับ JSON (ไม่มี s)
      case 'terminals': return t('menu.terminals');
      case 'users': return t('menu.users');
      default: return t('menu.dashboard');
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-900">
      {/* SIDEBAR */}
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col transition-all duration-300 z-20 shadow-xl overflow-hidden shrink-0">
        <div className="h-16 flex items-center px-6 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-2 text-white font-bold text-xl tracking-wide">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
               <CreditCard size={20} className="text-slate-900" />
            </div>
            FCS <span className="text-emerald-400 font-light">Ultimate</span>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto py-6 px-4">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 px-2">Operation & Sales</p>
          <nav className="space-y-1 mb-6">
            <NavItem icon={Users} label={t('menu.members')} isActive={activeTab === 'members'} onClick={() => setActiveTab('members')} /> 
            <NavItem icon={Store} label={t('menu.vendors')} isActive={activeTab === 'vendors'} onClick={() => setActiveTab('vendors')} />
            
            <NavItem icon={Gift} label={t('menu.welfare')} isActive={activeTab === 'welfare'} onClick={() => setActiveTab('welfare')} />
            <NavItem icon={Megaphone} label={t('menu.promos')} isActive={activeTab === 'promos'} onClick={() => setActiveTab('promos')} />
            
            {/* 💡 แก้คีย์เป็น t('menu.menuSchedule') ให้ตรง JSON */}
            <NavItem icon={CalendarDays} label={t('menu.menuSchedule')} isActive={activeTab === 'menuSchedules'} onClick={() => setActiveTab('menuSchedules')} />
            
            <NavItem icon={MonitorSmartphone} label={t('menu.terminals')} isActive={activeTab === 'terminals'} onClick={() => setActiveTab('terminals')} />
            <NavItem icon={ShieldCheck} label={t('menu.users')} isActive={activeTab === 'users'} onClick={() => setActiveTab('users')} />
            <NavItem icon={LayoutDashboard} label={t('menu.dashboard')} isActive={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
          </nav>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        <header className="h-16 bg-white/80 border-b border-slate-200 flex items-center justify-between px-8 z-10 sticky top-0 shrink-0">
          
          <h1 className="font-semibold text-slate-800 text-lg">
            {getPageTitle()}
          </h1>

          {/* ปุ่มสลับภาษา (TH / EN) */}
          <button 
            onClick={toggleLanguage}
            className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-50 shadow-sm transition-colors"
          >
            <Globe size={16} className="text-emerald-500" />
            {i18n.language === 'th' ? 'EN' : 'TH'}
          </button>
        </header>

        <div className="flex-1 overflow-auto p-6 md:p-8 bg-slate-50/50">
          {activeTab === 'vendors' && <VendorsView />}
          {activeTab === 'members' && <MembersView />}
          {activeTab === 'welfare' && <WelfareView />}
          {activeTab === 'promos' && <PromotionsView />}
          {activeTab === 'menuSchedules' && <MenuSchedulingView />}
          {activeTab === 'terminals' && <TerminalsView />}
          {activeTab === 'users' && <UsersView />}
          {activeTab === 'dashboard' && <div className="p-8 text-center text-slate-500">{t('menu.dashboard')}</div>}
        </div>
      </main>
    </div>
  );
}

// Component ปุ่มเมนูซ้ายมือ
function NavItem({ icon: Icon, label, isActive, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
        isActive ? 'bg-emerald-500/15 text-emerald-400 font-medium' : 'text-slate-400 hover:bg-slate-800/80 hover:text-white'
      }`}
    >
      <Icon size={18} strokeWidth={isActive ? 2.5 : 2} className={isActive ? 'text-emerald-400' : ''} />
      <span className="text-sm tracking-wide text-left">{label}</span>
    </button>
  );
}