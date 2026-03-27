import React, { useState } from 'react';
import { z } from 'zod';
import { useForm } from '../../hooks/useForm';
import { Button, Input, Card } from '../../components/core';
import './AuthPages.css';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  rememberMe: z.boolean().optional(),
});

type LoginFormData = z.infer<typeof loginSchema>;

export const LoginPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { values, errors, handleChange, handleSubmit } = useForm<LoginFormData>({
    initialValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
    schema: loginSchema,
    onSubmit: async (data) => {
      setIsLoading(true);
      try {
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1500));
        console.log('Login submitted:', data);
        // Redirect to dashboard or home
      } catch (error) {
        console.error('Login error:', error);
      } finally {
        setIsLoading(false);
      }
    },
  });

  const handleOAuthLogin = (provider: 'google' | 'facebook' | 'apple') => {
    console.log(`OAuth login with ${provider}`);
    // Implement OAuth flow
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-card-wrapper">
          <Card variant="elevated" className="auth-card">
            <CardHeader>
              <h1 className="auth-title">Welcome Back</h1>
              <p className="auth-subtitle">Sign in to your Mnbara account</p>
            </CardHeader>

            <CardBody>
              {/* OAuth Buttons */}
              <div className="oauth-buttons">
                <Button
                  variant="outline"
                  fullWidth
                  onClick={() => handleOAuthLogin('google')}
                  className="oauth-button"
                >
                  <svg className="oauth-icon" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Continue with Google
                </Button>

                <Button
                  variant="outline"
                  fullWidth
                  onClick={() => handleOAuthLogin('facebook')}
                  className="oauth-button"
                >
                  <svg className="oauth-icon" viewBox="0 0 24 24">
                    <path
                      fill="#1877F2"
                      d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
                    />
                  </svg>
                  Continue with Facebook
                </Button>

                <Button
                  variant="outline"
                  fullWidth
                  onClick={() => handleOAuthLogin('apple')}
                  className="oauth-button"
                >
                  <svg className="oauth-icon" viewBox="0 0 24 24">
                    <path
                      fill="#000"
                      d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"
                    />
                  </svg>
                  Continue with Apple
                </Button>
              </div>

              <div className="auth-divider">
                <span>or</span>
              </div>

              {/* Login Form */}
              <form onSubmit={handleSubmit} className="auth-form">
                <Input
                  label="Email Address"
                  type="email"
                  name="email"
                  value={values.email}
                  onChange={handleChange}
                  error={errors.email}
                  fullWidth
                  placeholder="you@example.com"
                  leftIcon={
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                      <polyline points="22,6 12,13 2,6" />
                    </svg>
                  }
                />

                <Input
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={values.password}
                  onChange={handleChange}
                  error={errors.password}
                  fullWidth
                  placeholder="Enter your password"
                  leftIcon={
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  }
                  rightIcon={
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="password-toggle"
                    >
                      {showPassword ? (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                          <line x1="1" y1="1" x2="23" y2="23" />
                        </svg>
                      ) : (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      )}
                    </button>
                  }
                />

                <div className="auth-options">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="rememberMe"
                      checked={values.rememberMe}
                      onChange={handleChange}
                    />
                    <span>Remember me</span>
                  </label>
                  <a href="/auth/forgot-password" className="auth-link">
                    Forgot password?
                  </a>
                </div>

                <Button type="submit" fullWidth loading={isLoading}>
                  Sign In
                </Button>
              </form>
            </CardBody>

            <CardFooter className="auth-footer">
              <p className="auth-footer-text">
                Don't have an account?{' '}
                <a href="/auth/register" className="auth-link">
                  Create one
                </a>
              </p>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
};

// Helper components for Card sections
const CardHeader: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="auth-card-header">{children}</div>
);

export default LoginPage;
