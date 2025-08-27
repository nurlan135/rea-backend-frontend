'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Bell, 
  Settings, 
  Send, 
  BarChart3, 
  Users,
  MessageSquare,
  AlertCircle,
  CheckCircle,
  Clock,
  TrendingUp
} from 'lucide-react';
import NotificationCenter from '@/components/notifications/NotificationCenter';
import NotificationSettings from '@/components/notifications/NotificationSettings';

export default function NotificationsPage() {
  const [activeTab, setActiveTab] = useState('notifications');
  const [stats] = useState({
    total_sent: 1247,
    total_delivered: 1189,
    total_read: 892,
    delivery_rate: 95.3,
    read_rate: 71.6,
    recent_activity: [
      { type: 'property_approved', count: 23, label: 'Əmlak təsdiqi' },
      { type: 'booking_confirmed', count: 18, label: 'Rezervasiya' },
      { type: 'deal_status_change', count: 12, label: 'Müqavilə dəyişikliyi' },
      { type: 'system_announcement', count: 8, label: 'Sistem elanı' }
    ]
  });

  const StatsOverview = () => (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Send className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-2xl font-bold">{stats.total_sent}</p>
                <p className="text-xs text-gray-600">Göndərilən</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-2xl font-bold">{stats.total_delivered}</p>
                <p className="text-xs text-gray-600">Çatdırılan</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-2xl font-bold">{stats.total_read}</p>
                <p className="text-xs text-gray-600">Oxunan</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-2xl font-bold">{stats.read_rate}%</p>
                <p className="text-xs text-gray-600">Oxunma nisbəti</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Performans Metrikləri</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Çatdırılma nisbəti</span>
                <div className="flex items-center space-x-2">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full" 
                      style={{ width: `${stats.delivery_rate}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium">{stats.delivery_rate}%</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Oxunma nisbəti</span>
                <div className="flex items-center space-x-2">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${stats.read_rate}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium">{stats.read_rate}%</span>
                </div>
              </div>

              <div className="pt-4 border-t">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-green-600">
                      {stats.total_delivered}
                    </p>
                    <p className="text-sm text-gray-600">Çatdırılan</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-red-600">
                      {stats.total_sent - stats.total_delivered}
                    </p>
                    <p className="text-sm text-gray-600">Çatdırılmayan</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Son Fəaliyyət</CardTitle>
            <CardDescription>
              Son 24 saatda göndərilən bildirişlər
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.recent_activity.map((activity, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${
                      activity.type === 'property_approved' ? 'bg-green-500' :
                      activity.type === 'booking_confirmed' ? 'bg-blue-500' :
                      activity.type === 'deal_status_change' ? 'bg-purple-500' : 'bg-gray-500'
                    }`} />
                    <span className="text-sm">{activity.label}</span>
                  </div>
                  <Badge variant="outline">{activity.count}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Sürətli Əməliyyatlar</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button className="h-20 flex-col">
              <Send className="h-6 w-6 mb-2" />
              Toplu Bildiriş
            </Button>
            
            <Button variant="outline" className="h-20 flex-col">
              <Users className="h-6 w-6 mb-2" />
              İstifadəçi Qrupları
            </Button>
            
            <Button variant="outline" className="h-20 flex-col">
              <MessageSquare className="h-6 w-6 mb-2" />
              Şablon Yarat
            </Button>
            
            <Button variant="outline" className="h-20 flex-col">
              <BarChart3 className="h-6 w-6 mb-2" />
              Analitika
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Bildirişlər</h1>
          <p className="text-gray-600">Bütün bildirişləri idarə edin və konfiqurasiya edin</p>
        </div>

        <div className="flex space-x-2">
          <Button>
            <Send className="h-4 w-4 mr-2" />
            Yeni Bildiriş
          </Button>
          <Button variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Tənzimləmələr
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="notifications" className="flex items-center">
            <Bell className="h-4 w-4 mr-2" />
            Bildirişlər
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center">
            <Settings className="h-4 w-4 mr-2" />
            Tənzimləmələr
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center">
            <BarChart3 className="h-4 w-4 mr-2" />
            Analitika
          </TabsTrigger>
        </TabsList>

        <TabsContent value="notifications" className="space-y-6">
          <NotificationCenter showHeader={false} />
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <NotificationSettings />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <StatsOverview />
        </TabsContent>
      </Tabs>
    </div>
  );
}