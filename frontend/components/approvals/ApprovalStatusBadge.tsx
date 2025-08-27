'use client';

import { Badge } from '@/components/ui/badge';
import { Clock, CheckCircle, XCircle, Archive } from 'lucide-react';

interface ApprovalStatusBadgeProps {
  status: 'pending' | 'active' | 'rejected' | 'sold' | 'archived';
  className?: string;
}

const statusConfig = {
  pending: {
    label: 'Gözləmədə',
    variant: 'secondary' as const,
    icon: Clock,
    className: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
  },
  active: {
    label: 'Aktiv',
    variant: 'default' as const,
    icon: CheckCircle,
    className: 'bg-green-100 text-green-800 hover:bg-green-200'
  },
  rejected: {
    label: 'Rədd edilib',
    variant: 'destructive' as const,
    icon: XCircle,
    className: 'bg-red-100 text-red-800 hover:bg-red-200'
  },
  sold: {
    label: 'Satılıb',
    variant: 'default' as const,
    icon: CheckCircle,
    className: 'bg-blue-100 text-blue-800 hover:bg-blue-200'
  },
  archived: {
    label: 'Arxiv',
    variant: 'outline' as const,
    icon: Archive,
    className: 'bg-gray-100 text-gray-800 hover:bg-gray-200'
  }
};

export function ApprovalStatusBadge({ status, className }: ApprovalStatusBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <Badge 
      variant={config.variant}
      className={`${config.className} ${className || ''}`}
    >
      <Icon className="w-3 h-3 mr-1" />
      {config.label}
    </Badge>
  );
}