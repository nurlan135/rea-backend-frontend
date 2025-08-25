'use client';

import { KPICard, type TrendDirection } from '@/components/ui/kpi-card';

interface KPIWidgetProps {
  title: string;
  value: number | string;
  change?: number;
  changeType?: 'increase' | 'decrease' | 'neutral';
  icon?: React.ReactNode;
  suffix?: string;
  loading?: boolean;
  onClick?: () => void;
}

export default function KPIWidget({
  title,
  value,
  change,
  changeType = 'neutral',
  icon,
  suffix = '',
  loading = false,
  onClick,
}: KPIWidgetProps) {
  // Convert changeType to TrendDirection
  const getTrendDirection = (): TrendDirection => {
    switch (changeType) {
      case 'increase':
        return 'up';
      case 'decrease':
        return 'down';
      default:
        return 'neutral';
    }
  };

  // Format the display value
  const displayValue = typeof value === 'string' ? value : `${value}${suffix}`;

  return (
    <KPICard
      title={title}
      value={displayValue}
      trend={change !== undefined ? {
        direction: getTrendDirection(),
        value: Math.abs(change),
        label: '%'
      } : undefined}
      icon={icon}
      loading={loading}
      onClick={onClick}
      className="transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
    />
  );
}