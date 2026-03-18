import React from 'react';

export default function Button({ 
  children,       // ข้อความในปุ่ม (ถ้ามี)
  icon: Icon,     // รูปไอคอนจาก lucide-react (ถ้ามี)
  variant = 'primary', // ประเภทปุ่ม: primary, secondary, danger, ghost, outline
  onClick, 
  disabled = false,
  className = '', // เผื่ออยากเติม class พิเศษเฉพาะจุด
  title = '',     // ข้อความ Tooltip เวลาเอาเมาส์ชี้
  type = 'button' // ชนิดปุ่ม (button, submit, reset)
}) {

  // 1. กำหนดสีปุ่มตาม Variant มาตรฐาน Enterprise
  const variants = {
    primary:   'bg-emerald-600 text-white shadow-sm hover:bg-emerald-700 focus:ring-emerald-500/20',
    secondary: 'bg-white border border-slate-200 text-slate-700 shadow-sm hover:bg-slate-50 focus:ring-slate-500/20',
    danger:    'bg-rose-600 text-white shadow-sm hover:bg-rose-700 focus:ring-rose-500/20',
    ghost:     'bg-transparent text-slate-400 hover:text-emerald-600 hover:bg-emerald-50', // สำหรับปุ่ม Edit ในตาราง
    outline:   'bg-slate-50 border border-slate-200 text-slate-600 hover:bg-white hover:text-emerald-600 hover:border-emerald-200' // แบบ Hybrid มีกรอบ
  };

  // 2. เช็คว่ามีข้อความไหม? ถ้ามีให้ปุ่มกว้างปกติ (px-4) ถ้าไม่มีให้เป็นปุ่มสี่เหลี่ยมจัตุรัส (p-1.5)
  const sizing = children ? 'px-4 py-2' : 'p-1.5';

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`
        flex items-center justify-center gap-2 rounded-lg text-sm font-bold transition-all duration-200
        focus:outline-none focus:ring-2 focus:ring-offset-1
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variants[variant]} 
        ${sizing} 
        ${className}
      `}
    >
      {/* ถ้ามีการส่ง Icon มา ให้โชว์ Icon */}
      {Icon && <Icon size={16} />}
      
      {/* ถ้ามีการส่งข้อความมา ให้โชว์ข้อความ */}
      {children && <span>{children}</span>}
    </button>
  );
}