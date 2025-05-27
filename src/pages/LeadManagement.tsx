import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Filter,
  FileText,
  MapPin,
  Phone,
  Mail,
  Upload,
  Trash2,
  AlertCircle,
  User
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/common/Card';
import { Input } from '../components/common/Input';
import { Button } from '../components/common/Button';
import { Select } from '../components/common/Select';
import { TextArea } from '../components/common/TextArea';
import { Modal } from '../components/common/Modal';
import { StatusBadge } from '../components/common/StatusBadge';
import { Toast } from '../components/common/Toast';
import { Lead, LeadStatus, LeadPriority } from '../types/lead';
import { getLeads, createLead, updateLead, deleteLead } from '../services/leadService';
import { useAuthStore } from '../store/authStore';

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low Priority' },
  { value: 'medium', label: 'Medium Priority' },
  { value: 'high', label: 'High Priority' },
];

const SOURCE_OPTIONS = [
  { value: 'website', label: 'Website' },
  { value: 'referral', label: 'Referral' },
  { value: 'direct', label: 'Direct Contact' },
  { value: 'social', label: 'Social Media' },
  { value: 'trade_show', label: 'Trade Show' },
  { value: 'other', label: 'Other' },
];

const STATUS_OPTIONS = [
  { value: 'new', label: 'New Lead' },
  { value: 'negotiation', label: 'In Negotiation' },
  { value: 'won', label: 'Won' },
  { value: 'lost', label: 'Lost' },
];

const ITEMS_PER_PAGE = 10;

export function LeadManagement() {
  const { user } = useAuthStore();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [filteredLeads, setFilteredLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<LeadStatus | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<LeadPriority | 'all'>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [toast, setToast] = useState<{
    show: boolean;
    title: string;
    description?: string;
    variant?: 'success' | 'error' | 'warning';
  }>({ show: false, title: '' });

  // Form state
  const [formData, setFormData] = useState({
    customerName: '',
    email: '',
    phone: '',
    serviceNeeded: '',
    siteLocation: '',
    priority: 'medium' as LeadPriority,
    source: '',
    notes: '',
    files: [] as File[],
  });

  useEffect(() => {
    fetchLeads();
  }, []);

  useEffect(() => {
    filterLeads();
  }, [leads, searchTerm, statusFilter, priorityFilter, sourceFilter]);

  const fetchLeads = async () => {
    try {
      const data = await getLeads();
      setLeads(data);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching leads:', error);
      showToast('Error fetching leads', 'error');
      setIsLoading(false);
    }
  };

  const filterLeads = () => {
    let filtered = [...leads];

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(lead => 
        lead.customerName.toLowerCase().includes(searchLower) ||
        lead.siteLocation.toLowerCase().includes(searchLower) ||
        lead.serviceNeeded.toLowerCase().includes(searchLower)
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(lead => lead.status === statusFilter);
    }

    if (priorityFilter !== 'all') {
      filtered = filtered.filter(lead => lead.priority === priorityFilter);
    }

    if (sourceFilter !== 'all') {
      filtered = filtered.filter(lead => lead.source === sourceFilter);
    }

    setFilteredLeads(filtered);
    setCurrentPage(1);
  };

  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.customerName || !formData.serviceNeeded || !formData.siteLocation) {
      showToast('Please fill in all required fields', 'error');
      return;
    }

    try {
      const newLead = await createLead({
        customerName: formData.customerName,
        serviceNeeded: formData.serviceNeeded,
        siteLocation: formData.siteLocation,
        status: 'new',
        assignedTo: user!.id,
        priority: formData.priority,
        source: formData.source,
        notes: formData.notes,
      });

      setLeads(prev => [newLead, ...prev]);
      setIsCreateModalOpen(false);
      resetForm();
      showToast('Lead created successfully', 'success');
    } catch (error) {
      console.error('Error creating lead:', error);
      showToast('Error creating lead', 'error');
    }
  };

  const handleUpdateLead = async (lead: Lead, updates: Partial<Lead>) => {
    try {
      const updatedLead = await updateLead(lead.id, updates);
      if (updatedLead) {
        setLeads(prev => 
          prev.map(l => l.id === lead.id ? updatedLead : l)
        );
        showToast('Lead updated successfully', 'success');
      }
    } catch (error) {
      console.error('Error updating lead:', error);
      showToast('Error updating lead', 'error');
    }
  };

  const handleDeleteLead = async () => {
    if (!selectedLead) return;

    try {
      await deleteLead(selectedLead.id);
      setLeads(prev => prev.filter(lead => lead.id !== selectedLead.id));
      setIsDeleteModalOpen(false);
      setSelectedLead(null);
      showToast('Lead deleted successfully', 'success');
    } catch (error) {
      console.error('Error deleting lead:', error);
      showToast('Error deleting lead', 'error');
    }
  };

  const resetForm = () => {
    setFormData({
      customerName: '',
      email: '',
      phone: '',
      serviceNeeded: '',
      siteLocation: '',
      priority: 'medium',
      source: '',
      notes: '',
      files: [],
    });
  };

  const showToast = (
    title: string,
    variant: 'success' | 'error' | 'warning' = 'success'
  ) => {
    setToast({ show: true, title, variant });
    setTimeout(() => setToast({ show: false, title: '' }), 3000);
  };

  // Pagination
  const totalPages = Math.ceil(filteredLeads.length / ITEMS_PER_PAGE);
  const paginatedLeads = filteredLeads.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  if (!user || (user.role !== 'sales_agent' && user.role !== 'admin')) {
    return (
      <div className="p-4 text-center text-gray-500">
        You don't have permission to access this page.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
            <Input
              placeholder="Search leads..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex gap-4">
            <Select
              options={[
                { value: 'all', label: 'All Status' },
                ...STATUS_OPTIONS,
              ]}
              value={statusFilter}
              onChange={(value) => setStatusFilter(value as LeadStatus | 'all')}
              className="w-40"
            />

            <Select
              options={[
                { value: 'all', label: 'All Priority' },
                ...PRIORITY_OPTIONS,
              ]}
              value={priorityFilter}
              onChange={(value) => setPriorityFilter(value as LeadPriority | 'all')}
              className="w-40"
            />

            <Select
              options={[
                { value: 'all', label: 'All Sources' },
                ...SOURCE_OPTIONS,
              ]}
              value={sourceFilter}
              onChange={setSourceFilter}
              className="w-40"
            />
          </div>
        </div>

        <Button
          onClick={() => setIsCreateModalOpen(true)}
          leftIcon={<Plus size={16} />}
        >
          New Lead
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lead Pipeline</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-4">Loading leads...</div>
          ) : paginatedLeads.length === 0 ? (
            <div className="text-center py-4 text-gray-500">
              No leads found. Create a new lead to get started.
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Customer
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Service
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Location
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Priority
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Source
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {paginatedLeads.map((lead) => (
                      <tr key={lead.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium text-gray-900">
                            {lead.customerName}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">
                            {lead.serviceNeeded}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">
                            {lead.siteLocation}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            lead.priority === 'high' 
                              ? 'bg-error-100 text-error-800'
                              : lead.priority === 'medium'
                                ? 'bg-warning-100 text-warning-800'
                                : 'bg-success-100 text-success-800'
                          }`}>
                            {lead.priority?.charAt(0).toUpperCase() + lead.priority?.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <StatusBadge status={lead.status} />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">
                            {SOURCE_OPTIONS.find(s => s.value === lead.source)?.label || '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedLead(lead);
                              setIsViewModalOpen(true);
                            }}
                          >
                            View
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="flex justify-between items-center mt-4">
                  <p className="text-sm text-gray-500">
                    Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} to{' '}
                    {Math.min(currentPage * ITEMS_PER_PAGE, filteredLeads.length)} of{' '}
                    {filteredLeads.length} leads
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Create Lead Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          resetForm();
        }}
        title="Create New Lead"
        size="lg"
      >
        <form onSubmit={handleCreateLead} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Customer Name"
              value={formData.customerName}
              onChange={(e) => setFormData(prev => ({ ...prev, customerName: e.target.value }))}
              required
            />

            <Input
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            />

            <Input
              label="Phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
            />

            <Select
              label="Service Needed"
              options={[
                { value: 'tower_crane', label: 'Tower Crane' },
                { value: 'mobile_crane', label: 'Mobile Crane' },
                { value: 'crawler_crane', label: 'Crawler Crane' },
              ]}
              value={formData.serviceNeeded}
              onChange={(value) => setFormData(prev => ({ ...prev, serviceNeeded: value }))}
              required
            />

            <div className="md:col-span-2">
              <Input
                label="Site Location"
                value={formData.siteLocation}
                onChange={(e) => setFormData(prev => ({ ...prev, siteLocation: e.target.value }))}
                required
              />
            </div>

            <Select
              label="Priority"
              options={PRIORITY_OPTIONS}
              value={formData.priority}
              onChange={(value) => setFormData(prev => ({ ...prev, priority: value as LeadPriority }))}
              required
            />

            <Select
              label="Source"
              options={SOURCE_OPTIONS}
              value={formData.source}
              onChange={(value) => setFormData(prev => ({ ...prev, source: value }))}
            />

            <div className="md:col-span-2">
              <TextArea
                label="Notes"
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                rows={4}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsCreateModalOpen(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button type="submit">Create Lead</Button>
          </div>
        </form>
      </Modal>

      {/* View Lead Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false);
          setSelectedLead(null);
        }}
        title="Lead Details"
        size="lg"
      >
        {selectedLead && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-medium text-gray-500">Customer</h4>
                <p className="mt-1 text-sm text-gray-900">{selectedLead.customerName}</p>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-500">Service Needed</h4>
                <p className="mt-1 text-sm text-gray-900">{selectedLead.serviceNeeded}</p>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-500">Location</h4>
                <p className="mt-1 text-sm text-gray-900">{selectedLead.siteLocation}</p>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-500">Status</h4>
                <div className="mt-1">
                  <Select
                    options={STATUS_OPTIONS}
                    value={selectedLead.status}
                    onChange={(value) => handleUpdateLead(selectedLead, { status: value as LeadStatus })}
                  />
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-500">Priority</h4>
                <div className="mt-1">
                  <Select
                    options={PRIORITY_OPTIONS}
                    value={selectedLead.priority}
                    onChange={(value) => handleUpdateLead(selectedLead, { priority: value as LeadPriority })}
                  />
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-500">Source</h4>
                <div className="mt-1">
                  <Select
                    options={SOURCE_OPTIONS}
                    value={selectedLead.source}
                    onChange={(value) => handleUpdateLead(selectedLead, { source: value })}
                  />
                </div>
              </div>

              <div className="md:col-span-2">
                <h4 className="text-sm font-medium text-gray-500">Notes</h4>
                <TextArea
                  value={selectedLead.notes || ''}
                  onChange={(e) => handleUpdateLead(selectedLead, { notes: e.target.value })}
                  rows={4}
                  className="mt-1"
                />
              </div>
            </div>

            <div className="flex justify-between">
              <Button
                variant="destructive"
                onClick={() => {
                  setIsViewModalOpen(false);
                  setIsDeleteModalOpen(true);
                }}
              >
                Delete Lead
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setIsViewModalOpen(false);
                  setSelectedLead(null);
                }}
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSelectedLead(null);
        }}
        title="Delete Lead"
        size="sm"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-4 bg-error-50 text-error-700 rounded-lg">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <p className="text-sm">
              Are you sure you want to delete this lead? This action cannot be undone.
            </p>
          </div>

          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteModalOpen(false);
                setSelectedLead(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteLead}
            >
              Delete Lead
            </Button>
          </div>
        </div>
      </Modal>

      {/* Toast Notifications */}
      {toast.show && (
        <Toast
          title={toast.title}
          variant={toast.variant}
          isVisible={toast.show}
          onClose={() => setToast({ show: false, title: '' })}
        />
      )}
    </div>
  );
}