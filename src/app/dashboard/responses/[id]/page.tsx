'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { FormTextArea } from '@/components/ui/FormTextArea';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Response, RFP } from '@/types';
import { formatDate, formatCurrency, getStatusColor } from '@/lib/utils';

export default function ResponseDetailPage() {
  const { user } = useAuth();
  const { success, error: showError } = useToast();
  const params = useParams();
  const router = useRouter();
  const [response, setResponse] = useState<Response | null>(null);
  const [rfp, setRfp] = useState<RFP | null>(null);
  const [loading, setLoading] = useState(true);
  const [reviewerNotes, setReviewerNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchResponse = async () => {
      try {
        const responseData = await api.get(`/responses/${params.id}`);
        setResponse(responseData.data);
        
        // Fetch RFP details if available
        if (responseData.data.rfp_id) {
          const rfpData = await api.get(`/rfps/${responseData.data.rfp_id}`);
          setRfp(rfpData.data);
        }
      } catch (error) {
        console.error('Error fetching response:', error);
        showError('Failed to load response', 'There was an error loading the response details.');
        router.push('/dashboard/responses');
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchResponse();
    }
  }, [params.id, router, showError]);

  const handleStatusUpdate = async (newStatus: 'approved' | 'rejected') => {
    if (!response) return;
    
    setIsSubmitting(true);
    try {
      await api.patch(`/responses/${response.id}`, { 
        status: newStatus,
        reviewer_notes: reviewerNotes 
      });
      
      success(
        `Response ${newStatus === 'approved' ? 'Approved' : 'Rejected'}!`,
        `The response has been ${newStatus === 'approved' ? 'approved' : 'rejected'} successfully.`
      );
      
      // Refresh the response data
      const responseData = await api.get(`/responses/${response.id}`);
      setResponse(responseData.data);
    } catch (error) {
      console.error(`Error ${newStatus}ing response:`, error);
      showError(`Failed to ${newStatus} response`, `There was an error ${newStatus}ing the response. Please try again.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitResponse = async () => {
    if (!response) return;
    
    setIsSubmitting(true);
    try {
      await api.patch(`/responses/${response.id}`, { status: 'submitted' });
      
      success('Response Submitted!', 'Your response has been submitted successfully.');
      
      // Refresh the response data
      const responseData = await api.get(`/responses/${response.id}`);
      setResponse(responseData.data);
    } catch (error) {
      console.error('Error submitting response:', error);
      showError('Failed to submit response', 'There was an error submitting the response. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) return null;

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading response...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!response) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Response not found</h2>
          <p className="text-gray-600 mb-6">The response you&apos;re looking for doesn&apos;t exist or you don&apos;t have permission to view it.</p>
          <Link href="/dashboard/responses">
            <Button>Back to Responses</Button>
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
              Response Details
            </h1>
            <p className="text-gray-600">
              {user.role === 'buyer' 
                ? 'Review and manage this response' 
                : 'View and manage your response'}
            </p>
          </div>
          <Link href="/dashboard/responses">
            <Button variant="outline">Back to Responses</Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* RFP Information */}
            {rfp && (
              <Card>
                <CardHeader>
                  <CardTitle>RFP Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{rfp.title}</h3>
                      <p className="text-gray-600 mt-1">{rfp.description}</p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
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
                      <div>
                        <span className="font-medium text-gray-700">Status:</span> 
                        <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(rfp.status)}`}>
                          {rfp.status.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Response Details */}
            <Card>
              <CardHeader>
                <CardTitle>Response Details</CardTitle>
                <div className="flex items-center space-x-3">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(response.status)}`}>
                    {response.status.replace('_', ' ').toUpperCase()}
                  </span>
                  <span className="text-sm text-gray-500">
                    Submitted: {formatDate(response.submitted_at || response.created_at)}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Proposal */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Proposal</h4>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-gray-700 whitespace-pre-wrap">{response.proposal}</p>
                  </div>
                </div>

                {/* Proposed Budget */}
                {response.proposed_budget && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Proposed Budget</h4>
                    <p className="text-lg font-semibold text-blue-600">{formatCurrency(response.proposed_budget)}</p>
                  </div>
                )}

                {/* Timeline */}
                {response.timeline && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Timeline</h4>
                    <p className="text-gray-700">{response.timeline}</p>
                  </div>
                )}

                {/* Methodology */}
                {response.methodology && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Methodology</h4>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-gray-700 whitespace-pre-wrap">{response.methodology}</p>
                    </div>
                  </div>
                )}

                {/* Team Details */}
                {response.team_details && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Team Details</h4>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-gray-700 whitespace-pre-wrap">{response.team_details}</p>
                    </div>
                  </div>
                )}

                {/* Additional Notes */}
                {response.additional_notes && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Additional Notes</h4>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-gray-700 whitespace-pre-wrap">{response.additional_notes}</p>
                    </div>
                  </div>
                )}

                {/* Reviewer Notes */}
                {response.reviewer_notes && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Reviewer Notes</h4>
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <p className="text-gray-700 whitespace-pre-wrap">{response.reviewer_notes}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Response Info */}
            <Card>
              <CardHeader>
                <CardTitle>Response Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <span className="font-medium text-gray-700">Submitted by:</span>
                  <p className="text-gray-900">{response.submitter?.full_name || response.submitter?.username || 'Unknown'}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Company:</span>
                  <p className="text-gray-900">{response.submitter?.company_name || 'Not specified'}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Created:</span>
                  <p className="text-gray-900">{formatDate(response.created_at)}</p>
                </div>
                {response.submitted_at && (
                  <div>
                    <span className="font-medium text-gray-700">Submitted:</span>
                    <p className="text-gray-900">{formatDate(response.submitted_at)}</p>
                  </div>
                )}
                {response.reviewed_at && (
                  <div>
                    <span className="font-medium text-gray-700">Reviewed:</span>
                    <p className="text-gray-900">{formatDate(response.reviewed_at)}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {user.role === 'supplier' && response.status === 'draft' && (
                  <Button 
                    onClick={handleSubmitResponse}
                    disabled={isSubmitting}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit Response'}
                  </Button>
                )}

                {user.role === 'buyer' && response.status === 'submitted' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Reviewer Notes
                      </label>
                      <FormTextArea
                        label=""
                        id="reviewer_notes"
                        name="reviewer_notes"
                        value={reviewerNotes}
                        onChange={(e) => setReviewerNotes(e.target.value)}
                        placeholder="Add notes about this response..."
                        rows={3}
                      />
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        onClick={() => handleStatusUpdate('approved')}
                        disabled={isSubmitting}
                        className="flex-1 bg-green-600 hover:bg-green-700"
                      >
                        {isSubmitting ? 'Processing...' : 'Approve'}
                      </Button>
                      <Button
                        onClick={() => handleStatusUpdate('rejected')}
                        disabled={isSubmitting}
                        variant="destructive"
                        className="flex-1"
                      >
                        {isSubmitting ? 'Processing...' : 'Reject'}
                      </Button>
                    </div>
                  </>
                )}

                {user.role === 'supplier' && response.status === 'draft' && (
                  <Button 
                    variant="destructive"
                    className="w-full"
                    onClick={() => {
                      if (confirm('Are you sure you want to delete this response?')) {
                        // Handle delete
                      }
                    }}
                  >
                    Delete Response
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
