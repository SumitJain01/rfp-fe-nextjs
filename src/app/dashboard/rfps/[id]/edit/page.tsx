'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { FormTextArea } from '@/components/ui/FormTextArea';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { RFP } from '@/types';

export default function EditRFPPage({ params }: { params: { id: string } }) {
  const { user } = useAuth();
  const { success, error: showError } = useToast();
  const router = useRouter();
  const [rfp, setRfp] = useState<RFP | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    budget_min: '',
    budget_max: '',
    deadline: '',
    requirements: '',
    evaluation_criteria: '',
    terms_and_conditions: '',
    status: 'draft' as 'draft' | 'published' | 'closed' | 'cancelled'
  });

  useEffect(() => {
    const fetchRfp = async () => {
      try {
        const response = await api.get(`/rfps/${params.id}`);
        const rfpData = response.data.data;
        setRfp(rfpData);
        
        // Check if user can edit this RFP
        if (user?.role !== 'buyer' || user?.id !== rfpData.created_by) {
          showError('Access Denied', 'You can only edit RFPs you created.');
          router.push('/dashboard/rfps');
          return;
        }

        setFormData({
          title: rfpData.title,
          description: rfpData.description,
          category: rfpData.category,
          budget_min: rfpData.budget_min?.toString() || '',
          budget_max: rfpData.budget_max?.toString() || '',
          deadline: rfpData.deadline.split('T')[0], // Convert to YYYY-MM-DD format
          requirements: rfpData.requirements.join('\n'),
          evaluation_criteria: rfpData.evaluation_criteria.join('\n'),
          terms_and_conditions: rfpData.terms_and_conditions || '',
          status: rfpData.status
        });
      } catch (error) {
        console.error('Error fetching RFP:', error);
        showError('Error', 'Failed to load RFP details.');
        router.push('/dashboard/rfps');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchRfp();
    }
  }, [params.id, user, router, showError]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const updateData = {
        ...formData,
        budget_min: formData.budget_min ? parseFloat(formData.budget_min) : undefined,
        budget_max: formData.budget_max ? parseFloat(formData.budget_max) : undefined,
        requirements: formData.requirements.split('\n').filter(req => req.trim()),
        evaluation_criteria: formData.evaluation_criteria.split('\n').filter(criteria => criteria.trim()),
        deadline: new Date(formData.deadline).toISOString()
      };

      await api.put(`/rfps/${params.id}`, updateData);
      success('RFP Updated!', 'Your RFP has been successfully updated.');
      router.push('/dashboard/rfps');
    } catch (error) {
      console.error('Error updating RFP:', error);
      showError('Failed to update RFP', 'There was an error updating your RFP. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
            <div className="space-y-4">
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!rfp) {
    return (
      <DashboardLayout>
        <div className="text-center py-16">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">RFP Not Found</h1>
          <p className="text-gray-600 mb-6">The RFP you&apos;re looking for doesn&apos;t exist or you don&apos;t have permission to edit it.</p>
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
            <h1 className="text-2xl font-bold text-gray-900">Edit RFP</h1>
            <p className="text-gray-600">Update your Request for Proposal</p>
          </div>
          <Link href="/dashboard/rfps">
            <Button variant="outline">Back to RFPs</Button>
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Update the basic details of your RFP</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                label="Title"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
                placeholder="Enter RFP title"
              />

              <FormTextArea
                label="Description"
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                required
                placeholder="Describe your project requirements"
                rows={4}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    required
                    className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">Select Category</option>
                    <option value="it_services">IT Services</option>
                    <option value="construction">Construction</option>
                    <option value="consulting">Consulting</option>
                    <option value="manufacturing">Manufacturing</option>
                    <option value="logistics">Logistics</option>
                    <option value="marketing">Marketing</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="closed">Closed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  label="Minimum Budget"
                  id="budget_min"
                  name="budget_min"
                  type="number"
                  value={formData.budget_min}
                  onChange={handleInputChange}
                  placeholder="0"
                />

                <FormField
                  label="Maximum Budget"
                  id="budget_max"
                  name="budget_max"
                  type="number"
                  value={formData.budget_max}
                  onChange={handleInputChange}
                  placeholder="0"
                />

                <FormField
                  label="Deadline"
                  id="deadline"
                  name="deadline"
                  type="date"
                  value={formData.deadline}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </CardContent>
          </Card>

          {/* Requirements */}
          <Card>
            <CardHeader>
              <CardTitle>Requirements</CardTitle>
              <CardDescription>List the specific requirements for this project (one per line)</CardDescription>
            </CardHeader>
            <CardContent>
              <FormTextArea
                label="Requirements"
                id="requirements"
                name="requirements"
                value={formData.requirements}
                onChange={handleInputChange}
                placeholder="Enter requirements, one per line"
                rows={6}
              />
            </CardContent>
          </Card>

          {/* Evaluation Criteria */}
          <Card>
            <CardHeader>
              <CardTitle>Evaluation Criteria</CardTitle>
              <CardDescription>Define how proposals will be evaluated (one per line)</CardDescription>
            </CardHeader>
            <CardContent>
              <FormTextArea
                label="Evaluation Criteria"
                id="evaluation_criteria"
                name="evaluation_criteria"
                value={formData.evaluation_criteria}
                onChange={handleInputChange}
                placeholder="Enter evaluation criteria, one per line"
                rows={6}
              />
            </CardContent>
          </Card>

          {/* Terms and Conditions */}
          <Card>
            <CardHeader>
              <CardTitle>Terms and Conditions</CardTitle>
              <CardDescription>Additional terms and conditions for this RFP</CardDescription>
            </CardHeader>
            <CardContent>
              <FormTextArea
                label="Terms and Conditions"
                id="terms_and_conditions"
                name="terms_and_conditions"
                value={formData.terms_and_conditions}
                onChange={handleInputChange}
                placeholder="Enter any additional terms and conditions"
                rows={4}
              />
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end space-x-4">
            <Link href="/dashboard/rfps">
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </Link>
            <Button type="submit" disabled={saving} className="bg-blue-600 hover:bg-blue-700">
              {saving ? 'Saving...' : 'Update RFP'}
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
