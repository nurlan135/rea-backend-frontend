'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Bell, 
  Mail, 
  MessageSquare, 
  Clock, 
  Volume2, 
  VolumeX,
  Settings,
  Check,
  AlertCircle,
  Smartphone,
  Moon
} from 'lucide-react';

interface NotificationSettings {
  email_notifications: boolean;
  push_notifications: boolean;
  sms_notifications: boolean;
  property_updates: boolean;
  booking_updates: boolean;
  deal_updates: boolean;
  system_announcements: boolean;
  daily_digest: boolean;
  quiet_hours_start: string;
  quiet_hours_end: string;
}

interface NotificationSettingsProps {
  userId?: string;
}

export default function NotificationSettings({ userId }: NotificationSettingsProps) {
  const [settings, setSettings] = useState<NotificationSettings>({
    email_notifications: true,
    push_notifications: true,
    sms_notifications: false,
    property_updates: true,
    booking_updates: true,
    deal_updates: true,
    system_announcements: true,
    daily_digest: false,
    quiet_hours_start: '22:00',
    quiet_hours_end: '08:00'
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/notifications/settings', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setSettings(data.data.settings);
        }
      }
    } catch (error) {
      console.error('Load settings error:', error);
      setError('Tənzimləmələr yüklənərkən xəta baş verdi');
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    setError('');
    try {
      const response = await fetch('/api/notifications/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(settings)
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setSaved(true);
          setTimeout(() => setSaved(false), 3000);
        } else {
          setError(data.error?.message || 'Saxlama zamanı xəta baş verdi');
        }
      } else {
        setError('Tənzimləmələr saxlanılarkən xəta baş verdi');
      }
    } catch (error) {
      console.error('Save settings error:', error);
      setError('Tənzimləmələr saxlanılarkən xəta baş verdi');
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (key: keyof NotificationSettings, value: boolean | string) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const testNotification = async () => {
    try {
      await fetch('/api/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          recipient_id: userId, // This would come from user context
          type: 'system_announcement',
          title: 'Test Bildirişi',
          message: 'Bu bir test bildirişidir. Tənzimləmələriniz düzgün işləyir.',
          priority: 'medium'
        })
      });
    } catch (error) {
      console.error('Test notification error:', error);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-4" />
          <div className="space-y-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-12 bg-gray-200 rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Settings className="h-5 w-5 mr-2" />
            Bildiriş Tənzimləmələri
          </CardTitle>
          <CardDescription>
            Bildiriş növlərini və alınacaq kanalları konfiqurasiya edin
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <Alert className="border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                {error}
              </AlertDescription>
            </Alert>
          )}

          {saved && (
            <Alert className="border-green-200 bg-green-50">
              <Check className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Tənzimləmələr uğurla saxlandı
              </AlertDescription>
            </Alert>
          )}

          {/* Notification Channels */}
          <div>
            <h3 className="text-lg font-medium mb-4">Bildiriş Kanalları</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <Mail className="h-5 w-5 text-blue-600" />
                  <div>
                    <Label className="font-medium">E-mail bildirişləri</Label>
                    <p className="text-sm text-gray-600">E-mail ünvanınıza bildiriş göndər</p>
                  </div>
                </div>
                <Switch
                  checked={settings.email_notifications}
                  onCheckedChange={(checked) => updateSetting('email_notifications', checked)}
                />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <Bell className="h-5 w-5 text-green-600" />
                  <div>
                    <Label className="font-medium">Push bildirişləri</Label>
                    <p className="text-sm text-gray-600">Brauzerdə və mobil tətbiqdə bildiriş</p>
                  </div>
                </div>
                <Switch
                  checked={settings.push_notifications}
                  onCheckedChange={(checked) => updateSetting('push_notifications', checked)}
                />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <Smartphone className="h-5 w-5 text-purple-600" />
                  <div>
                    <Label className="font-medium">SMS bildirişləri</Label>
                    <p className="text-sm text-gray-600">Telefon nömrənizə SMS göndər</p>
                  </div>
                </div>
                <Switch
                  checked={settings.sms_notifications}
                  onCheckedChange={(checked) => updateSetting('sms_notifications', checked)}
                />
              </div>
            </div>
          </div>

          {/* Notification Types */}
          <div>
            <h3 className="text-lg font-medium mb-4">Bildiriş Növləri</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <Label className="font-medium">Əmlak yenilikləri</Label>
                  <p className="text-sm text-gray-600">Əmlak təsdiqi, rəddi və dəyişikliklər</p>
                </div>
                <Switch
                  checked={settings.property_updates}
                  onCheckedChange={(checked) => updateSetting('property_updates', checked)}
                />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <Label className="font-medium">Rezervasiya yenilikləri</Label>
                  <p className="text-sm text-gray-600">Yeni rezervasiyalar və ləğvetmələr</p>
                </div>
                <Switch
                  checked={settings.booking_updates}
                  onCheckedChange={(checked) => updateSetting('booking_updates', checked)}
                />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <Label className="font-medium">Müqavilə yenilikləri</Label>
                  <p className="text-sm text-gray-600">Müqavilə status dəyişiklikləri</p>
                </div>
                <Switch
                  checked={settings.deal_updates}
                  onCheckedChange={(checked) => updateSetting('deal_updates', checked)}
                />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <Label className="font-medium">Sistem elanları</Label>
                  <p className="text-sm text-gray-600">Ümumi sistem məlumatlandırmaları</p>
                </div>
                <Switch
                  checked={settings.system_announcements}
                  onCheckedChange={(checked) => updateSetting('system_announcements', checked)}
                />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <Label className="font-medium">Günlük xülasə</Label>
                  <p className="text-sm text-gray-600">Günlük fəaliyyət xülasəsi</p>
                </div>
                <Switch
                  checked={settings.daily_digest}
                  onCheckedChange={(checked) => updateSetting('daily_digest', checked)}
                />
              </div>
            </div>
          </div>

          {/* Quiet Hours */}
          <div>
            <h3 className="text-lg font-medium mb-4 flex items-center">
              <Moon className="h-5 w-5 mr-2" />
              Sükut Saatları
            </h3>
            <div className="p-4 border rounded-lg space-y-4">
              <p className="text-sm text-gray-600">
                Bu saatlarda bildiriş göndərilməyəcək (təcili bildirişlər istisna olmaqla)
              </p>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium mb-2 block">Başlama vaxtı</Label>
                  <Input
                    type="time"
                    value={settings.quiet_hours_start}
                    onChange={(e) => updateSetting('quiet_hours_start', e.target.value)}
                  />
                </div>
                
                <div>
                  <Label className="text-sm font-medium mb-2 block">Bitirmə vaxtı</Label>
                  <Input
                    type="time"
                    value={settings.quiet_hours_end}
                    onChange={(e) => updateSetting('quiet_hours_end', e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-6 border-t">
            <Button variant="outline" onClick={testNotification}>
              <Bell className="h-4 w-4 mr-2" />
              Test bildirişi göndər
            </Button>

            <div className="flex space-x-2">
              <Button variant="outline" onClick={loadSettings} disabled={loading}>
                Sıfırla
              </Button>
              <Button onClick={saveSettings} disabled={saving}>
                {saving ? (
                  <>
                    <Clock className="h-4 w-4 mr-2 animate-spin" />
                    Saxlanır...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Saxla
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notification Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Bildiriş Nümunəsi</CardTitle>
          <CardDescription>
            Bildirişlərinizin necə görünəcəyini nəzərdən keçirin
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-4 border rounded-lg bg-blue-50 border-blue-200">
            <div className="flex items-start space-x-3">
              <div className="p-2 bg-blue-100 rounded-full">
                <Bell className="h-5 w-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-gray-900">Yeni əmlak təyin edildi</h4>
                <p className="text-sm text-gray-600 mt-1">
                  Sizə yeni bir əmlak təyin edilib: "Yasamal rayonunda 3 otaqlı mənzil"
                </p>
                <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                  <span>2 dəqiqə əvvəl</span>
                  <span>Sistem Admin</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}