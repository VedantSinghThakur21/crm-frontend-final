import React from 'react';
import { Badge } from './Badge';
import { LeadStatus } from '../../types/lead';
import { JobStatus } from '../../types/job';

interface StatusBadgeProps {
  status: LeadStatus | JobStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  let variant: any;
  let label: string = status.replace('_', ' ');
  
  // Capitalize first letter of each word
  label = label
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
  
  // Determine badge variant based on status
  switch (status) {
    case 'new':
      variant = 'default';
      break;
    case 'negotiation':
      variant = 'warning';
      break;
    case 'won':
      variant = 'success';
      break;
    case 'lost':
      variant = 'error';
      break;
    case 'scheduled':
      variant = 'secondary';
      break;
    case 'accepted':
      variant = 'success';
      break;
    case 'rejected':
      variant = 'error';
      break;
    case 'in_progress':
      variant = 'warning';
      break;
    case 'completed':
      variant = 'success';
      break;
    default:
      variant = 'outline';
  }
  
  return (
    <Badge variant={variant} className={className}>
      {label}
    </Badge>
  );
}