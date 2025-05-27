import { Quotation, QuotationInputs } from '../types/quotation';

// Mock data
const MOCK_QUOTATIONS: Quotation[] = [
  {
    id: '1',
    leadId: '2', // BuildRight Inc
    baseRate: 5000,
    workingHours: 8,
    rentalDays: 30,
    foodCharge: 500,
    accomCharge: 1200,
    numResources: 3,
    usagePercent: 80,
    elongationPercent: 10,
    commercialCharge: 2000,
    riskPercent: 5,
    incidentalCharge: 800,
    otherCharge: 300,
    totalRent: 167900, // Calculated based on the formula
    version: 1,
    createdAt: '2023-09-26T10:15:00Z',
    updatedAt: '2023-09-26T10:15:00Z',
    createdBy: '1', // John Sales
  },
  {
    id: '2',
    leadId: '2', // BuildRight Inc
    baseRate: 5000,
    workingHours: 8,
    rentalDays: 30,
    foodCharge: 500,
    accomCharge: 1200,
    numResources: 3,
    usagePercent: 75,
    elongationPercent: 8,
    commercialCharge: 1800,
    riskPercent: 4,
    incidentalCharge: 800,
    otherCharge: 300,
    totalRent: 156500, // Lower price for negotiation
    version: 2,
    createdAt: '2023-09-28T11:30:00Z',
    updatedAt: '2023-09-28T11:30:00Z',
    createdBy: '1', // John Sales
  },
  {
    id: '3',
    leadId: '3', // Skyrise Developers
    baseRate: 8000,
    workingHours: 10,
    rentalDays: 90,
    foodCharge: 800,
    accomCharge: 2000,
    numResources: 5,
    usagePercent: 90,
    elongationPercent: 15,
    commercialCharge: 5000,
    riskPercent: 7,
    incidentalCharge: 1500,
    otherCharge: 800,
    totalRent: 845525, // Calculated based on the formula
    version: 1,
    createdAt: '2023-09-16T14:20:00Z',
    updatedAt: '2023-09-22T15:45:00Z',
    createdBy: '1', // John Sales
  },
];

// Calculate total rent based on the formula
export const calculateTotalRent = (inputs: QuotationInputs): number => {
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
  } = inputs;

  // Basic calculation
  const dailyRate = baseRate * workingHours;
  const basicRent = dailyRate * rentalDays;
  
  // Resource costs
  const resourceCosts = (foodCharge + accomCharge) * numResources * rentalDays;
  
  // Usage and elongation factors
  const usageFactor = 1 + (usagePercent / 100);
  const elongationFactor = 1 + (elongationPercent / 100);
  
  // Commercial and risk factors
  const commercialFactor = commercialCharge;
  const riskFactor = basicRent * (riskPercent / 100);
  
  // Additional charges
  const additionalCharges = incidentalCharge + otherCharge;
  
  // Total calculation
  const totalRent = (basicRent * usageFactor * elongationFactor) + resourceCosts + commercialFactor + riskFactor + additionalCharges;
  
  return Math.round(totalRent);
};

// Get quotations for a lead
export const getQuotationsForLead = async (leadId: string): Promise<Quotation[]> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  return MOCK_QUOTATIONS.filter(q => q.leadId === leadId).map(q => ({ ...q }));
};

// Get quotation by ID
export const getQuotationById = async (id: string): Promise<Quotation | null> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 300));
  const quotation = MOCK_QUOTATIONS.find(q => q.id === id);
  return quotation ? { ...quotation } : null;
};

// Create quotation
export const createQuotation = async (
  leadId: string,
  inputs: QuotationInputs,
  createdBy: string
): Promise<Quotation> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 800));
  
  // Get latest version for this lead
  const existingQuotations = MOCK_QUOTATIONS.filter(q => q.leadId === leadId);
  const latestVersion = existingQuotations.length > 0
    ? Math.max(...existingQuotations.map(q => q.version))
    : 0;
  
  const totalRent = calculateTotalRent(inputs);
  
  const newQuotation: Quotation = {
    ...inputs,
    id: Math.random().toString(36).substring(2, 9),
    leadId,
    totalRent,
    version: latestVersion + 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy,
  };
  
  MOCK_QUOTATIONS.push(newQuotation);
  return { ...newQuotation };
};

// Update quotation
export const updateQuotation = async (
  id: string,
  updates: Partial<QuotationInputs>
): Promise<Quotation | null> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 600));
  
  const index = MOCK_QUOTATIONS.findIndex(q => q.id === id);
  if (index === -1) return null;
  
  const updatedInputs = {
    ...MOCK_QUOTATIONS[index],
    ...updates,
  };
  
  const totalRent = calculateTotalRent(updatedInputs);
  
  MOCK_QUOTATIONS[index] = {
    ...MOCK_QUOTATIONS[index],
    ...updates,
    totalRent,
    updatedAt: new Date().toISOString(),
  };
  
  return { ...MOCK_QUOTATIONS[index] };
};