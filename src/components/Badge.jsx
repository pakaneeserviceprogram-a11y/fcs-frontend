import React from 'react';

export default function Badge({ status, text }) {
  // กำหนดสีตามสถานะมาตรฐาน
  const styles = {
    ACTIVE: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    INACTIVE: 'bg-slate-100 text-slate-500 border-slate-200',
    PENDING: 'bg-amber-100 text-amber-700 border-amber-200',
    FROZEN: 'bg-rose-100 text-rose-700 border-rose-200',
    DEFAULT: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  };

  // ถ้าส่ง status แปลกๆ มา ให้ใช้สี DEFAULT
  const badgeStyle = styles[status] || styles.DEFAULT;

  return (
    <span className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-full border ${badgeStyle}`}>
      {text || status}
    </span>
  );
}