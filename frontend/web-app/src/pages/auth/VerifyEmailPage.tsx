import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { motion } from 'framer-motion'
import { CheckCircleIcon, XCircleIcon, EnvelopeIcon } from '@heroicons/react/24/outline'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

const VerifyEmailPage: React.FC = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'resend'>('loading')
  const [resendLoading, setResendLoading] = useState(false)
  const [resendSuccess, setResendSuccess] = useState(false)

  useEffect(() => {
    if (token) {
      verifyEmail()
    } else {
      setStatus('resend')
    }
  }, [token])

  const verifyEmail = async () => {
    try {
      await new Promise(resolve => setTimeout(resolve, 2000))
      // Simulate 90% success rate
      if (Math.random() > 0.1) {
        setStatus('success')
      } else {
        setStatus('error')
      }
    } catch (err) {
      setStatus('error')
    }
  }

  const handleResend = async () => {
    setResendLoading(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 1500))
      setResendSuccess(true)
    } finally {
      setResendLoading(false)
    }
  }

  if (status === 'loading') {
    return (
      <>
        <Helmet><title>Verifying Email - Mnbara</title></Helmet>
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
          <div className="text-center">
            <LoadingSpinner size="large" />
            <p className="mt-4 text-gray-600 dark:text-gray-400">Verifying your email...</p>
          </div>
        </div>
      </>
    )
  }

  if (status === 'success') {
    return (
      <>
        <Helmet><title>Email Verified - Mnbara</title></Helmet>
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="max-w-md w-full text-center">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircleIcon className="w-12 h-12 text-green-500" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Email Verified!</h1>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Your email has been successfully verified. You can now access all features of Mnbara.
              </p>
              <button onClick={() => navigate('/')} className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700">
                Start Shopping
              </button>
            </div>
          </motion.div>
        </div>
      </>
    )
  }

  if (status === 'error') {
    return (
      <>
        <Helmet><title>Verification Failed - Mnbara</title></Helmet>
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="max-w-md w-full text-center">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg">
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <XCircleIcon className="w-12 h-12 text-red-500" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Verification Failed</h1>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                This verification link is invalid or has expired. Please request a new verification email.
              </p>
              <button
                onClick={handleResend}
                disabled={resendLoading || resendSuccess}
                className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50 mb-3"
              >
                {resendLoading ? 'Sending...' : resendSuccess ? 'Email Sent!' : 'Resend Verification Email'}
              </button>
              <button onClick={() => navigate('/auth/login')} className="w-full py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl font-semibold hover:bg-gray-50 dark:hover:bg-gray-700">
                Back to Login
              </button>
            </div>
          </motion.div>
        </div>
      </>
    )
  }

  // Resend page (no token provided)
  return (
    <>
      <Helmet><title>Verify Email - Mnbara</title></Helmet>
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-md w-full text-center">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg">
            <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-6">
              <EnvelopeIcon className="w-12 h-12 text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Check Your Email</h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              We've sent a verification link to your email address. Click the link to verify your account.
            </p>
            
            {resendSuccess ? (
              <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl text-green-600 dark:text-green-400 mb-4">
                Verification email sent! Check your inbox.
              </div>
            ) : (
              <p className="text-sm text-gray-500 mb-4">
                Didn't receive the email? Check your spam folder or
              </p>
            )}
            
            <button
              onClick={handleResend}
              disabled={resendLoading || resendSuccess}
              className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50 mb-3"
            >
              {resendLoading ? 'Sending...' : resendSuccess ? 'Email Sent!' : 'Resend Verification Email'}
            </button>
            
            <button onClick={() => navigate('/auth/login')} className="text-blue-600 hover:text-blue-700 font-medium">
              Back to Login
            </button>
          </div>
        </motion.div>
      </div>
    </>
  )
}

export default VerifyEmailPage
