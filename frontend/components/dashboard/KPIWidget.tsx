'use client';

import { Card, CardContent } from '@/components/ui/card';

interface KPIWidgetProps {
  title: string;
  value: number | string;
  change?: number;
  changeType?: 'increase' | 'decrease' | 'neutral';
  icon?: React.ReactNode;
  suffix?: string;
  loading?: boolean;
}

export default function KPIWidget({
  title,
  value,
  change,
  changeType = 'neutral',
  icon,
  suffix = '',
  loading = false,
}: KPIWidgetProps) {
  const getChangeColor = () => {
    switch (changeType) {
      case 'increase':
        return 'text-green-600 dark:text-green-400';
      case 'decrease':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-muted-foreground';
    }
  };

  const getChangeIcon = () => {
    if (changeType === 'increase') {
      return (
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17l9.2-9.2M17 17V7H7" />
        </svg>
      );
    }
    if (changeType === 'decrease') {
      return (
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 7l-9.2 9.2M7 7v10h10" />
        </svg>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <Card className="shadow-sm border border-border/50">
        <CardContent className="p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-muted rounded-full animate-pulse"></div>
            </div>
            <div className="ml-5 w-0 flex-1">
              <div className="h-4 bg-muted rounded animate-pulse mb-3"></div>
              <div className="h-7 bg-muted rounded animate-pulse"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm border border-border/50 hover:shadow-md transition-shadow duration-200">
      <CardContent className="p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="text-blue-600">
              {icon || (
                <svg className="h-10 w-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              )}
            </div>
          </div>
          <div className="ml-5 w-0 flex-1">
            <div className="space-y-1">
              <div className="text-sm font-medium text-muted-foreground truncate">{title}</div>
              <div className="flex items-baseline">
                <div className="text-2xl font-bold text-foreground">
                  {value}{suffix}
                </div>
                {change !== undefined && (
                  <div className={`ml-3 flex items-center text-sm font-semibold ${getChangeColor()}`}>
                    {getChangeIcon()}
                    <span className="sr-only">
                      {changeType === 'increase' ? 'Artım' : changeType === 'decrease' ? 'Azalma' : 'Dəyişiklik yoxdur'}
                    </span>
                    <span className="ml-1">{Math.abs(change)}%</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}