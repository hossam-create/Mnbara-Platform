// ============================================================
// P2P Exchange - ProofUpload Component
// Component for uploading proof of payment (photo/video)
// ============================================================

import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useUploadProof } from '../../hooks/useMatch';

// ============================================================
// VALIDATION SCHEMA
// ============================================================

const proofUploadSchema = z.object({
  referenceId: z.string().min(1, 'Reference ID is required'),
  recipientName: z.string().min(1, 'Recipient name is required'),
  paymentMethod: z.string().min(1, 'Payment method is required'),
  notes: z.string().optional(),
});

type ProofUploadFormData = z.infer<typeof proofUploadSchema>;

// ============================================================
// TYPES
// ============================================================

interface ProofUploadProps {
  matchId: number;
  onSuccess?: () => void;
  onCancel?: () => void;
}

// ============================================================
// COMPONENT
// ============================================================

export const ProofUpload: React.FC<ProofUploadProps> = ({
  matchId,
  onSuccess,
  onCancel,
}) => {
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const uploadProof = useUploadProof();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProofUploadFormData>({
    resolver: zodResolver(proofUploadSchema),
  });

  // ============================================================
  // PHOTO DROPZONE
  // ============================================================

  const onPhotoDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      setPhotoFile(file);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const {
    getRootProps: getPhotoRootProps,
    getInputProps: getPhotoInputProps,
    isDragActive: isPhotoDragActive,
  } = useDropzone({
    onDrop: onPhotoDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif'],
    },
    maxFiles: 1,
    maxSize: 5 * 1024 * 1024, // 5MB
  });

  // ============================================================
  // VIDEO DROPZONE
  // ============================================================

  const onVideoDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setVideoFile(acceptedFiles[0]);
    }
  }, []);

  const {
    getRootProps: getVideoRootProps,
    getInputProps: getVideoInputProps,
    isDragActive: isVideoDragActive,
  } = useDropzone({
    onDrop: onVideoDrop,
    accept: {
      'video/*': ['.mp4', '.mov', '.avi'],
    },
    maxFiles: 1,
    maxSize: 50 * 1024 * 1024, // 50MB
  });

  // ============================================================
  // HANDLERS
  // ============================================================

  const onSubmit = async (data: ProofUploadFormData) => {
    if (!photoFile) {
      alert('Please upload a photo of the payment receipt');
      return;
    }

    try {
      await uploadProof.mutateAsync({
        matchId,
        data: {
          photo: photoFile,
          video: videoFile || undefined,
          referenceId: data.referenceId,
          recipientName: data.recipientName,
          paymentMethod: data.paymentMethod,
          metadata: data.notes ? { notes: data.notes } : undefined,
        },
      });
      onSuccess?.();
    } catch (error) {
      console.error('Failed to upload proof:', error);
    }
  };

  const handleRemovePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
  };

  const handleRemoveVideo = () => {
    setVideoFile(null);
  };

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Upload Proof of Payment</h2>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Photo Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Payment Receipt Photo <span className="text-red-500">*</span>
          </label>
          {!photoFile ? (
            <div
              {...getPhotoRootProps()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                isPhotoDragActive
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <input {...getPhotoInputProps()} />
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                stroke="currentColor"
                fill="none"
                viewBox="0 0 48 48"
              >
                <path
                  d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <p className="mt-2 text-sm text-gray-600">
                {isPhotoDragActive
                  ? 'Drop the photo here'
                  : 'Drag and drop a photo, or click to select'}
              </p>
              <p className="mt-1 text-xs text-gray-500">PNG, JPG, GIF up to 5MB</p>
            </div>
          ) : (
            <div className="relative">
              <img
                src={photoPreview!}
                alt="Payment receipt"
                className="w-full h-64 object-contain rounded-lg border border-gray-300"
              />
              <button
                type="button"
                onClick={handleRemovePhoto}
                className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-full hover:bg-red-700"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}
        </div>

        {/* Video Upload (Optional) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Payment Video (Optional)
          </label>
          {!videoFile ? (
            <div
              {...getVideoRootProps()}
              className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                isVideoDragActive
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <input {...getVideoInputProps()} />
              <svg
                className="mx-auto h-10 w-10 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
              <p className="mt-2 text-sm text-gray-600">
                {isVideoDragActive
                  ? 'Drop the video here'
                  : 'Drag and drop a video, or click to select'}
              </p>
              <p className="mt-1 text-xs text-gray-500">MP4, MOV, AVI up to 50MB</p>
            </div>
          ) : (
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-300">
              <div className="flex items-center space-x-3">
                <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
                <div>
                  <p className="text-sm font-medium text-gray-900">{videoFile.name}</p>
                  <p className="text-xs text-gray-500">
                    {(videoFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleRemoveVideo}
                className="p-2 text-red-600 hover:bg-red-50 rounded-full"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}
        </div>

        {/* Reference ID */}
        <div>
          <label htmlFor="referenceId" className="block text-sm font-medium text-gray-700 mb-2">
            Transaction Reference ID <span className="text-red-500">*</span>
          </label>
          <input
            {...register('referenceId')}
            type="text"
            id="referenceId"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter transaction reference number"
          />
          {errors.referenceId && (
            <p className="mt-1 text-sm text-red-600">{errors.referenceId.message}</p>
          )}
        </div>

        {/* Recipient Name */}
        <div>
          <label htmlFor="recipientName" className="block text-sm font-medium text-gray-700 mb-2">
            Recipient Name <span className="text-red-500">*</span>
          </label>
          <input
            {...register('recipientName')}
            type="text"
            id="recipientName"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter recipient name"
          />
          {errors.recipientName && (
            <p className="mt-1 text-sm text-red-600">{errors.recipientName.message}</p>
          )}
        </div>

        {/* Payment Method */}
        <div>
          <label htmlFor="paymentMethod" className="block text-sm font-medium text-gray-700 mb-2">
            Payment Method <span className="text-red-500">*</span>
          </label>
          <select
            {...register('paymentMethod')}
            id="paymentMethod"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Select payment method</option>
            <option value="bank_transfer">Bank Transfer</option>
            <option value="mobile_wallet">Mobile Wallet</option>
            <option value="cash">Cash</option>
            <option value="other">Other</option>
          </select>
          {errors.paymentMethod && (
            <p className="mt-1 text-sm text-red-600">{errors.paymentMethod.message}</p>
          )}
        </div>

        {/* Notes */}
        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
            Additional Notes (Optional)
          </label>
          <textarea
            {...register('notes')}
            id="notes"
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Add any additional information..."
          />
        </div>

        {/* Error Message */}
        {uploadProof.isError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">
              Error: {uploadProof.error instanceof Error ? uploadProof.error.message : 'Failed to upload proof'}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex space-x-3">
          <button
            type="submit"
            disabled={!photoFile || uploadProof.isPending}
            className={`flex-1 px-6 py-3 rounded-lg font-medium transition-colors ${
              photoFile && !uploadProof.isPending
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {uploadProof.isPending ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Uploading...
              </span>
            ) : (
              'Upload Proof'
            )}
          </button>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={uploadProof.isPending}
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
          )}
        </div>

        {/* Success Message */}
        {uploadProof.isSuccess && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-green-800 font-medium">
              Proof uploaded successfully! Waiting for counter party to confirm receipt.
            </p>
          </div>
        )}
      </form>
    </div>
  );
};
