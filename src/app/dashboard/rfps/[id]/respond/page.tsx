'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { FormTextArea } from '@/components/ui/FormTextArea';
import { ErrorAlert } from '@/components/ui/ErrorAlert';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import { RFP } from '@/types';
import { formatDate, formatCurrency } from '@/lib/utils';
import { validateRequired, validateLength } from '@/lib/validation';

export default function SubmitResponsePage() {
  const { user } = useAuth();
  const { success, error: showError } = useToast();
  const params = useParams();
  const router = useRouter();
  const [rfp, setRfp] = useState<RFP | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitAttempted, setSubmitAttempted] = useState(false);

  const [formData, setFormData] = useState({
    proposal: '',
    proposed_budget: '',
    timeline: '',
    methodology: '',
    team_details: '',
    additional_notes: '',
    status: 'draft' as 'draft' | 'submitted'
  });

  useEffect(() => {
    const fetchRFP = async () => {
      try {
        const response = await api.get(`/rfps/${params.id}`);
        setRfp(response.data);
      } catch (error) {
        console.error('Error fetching RFP:', error);
        showError('Failed to load RFP', 'There was an error loading the RFP details.');
        router.push('/dashboard/rfps');
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchRFP();
    }
  }, [params.id, router, showError]);

  // Redirect if not a supplier
  if (user && user.role !== 'supplier') {
    router.push('/dashboard');
    return null;
  }

  const validateField = (name: string, value: string): string | undefined => {
    switch (name) {
      case 'proposal':
        const proposalValidation = validateRequired(value, 'Proposal');
        if (!proposalValidation.isValid) return proposalValidation.error;
        const proposalLengthValidation = validateLength(value, 'Proposal', 50, 5000);
        if (!proposalLengthValidation.isValid) return proposalLengthValidation.error;
        break;
      case 'proposed_budget':
        if (value && isNaN(Number(value))) {
          return 'Proposed budget must be a valid number';
        }
        if (value && Number(value) < 0) {
          return 'Proposed budget must be positive';
        }
        break;
      case 'timeline':
        if (value) {
          const timelineValidation = validateLength(value, 'Timeline', 10, 500);
          if (!timelineValidation.isValid) return timelineValidation.error;
        }
        break;
      case 'methodology':
        if (value) {
          const methodologyValidation = validateLength(value, 'Methodology', 20, 2000);
          if (!methodologyValidation.isValid) return methodologyValidation.error;
        }
        break;
      case 'team_details':
        if (value) {
          const teamValidation = validateLength(value, 'Team Details', 20, 1000);
          if (!teamValidation.isValid) return teamValidation.error;
        }
        break;
    }
    return undefined;
  };

  const handleInputChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear field error when user starts typing
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({ ...prev, [name]: '' }));
    }
    
    // Real-time validation
    const error = validateField(name, value);
    if (error) {
      setFieldErrors(prev => ({ ...prev, [name]: error }));
    }
  };

  const validateForm = (): boolean => {
    const errors: string[] = [];
    const fieldErrs: Record<string, string> = {};

    // Validate proposal (required)
    const proposalValidation = validateRequired(formData.proposal, 'Proposal');
    if (!proposalValidation.isValid) {
      errors.push(proposalValidation.error!);
      fieldErrs.proposal = proposalValidation.error!;
    } else {
      const proposalLengthValidation = validateLength(formData.proposal, 'Proposal', 50, 5000);
      if (!proposalLengthValidation.isValid) {
        errors.push(proposalLengthValidation.error!);
        fieldErrs.proposal = proposalLengthValidation.error!;
      }
    }

    // Validate proposed budget if provided
    if (formData.proposed_budget) {
      if (isNaN(Number(formData.proposed_budget))) {
        errors.push('Proposed budget must be a valid number');
        fieldErrs.proposed_budget = 'Proposed budget must be a valid number';
      } else if (Number(formData.proposed_budget) < 0) {
        errors.push('Proposed budget must be positive');
        fieldErrs.proposed_budget = 'Proposed budget must be positive';
      }
    }

    // Validate timeline if provided
    if (formData.timeline) {
      const timelineValidation = validateLength(formData.timeline, 'Timeline', 10, 500);
      if (!timelineValidation.isValid) {
        errors.push(timelineValidation.error!);
        fieldErrs.timeline = timelineValidation.error!;
      }
    }

    // Validate methodology if provided
    if (formData.methodology) {
      const methodologyValidation = validateLength(formData.methodology, 'Methodology', 20, 2000);
      if (!methodologyValidation.isValid) {
        errors.push(methodologyValidation.error!);
        fieldErrs.methodology = methodologyValidation.error!;
      }
    }

    // Validate team details if provided
    if (formData.team_details) {
      const teamValidation = validateLength(formData.team_details, 'Team Details', 20, 1000);
      if (!teamValidation.isValid) {
        errors.push(teamValidation.error!);
        fieldErrs.team_details = teamValidation.error!;
      }
    }

    setValidationErrors(errors);
    setFieldErrors(fieldErrs);
    return errors.length === 0;
  };

  const handleSubmit = async (status: 'draft' | 'submitted') => {
    setSubmitAttempted(true);
    setSubmitting(true);
    setValidationErrors([]);
    setFieldErrors({});

    if (!validateForm()) {
      setSubmitting(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    try {
      const submitData = {
        ...formData,
        proposed_budget: formData.proposed_budget ? Number(formData.proposed_budget) : null,
        status
      };

      console.log('Submitting response data:', submitData);
      const response = await api.post(`/rfps/${params.id}/responses`, submitData);
      console.log('Response created successfully:', response.data);
      
      if (status === 'submitted') {
        success('Response Submitted!', 'Your response has been submitted successfully.');
      } else {
        success('Response Saved!', 'Your response has been saved as draft.');
      }
      
      router.push('/dashboard/responses');
    } catch (err: unknown) {
      console.error('Error creating response:', err);
      
      // Handle API validation errors
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosError = err as { response?: { data?: { details?: Array<{ message?: string; field?: string }>; message?: string } }; message?: string };
        if (axiosError.response?.data?.details) {
          // Backend validation errors
          const backendErrors = axiosError.response.data.details.map((detail: { message?: string; field?: string }) => 
            detail.message || `${detail.field}: ${detail.message}`
          );
          showError('Failed to submit response', backendErrors.join(', '));
          setValidationErrors(backendErrors);
        } else {
          // General error
          const errorMsg = axiosError.response?.data?.message || axiosError.message || 'Failed to submit response';
          showError('Failed to submit response', errorMsg);
          setValidationErrors([errorMsg]);
        }
      } else {
        // General error
        const errorMessage = err instanceof Error ? err.message : 'Failed to submit response';
        showError('Failed to submit response', errorMessage);
        setValidationErrors([errorMessage]);
      }
      
      // Scroll to top to show errors
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) return null;

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading RFP...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!rfp) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">RFP not found</h2>
          <p className="text-gray-600 mb-6">The RFP you&apos;re looking for doesn&apos;t exist or is not available for responses.</p>
          <Link href="/dashboard/rfps">
            <Button>Back to RFPs</Button>
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Submit Response
            </h1>
            <p className="text-gray-600">
              Submit your response to: {rfp.title}
            </p>
          </div>
          <Link href={`/dashboard/rfps/${params.id}`}>
            <Button variant="outline">Back to RFP</Button>
          </Link>
        </div>

        {/* RFP Summary */}
        <Card>
          <CardHeader>
            <CardTitle>RFP Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{rfp.title}</h3>
                <p className="text-gray-600 mt-1">{rfp.description}</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Category:</span> {rfp.category}
                </div>
                <div>
                  <span className="font-medium text-gray-700">Deadline:</span> {formatDate(rfp.deadline)}
                </div>
                {rfp.budget_min && rfp.budget_max && (
                  <div>
                    <span className="font-medium text-gray-700">Budget Range:</span> {formatCurrency(rfp.budget_min)} - {formatCurrency(rfp.budget_max)}
                  </div>
                )}
              </div>

              {rfp.requirements && rfp.requirements.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Requirements:</h4>
                  <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                    {rfp.requirements.map((req, index) => (
                      <li key={index}>{req}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Response Form */}
        <Card>
          <CardHeader>
            <CardTitle>Your Response</CardTitle>
            <CardDescription>
              Fill out the form below to submit your response. You can save as draft or submit directly.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {validationErrors.length > 0 && (
              <ErrorAlert errors={validationErrors} className="mb-6" />
            )}

            <form className="space-y-6">
              {/* Proposal */}
              <FormTextArea
                label="Proposal *"
                id="proposal"
                name="proposal"
                value={formData.proposal}
                onChange={(e) => handleInputChange('proposal', e.target.value)}
                placeholder="Describe your proposal in detail..."
                rows={8}
                error={fieldErrors.proposal}
                hint="Minimum 50 characters, maximum 5000 characters"
                required
              />

              {/* Proposed Budget */}
              <FormField
                label="Proposed Budget"
                id="proposed_budget"
                name="proposed_budget"
                type="number"
                value={formData.proposed_budget}
                onChange={(e) => handleInputChange('proposed_budget', e.target.value)}
                placeholder="Enter your proposed budget"
                error={fieldErrors.proposed_budget}
                hint="Enter the total budget for your proposal"
              />

              {/* Timeline */}
              <FormTextArea
                label="Timeline"
                id="timeline"
                name="timeline"
                value={formData.timeline}
                onChange={(e) => handleInputChange('timeline', e.target.value)}
                placeholder="Describe the timeline for your proposal..."
                rows={3}
                error={fieldErrors.timeline}
                hint="Describe when you can deliver the project"
              />

              {/* Methodology */}
              <FormTextArea
                label="Methodology"
                id="methodology"
                name="methodology"
                value={formData.methodology}
                onChange={(e) => handleInputChange('methodology', e.target.value)}
                placeholder="Describe your approach and methodology..."
                rows={4}
                error={fieldErrors.methodology}
                hint="Explain how you will approach the project"
              />

              {/* Team Details */}
              <FormTextArea
                label="Team Details"
                id="team_details"
                name="team_details"
                value={formData.team_details}
                onChange={(e) => handleInputChange('team_details', e.target.value)}
                placeholder="Describe your team and their qualifications..."
                rows={4}
                error={fieldErrors.team_details}
                hint="Provide information about your team members"
              />

              {/* Additional Notes */}
              <FormTextArea
                label="Additional Notes"
                id="additional_notes"
                name="additional_notes"
                value={formData.additional_notes}
                onChange={(e) => handleInputChange('additional_notes', e.target.value)}
                placeholder="Any additional information you'd like to include..."
                rows={3}
                error={fieldErrors.additional_notes}
                hint="Optional additional information"
              />

              {/* Submit Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 pt-6">
                <Button
                  type="button"
                  onClick={() => handleSubmit('draft')}
                  disabled={submitting}
                  variant="outline"
                  className="flex-1"
                >
                  {submitting ? 'Saving...' : 'Save as Draft'}
                </Button>
                <Button
                  type="button"
                  onClick={() => handleSubmit('submitted')}
                  disabled={submitting}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  {submitting ? 'Submitting...' : 'Submit Response'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
