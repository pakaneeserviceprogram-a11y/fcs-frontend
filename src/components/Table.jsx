import React from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';

export default function Table({
  columns = [],
  data = [],
  isLoading = false,
  emptyMessage = "ไม่มีข้อมูล",
  sortConfig,
  onSort
}) {

  const getAlignClass = (align) => {
    if (align === 'center') return 'text-center';
    if (align === 'right') return 'text-right';
    return 'text-left';
  };

  const getJustifyClass = (align) => {
    if (align === 'center') return 'justify-center';
    if (align === 'right') return 'justify-end';
    return 'justify-start';
  };

  return (
    <div className="w-full overflow-x-auto">

      <table className="w-full text-left border-collapse">

        <thead>

          <tr className="bg-slate-50 border-b border-slate-200">

            {columns.map((col, idx) => (

              <th
                key={idx}

                onClick={() =>
                  col.accessor && onSort && onSort(col.accessor)
                }

                className={`py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider transition-colors
                ${getAlignClass(col.align)}
                ${col.accessor && onSort ? 'cursor-pointer select-none hover:bg-slate-200/60' : ''}
                `}
              >

                <div className={`flex items-center gap-1 ${getJustifyClass(col.align)}`}>

                  {col.header}

                  {sortConfig && sortConfig.key === col.accessor && (

                    sortConfig.direction === 'asc'
                      ? <ChevronUp size={14} className="text-emerald-500" />
                      : <ChevronDown size={14} className="text-emerald-500" />

                  )}

                </div>

              </th>

            ))}

          </tr>

        </thead>

        <tbody className="divide-y divide-slate-100">

          {isLoading ? (

            <tr>
              <td colSpan={columns.length} className="text-center py-8 text-slate-500 font-medium">
                กำลังโหลดข้อมูล...
              </td>
            </tr>

          ) : !data || data.length === 0 ? (

            <tr>
              <td colSpan={columns.length} className="text-center py-8 text-slate-500 font-medium">
                {emptyMessage}
              </td>
            </tr>

          ) : (

            data.map((row, rowIndex) => (

              <tr
                key={row.id || row.MemberID || rowIndex}
                className="hover:bg-slate-50/80 transition-colors"
              >

                {columns.map((col, colIndex) => (

                  <td
                    key={colIndex}
                    className={`py-4 px-6 ${getAlignClass(col.align)}`}
                  >

                    {col.render
                      ? col.render(row)
                      : col.accessor
                        ? row[col.accessor]
                        : null}

                  </td>

                ))}

              </tr>

            ))

          )}

        </tbody>

      </table>

    </div>
  );
}