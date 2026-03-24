// Payout Details Modal Component
'use client';

import React, { useState, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { 
  XMarkIcon, 
  CheckCircleIcon, 
  XCircleIcon,
  ClockIcon,
  BanknotesIcon,
  UserIcon,
  CalendarIcon,
} from '@heroicons/react/24/outline';
import { 
  usePayoutDetails, 
  useUserWalletHistory,
  useApprovePayout,
  useRejectPayout,
  useMarkAsProcessing,
  useCompletePayout,
} from '@/hooks/usePayouts';
import { PayoutStatus, PayoutMethod } from '@/types/payout.types';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface Props {
  payoutId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function PayoutDetailsModal({ payoutId, isOpen, onClose }: Props) {
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [completionNotes, setCompletionNotes] = useState('');
  const [showCompletionForm, setShowCompletionForm] = useState(false);

  const { data: payout, isLoading } = usePayoutDetails(payoutId);
  const { data: walletHistory } = useUserWalletHistory(payout?.userId || null);

  const approveMutation = useApprovePayout();
  const rejectMutation = useRejectPayout();
  const processingMutation = useMarkAsProcessing();
  const completeMutation = useCompletePayout();

  const handleApprove = async () => {
    if (!payoutId) return;
    await approveMutation.mutateAsync(payoutId);
    onClose();
  };

  const handleReject = async () => {
    if (!payoutId || !rejectionReason.trim()) return;
    await rejectMutation.mutateAsync({ id: payoutId, reason: rejectionReason });
    setRejectionReason('');
    setShowRejectForm(false);
    onClose();
  };

  const handleMarkAsProcessing = async () => {
    if (!payoutId) return;
    await processingMutation.mutateAsync(payoutId);
    onClose();
  };

  const handleComplete = async () => {
    if (!payoutId) return;
    await completeMutation.mutateAsync({ id: payoutId, notes: completionNotes });
    setCompletionNotes('');
    setShowCompletionForm(false);
    onClose();
  };

  const renderAccountDetails = () => {
    if (!payout?.accountDetails) return null;

    if (payout.method === PayoutMethod.BANK_TRANSFER) {
      const details = payout.accountDetails as any;
      return (
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-600">اسم صاحب الحساب:</span>
            <span className="font-medium">{details.accountHolderName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">اسم البنك:</span>
            <span className="font-medium">{details.bankName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">رقم الحساب:</span>
            <span className="font-mono font-medium">{details.accountNumber}</span>
          </div>
          {details.routingNumber && (
            <div className="flex justify-between">
              <span className="text-gray-600">Routing Number:</span>
              <span className="font-mono font-medium">{details.routingNumber}</span>
            </div>
          )}
          {details.iban && (
            <div className="flex justify-between">
              <span className="text-gray-600">IBAN:</span>
              <span className="font-mono font-medium">{details.iban}</span>
            </div>
          )}
          {details.swiftCode && (
            <div className="flex justify-between">
              <span className="text-gray-600">SWIFT Code:</span>
              <span className="font-mono font-medium">{details.swiftCode}</span>
            </div>
          )}
        </div>
      );
    }

    if (payout.method === PayoutMethod.PAYPAL) {
      const details = payout.accountDetails as any;
      return (
        <div className="flex justify-between">
          <span className="text-gray-600">البريد الإلكتروني:</span>
          <span className="font-medium">{details.email}</span>
        </div>
      );
    }

    if (payout.method === PayoutMethod.STRIPE_TRANSFER) {
      const details = payout.accountDetails as any;
      return (
        <div className="flex justify-between">
          <span className="text-gray-600">معرف الحساب:</span>
          <span className="font-mono font-medium">{details.accountId}</span>
        </div>
      );
    }

    return null;
  };

  const canApprove = payout?.status === PayoutStatus.PENDING;
  const canReject = payout?.status === PayoutStatus.PENDING;
  const canProcess = payout?.status === PayoutStatus.APPROVED;
  const canComplete = payout?.status === PayoutStatus.PROCESSING;

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose} dir="rtl">
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-2xl bg-white shadow-xl transition-all">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                  <Dialog.Title className="text-2xl font-bold text-gray-900">
                    تفاصيل طلب السحب
                  </Dialog.Title>
                  <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-500 transition-colors"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                {/* Content */}
                {isLoading ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                  </div>
                ) : payout ? (
                  <div className="p-6 space-y-6">
                    {/* User Info */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <UserIcon className="h-5 w-5" />
                        معلومات المستخدم
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="text-gray-600">الاسم:</span>
                          <p className="font-medium">{payout.user?.name || '-'}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">البريد الإلكتروني:</span>
                          <p className="font-medium">{payout.user?.email || '-'}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">الحالة:</span>
                          <p className="font-medium">
                            {payout.user?.isVerified ? (
                              <span className="text-green-600 flex items-center gap-1">
                                <CheckCircleIcon className="h-4 w-4" />
                                موثق
                              </span>
                            ) : (
                              <span className="text-yellow-600">غير موثق</span>
                            )}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Payout Details */}
                    <div className="bg-blue-50 rounded-lg p-4">
                      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <BanknotesIcon className="h-5 w-5" />
                        تفاصيل السحب
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="text-gray-600">المبلغ:</span>
                          <p className="text-2xl font-bold text-blue-600">
                            ${payout.amount.toLocaleString()} {payout.currency}
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-600">الطريقة:</span>
                          <p className="font-medium">
                            {payout.method === PayoutMethod.BANK_TRANSFER && 'تحويل بنكي'}
                            {payout.method === PayoutMethod.PAYPAL && 'PayPal'}
                            {payout.method === PayoutMethod.STRIPE_TRANSFER && 'Stripe'}
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-600">تاريخ الطلب:</span>
                          <p className="font-medium">
                            {format(new Date(payout.requestedAt), 'dd MMM yyyy HH:mm', {
                              locale: ar,
                            })}
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-600">الحالة:</span>
                          <p className="font-medium">{payout.status}</p>
                        </div>
                      </div>
                    </div>

                    {/* Account Details */}
                    <div className="bg-yellow-50 rounded-lg p-4">
                      <h3 className="text-lg font-semibold mb-4">تفاصيل الحساب</h3>
                      {renderAccountDetails()}
                    </div>

                    {/* Wallet History */}
                    {walletHistory && walletHistory.length > 0 && (
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                          <CalendarIcon className="h-5 w-5" />
                          سجل المحفظة (آخر 5 معاملات)
                        </h3>
                        <div className="space-y-2">
                          {walletHistory.slice(0, 5).map((transaction) => (
                            <div
                              key={transaction.id}
                              className="flex justify-between items-center py-2 border-b border-gray-200 last:border-0"
                            >
                              <div>
                                <p className="font-medium">{transaction.transactionType}</p>
                                <p className="text-xs text-gray-500">
                                  {format(new Date(transaction.createdAt), 'dd MMM yyyy HH:mm', {
                                    locale: ar,
                                  })}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="font-semibold">
                                  ${transaction.amount.toLocaleString()}
                                </p>
                                <p className="text-xs text-gray-500">{transaction.status}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Notes */}
                    {payout.notes && (
                      <div className="bg-green-50 rounded-lg p-4">
                        <h3 className="text-lg font-semibold mb-2">ملاحظات:</h3>
                        <p className="text-gray-700">{payout.notes}</p>
                      </div>
                    )}

                    {/* Rejection Reason */}
                    {payout.rejectionReason && (
                      <div className="bg-red-50 rounded-lg p-4">
                        <h3 className="text-lg font-semibold mb-2 text-red-800">
                          سبب الرفض:
                        </h3>
                        <p className="text-red-700">{payout.rejectionReason}</p>
                      </div>
                    )}

                    {/* Reject Form */}
                    {showRejectForm && (
                      <div className="bg-red-50 rounded-lg p-4">
                        <h3 className="text-lg font-semibold mb-2">سبب الرفض:</h3>
                        <textarea
                          value={rejectionReason}
                          onChange={(e) => setRejectionReason(e.target.value)}
                          placeholder="اكتب سبب رفض الطلب..."
                          rows={4}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                        />
                      </div>
                    )}

                    {/* Completion Form */}
                    {showCompletionForm && (
                      <div className="bg-green-50 rounded-lg p-4">
                        <h3 className="text-lg font-semibold mb-2">ملاحظات الإتمام:</h3>
                        <textarea
                          value={completionNotes}
                          onChange={(e) => setCompletionNotes(e.target.value)}
                          placeholder="أضف ملاحظات (اختياري)..."
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-6 text-center text-gray-500">
                    لم يتم العثور على تفاصيل الطلب
                  </div>
                )}

                {/* Actions */}
                {payout && (
                  <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex flex-wrap gap-3 justify-end">
                    {canApprove && (
                      <button
                        onClick={handleApprove}
                        disabled={approveMutation.isPending}
                        className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
                      >
                        <CheckCircleIcon className="h-5 w-5" />
                        الموافقة
                      </button>
                    )}

                    {canReject && !showRejectForm && (
                      <button
                        onClick={() => setShowRejectForm(true)}
                        className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
                      >
                        <XCircleIcon className="h-5 w-5" />
                        رفض
                      </button>
                    )}

                    {showRejectForm && (
                      <>
                        <button
                          onClick={handleReject}
                          disabled={rejectMutation.isPending || !rejectionReason.trim()}
                          className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                        >
                          تأكيد الرفض
                        </button>
                        <button
                          onClick={() => {
                            setShowRejectForm(false);
                            setRejectionReason('');
                          }}
                          className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-100"
                        >
                          إلغاء
                        </button>
                      </>
                    )}

                    {canProcess && (
                      <button
                        onClick={handleMarkAsProcessing}
                        disabled={processingMutation.isPending}
                        className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2"
                      >
                        <ClockIcon className="h-5 w-5" />
                        بدء المعالجة
                      </button>
                    )}

                    {canComplete && !showCompletionForm && (
                      <button
                        onClick={() => setShowCompletionForm(true)}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                      >
                        <CheckCircleIcon className="h-5 w-5" />
                        إتمام السحب
                      </button>
                    )}

                    {showCompletionForm && (
                      <>
                        <button
                          onClick={handleComplete}
                          disabled={completeMutation.isPending}
                          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                        >
                          تأكيد الإتمام
                        </button>
                        <button
                          onClick={() => {
                            setShowCompletionForm(false);
                            setCompletionNotes('');
                          }}
                          className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-100"
                        >
                          إلغاء
                        </button>
                      </>
                    )}

                    <button
                      onClick={onClose}
                      className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-100"
                    >
                      إغلاق
                    </button>
                  </div>
                )}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
