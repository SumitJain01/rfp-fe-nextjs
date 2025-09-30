'use client';

import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { RFP } from '@/types';
import { formatDate, formatCurrency, getStatusColor } from '@/lib/utils';

export default function RFPsPage() {
  const { user } = useAuth();
  const [rfps, setRfps] = useState<RFP[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  useEffect(() => {
    const fetchRfps = async () => {
      try {
        const params = new URLSearchParams();
        if (searchTerm) params.append('search', searchTerm);
        if (statusFilter) params.append('status', statusFilter);
        if (categoryFilter) params.append('category', categoryFilter);

        const response = await api.get(`/rfps?${params.toString()}`);
        setRfps(response.data.data);
      } catch (error) {
        console.error('Error fetching RFPs:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRfps();
  }, [searchTerm, statusFilter, categoryFilter]);

  const handlePublishRfp = async (rfpId: string) => {
    try {
      await api.post(`/rfps/${rfpId}/publish`);
      // Refresh the list
      const response = await api.get('/rfps');
      setRfps(response.data.data);
    } catch (error) {
      console.error('Error publishing RFP:', error);
    }
  };

  const handleDeleteRfp = async (rfpId: string) => {
    if (!confirm('Are you sure you want to delete this RFP?')) return;

    try {
      await api.delete(`/rfps/${rfpId}`);
      setRfps(rfps.filter(rfp => rfp.id !== rfpId));
    } catch (error) {
      console.error('Error deleting RFP:', error);
    }
  };

  if (!user) return null;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {user.role === 'buyer' ? 'My RFPs' : 'Available RFPs'}
            </h1>
            <p className="text-gray-600">
              {user.role === 'buyer' 
                ? 'Manage your Request for Proposals' 
                : 'Browse and respond to available RFPs'}
            </p>
          </div>
          {user.role === 'buyer' && (
            <Link href="/dashboard/rfps/create">
              <Button className="bg-blue-600 hover:bg-blue-700">
                Create New RFP
              </Button>
            </Link>
          )}
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Search
                </label>
                <Input
                  placeholder="Search RFPs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">All Statuses</option>
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="closed">Closed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">All Categories</option>
                  <option value="it_services">IT Services</option>
                  <option value="construction">Construction</option>
                  <option value="consulting">Consulting</option>
                  <option value="manufacturing">Manufacturing</option>
                  <option value="logistics">Logistics</option>
                  <option value="marketing">Marketing</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* RFP List */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-3 bg-gray-200 rounded"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : rfps.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rfps.map((rfp) => (
              <Card key={rfp.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{rfp.title}</CardTitle>
                    <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(rfp.status)}`}>
                      {rfp.status}
                    </span>
                  </div>
                  <CardDescription className="capitalize">
                    {rfp.category.replace('_', ' ')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <p className="text-sm text-gray-600 line-clamp-3">
                      {rfp.description}
                    </p>
                    
                    <div className="space-y-1 text-sm">
                      {(rfp.budget_min || rfp.budget_max) && (
                        <p className="text-gray-600">
                          <span className="font-medium">Budget:</span>{' '}
                          {rfp.budget_min && rfp.budget_max 
                            ? `${formatCurrency(rfp.budget_min)} - ${formatCurrency(rfp.budget_max)}`
                            : rfp.budget_min 
                              ? `From ${formatCurrency(rfp.budget_min)}`
                              : `Up to ${formatCurrency(rfp.budget_max!)}`
                          }
                        </p>
                      )}
                      <p className="text-gray-600">
                        <span className="font-medium">Deadline:</span>{' '}
                        {formatDate(rfp.deadline)}
                      </p>
                      <p className="text-gray-600">
                        <span className="font-medium">Responses:</span>{' '}
                        {rfp.response_count}
                      </p>
                      {rfp.creator && (
                        <p className="text-gray-600">
                          <span className="font-medium">By:</span>{' '}
                          {rfp.creator.company_name || rfp.creator.full_name}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2 pt-2">
                      <Link href={`/dashboard/rfps/${rfp.id}`}>
                        <Button size="sm" variant="outline">
                          View Details
                        </Button>
                      </Link>
                      
                      {user.role === 'buyer' && user.id === rfp.created_by && (
                        <>
                          {rfp.status === 'draft' && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => handlePublishRfp(rfp.id)}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                Publish
                              </Button>
                              <Link href={`/dashboard/rfps/${rfp.id}/edit`}>
                                <Button size="sm" variant="outline">
                                  Edit
                                </Button>
                              </Link>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleDeleteRfp(rfp.id)}
                              >
                                Delete
                              </Button>
                            </>
                          )}
                          {rfp.status === 'published' && (
                            <Link href={`/dashboard/responses?rfp_id=${rfp.id}`}>
                              <Button size="sm" variant="outline">
                                View Responses ({rfp.response_count})
                              </Button>
                            </Link>
                          )}
                        </>
                      )}

                      {user.role === 'supplier' && rfp.status === 'published' && (
                        <Link href={`/dashboard/rfps/${rfp.id}/respond`}>
                          <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                            Submit Response
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="text-center py-16">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="h-10 w-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {user.role === 'buyer' ? 'No RFPs created yet' : 'No RFPs available'}
              </h3>
              <p className="text-gray-500 mb-6 max-w-sm mx-auto">
                {user.role === 'buyer' 
                  ? 'Get started by creating your first Request for Proposal to connect with suppliers.' 
                  : 'Check back later for new opportunities or adjust your search filters.'}
              </p>
              {user.role === 'buyer' && (
                <Link href="/dashboard/rfps/create">
                  <Button className="bg-blue-600 hover:bg-blue-700 px-6 py-2">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Create New RFP
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
