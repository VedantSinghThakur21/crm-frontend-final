import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  AlertCircle,
  Check,
  X,
  Filter,
  Truck
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Select } from '../components/common/Select';
import { TextArea } from '../components/common/TextArea';
import { Modal } from '../components/common/Modal';
import { Toast } from '../components/common/Toast';
import { useAuthStore } from '../store/authStore';
import { Equipment } from '../types/job';
import { getAllEquipment } from '../services/jobService';

type AvailabilityStatus = 'available' | 'in_use' | 'maintenance';

interface EquipmentWithStatus extends Equipment {
  status: AvailabilityStatus;
}

const EQUIPMENT_TYPES = [
  { value: 'tower_crane', label: 'Tower Crane' },
  { value: 'mobile_crane', label: 'Mobile Crane' },
  { value: 'crawler_crane', label: 'Crawler Crane' },
  { value: 'excavator', label: 'Excavator' },
  { value: 'forklift', label: 'Forklift' },
];

const STATUS_OPTIONS = [
  { value: 'available', label: 'Available' },
  { value: 'in_use', label: 'In Use' },
  { value: 'maintenance', label: 'Maintenance' },
];

export function EquipmentManagement() {
  const { user } = useAuthStore();
  const [equipment, setEquipment] = useState<EquipmentWithStatus[]>([]);
  const [filteredEquipment, setFilteredEquipment] = useState<EquipmentWithStatus[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<AvailabilityStatus | 'all'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState<EquipmentWithStatus | null>(null);
  const [toast, setToast] = useState<{
    show: boolean;
    title: string;
    description?: string;
    variant?: 'success' | 'error' | 'warning';
  }>({ show: false, title: '' });

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    baseRate: '',
    description: '',
    status: 'available' as AvailabilityStatus,
  });

  useEffect(() => {
    fetchEquipment();
  }, []);

  useEffect(() => {
    filterEquipment();
  }, [equipment, searchTerm, statusFilter]);

  const fetchEquipment = async () => {
    try {
      const data = await getAllEquipment();
      // Add mock status for demonstration
      const withStatus: EquipmentWithStatus[] = data.map(item => ({
        ...item,
        status: Math.random() > 0.7 
          ? 'maintenance'
          : Math.random() > 0.5 
            ? 'in_use' 
            : 'available',
      }));
      setEquipment(withStatus);
    } catch (error) {
      console.error('Error fetching equipment:', error);
      showToast('Error fetching equipment', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const filterEquipment = () => {
    let filtered = [...equipment];

    if (searchTerm) {
      filtered = filtered.filter(item => 
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.type.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(item => item.status === statusFilter);
    }

    setFilteredEquipment(filtered);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.type || !formData.baseRate) {
      showToast('Please fill in all required fields', 'error');
      return;
    }

    try {
      const newEquipment: EquipmentWithStatus = {
        id: selectedEquipment?.id || Math.random().toString(36).substring(2, 9),
        name: formData.name,
        type: formData.type,
        description: formData.description,
        baseRate: parseFloat(formData.baseRate),
        status: formData.status,
      };

      if (selectedEquipment) {
        // Update existing equipment
        setEquipment(prev => 
          prev.map(item => 
            item.id === selectedEquipment.id ? newEquipment : item
          )
        );
        showToast('Equipment updated successfully', 'success');
      } else {
        // Add new equipment
        setEquipment(prev => [...prev, newEquipment]);
        showToast('Equipment added successfully', 'success');
      }

      setIsModalOpen(false);
      resetForm();
    } catch (error) {
      showToast('Error saving equipment', 'error');
    }
  };

  const handleDelete = async () => {
    if (!selectedEquipment) return;

    try {
      setEquipment(prev => prev.filter(item => item.id !== selectedEquipment.id));
      setIsDeleteModalOpen(false);
      setSelectedEquipment(null);
      showToast('Equipment deleted successfully', 'success');
    } catch (error) {
      showToast('Error deleting equipment', 'error');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: '',
      baseRate: '',
      description: '',
      status: 'available',
    });
    setSelectedEquipment(null);
  };

  const showToast = (
    title: string,
    variant: 'success' | 'error' | 'warning' = 'success'
  ) => {
    setToast({ show: true, title, variant });
    setTimeout(() => setToast({ show: false, title: '' }), 3000);
  };

  const getStatusColor = (status: AvailabilityStatus) => {
    switch (status) {
      case 'available':
        return 'text-success-600 bg-success-50';
      case 'in_use':
        return 'text-primary-600 bg-primary-50';
      case 'maintenance':
        return 'text-warning-600 bg-warning-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  if (!user || (user.role !== 'operations_manager' && user.role !== 'admin')) {
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
              placeholder="Search equipment..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select
            options={[
              { value: 'all', label: 'All Status' },
              ...STATUS_OPTIONS,
            ]}
            value={statusFilter}
            onChange={(value) => setStatusFilter(value as AvailabilityStatus | 'all')}
            className="w-full sm:w-40"
          />
        </div>

        <Button
          onClick={() => {
            resetForm();
            setIsModalOpen(true);
          }}
          leftIcon={<Plus size={16} />}
        >
          Add Equipment
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Equipment Inventory</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-4">Loading equipment...</div>
          ) : filteredEquipment.length === 0 ? (
            <div className="text-center py-4 text-gray-500">
              No equipment found. Add new equipment to get started.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredEquipment.map((item) => (
                <Card key={item.id} variant="bordered" className="h-full">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-lg">{item.name}</h3>
                        <p className="text-sm text-gray-500">{item.type}</p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                        {item.status.replace('_', ' ')}
                      </span>
                    </div>

                    <div className="mt-4">
                      <p className="text-sm text-gray-600">{item.description}</p>
                      <p className="mt-2 font-medium">
                        Base Rate: ${item.baseRate}/hour
                      </p>
                    </div>

                    <div className="mt-4 flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedEquipment(item);
                          setFormData({
                            name: item.name,
                            type: item.type,
                            baseRate: item.baseRate.toString(),
                            description: item.description,
                            status: item.status,
                          });
                          setIsModalOpen(true);
                        }}
                      >
                        <Edit2 size={16} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedEquipment(item);
                          setIsDeleteModalOpen(true);
                        }}
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Equipment Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          resetForm();
        }}
        title={selectedEquipment ? 'Edit Equipment' : 'Add New Equipment'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            label="Equipment Name"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            required
          />

          <Select
            label="Equipment Type"
            options={EQUIPMENT_TYPES}
            value={formData.type}
            onChange={(value) => setFormData(prev => ({ ...prev, type: value }))}
            required
          />

          <Input
            label="Base Rate (per hour)"
            type="number"
            min="0"
            step="0.01"
            value={formData.baseRate}
            onChange={(e) => setFormData(prev => ({ ...prev, baseRate: e.target.value }))}
            required
          />

          <TextArea
            label="Description"
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            rows={3}
          />

          <Select
            label="Availability Status"
            options={STATUS_OPTIONS}
            value={formData.status}
            onChange={(value) => setFormData(prev => ({ ...prev, status: value as AvailabilityStatus }))}
            required
          />

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsModalOpen(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button type="submit">
              {selectedEquipment ? 'Update' : 'Add'} Equipment
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSelectedEquipment(null);
        }}
        title="Delete Equipment"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Are you sure you want to delete this equipment? This action cannot be undone.
          </p>

          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteModalOpen(false);
                setSelectedEquipment(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
            >
              Delete
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