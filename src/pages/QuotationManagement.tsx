import React, { useState, useEffect } from 'react';
import { 
  Calculator, 
  FileText, 
  Send, 
  Download,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/common/Card';
import { Input } from '../components/common/Input';
import { Button } from '../components/common/Button';
import { Select } from '../components/common/Select';
import { Modal } from '../components/common/Modal';
import { Badge } from '../components/common/Badge';
import { Toast } from '../components/common/Toast';
import { useAuthStore } from '../store/authStore';
import { getLeads } from '../services/leadService';
import { getQuotationsForLead, createQuotation } from '../services/quotationService';
import { Lead } from '../types/lead';
import { Quotation, QuotationInputs } from '../types/quotation';

type QuotationStatus = 'draft' | 'in_review' | 'approved' | 'sent';

interface QuotationWithStatus extends Quotation {
  status: QuotationStatus;
}

export function QuotationManagement() {
  const { user } = useAuthStore();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [quotations, setQuotations] = useState<QuotationWithStatus[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState<{
    show: boolean;
    title: string;
    description?: string;
    variant?: 'success' | 'error' | 'warning';
  }>({ show: false, title: '' });

  // Form state
  const [formData, setFormData] = useState<QuotationInputs>({
    baseRate: 0,
    workingHours: 8,
    rentalDays: 1,
    foodCharge: 0,
    accomCharge: 0,
    numResources: 1,
    usagePercent: 0,
    elongationPercent: 0,
    commercialCharge: 0,
    riskPercent: 0,
    incidentalCharge: 0,
    otherCharge: 0,
  });

  // Calculated values
  const [calculatedValues, setCalculatedValues] = useState({
    totalWorkingHours: 0,
    baseCost: 0,
    accomTotal: 0,
    usageCharge: 0,
    fuelCost: 0,
    elongationCost: 0,
    totalFuelCost: 0,
    riskCharge: 0,
    totalRent: 0,
  });

  useEffect(() => {
    fetchLeads();
  }, []);

  useEffect(() => {
    if (selectedLead) {
      fetchQuotations(selectedLead.id);
    }
  }, [selectedLead]);

  useEffect(() => {
    calculateRent();
  }, [formData]);

  const fetchLeads = async () => {
    try {
      const data = await getLeads();
      setLeads(data.filter(lead => lead.status !== 'lost'));
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching leads:', error);
      showToast('Error fetching leads', 'error');
    }
  };

  const fetchQuotations = async (leadId: string) => {
    try {
      const data = await getQuotationsForLead(leadId);
      // Mock status for demo
      const withStatus: QuotationWithStatus[] = data.map(q => ({
        ...q,
        status: q.version === 1 ? 'draft' : 'sent',
      }));
      setQuotations(withStatus);
    } catch (error) {
      console.error('Error fetching quotations:', error);
      showToast('Error fetching quotations', 'error');
    }
  };

  const calculateRent = () => {
    const {
      baseRate,
      workingHours,
      rentalDays,
      foodCharge,
      accomCharge,
      numResources,
      usagePercent,
      elongationPercent,
      commercialCharge,
      riskPercent,
      incidentalCharge,
      otherCharge,
    } = formData;

    const totalWorkingHours = workingHours * rentalDays;
    const baseCost = baseRate * totalWorkingHours;
    const accomTotal = (foodCharge + accomCharge) * numResources * rentalDays;
    const usageCharge = (usagePercent / 100) * baseRate;
    const fuelCost = baseCost;
    const elongationCost = (elongationPercent / 100) * fuelCost;
    const totalFuelCost = fuelCost + elongationCost;
    const riskCharge = (riskPercent / 100) * baseCost;

    const totalRent = (
      baseCost +
      accomTotal +
      usageCharge +
      totalFuelCost +
      commercialCharge +
      riskCharge +
      incidentalCharge +
      otherCharge
    );

    setCalculatedValues({
      totalWorkingHours,
      baseCost,
      accomTotal,
      usageCharge,
      fuelCost,
      elongationCost,
      totalFuelCost,
      riskCharge,
      totalRent,
    });
  };

  const handleCreateQuotation = async () => {
    if (!selectedLead || !user) return;

    try {
      const newQuotation = await createQuotation(selectedLead.id, formData, user.id);
      setQuotations(prev => [...prev, { ...newQuotation, status: 'draft' }]);
      setIsCreateModalOpen(false);
      resetForm();
      showToast('Quotation created successfully', 'success');
    } catch (error) {
      console.error('Error creating quotation:', error);
      showToast('Error creating quotation', 'error');
    }
  };

  const resetForm = () => {
    setFormData({
      baseRate: 0,
      workingHours: 8,
      rentalDays: 1,
      foodCharge: 0,
      accomCharge: 0,
      numResources: 1,
      usagePercent: 0,
      elongationPercent: 0,
      commercialCharge: 0,
      riskPercent: 0,
      incidentalCharge: 0,
      otherCharge: 0,
    });
  };

  const showToast = (title: string, variant: 'success' | 'error' | 'warning' = 'success') => {
    setToast({ show: true, title, variant });
    setTimeout(() => setToast({ show: false, title: '' }), 3000);
  };

  const getStatusBadgeVariant = (status: QuotationStatus) => {
    switch (status) {
      case 'draft':
        return 'secondary';
      case 'in_review':
        return 'warning';
      case 'approved':
        return 'success';
      case 'sent':
        return 'primary';
      default:
        return 'default';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  if (!user || (user.role !== 'sales_agent' && user.role !== 'admin')) {
    return (
      <div className="p-4 text-center text-gray-500">
        You don't have permission to access this page.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex-1">
          <Select
            label="Select Lead"
            options={leads.map(lead => ({
              value: lead.id,
              label: `${lead.customerName} - ${lead.serviceNeeded}`,
            }))}
            value={selectedLead?.id || ''}
            onChange={(value) => {
              const lead = leads.find(l => l.id === value);
              setSelectedLead(lead || null);
            }}
          />
        </div>
        
        <Button
          onClick={() => setIsCreateModalOpen(true)}
          disabled={!selectedLead}
          leftIcon={<Calculator size={16} />}
        >
          New Quotation
        </Button>
      </div>

      {selectedLead ? (
        <Card>
          <CardHeader>
            <CardTitle>Quotations for {selectedLead.customerName}</CardTitle>
          </CardHeader>
          <CardContent>
            {quotations.length === 0 ? (
              <div className="text-center py-4 text-gray-500">
                No quotations found. Create a new quotation to get started.
              </div>
            ) : (
              <div className="space-y-4">
                {quotations.map((quotation) => (
                  <Card key={quotation.id} variant="bordered">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-lg font-semibold">
                              Version {quotation.version}
                            </h3>
                            <Badge variant={getStatusBadgeVariant(quotation.status)}>
                              {quotation.status.replace('_', ' ')}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-500 mt-1">
                            Created on {new Date(quotation.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-primary-600">
                            {formatCurrency(quotation.totalRent)}
                          </p>
                          <p className="text-sm text-gray-500">Total Rent</p>
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500">Base Rate</p>
                          <p className="font-medium">{formatCurrency(quotation.baseRate)}/hr</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Duration</p>
                          <p className="font-medium">
                            {quotation.rentalDays} days × {quotation.workingHours} hrs
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500">Resources</p>
                          <p className="font-medium">{quotation.numResources}</p>
                        </div>
                      </div>

                      <div className="mt-4 flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          leftIcon={<Download size={16} />}
                          onClick={() => showToast('PDF downloaded', 'success')}
                        >
                          Export PDF
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          leftIcon={<Send size={16} />}
                          onClick={() => showToast('Quote sent to customer', 'success')}
                        >
                          Send to Customer
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent>
            <div className="text-center py-4 text-gray-500">
              Select a lead to view or create quotations.
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create Quotation Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          resetForm();
        }}
        title="Create New Quotation"
        size="xl"
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Base Rate (per hour)"
                type="number"
                value={formData.baseRate}
                onChange={(e) => setFormData(prev => ({ ...prev, baseRate: parseFloat(e.target.value) || 0 }))}
              />
              <Input
                label="Working Hours (per day)"
                type="number"
                value={formData.workingHours}
                onChange={(e) => setFormData(prev => ({ ...prev, workingHours: parseInt(e.target.value) || 0 }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Rental Days"
                type="number"
                value={formData.rentalDays}
                onChange={(e) => setFormData(prev => ({ ...prev, rentalDays: parseInt(e.target.value) || 0 }))}
              />
              <Input
                label="Number of Resources"
                type="number"
                value={formData.numResources}
                onChange={(e) => setFormData(prev => ({ ...prev, numResources: parseInt(e.target.value) || 0 }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Food Charge (per person/day)"
                type="number"
                value={formData.foodCharge}
                onChange={(e) => setFormData(prev => ({ ...prev, foodCharge: parseFloat(e.target.value) || 0 }))}
              />
              <Input
                label="Accommodation Charge (per person/day)"
                type="number"
                value={formData.accomCharge}
                onChange={(e) => setFormData(prev => ({ ...prev, accomCharge: parseFloat(e.target.value) || 0 }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Usage Percent"
                type="number"
                value={formData.usagePercent}
                onChange={(e) => setFormData(prev => ({ ...prev, usagePercent: parseFloat(e.target.value) || 0 }))}
              />
              <Input
                label="Elongation Percent"
                type="number"
                value={formData.elongationPercent}
                onChange={(e) => setFormData(prev => ({ ...prev, elongationPercent: parseFloat(e.target.value) || 0 }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Commercial Charge"
                type="number"
                value={formData.commercialCharge}
                onChange={(e) => setFormData(prev => ({ ...prev, commercialCharge: parseFloat(e.target.value) || 0 }))}
              />
              <Input
                label="Risk Percent"
                type="number"
                value={formData.riskPercent}
                onChange={(e) => setFormData(prev => ({ ...prev, riskPercent: parseFloat(e.target.value) || 0 }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Incidental Charge"
                type="number"
                value={formData.incidentalCharge}
                onChange={(e) => setFormData(prev => ({ ...prev, incidentalCharge: parseFloat(e.target.value) || 0 }))}
              />
              <Input
                label="Other Charges"
                type="number"
                value={formData.otherCharge}
                onChange={(e) => setFormData(prev => ({ ...prev, otherCharge: parseFloat(e.target.value) || 0 }))}
              />
            </div>
          </div>

          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">Calculation Summary</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Working Hours</span>
                <span className="font-medium">{calculatedValues.totalWorkingHours} hrs</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Base Cost</span>
                <span className="font-medium">{formatCurrency(calculatedValues.baseCost)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Accommodation Total</span>
                <span className="font-medium">{formatCurrency(calculatedValues.accomTotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Usage Charge</span>
                <span className="font-medium">{formatCurrency(calculatedValues.usageCharge)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Fuel Cost</span>
                <span className="font-medium">{formatCurrency(calculatedValues.fuelCost)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Elongation Cost</span>
                <span className="font-medium">{formatCurrency(calculatedValues.elongationCost)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Risk Charge</span>
                <span className="font-medium">{formatCurrency(calculatedValues.riskCharge)}</span>
              </div>
              <div className="pt-3 mt-3 border-t border-gray-200">
                <div className="flex justify-between text-lg font-semibold">
                  <span>Total Rent</span>
                  <span className="text-primary-600">{formatCurrency(calculatedValues.totalRent)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <Button
            variant="outline"
            onClick={() => {
              setIsCreateModalOpen(false);
              resetForm();
            }}
          >
            Cancel
          </Button>
          <Button onClick={handleCreateQuotation}>Create Quotation</Button>
        </div>
      </Modal>

      {/* Toast Notification */}
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