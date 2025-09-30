'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { ErrorAlert } from '@/components/ui/ErrorAlert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { 
  validateRegistrationForm, 
  validateUsername, 
  validateEmail, 
  validatePassword, 
  validateConfirmPassword,
  validateRequired,
  validateLength,
  validatePhone
} from '@/lib/validation';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    full_name: '',
    role: 'buyer' as 'buyer' | 'supplier',
    company_name: '',
    phone: '',
  });
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitAttempted, setSubmitAttempted] = useState(false);

  const { register } = useAuth();
  const router = useRouter();

  // Real-time validation function
  const validateField = (name: string, value: string): string | undefined => {
    switch (name) {
      case 'username':
        const usernameResult = validateUsername(value);
        if (!usernameResult.isValid) return usernameResult.error;
        break;
        
      case 'email':
        const emailResult = validateEmail(value);
        if (!emailResult.isValid) return emailResult.error;
        break;
        
      case 'password':
        const passwordResult = validatePassword(value);
        if (!passwordResult.isValid) return passwordResult.error;
        break;
        
      case 'confirmPassword':
        const confirmPasswordResult = validateConfirmPassword(formData.password, value);
        if (!confirmPasswordResult.isValid) return confirmPasswordResult.error;
        break;
        
      case 'full_name':
        const fullNameRequiredResult = validateRequired(value, 'Full name');
        if (!fullNameRequiredResult.isValid) return fullNameRequiredResult.error;
        const fullNameLengthResult = validateLength(value, 'Full name', 2, 100);
        if (!fullNameLengthResult.isValid) return fullNameLengthResult.error;
        break;
        
      case 'company_name':
        if (value) {
          const companyNameResult = validateLength(value, 'Company name', 0, 100);
          if (!companyNameResult.isValid) return companyNameResult.error;
        }
        break;
        
      case 'phone':
        const phoneResult = validatePhone(value);
        if (!phoneResult.isValid) return phoneResult.error;
        break;
    }
    return undefined;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    setFormData({
      ...formData,
      [name]: value,
    });

    // Real-time validation only after first submit attempt
    if (submitAttempted) {
      const error = validateField(name, value);
      setFieldErrors(prev => ({
        ...prev,
        [name]: error || ''
      }));
      
      // Special case for confirm password when password changes
      if (name === 'password' && formData.confirmPassword) {
        const confirmError = validateConfirmPassword(value, formData.confirmPassword);
        setFieldErrors(prev => ({
          ...prev,
          confirmPassword: confirmError.isValid ? '' : confirmError.error!
        }));
      }
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const error = validateField(name, value);
    setFieldErrors(prev => ({
      ...prev,
      [name]: error || ''
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitAttempted(true);
    setLoading(true);
    setValidationErrors([]);
    setFieldErrors({});

    // Comprehensive form validation
    const validation = validateRegistrationForm(formData);
    
    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      setLoading(false);
      
      // Scroll to top to show errors
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    try {
      const { confirmPassword: _, ...registerData } = formData;
      await register(registerData);
      router.push('/dashboard');
    } catch (err: unknown) {
      console.error('Registration error:', err);
      
      // Handle API validation errors
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosError = err as { response?: { data?: { details?: Array<{ message?: string; field?: string }>; message?: string } }; message?: string };
        if (axiosError.response?.data?.details) {
          // Backend validation errors
          const backendErrors = axiosError.response.data.details.map((detail: { message?: string; field?: string }) => 
            detail.message || `${detail.field}: ${detail.message}`
          );
          setValidationErrors(backendErrors);
        } else {
          // General error
          setValidationErrors([axiosError.response?.data?.message || axiosError.message || 'Registration failed']);
        }
      } else {
        // General error
        const errorMessage = err instanceof Error ? err.message : 'Registration failed';
        setValidationErrors([errorMessage]);
      }
      
      // Scroll to top to show errors
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Or{' '}
            <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
              sign in to your existing account
            </Link>
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Register</CardTitle>
            <CardDescription>Create a new account to get started</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <ErrorAlert errors={validationErrors} />

              <FormField
                label="Username"
                id="username"
                name="username"
                type="text"
                value={formData.username}
                onChange={handleChange}
                onBlur={handleBlur}
                required
                placeholder="Choose a username"
                error={fieldErrors.username}
                hint="3-30 characters, letters, numbers, and underscores only"
              />

              <FormField
                label="Email"
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                onBlur={handleBlur}
                required
                placeholder="Enter your email address"
                error={fieldErrors.email}
                hint="We'll use this to send you important updates"
              />

              <FormField
                label="Full Name"
                id="full_name"
                name="full_name"
                type="text"
                value={formData.full_name}
                onChange={handleChange}
                onBlur={handleBlur}
                required
                placeholder="Enter your full name"
                error={fieldErrors.full_name}
                hint="Your full name as it should appear on your profile"
              />

              <div>
                <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                  Role
                </label>
                <select
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="buyer">Buyer</option>
                  <option value="supplier">Supplier</option>
                </select>
              </div>

              <FormField
                label="Company Name"
                id="company_name"
                name="company_name"
                type="text"
                value={formData.company_name}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="Enter your company name"
                error={fieldErrors.company_name}
                hint="Optional - your organization name"
              />

              <FormField
                label="Phone"
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="Enter your phone number"
                error={fieldErrors.phone}
                hint="Optional - format: +1234567890"
              />

              <FormField
                label="Password"
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                onBlur={handleBlur}
                required
                placeholder="Choose a secure password"
                error={fieldErrors.password}
                hint="At least 6 characters with uppercase, lowercase, and number"
              />

              <FormField
                label="Confirm Password"
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange}
                onBlur={handleBlur}
                required
                placeholder="Confirm your password"
                error={fieldErrors.confirmPassword}
                hint="Must match the password above"
              />

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {loading ? 'Creating account...' : 'Create account'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
