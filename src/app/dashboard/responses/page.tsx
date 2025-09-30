'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Response, RFP } from '@/types';
import { formatDate, formatCurrency, getStatusColor } from '@/lib/utils';

export default function ResponsesPage() {
  const { user } = useAuth();
  const { success, error: showError } = useToast();
  const [responses, setResponses] = useState<Response[]>([]);
  const [rfps, setRfps] = useState<RFP[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [rfpFilter, setRfpFilter] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const params = new URLSearchParams();
        if (searchTerm) params.append('search', searchTerm);
        if (statusFilter) params.append('status', statusFilter);
        if (rfpFilter) params.append('rfp_id', rfpFilter);

        // Fetch responses
        const response = await api.get(`/responses?${params.toString()}`);
        setResponses(response.data.data || []);

        // Fetch RFPs for filtering (buyers need this to filter by RFP)
        if (user?.role === 'buyer') {
          const rfpResponse = await api.get('/rfps');
          setRfps(rfpResponse.data.data || []);
        }
      } catch (error) {
        console.error('Error fetching responses:', error);
        showError('Failed to load responses', 'There was an error loading the responses. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [searchTerm, statusFilter, rfpFilter, user?.role, showError]);

  const handleStatusUpdate = async (responseId: string, newStatus: 'approved' | 'rejected') => {
    try {
      await api.patch(`/responses/${responseId}`, { status: newStatus });
      success(
        `Response ${newStatus === 'approved' ? 'Approved' : 'Rejected'}!`,
        `The response has been ${newStatus === 'approved' ? 'approved' : 'rejected'} successfully.`
      );
      
      // Refresh the list
      const response = await api.get('/responses');
      setResponses(response.data.data || []);
    } catch (error) {
      console.error(`Error ${newStatus}ing response:`, error);
      showError(`Failed to ${newStatus} response`, `There was an error ${newStatus}ing the response. Please try again.`);
    }
  };

  const handleDeleteResponse = async (responseId: string) => {
    if (!confirm('Are you sure you want to delete this response?')) return;

    try {
      await api.delete(`/responses/${responseId}`);
      success('Response Deleted', 'The response has been successfully deleted.');
      setResponses(responses.filter(response => response.id !== responseId));
    } catch (error) {
      console.error('Error deleting response:', error);
      showError('Failed to delete response', 'There was an error deleting the response. Please try again.');
    }
  };

  if (!user) return null;

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading responses...</p>
          </div>
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
              {user.role === 'buyer' ? 'RFP Responses' : 'My Responses'}
            </h1>
            <p className="text-gray-600">
              {user.role === 'buyer' 
                ? 'Review and manage responses to your RFPs' 
                : 'View and manage your submitted responses'}
            </p>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search
                </label>
                <Input
                  type="text"
                  placeholder="Search responses..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="">All Statuses</option>
                  <option value="draft">Draft</option>
                  <option value="submitted">Submitted</option>
                  <option value="under_review">Under Review</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>

              {user.role === 'buyer' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    RFP
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={rfpFilter}
                    onChange={(e) => setRfpFilter(e.target.value)}
                  >
                    <option value="">All RFPs</option>
                    {rfps.map((rfp) => (
                      <option key={rfp.id} value={rfp.id}>
                        {rfp.title}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Responses List */}
        <div className="space-y-4">
          {responses.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No responses found</h3>
                <p className="text-gray-500 mb-4">
                  {user.role === 'buyer' 
                    ? 'No responses have been submitted to your RFPs yet.' 
                    : 'You haven\'t submitted any responses yet.'}
                </p>
                {user.role === 'supplier' && (
                  <Link href="/dashboard/rfps">
                    <Button className="bg-blue-600 hover:bg-blue-700">
                      Browse RFPs
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          ) : (
            responses.map((response) => (
              <Card key={response.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {response.rfp?.title || 'Unknown RFP'}
                        </h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(response.status)}`}>
                          {response.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                      
                      <p className="text-gray-600 mb-3 line-clamp-2">
                        {response.proposal}
                      </p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-500">
                        <div>
                          <span className="font-medium">Submitted by:</span> {response.submitter?.full_name || response.submitter?.username || 'Unknown'}
                        </div>
                        <div>
                          <span className="font-medium">Submitted:</span> {formatDate(response.submitted_at || response.created_at)}
                        </div>
                        {response.proposed_budget && (
                          <div>
                            <span className="font-medium">Proposed Budget:</span> {formatCurrency(response.proposed_budget)}
                          </div>
                        )}
                      </div>

                      {response.timeline && (
                        <div className="mt-2 text-sm text-gray-500">
                          <span className="font-medium">Timeline:</span> {response.timeline}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col space-y-2 ml-4">
                      <Link href={`/dashboard/responses/${response.id}`}>
                        <Button size="sm" variant="outline">
                          View Details
                        </Button>
                      </Link>
                      
                      {user.role === 'buyer' && response.status === 'submitted' && (
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            onClick={() => handleStatusUpdate(response.id, 'approved')}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleStatusUpdate(response.id, 'rejected')}
                            variant="destructive"
                          >
                            Reject
                          </Button>
                        </div>
                      )}
                      
                      {user.role === 'supplier' && response.status === 'draft' && (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteResponse(response.id)}
                        >
                          Delete
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
