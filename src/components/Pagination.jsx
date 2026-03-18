import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Pagination({ meta, onPageChange }) {
  if (!meta || meta.totalPages <= 1) return null; // ถ้ามีหน้าเดียว ไม่ต้องโชว์ปุ่ม

  return (
    <div className="flex items-center justify-between px-6 py-4 bg-white border-t border-slate-200">
      <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-slate-500">
            แสดง <span className="font-bold text-slate-700">{(meta.currentPage - 1) * meta.itemsPerPage + 1}</span> ถึง <span className="font-bold text-slate-700">{Math.min(meta.currentPage * meta.itemsPerPage, meta.totalItems)}</span> จากทั้งหมด <span className="font-bold text-slate-700">{meta.totalItems}</span> รายการ
          </p>
        </div>
        <div>
          <nav className="relative z-0 inline-flex rounded-lg shadow-sm -space-x-px">
            <button 
              onClick={() => onPageChange(meta.currentPage - 1)} 
              disabled={meta.currentPage === 1} 
              className="relative inline-flex items-center px-3 py-2 rounded-l-lg border border-slate-300 bg-white text-sm font-bold text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={16} /> <span className="ml-1">ก่อนหน้า</span>
            </button>
            <span className="relative inline-flex items-center px-4 py-2 border border-slate-300 bg-slate-50 text-sm font-bold text-slate-700">
              หน้า {meta.currentPage} / {meta.totalPages}
            </span>
            <button 
              onClick={() => onPageChange(meta.currentPage + 1)} 
              disabled={meta.currentPage === meta.totalPages} 
              className="relative inline-flex items-center px-3 py-2 rounded-r-lg border border-slate-300 bg-white text-sm font-bold text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <span className="mr-1">ถัดไป</span> <ChevronRight size={16} />
            </button>
          </nav>
        </div>
      </div>
    </div>
  );
}