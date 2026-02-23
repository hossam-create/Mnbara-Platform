/**
 * KYC Verification Page
 * Integrated from docs/external-projects/KYC-Website: ID upload + selfie, ML verification via kyc-service.
 */

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../../services/api.service';

export default function KYCVerificationPage() {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [status, setStatus] = useState<{ verified: boolean; status?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [idType, setIdType] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [fullName, setFullName] = useState('');
  const [idPhoto, setIdPhoto] = useState<File | null>(null);
  const [selfiePhoto, setSelfiePhoto] = useState<File | null>(null);
  const [selfieDataUrl, setSelfieDataUrl] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState(false);

  useEffect(() => {
    apiService.kyc.getStatus()
      .then((res) => {
        if (res.data?.data) {
          setStatus({ verified: res.data.data.status === 'APPROVED', status: res.data.data.status });
        } else {
          setStatus(null);
        }
      })
      .catch(() => setStatus(null))
      .finally(() => setLoading(false));
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraActive(true);
      }
    } catch (e) {
      setError('Camera access denied or unavailable. You can upload a selfie photo instead.');
    }
  };

  const captureSelfie = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      setSelfieDataUrl(dataUrl);
      setCameraActive(false);
      if (video.srcObject) {
        (video.srcObject as MediaStream).getTracks().forEach((t) => t.stop());
      }
    }
  };

  const dataUrlToFile = (dataUrl: string, name: string): File => {
    const arr = dataUrl.split(',');
    const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) u8arr[n] = bstr.charCodeAt(n);
    return new File([u8arr], name, { type: mime });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!idType || !idNumber || !fullName) {
      setError('Please fill ID type, ID number, and full name.');
      return;
    }
    let selfieFile = selfiePhoto;
    if (selfieDataUrl && !selfieFile) {
      selfieFile = dataUrlToFile(selfieDataUrl, 'selfie.jpg');
    }
    if (!idPhoto || !selfieFile) {
      setError('Please upload ID photo and selfie (or capture from camera).');
      return;
    }

    setSubmitting(true);
    const formData = new FormData();
    formData.append('idType', idType);
    formData.append('idNumber', idNumber);
    formData.append('fullName', fullName);
    formData.append('idPhoto', idPhoto);
    formData.append('selfiePhoto', selfieFile);

    try {
      await apiService.kyc.submit(formData);
      setSuccess('Verification submitted. You will be notified once reviewed.');
      setStatus({ verified: false, status: 'PENDING' });
      setIdPhoto(null);
      setSelfiePhoto(null);
      setSelfieDataUrl(null);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Submission failed.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading KYC status...</p>
      </div>
    );
  }

  if (status?.verified) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
          <h1 className="text-xl font-semibold text-green-800">You are verified</h1>
          <p className="mt-2 text-green-700">Your identity has been verified. You can use all platform features.</p>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="mt-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Back to home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-2">KYC Verification</h1>
      <p className="text-gray-600 mb-6">
        Upload your ID and a selfie to verify your identity. Integrated from KYC-Website flow.
      </p>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700">{error}</div>
      )}
      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded text-green-700">{success}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block font-medium mb-1">ID Type</label>
          <select
            value={idType}
            onChange={(e) => setIdType(e.target.value)}
            className="w-full border rounded px-3 py-2"
            required
          >
            <option value="">Choose ID</option>
            <option value="national_id">National ID</option>
            <option value="passport">Passport</option>
            <option value="driving_license">Driving License</option>
          </select>
        </div>
        <div>
          <label className="block font-medium mb-1">ID Number</label>
          <input
            type="text"
            value={idNumber}
            onChange={(e) => setIdNumber(e.target.value)}
            className="w-full border rounded px-3 py-2"
            required
          />
        </div>
        <div>
          <label className="block font-medium mb-1">Full Name (as on ID)</label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full border rounded px-3 py-2"
            required
          />
        </div>
        <div>
          <label className="block font-medium mb-1">ID Photo (front)</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setIdPhoto(e.target.files?.[0] || null)}
            className="w-full border rounded px-3 py-2"
            required={!idPhoto}
          />
        </div>
        <div>
          <label className="block font-medium mb-1">Selfie</label>
          <div className="space-y-2">
            <button type="button" onClick={startCamera} className="mr-2 px-3 py-1 bg-gray-200 rounded hover:bg-gray-300">
              Use camera
            </button>
            <span className="text-gray-500">or</span>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                setSelfiePhoto(e.target.files?.[0] || null);
                setSelfieDataUrl(null);
              }}
              className="w-full border rounded px-3 py-2"
            />
          </div>
          {cameraActive && (
            <div className="mt-2">
              <video ref={videoRef} autoPlay muted playsInline className="max-w-xs border rounded" />
              <button type="button" onClick={captureSelfie} className="mt-2 px-3 py-1 bg-blue-600 text-white rounded">
                Capture
              </button>
            </div>
          )}
          {selfieDataUrl && (
            <div className="mt-2">
              <img src={selfieDataUrl} alt="Selfie" className="max-w-xs border rounded" />
              <p className="text-sm text-gray-500">Selfie captured. Submit the form to send.</p>
            </div>
          )}
          <canvas ref={canvasRef} className="hidden" />
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {submitting ? 'Submitting...' : 'Submit verification'}
        </button>
      </form>
    </div>
  );
}
