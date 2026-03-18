import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next'; 
import { 
  LayoutDashboard, Users, Store, Gift, ShieldCheck, 
  MonitorSmartphone, Megaphone, Globe, CalendarDays, CreditCard,
  Menu, X
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
  
  // 💡 กำหนดค่าเริ่มต้น: ถ้าเป็นจอ PC ให้เปิดค้างไว้ (>1024px) ถ้าจอมือถือให้ปิดไว้
  const [isSidebarOpen, setIsSidebarOpen] = useState(
    typeof window !== 'undefined' ? window.innerWidth >= 1024 : true
  );

  // 💡 เช็คการย่อขยายหน้าจออัตโนมัติ
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsSidebarOpen(true);
      } else {
        setIsSidebarOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleLanguage = () => {
    const newLang = i18n.language === 'th' ? 'en' : 'th';
    i18n.changeLanguage(newLang);
  };

  const getPageTitle = () => {
    switch(activeTab) {
      case 'vendors': return t('menu.vendors');
      case 'members': return t('menu.members');
      case 'welfare': return t('menu.welfare');
      case 'promos': return t('menu.promos');
      case 'menuSchedules': return t('menu.menuSchedule'); 
      case 'terminals': return t('menu.terminals');
      case 'users': return t('menu.users');
      default: return t('menu.dashboard');
    }
  };

  // 💡 ฟังก์ชันกดเมนู: ถ้าเป็นมือถือให้หุบเมนูทันที ถ้าเป็น PC ให้เปิดค้างไว้
  const handleMenuClick = (tab) => {
    setActiveTab(tab);
    if (window.innerWidth < 1024) {
      setIsSidebarOpen(false); 
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-900 overflow-hidden relative">
      
      {/* ฉากกั้นสีดำ (Overlay) โชว์เฉพาะตอนเปิดเมนูบนมือถือ/แท็บเล็ต (lg:hidden) */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-30 lg:hidden transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* 🟢 SIDEBAR */}
      {/* 💡 อัปเดต Class ใหม่: ใช้ -ml-64 บน PC เพื่อดึงเมนูซ่อนไปด้านซ้าย และให้พื้นที่ขยายเต็ม */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-slate-900 text-slate-300 flex flex-col transition-all duration-300 ease-in-out shadow-2xl
        lg:shadow-none lg:relative 
        ${isSidebarOpen ? 'translate-x-0 lg:ml-0' : '-translate-x-full lg:-ml-64'}
      `}>
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800 bg-slate-900/50 shrink-0">
          <div className="flex items-center gap-2 text-white font-bold text-xl tracking-wide">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center shrink-0">
               <CreditCard size={20} className="text-slate-900" />
            </div>
            FCS <span className="text-emerald-400 font-light">Ultimate</span>
          </div>
          {/* ปุ่มปิด (X) โชว์เฉพาะบนมือถือ */}
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-slate-400 hover:text-white transition-colors shrink-0">
            <X size={24} />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto py-6 px-4">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 px-2">Operation & Sales</p>
          <nav className="space-y-1 mb-6">
            <NavItem icon={Users} label={t('menu.members')} isActive={activeTab === 'members'} onClick={() => handleMenuClick('members')} /> 
            <NavItem icon={Store} label={t('menu.vendors')} isActive={activeTab === 'vendors'} onClick={() => handleMenuClick('vendors')} />
            
            <NavItem icon={Gift} label={t('menu.welfare')} isActive={activeTab === 'welfare'} onClick={() => handleMenuClick('welfare')} />
            <NavItem icon={Megaphone} label={t('menu.promos')} isActive={activeTab === 'promos'} onClick={() => handleMenuClick('promos')} />
            
            <NavItem icon={CalendarDays} label={t('menu.menuSchedule')} isActive={activeTab === 'menuSchedules'} onClick={() => handleMenuClick('menuSchedules')} />
            
            <NavItem icon={MonitorSmartphone} label={t('menu.terminals')} isActive={activeTab === 'terminals'} onClick={() => handleMenuClick('terminals')} />
            <NavItem icon={ShieldCheck} label={t('menu.users')} isActive={activeTab === 'users'} onClick={() => handleMenuClick('users')} />
            <NavItem icon={LayoutDashboard} label={t('menu.dashboard')} isActive={activeTab === 'dashboard'} onClick={() => handleMenuClick('dashboard')} />
          </nav>
        </div>
      </aside>

      {/* 🟢 MAIN CONTENT */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative bg-slate-50">
        <header className="h-16 bg-white/90 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-4 md:px-8 z-10 sticky top-0 shrink-0">
          
          <div className="flex items-center gap-3">
            {/* 💡 นำ lg:hidden ออก เพื่อให้ปุ่ม Hamburger โชว์บน PC ตลอดเวลา */}
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
              className="p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <Menu size={24} />
            </button>
            <h1 className="font-semibold text-slate-800 text-lg truncate">
              {getPageTitle()}
            </h1>
          </div>

          <button 
            onClick={toggleLanguage}
            className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-50 shadow-sm transition-colors shrink-0"
          >
            <Globe size={16} className="text-emerald-500" />
            {i18n.language === 'th' ? 'EN' : 'TH'}
          </button>
        </header>

        <div className="flex-1 overflow-auto p-4 sm:p-6 md:p-8">
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
      <span className="text-sm tracking-wide text-left truncate">{label}</span>
    </button>
  );
}