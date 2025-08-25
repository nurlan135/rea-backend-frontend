'use client';

import { useState, useEffect } from 'react';
import { AuthService } from '@/lib/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface Activity {
  id: string;
  type: 'booking' | 'deal' | 'property' | 'communication';
  title: string;
  description: string;
  timestamp: string;
  user: string;
}

export default function RecentActivities() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock data for now - replace with actual API call
    const mockActivities: Activity[] = [
      {
        id: '1',
        type: 'booking',
        title: 'Yeni rezervasiya',
        description: 'Yasamal rayonu, 2 otaq - Ali Məmmədov tərəfindən rezerv edildi',
        timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
        user: 'Ali Məmmədov'
      },
      {
        id: '2',
        type: 'deal',
        title: 'Satış tamamlandı',
        description: 'Nəsimi rayonu, 3 otaq - 180,000 AZN',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
        user: 'Sevil Həsənova'
      },
      {
        id: '3',
        type: 'property',
        title: 'Yeni əmlak əlavə edildi',
        description: 'Nərimanov rayonu, 4 otaq, 150 m²',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(), // 4 hours ago
        user: 'Rəşad Quliyev'
      },
      {
        id: '4',
        type: 'communication',
        title: 'Müştəri zəngi',
        description: '+994 50 123 45 67 nömrəsindən zəng',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(), // 6 hours ago
        user: 'Sistem'
      },
      {
        id: '5',
        type: 'booking',
        title: 'Rezervasiya ləğv edildi',
        description: 'Səbail rayonu, 1 otaq - müştəri tərəfindən ləğv edildi',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(), // 8 hours ago
        user: 'Nigar İbrahimova'
      }
    ];

    // Simulate API call delay
    setTimeout(() => {
      setActivities(mockActivities);
      setLoading(false);
    }, 1000);
  }, []);

  const getActivityIcon = (type: Activity['type']) => {
    switch (type) {
      case 'booking':
        return (
          <div className="bg-blue-500 rounded-full p-2.5 shadow-sm">
            <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a4 4 0 118 0v4m-8 0h8m-8 0H6a2 2 0 00-2 2v6a2 2 0 002 2h8a2 2 0 002-2V9a2 2 0 00-2-2h-2" />
            </svg>
          </div>
        );
      case 'deal':
        return (
          <div className="bg-green-500 rounded-full p-2.5 shadow-sm">
            <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
          </div>
        );
      case 'property':
        return (
          <div className="bg-purple-500 rounded-full p-2.5 shadow-sm">
            <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
        );
      case 'communication':
        return (
          <div className="bg-amber-500 rounded-full p-2.5 shadow-sm">
            <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="bg-muted-foreground rounded-full p-2.5 shadow-sm">
            <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60));

    if (diffInMinutes < 60) {
      return `${diffInMinutes} dəqiqə əvvəl`;
    }

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return `${diffInHours} saat əvvəl`;
    }

    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} gün əvvəl`;
  };

  if (loading) {
    return (
      <Card className="shadow-sm border border-border/50">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Son Fəaliyyətlər</CardTitle>
          <CardDescription>
            Son zamanlarda edilən əməliyyatlar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-start space-x-3">
                <div className="w-10 h-10 bg-muted rounded-full animate-pulse"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded animate-pulse"></div>
                  <div className="h-3 bg-muted rounded animate-pulse w-3/4"></div>
                  <div className="h-3 bg-muted rounded animate-pulse w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm border border-border/50">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg">Son Fəaliyyətlər</CardTitle>
        <CardDescription>
          Son zamanlarda edilən əməliyyatlar
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flow-root">
          <ul className="-mb-6">
            {activities.map((activity, activityIdx) => (
              <li key={activity.id}>
                <div className="relative pb-6">
                  {activityIdx !== activities.length - 1 && (
                    <span
                      className="absolute top-5 left-5 -ml-px h-full w-0.5 bg-border"
                      aria-hidden="true"
                    />
                  )}
                  <div className="relative flex space-x-3">
                    <div>{getActivityIcon(activity.type)}</div>
                    <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                      <div>
                        <p className="text-sm font-semibold text-foreground">
                          {activity.title}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {activity.description}
                        </p>
                        <p className="text-xs text-muted-foreground/75 mt-2 font-medium">
                          {activity.user}
                        </p>
                      </div>
                      <div className="text-right text-sm whitespace-nowrap text-muted-foreground">
                        <time dateTime={activity.timestamp} className="font-medium">
                          {formatTimeAgo(activity.timestamp)}
                        </time>
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <div className="mt-6 pt-4 border-t border-border/50">
          <Button variant="outline" className="w-full" size="sm">
            Hamısına bax
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}