// @ts-nocheck
// Payout Table Component with TanStack Table
'use client';

import React, { useMemo } from 'react';
// @ts-ignore - table package resolved at runtime, suppress type resolution locally
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  createColumnHelper,
  SortingState,
  ColumnDef,
} from '@tanstack/react-table';
import { PayoutRequest, PayoutStatus, PayoutMethod } from '@/types/payout.types';
import { 
  CheckCircleIcon, 
  XCircleIcon, 
  ClockIcon,
  EyeIcon,
  ChevronUpIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface Props {
  payouts: PayoutRequest[];
  onViewDetails: (payoutId: string) => void;
}

const columnHelper = createColumnHelper<PayoutRequest>();

export default function PayoutTable({ payouts, onViewDetails }: Props) {
  const [sorting, setSorting] = React.useState<SortingState>([]);

  const columns: ColumnDef<PayoutRequest, any>[] = useMemo(
    () => [
      columnHelper.accessor('user', {
        header: 'المستخدم',
        cell: (info) => {
          const user = info.getValue();
          return (
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-semibold">
                  {user?.name?.charAt(0) || 'U'}
                </span>
              </div>
              <div>
                <div className="font-medium text-gray-900 flex items-center gap-2">
                  {user?.name || 'مستخدم'}
                  {user?.isVerified && (
                    <CheckCircleIcon className="h-4 w-4 text-green-500" title="موثق" />
                  )}
                </div>
                <div className="text-sm text-gray-500">{user?.email || '-'}</div>
              </div>
            </div>
          );
        },
      }),
      columnHelper.accessor('amount', {
        header: 'المبلغ',
        cell: (info) => (
          <div className="font-semibold text-gray-900">
            ${info.getValue().toLocaleString()}
            <span className="text-xs text-gray-500 mr-1">
              {info.row.original.currency}
            </span>
          </div>
        ),
      }),
      columnHelper.accessor('method', {
        header: 'الطريقة',
        cell: (info) => {
          const methodLabels = {
            [PayoutMethod.BANK_TRANSFER]: 'تحويل بنكي',
            [PayoutMethod.PAYPAL]: 'PayPal',
            [PayoutMethod.STRIPE_TRANSFER]: 'Stripe',
          };
          return (
            <span className="text-sm text-gray-700">
              {methodLabels[info.getValue()]}
            </span>
          );
        },
      }),
      columnHelper.accessor('requestedAt', {
        header: 'تاريخ الطلب',
        cell: (info) => (
          <div className="text-sm text-gray-600">
            {format(new Date(info.getValue()), 'dd MMM yyyy', { locale: ar })}
            <div className="text-xs text-gray-400">
              {format(new Date(info.getValue()), 'HH:mm')}
            </div>
          </div>
        ),
      }),
      columnHelper.accessor('status', {
        header: 'الحالة',
        cell: (info) => {
          const status = info.getValue();
          const statusConfig: Record<PayoutStatus, { label: string; className: string; icon: any }> = {
            [PayoutStatus.PENDING]: {
              label: 'معلق',
              className: 'bg-yellow-100 text-yellow-800',
              icon: ClockIcon,
            },
            [PayoutStatus.APPROVED]: {
              label: 'موافق عليه',
              className: 'bg-blue-100 text-blue-800',
              icon: CheckCircleIcon,
            },
            [PayoutStatus.PROCESSING]: {
              label: 'قيد المعالجة',
              className: 'bg-purple-100 text-purple-800',
              icon: ClockIcon,
            },
            [PayoutStatus.COMPLETED]: {
              label: 'مكتمل',
              className: 'bg-green-100 text-green-800',
              icon: CheckCircleIcon,
            },
            [PayoutStatus.REJECTED]: {
              label: 'مرفوض',
              className: 'bg-red-100 text-red-800',
              icon: XCircleIcon,
            },
          };

          const config = statusConfig[status];
          const Icon = config.icon;

          return (
            <span
              className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${config.className}`}
            >
              <Icon className="h-4 w-4" />
              {config.label}
            </span>
          );
        },
      }),
      columnHelper.display({
        id: 'actions',
        header: 'الإجراءات',
        cell: (info) => (
          <button
            onClick={() => onViewDetails(info.row.original.id)}
            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
          >
            <EyeIcon className="h-4 w-4" />
            عرض التفاصيل
          </button>
        ),
      }),
    ],
    [onViewDetails]
  );

  const table = useReactTable({
    data: payouts,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  if (payouts.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
        <div className="text-gray-400 mb-4">
          <ClockIcon className="h-16 w-16 mx-auto" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          لا توجد طلبات سحب
        </h3>
        <p className="text-gray-500">
          لم يتم العثور على أي طلبات سحب تطابق الفلاتر المحددة
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    <div className="flex items-center gap-2">
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                      {header.column.getIsSorted() && (
                        <span>
                          {header.column.getIsSorted() === 'asc' ? (
                            <ChevronUpIcon className="h-4 w-4" />
                          ) : (
                            <ChevronDownIcon className="h-4 w-4" />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                className="hover:bg-gray-50 transition-colors"
              >
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-6 py-4 whitespace-nowrap">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex items-center justify-between">
        <div className="text-sm text-gray-700">
          عرض <span className="font-medium">{payouts.length}</span> من النتائج
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed">
            السابق
          </button>
          <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed">
            التالي
          </button>
        </div>
      </div>
    </div>
  );
}
