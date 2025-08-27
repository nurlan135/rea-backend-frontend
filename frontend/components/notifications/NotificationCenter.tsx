'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Bell, 
  BellOff, 
  Check, 
  CheckCheck, 
  Trash2, 
  Search,
  Filter,
  Settings,
  AlertCircle,
  CheckCircle,
  Clock,
  User,
  Home,
  DollarSign,
  Calendar,
  Archive,
  MoreVertical,
  X
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { formatDistanceToNow } from 'date-fns';
import { az } from 'date-fns/locale';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  action_url?: string;
  related_property_id?: string;
  property_title?: string;
  sender_first_name?: string;
  sender_last_name?: string;
  read_at?: string;
  created_at: string;
  expires_at?: string;
  metadata?: any;
}

interface NotificationCenterProps {
  userId?: string;
  showHeader?: boolean;
  maxHeight?: string;
}

const NOTIFICATION_TYPES = {
  property_approved: { label: 'Əmlak Təsdiqi', icon: CheckCircle, color: 'text-green-600' },
  property_rejected: { label: 'Əmlak Rəddi', icon: X, color: 'text-red-600' },
  booking_confirmed: { label: 'Rezervasiya', icon: Calendar, color: 'text-blue-600' },
  booking_cancelled: { label: 'Ləğv', icon: X, color: 'text-orange-600' },
  deal_status_change: { label: 'Müqavilə', icon: DollarSign, color: 'text-purple-600' },
  new_property_assigned: { label: 'Yeni Tapşırıq', icon: Home, color: 'text-indigo-600' },
  system_announcement: { label: 'Elan', icon: Bell, color: 'text-gray-600' },
  reminder: { label: 'Xatırlatma', icon: Clock, color: 'text-yellow-600' },
  approval_request: { label: 'Təsdiq Tələbi', icon: AlertCircle, color: 'text-blue-600' }
};

const PRIORITY_COLORS = {
  low: 'bg-gray-100 text-gray-800',
  medium: 'bg-blue-100 text-blue-800',
  high: 'bg-orange-100 text-orange-800',
  urgent: 'bg-red-100 text-red-800'
};

export default function NotificationCenter({
  userId,
  showHeader = true,
  maxHeight = '600px'
}: NotificationCenterProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [selectedNotifications, setSelectedNotifications] = useState<string[]>([]);
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    loadNotifications();
  }, [currentPage, filterType, filterStatus, filterPriority, searchTerm]);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
        status: filterStatus,
        sort_by: 'created_at',
        sort_order: 'desc'
      });

      if (filterType !== 'all') params.append('type', filterType);
      if (filterPriority !== 'all') params.append('priority', filterPriority);
      if (searchTerm) params.append('search', searchTerm);

      const response = await fetch(`/api/notifications?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setNotifications(data.data.notifications);
          setUnreadCount(data.data.unreadCount);
          setTotalPages(data.data.pagination.totalPages);
        }
      }
    } catch (error) {
      console.error('Load notifications error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        setNotifications(prev => prev.map(n => 
          n.id === notificationId ? { ...n, read_at: new Date().toISOString() } : n
        ));
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Mark as read error:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const response = await fetch('/api/notifications/read-all', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, read_at: new Date().toISOString() })));
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Mark all as read error:', error);
    }
  };

  const handleDelete = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getToken('token')}`
        }
      });

      if (response.ok) {
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
        const notification = notifications.find(n => n.id === notificationId);
        if (notification && !notification.read_at) {
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
      }
    } catch (error) {
      console.error('Delete notification error:', error);
    }
  };

  const handleBatchAction = async (action: string) => {
    if (selectedNotifications.length === 0) return;

    try {
      const response = await fetch('/api/notifications/batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          action,
          notification_ids: selectedNotifications
        })
      });

      if (response.ok) {
        if (action === 'read') {
          setNotifications(prev => prev.map(n => 
            selectedNotifications.includes(n.id) ? { ...n, read_at: new Date().toISOString() } : n
          ));
          const unreadSelected = notifications.filter(n => 
            selectedNotifications.includes(n.id) && !n.read_at
          ).length;
          setUnreadCount(prev => Math.max(0, prev - unreadSelected));
        } else if (action === 'delete') {
          setNotifications(prev => prev.filter(n => !selectedNotifications.includes(n.id)));
          const unreadSelected = notifications.filter(n => 
            selectedNotifications.includes(n.id) && !n.read_at
          ).length;
          setUnreadCount(prev => Math.max(0, prev - unreadSelected));
        }
        setSelectedNotifications([]);
      }
    } catch (error) {
      console.error('Batch action error:', error);
    }
  };

  const handleSelectAll = () => {
    if (selectedNotifications.length === notifications.length) {
      setSelectedNotifications([]);
    } else {
      setSelectedNotifications(notifications.map(n => n.id));
    }
  };

  const getNotificationIcon = (type: string) => {
    const config = NOTIFICATION_TYPES[type as keyof typeof NOTIFICATION_TYPES];
    if (!config) return Bell;
    return config.icon;
  };

  const getNotificationColor = (type: string) => {
    const config = NOTIFICATION_TYPES[type as keyof typeof NOTIFICATION_TYPES];
    return config?.color || 'text-gray-600';
  };

  const getPriorityBadge = (priority: string) => {
    const colorClass = PRIORITY_COLORS[priority as keyof typeof PRIORITY_COLORS] || PRIORITY_COLORS.medium;
    const label = priority === 'low' ? 'Aşağı' :
                  priority === 'medium' ? 'Orta' :
                  priority === 'high' ? 'Yüksək' : 'Təcili';
    return (
      <Badge variant="outline" className={colorClass}>
        {label}
      </Badge>
    );
  };

  const formatTimeAgo = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { 
        addSuffix: true,
        locale: az 
      });
    } catch {
      return new Date(dateString).toLocaleDateString('az-AZ');
    }
  };

  const NotificationItem = ({ notification }: { notification: Notification }) => {
    const Icon = getNotificationIcon(notification.type);
    const isUnread = !notification.read_at;
    const isExpired = notification.expires_at && new Date(notification.expires_at) < new Date();

    return (
      <div 
        className={`p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
          isUnread ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
        } ${isExpired ? 'opacity-60' : ''}`}
      >
        <div className="flex items-start space-x-3">
          <Checkbox
            checked={selectedNotifications.includes(notification.id)}
            onCheckedChange={(checked) => {
              if (checked) {
                setSelectedNotifications(prev => [...prev, notification.id]);
              } else {
                setSelectedNotifications(prev => prev.filter(id => id !== notification.id));
              }
            }}
          />

          <div className="flex-shrink-0">
            <div className={`p-2 rounded-full ${isUnread ? 'bg-blue-100' : 'bg-gray-100'}`}>
              <Icon className={`h-5 w-5 ${getNotificationColor(notification.type)}`} />
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <h4 className={`font-medium ${isUnread ? 'text-gray-900' : 'text-gray-700'}`}>
                    {notification.title}
                  </h4>
                  {getPriorityBadge(notification.priority)}
                  {isExpired && (
                    <Badge variant="outline" className="bg-gray-100 text-gray-500">
                      Vaxtı keçib
                    </Badge>
                  )}
                </div>

                <p className="text-sm text-gray-600 mb-2">
                  {notification.message}
                </p>

                <div className="flex items-center space-x-4 text-xs text-gray-500">
                  <span>{formatTimeAgo(notification.created_at)}</span>
                  
                  {notification.sender_first_name && (
                    <span className="flex items-center">
                      <User className="h-3 w-3 mr-1" />
                      {notification.sender_first_name} {notification.sender_last_name}
                    </span>
                  )}
                  
                  {notification.property_title && (
                    <span className="flex items-center">
                      <Home className="h-3 w-3 mr-1" />
                      {notification.property_title}
                    </span>
                  )}
                </div>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {isUnread && (
                    <DropdownMenuItem onClick={() => handleMarkAsRead(notification.id)}>
                      <Check className="h-4 w-4 mr-2" />
                      Oxundu olaraq qeyd et
                    </DropdownMenuItem>
                  )}
                  {notification.action_url && (
                    <DropdownMenuItem onClick={() => window.open(notification.action_url, '_blank')}>
                      <Archive className="h-4 w-4 mr-2" />
                      Açıq keç
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem 
                    onClick={() => handleDelete(notification.id)}
                    className="text-red-600"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Sil
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full" style={{ maxHeight }}>
      {showHeader && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Bell className="h-5 w-5" />
                <CardTitle>Bildirişlər</CardTitle>
                {unreadCount > 0 && (
                  <Badge variant="destructive" className="rounded-full">
                    {unreadCount}
                  </Badge>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <Button size="sm" variant="outline" onClick={handleMarkAllAsRead}>
                  <CheckCheck className="h-4 w-4 mr-1" />
                  Hamısını oxu
                </Button>
                
                <Dialog>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Bildiriş Tənzimləmələri</DialogTitle>
                    </DialogHeader>
                    {/* Notification settings content */}
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </CardHeader>
        </Card>
      )}

      <Card>
        <CardContent className="p-0">
          {/* Filters */}
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <Input
                  placeholder="Bildirişlərdə axtar..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>

              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Növ" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Bütün növlər</SelectItem>
                  {Object.entries(NOTIFICATION_TYPES).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      {config.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Hamısı</SelectItem>
                  <SelectItem value="unread">Oxunmamış</SelectItem>
                  <SelectItem value="read">Oxunmuş</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterPriority} onValueChange={setFilterPriority}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Prioritet" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Hamısı</SelectItem>
                  <SelectItem value="urgent">Təcili</SelectItem>
                  <SelectItem value="high">Yüksək</SelectItem>
                  <SelectItem value="medium">Orta</SelectItem>
                  <SelectItem value="low">Aşağı</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Batch Actions */}
            {selectedNotifications.length > 0 && (
              <div className="flex items-center justify-between mt-3 p-2 bg-blue-50 rounded">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={selectedNotifications.length === notifications.length}
                    onCheckedChange={handleSelectAll}
                  />
                  <span className="text-sm font-medium">
                    {selectedNotifications.length} seçildi
                  </span>
                </div>

                <div className="flex space-x-2">
                  <Button size="sm" onClick={() => handleBatchAction('read')}>
                    <Check className="h-4 w-4 mr-1" />
                    Oxundu qeyd et
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => handleBatchAction('delete')}>
                    <Trash2 className="h-4 w-4 mr-1" />
                    Sil
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Notifications List */}
          <div className="overflow-y-auto" style={{ maxHeight: '400px' }}>
            {loading ? (
              <div className="space-y-4 p-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center space-x-3">
                    <Skeleton className="h-4 w-4" />
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-12 text-center">
                <BellOff className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Bildiriş yoxdur
                </h3>
                <p className="text-gray-500">
                  {searchTerm || filterType !== 'all' || filterStatus !== 'all' || filterPriority !== 'all'
                    ? 'Seçilmiş filtrlərə uyğun bildiriş tapılmadı'
                    : 'Hələ heç bir bildirişiniz yoxdur'
                  }
                </p>
              </div>
            ) : (
              <div>
                {notifications.map((notification) => (
                  <NotificationItem key={notification.id} notification={notification} />
                ))}
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-gray-100">
              <div className="flex items-center justify-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(currentPage - 1)}
                >
                  Əvvəlki
                </Button>
                
                <span className="text-sm">
                  Səhifə {currentPage} / {totalPages}
                </span>
                
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(currentPage + 1)}
                >
                  Növbəti
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}