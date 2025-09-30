'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { FormTextArea } from '@/components/ui/FormTextArea';
import { ErrorAlert } from '@/components/ui/ErrorAlert';
import api from '@/lib/api';
import { 
  validateRFPForm, 
  validateRequired, 
  validateLength, 
  validateDate, 
  validateNumber, 
  validateBudgetRange,
  validateArray,
  FieldValidationResult 
} from '@/lib/validation';

export default function CreateRFPPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitAttempted, setSubmitAttempted] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    budget_min: '',
    budget_max: '',
    deadline: '',
    requirements: [''],
    evaluation_criteria: [''],
    terms_and_conditions: '',
    status: 'draft' as 'draft' | 'published'
  });

  // Redirect if not a buyer
  if (user && user.role !== 'buyer') {
    router.push('/dashboard');
    return null;
  }

  // Real-time validation function
  const validateField = (name: string, value: string): string | undefined => {
    switch (name) {
      case 'title':
        const titleRequiredResult = validateRequired(value, 'Title');
        if (!titleRequiredResult.isValid) return titleRequiredResult.error;
        const titleLengthResult = validateLength(value, 'Title', 5, 200);
        if (!titleLengthResult.isValid) return titleLengthResult.error;
        break;
        
      case 'category':
        const categoryResult = validateRequired(value, 'Category');
        if (!categoryResult.isValid) return categoryResult.error;
        break;
        
      case 'description':
        const descRequiredResult = validateRequired(value, 'Description');
        if (!descRequiredResult.isValid) return descRequiredResult.error;
        const descLengthResult = validateLength(value, 'Description', 10, 5000);
        if (!descLengthResult.isValid) return descLengthResult.error;
        break;
        
      case 'deadline':
        const deadlineResult = validateDate(value, 'Deadline');
        if (!deadlineResult.isValid) return deadlineResult.error;
        break;
        
      case 'budget_min':
        const budgetMinResult = validateNumber(value, 'Minimum budget', 0);
        if (!budgetMinResult.isValid) return budgetMinResult.error;
        break;
        
      case 'budget_max':
        const budgetMaxResult = validateNumber(value, 'Maximum budget', 0);
        if (!budgetMaxResult.isValid) return budgetMaxResult.error;
        break;
        
      case 'terms_and_conditions':
        if (value) {
          const termsLengthResult = validateLength(value, 'Terms and conditions', 0, 10000);
          if (!termsLengthResult.isValid) return termsLengthResult.error;
        }
        break;
    }
    return undefined;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Update form data
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Real-time validation only after first submit attempt
    if (submitAttempted) {
      const error = validateField(name, value);
      setFieldErrors(prev => ({
        ...prev,
        [name]: error || ''
      }));
      
      // Special case for budget range validation
      if (name === 'budget_min' || name === 'budget_max') {
        const minBudget = name === 'budget_min' ? value : formData.budget_min;
        const maxBudget = name === 'budget_max' ? value : formData.budget_max;
        const budgetRangeResult = validateBudgetRange(minBudget, maxBudget);
        
        if (!budgetRangeResult.isValid) {
          setFieldErrors(prev => ({
            ...prev,
            budget_range: budgetRangeResult.error || ''
          }));
        } else {
          setFieldErrors(prev => ({
            ...prev,
            budget_range: ''
          }));
        }
      }
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const error = validateField(name, value);
    setFieldErrors(prev => ({
      ...prev,
      [name]: error || ''
    }));
  };

  const handleArrayChange = (index: number, value: string, field: 'requirements' | 'evaluation_criteria') => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].map((item, i) => i === index ? value : item)
    }));

    // Validate array after changes if submit was attempted
    if (submitAttempted) {
      const updatedArray = formData[field].map((item, i) => i === index ? value : item);
      const arrayValidation = validateArray(updatedArray, field === 'requirements' ? 'requirement' : 'evaluation criterion', 1);
      setFieldErrors(prev => ({
        ...prev,
        [field]: arrayValidation.isValid ? '' : arrayValidation.error!
      }));
    }
  };

  const addArrayItem = (field: 'requirements' | 'evaluation_criteria') => {
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field], '']
    }));
  };

  const removeArrayItem = (index: number, field: 'requirements' | 'evaluation_criteria') => {
    if (formData[field].length <= 1) return; // Prevent removing the last item
    
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));

    // Re-validate array after removal if submit was attempted
    if (submitAttempted) {
      const updatedArray = formData[field].filter((_, i) => i !== index);
      const arrayValidation = validateArray(updatedArray, field === 'requirements' ? 'requirement' : 'evaluation criterion', 1);
      setFieldErrors(prev => ({
        ...prev,
        [field]: arrayValidation.isValid ? '' : arrayValidation.error!
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitAttempted(true);
    setLoading(true);
    setValidationErrors([]);
    setFieldErrors({});

    // Comprehensive form validation
    const validation = validateRFPForm(formData);
    
    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      setLoading(false);
      
      // Scroll to top to show errors
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    try {
      // Clean up the form data
      const submitData = {
        ...formData,
        budget_min: formData.budget_min ? parseFloat(formData.budget_min) : undefined,
        budget_max: formData.budget_max ? parseFloat(formData.budget_max) : undefined,
        requirements: formData.requirements.filter(req => req.trim() !== ''),
        evaluation_criteria: formData.evaluation_criteria.filter(criteria => criteria.trim() !== ''),
        deadline: new Date(formData.deadline).toISOString()
      };

      console.log('Submitting RFP data:', submitData);
      const response = await api.post('/rfps', submitData);
      console.log('RFP created successfully:', response.data);
      
      router.push('/dashboard/rfps');
    } catch (err: any) {
      console.error('Error creating RFP:', err);
      
      // Handle API validation errors
      if (err.response?.data?.details) {
        // Backend validation errors
        const backendErrors = err.response.data.details.map((detail: any) => 
          detail.message || `${detail.field}: ${detail.message}`
        );
        setValidationErrors(backendErrors);
      } else {
        // General error
        setValidationErrors([err.response?.data?.message || err.message || 'Failed to create RFP']);
      }
      
      // Scroll to top to show errors
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <Button 
            variant="outline" 
            onClick={() => router.back()}
            className="flex items-center space-x-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>Back</span>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Create New RFP</h1>
            <p className="text-gray-600">Create a new Request for Proposal</p>
          </div>
        </div>

        {/* Validation Errors */}
        <ErrorAlert errors={validationErrors} />

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Provide the basic details of your RFP</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                label="Title"
                id="title"
                name="title"
                type="text"
                required
                value={formData.title}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="Enter RFP title"
                error={fieldErrors.title}
                hint="Provide a clear and descriptive title for your RFP (5-200 characters)"
              />

              <FormField
                label="Category"
                id="category"
                name="category"
                type="text"
                required
                value={formData.category}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="e.g., Web Development, Marketing, Consulting"
                error={fieldErrors.category}
                hint="Specify the industry or service category for this project"
              />

              <FormTextArea
                label="Description"
                id="description"
                name="description"
                required
                rows={4}
                value={formData.description}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="Provide a detailed description of your project requirements"
                error={fieldErrors.description}
                hint="Detailed project description (10-5000 characters)"
                maxLength={5000}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  label="Minimum Budget"
                  id="budget_min"
                  name="budget_min"
                  type="number"
                  min="0"
                  step="100"
                  value={formData.budget_min}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="0"
                  error={fieldErrors.budget_min}
                  hint="Optional minimum budget in your currency"
                />
                <FormField
                  label="Maximum Budget"
                  id="budget_max"
                  name="budget_max"
                  type="number"
                  min="0"
                  step="100"
                  value={formData.budget_max}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="0"
                  error={fieldErrors.budget_max}
                  hint="Optional maximum budget in your currency"
                />
              </div>

              {fieldErrors.budget_range && (
                <div className="text-xs text-red-600 flex items-center space-x-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{fieldErrors.budget_range}</span>
                </div>
              )}

              <FormField
                label="Deadline"
                id="deadline"
                name="deadline"
                type="datetime-local"
                required
                value={formData.deadline}
                onChange={handleChange}
                onBlur={handleBlur}
                min={new Date().toISOString().slice(0, 16)}
                error={fieldErrors.deadline}
                hint="When do you need responses by? Must be a future date and time"
              />
            </CardContent>
          </Card>

          {/* Requirements */}
          <Card>
            <CardHeader>
              <CardTitle>Requirements</CardTitle>
              <CardDescription>List the specific requirements for this project (at least 1 required)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {formData.requirements.map((requirement, index) => (
                <div key={index} className="flex space-x-2">
                  <Input
                    type="text"
                    value={requirement}
                    onChange={(e) => handleArrayChange(index, e.target.value, 'requirements')}
                    placeholder={`Requirement ${index + 1}`}
                    className={`flex-1 ${fieldErrors.requirements ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                  />
                  {formData.requirements.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => removeArrayItem(index, 'requirements')}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      Remove
                    </Button>
                  )}
                </div>
              ))}
              
              {fieldErrors.requirements && (
                <div className="text-xs text-red-600 flex items-center space-x-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{fieldErrors.requirements}</span>
                </div>
              )}
              
              <Button
                type="button"
                variant="outline"
                onClick={() => addArrayItem('requirements')}
                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
              >
                Add Requirement
              </Button>
            </CardContent>
          </Card>

          {/* Evaluation Criteria */}
          <Card>
            <CardHeader>
              <CardTitle>Evaluation Criteria</CardTitle>
              <CardDescription>Define how proposals will be evaluated (at least 1 required)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {formData.evaluation_criteria.map((criteria, index) => (
                <div key={index} className="flex space-x-2">
                  <Input
                    type="text"
                    value={criteria}
                    onChange={(e) => handleArrayChange(index, e.target.value, 'evaluation_criteria')}
                    placeholder={`Evaluation criteria ${index + 1}`}
                    className={`flex-1 ${fieldErrors.evaluation_criteria ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                  />
                  {formData.evaluation_criteria.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => removeArrayItem(index, 'evaluation_criteria')}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      Remove
                    </Button>
                  )}
                </div>
              ))}
              
              {fieldErrors.evaluation_criteria && (
                <div className="text-xs text-red-600 flex items-center space-x-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{fieldErrors.evaluation_criteria}</span>
                </div>
              )}
              
              <Button
                type="button"
                variant="outline"
                onClick={() => addArrayItem('evaluation_criteria')}
                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
              >
                Add Criteria
              </Button>
            </CardContent>
          </Card>

          {/* Terms and Conditions */}
          <Card>
            <CardHeader>
              <CardTitle>Terms and Conditions</CardTitle>
              <CardDescription>Additional terms and conditions (optional)</CardDescription>
            </CardHeader>
            <CardContent>
              <FormTextArea
                label=""
                id="terms_and_conditions"
                name="terms_and_conditions"
                rows={4}
                value={formData.terms_and_conditions}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="Enter any specific terms and conditions for this project"
                error={fieldErrors.terms_and_conditions}
                hint="Optional additional terms and conditions (max 10,000 characters)"
                maxLength={10000}
              />
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {loading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Creating...</span>
                </div>
              ) : (
                'Create RFP'
              )}
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
