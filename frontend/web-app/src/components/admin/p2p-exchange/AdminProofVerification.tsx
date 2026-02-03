import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { adminExchangeApi } from '../../../api/p2p-exchange/admin-exchange.api';
import type { ProofOfPayment, VerificationStatus } from '../../../types/p2p-exchange.types';

interface AdminProofVerificationProps {
  proof: ProofOfPayment;
  onClose?: () => void;
}

export function AdminProofVerification({ proof, onClose }: AdminProofVerificationProps) {
  const [decision, setDecision] = useState<'approve' | 'reject' | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [notes, setNotes] = useState('');
  const [showImageModal, setShowImageModal] = useState(false);
  const queryClient = useQueryClient();

  // Verify proof mutation
  const verifyMutation = useMutation({
    mutationFn: (data: { status: VerificationStatus; reason?: string; notes?: string }) =>
      adminExchangeApi.verifyProof(proof.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-pending-proofs'] });
      queryClient.invalidateQueries({ queryKey: ['admin-exchange-stats'] });
      onClose?.();
    },
  });

  const handleSubmit = async () => {
    if (!decision) return;

    if (decision === 'reject' && !rejectionReason.trim()) {
      alert('الرجاء إدخال سبب الرفض');
      return;
    }

    await verifyMutation.mutateAsync({
      status: decision === 'approve' ? 'VERIFIED' : 'REJECTED',
      reason: decision === 'reject' ? rejectionReason : undefined,
      notes: notes.trim() || undefined,
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-lg max-w-4xl mx-auto" data-testid="admin-proof-verification">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between" data-testid="verification-header">
        <div>
          <h2 className="text-xl font-bold text-gray-900">مراجعة إثبات الدفع</h2>
          <p className="text-sm text-gray-500 mt-1">
            إثبات #{proof.id.slice(0, 8)} - المطابقة #{proof.matchId.slice(0, 8)}
          </p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            data-testid="close-verification-button"
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>

      <div className="p-6 space-y-6">
        {/* Proof Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6" data-testid="proof-information">
          {/* Left Column - Details */}
          <div className="space-y-4" data-testid="proof-details">
            <div data-testid="proof-info-section">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">
                معلومات الإثبات
              </h3>
              <div className="space-y-2">
                <InfoRow label="المرسل" value={proof.senderId} />
                <InfoRow label="المستلم" value={proof.recipientId} />
                <InfoRow
                  label="تاريخ الإرسال"
                  value={new Date(proof.createdAt).toLocaleString('ar-SA')}
                />
                <InfoRow
                  label="الحالة"
                  value={
                    <StatusBadge
                      status={proof.verificationStatus || 'PENDING'}
                    />
                  }
                />
              </div>
            </div>

            {/* Transaction Details */}
            <div data-testid="transaction-details-section">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">
                تفاصيل المعاملة
              </h3>
              <div className="space-y-2">
                <InfoRow label="رقم المرجع" value={proof.transactionReference} />
                <InfoRow
                  label="طريقة الدفع"
                  value={proof.paymentMethod || 'غير محدد'}
                />
                {proof.metadata && (
                  <div className="mt-2">
                    <p className="text-xs text-gray-500 mb-1">بيانات إضافية:</p>
                    <pre className="text-xs bg-gray-50 p-2 rounded overflow-auto">
                      {JSON.stringify(proof.metadata, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Image */}
          <div data-testid="proof-image-section">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              صورة الإثبات
            </h3>
            <div className="relative">
              <img
                src={proof.imageUrl}
                alt="إثبات الدفع"
                data-testid="proof-image"
                className="w-full h-64 object-cover rounded-lg border border-gray-200 cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => setShowImageModal(true)}
              />
              <button
                onClick={() => setShowImageModal(true)}
                data-testid="zoom-image-button"
                className="absolute top-2 right-2 bg-white bg-opacity-90 hover:bg-opacity-100 rounded-lg p-2 transition-all"
              >
                <svg
                  className="w-5 h-5 text-gray-700"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"
                  />
                </svg>
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2 text-center">
              انقر على الصورة للتكبير
            </p>
          </div>
        </div>

        {/* Decision Section */}
        <div className="border-t border-gray-200 pt-6" data-testid="decision-section">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">القرار</h3>

          {/* Decision Buttons */}
          <div className="flex gap-4 mb-4" data-testid="decision-buttons">
            <button
              onClick={() => setDecision('approve')}
              data-testid="approve-button"
              className={`flex-1 py-3 rounded-lg font-medium transition-all ${
                decision === 'approve'
                  ? 'bg-green-600 text-white shadow-lg'
                  : 'bg-green-50 text-green-700 hover:bg-green-100'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>قبول الإثبات</span>
              </div>
            </button>

            <button
              onClick={() => setDecision('reject')}
              data-testid="reject-button"
              className={`flex-1 py-3 rounded-lg font-medium transition-all ${
                decision === 'reject'
                  ? 'bg-red-600 text-white shadow-lg'
                  : 'bg-red-50 text-red-700 hover:bg-red-100'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>رفض الإثبات</span>
              </div>
            </button>
          </div>

          {/* Rejection Reason (shown only when reject is selected) */}
          {decision === 'reject' && (
            <div className="mb-4" data-testid="rejection-reason-section">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                سبب الرفض <span className="text-red-600">*</span>
              </label>
              <select
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                data-testid="rejection-reason-select"
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="">اختر السبب</option>
                <option value="unclear_image">الصورة غير واضحة</option>
                <option value="incomplete_info">معلومات غير كاملة</option>
                <option value="suspicious_transaction">معاملة مشبوهة</option>
                <option value="wrong_amount">المبلغ غير صحيح</option>
                <option value="wrong_recipient">المستلم غير صحيح</option>
                <option value="duplicate">إثبات مكرر</option>
                <option value="other">سبب آخر</option>
              </select>
            </div>
          )}

          {/* Admin Notes */}
          <div data-testid="admin-notes-section">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ملاحظات المشرف (اختياري)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              data-testid="admin-notes-textarea"
              rows={3}
              placeholder="أضف أي ملاحظات إضافية..."
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4 border-t border-gray-200" data-testid="action-buttons">
          {onClose && (
            <button
              onClick={onClose}
              disabled={verifyMutation.isPending}
              data-testid="cancel-button"
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              إلغاء
            </button>
          )}
          <button
            onClick={handleSubmit}
            disabled={!decision || verifyMutation.isPending}
            data-testid="confirm-decision-button"
            className="flex-1 px-6 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {verifyMutation.isPending ? (
              <div className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>جاري الحفظ...</span>
              </div>
            ) : (
              'تأكيد القرار'
            )}
          </button>
        </div>

        {/* Error Message */}
        {verifyMutation.isError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3" data-testid="error-message">
            <svg
              className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            <div className="flex-1">
              <p className="text-sm text-red-800 font-medium">فشل حفظ القرار</p>
              <p className="text-sm text-red-700 mt-1">
                {(verifyMutation.error as Error)?.message || 'حدث خطأ غير متوقع'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Image Modal */}
      {showImageModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          data-testid="image-modal"
          onClick={() => setShowImageModal(false)}
        >
          <div className="relative max-w-4xl max-h-full">
            <img
              src={proof.imageUrl}
              alt="إثبات الدفع"
              data-testid="modal-image"
              className="max-w-full max-h-[90vh] object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
            <button
              onClick={() => setShowImageModal(false)}
              data-testid="close-modal-button"
              className="absolute top-4 right-4 bg-white bg-opacity-90 hover:bg-opacity-100 rounded-full p-2 transition-all"
            >
              <svg
                className="w-6 h-6 text-gray-700"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Info Row Component
function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between py-2 border-b border-gray-100">
      <span className="text-sm text-gray-600">{label}:</span>
      <span className="text-sm font-medium text-gray-900">{value}</span>
    </div>
  );
}

// Status Badge Component
function StatusBadge({ status }: { status: string }) {
  const statusConfig: Record<string, { label: string; color: string }> = {
    PENDING: { label: 'معلق', color: 'bg-yellow-100 text-yellow-800' },
    VERIFIED: { label: 'موثق', color: 'bg-green-100 text-green-800' },
    REJECTED: { label: 'مرفوض', color: 'bg-red-100 text-red-800' },
  };

  const config = statusConfig[status] || {
    label: status,
    color: 'bg-gray-100 text-gray-800',
  };

  return (
    <span className={`text-xs font-medium px-2 py-1 rounded-full ${config.color}`}>
      {config.label}
    </span>
  );
}
