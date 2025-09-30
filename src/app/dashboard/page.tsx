'use client';

import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { RFP, Response } from '@/types';
import { formatDate, getStatusColor } from '@/lib/utils';

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalRfps: 0,
    activeRfps: 0,
    totalResponses: 0,
    pendingResponses: 0,
  });
  const [recentRfps, setRecentRfps] = useState<RFP[]>([]);
  const [recentResponses, setRecentResponses] = useState<Response[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch RFPs
        const rfpsResponse = await api.get('/rfps?limit=5');
        const rfps = rfpsResponse.data.data;
        setRecentRfps(rfps);

        // Fetch responses
        const responsesResponse = await api.get('/responses?limit=5');
        const responses = responsesResponse.data.data;
        setRecentResponses(responses);

        // Calculate stats based on user role
        if (user?.role === 'buyer') {
          setStats({
            totalRfps: rfps.length,
            activeRfps: rfps.filter((rfp: RFP) => rfp.status === 'published').length,
            totalResponses: responses.length,
            pendingResponses: responses.filter((response: Response) => response.status === 'submitted').length,
          });
        } else {
          setStats({
            totalRfps: rfps.length,
            activeRfps: rfps.filter((rfp: RFP) => rfp.status === 'published').length,
            totalResponses: responses.length,
            pendingResponses: responses.filter((response: Response) => response.status === 'draft').length,
          });
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  if (!user) return null;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Welcome Section */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {user.full_name}!
          </h1>
          <p className="text-gray-600">
            {user.role === 'buyer' 
              ? 'Manage your RFPs and review supplier responses.' 
              : 'Browse available RFPs and submit your proposals.'}
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100 hover:shadow-xl transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-700">
                {user.role === 'buyer' ? 'Total RFPs' : 'Available RFPs'}
              </CardTitle>
              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-900">{stats.totalRfps}</div>
              <p className="text-xs text-blue-600 mt-1">
                {user.role === 'buyer' ? 'RFPs created' : 'RFPs to explore'}
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100 hover:shadow-xl transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-700">
                {user.role === 'buyer' ? 'Active RFPs' : 'Open RFPs'}
              </CardTitle>
              <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-900">{stats.activeRfps}</div>
              <p className="text-xs text-green-600 mt-1">
                Currently active
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100 hover:shadow-xl transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-purple-700">
                {user.role === 'buyer' ? 'Total Responses' : 'My Responses'}
              </CardTitle>
              <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-900">{stats.totalResponses}</div>
              <p className="text-xs text-purple-600 mt-1">
                {user.role === 'buyer' ? 'Responses received' : 'Responses submitted'}
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-orange-100 hover:shadow-xl transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-orange-700">
                {user.role === 'buyer' ? 'Pending Reviews' : 'Draft Responses'}
              </CardTitle>
              <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-900">{stats.pendingResponses}</div>
              <p className="text-xs text-orange-600 mt-1">
                {user.role === 'buyer' ? 'Awaiting review' : 'In draft status'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              {user.role === 'buyer' 
                ? 'Create new RFPs and manage existing ones.' 
                : 'Browse RFPs and submit responses.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              {user.role === 'buyer' ? (
                <>
                  <Link href="/dashboard/rfps/create">
                    <Button className="bg-blue-600 hover:bg-blue-700">
                      Create New RFP
                    </Button>
                  </Link>
                  <Link href="/dashboard/rfps">
                    <Button variant="outline">
                      Manage RFPs
                    </Button>
                  </Link>
                  <Link href="/dashboard/responses">
                    <Button variant="outline">
                      Review Responses
                    </Button>
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/dashboard/rfps">
                    <Button className="bg-blue-600 hover:bg-blue-700">
                      Browse RFPs
                    </Button>
                  </Link>
                  <Link href="/dashboard/responses">
                    <Button variant="outline">
                      My Responses
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent RFPs */}
          <Card>
            <CardHeader>
              <CardTitle>
                {user.role === 'buyer' ? 'Recent RFPs' : 'Latest RFPs'}
              </CardTitle>
              <CardDescription>
                {user.role === 'buyer' 
                  ? 'Your recently created RFPs' 
                  : 'Recently published RFPs you can respond to'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  ))}
                </div>
              ) : recentRfps.length > 0 ? (
                <div className="space-y-4">
                  {recentRfps.slice(0, 5).map((rfp) => (
                    <div key={rfp.id} className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">{rfp.title}</h4>
                        <p className="text-xs text-gray-500">
                          Deadline: {formatDate(rfp.deadline)}
                        </p>
                      </div>
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(rfp.status)}`}>
                        {rfp.status}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">
                  {user.role === 'buyer' 
                    ? 'No RFPs created yet.' 
                    : 'No RFPs available at the moment.'}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Recent Responses */}
          <Card>
            <CardHeader>
              <CardTitle>
                {user.role === 'buyer' ? 'Recent Responses' : 'My Recent Responses'}
              </CardTitle>
              <CardDescription>
                {user.role === 'buyer' 
                  ? 'Latest responses to your RFPs' 
                  : 'Your recent response submissions'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  ))}
                </div>
              ) : recentResponses.length > 0 ? (
                <div className="space-y-4">
                  {recentResponses.slice(0, 5).map((response) => (
                    <div key={response.id} className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">
                          {response.rfp?.title || 'RFP Response'}
                        </h4>
                        <p className="text-xs text-gray-500">
                          {user.role === 'buyer' 
                            ? `From: ${response.submitter?.full_name}` 
                            : `Submitted: ${formatDate(response.created_at)}`}
                        </p>
                      </div>
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(response.status)}`}>
                        {response.status.replace('_', ' ')}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">
                  {user.role === 'buyer' 
                    ? 'No responses received yet.' 
                    : 'No responses submitted yet.'}
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
