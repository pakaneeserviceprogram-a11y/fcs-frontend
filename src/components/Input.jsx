import React from 'react';

export default function Input({ label, type = 'text', value, onChange, placeholder, disabled, required, min, max, step }) {
  return (
    <div>
      {label && <label className="block text-sm font-bold text-slate-700 mb-1">{label}</label>}
      <input 
        type={type} 
        required={required}
        disabled={disabled}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        min={min} max={max} step={step}
        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 disabled:opacity-50 transition-colors"
      />
    </div>
  );
}