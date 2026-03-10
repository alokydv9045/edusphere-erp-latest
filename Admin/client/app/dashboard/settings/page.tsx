'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  Bell,
  Lock,
  Eye,
  Globe,
  Moon,
  LogOut,
  Loader2,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';

export default function SettingsPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('general');

  const [generalSettings, setGeneralSettings] = useState({
    applicationName: 'EduSphere Admin Portal',
    timezone: 'Asia/Kolkata',
    language: 'en',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '24h',
  });

  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    systemNotifications: true,
    dailyReports: true,
    weeklyReports: false,
    schoolAlerts: true,
    billingAlerts: true,
    securityAlerts: true,
    newsAndUpdates: false,
  });

  const [securitySettings, setSecuritySettings] = useState({
    sessionTimeout: '30',
    requirePasswordChange: false,
    passwordExpiry: '90',
    twoFactorAuth: false,
    activityLogging: true,
  });

  const [displaySettings, setDisplaySettings] = useState({
    theme: 'light',
    sidebarCollapsed: false,
    compactMode: false,
    showAnimations: true,
    itemsPerPage: '10',
  });

  const handleSaveGeneral = async () => {
    setLoading(true);
    try {
      // TODO: API call to save general settings
      toast({
        title: 'Success',
        description: 'General settings saved successfully',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to save general settings',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNotifications = async () => {
    setLoading(true);
    try {
      // TODO: API call to save notification settings
      toast({
        title: 'Success',
        description: 'Notification settings saved successfully',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to save notification settings',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSecurity = async () => {
    setLoading(true);
    try {
      // TODO: API call to save security settings
      toast({
        title: 'Success',
        description: 'Security settings saved successfully',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to save security settings',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDisplay = async () => {
    setLoading(true);
    try {
      // TODO: API call to save display settings
      toast({
        title: 'Success',
        description: 'Display settings saved successfully',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to save display settings',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Manage your application preferences and configurations
        </p>
      </div>

      {/* Settings Navigation */}
      <div className="flex gap-2 border-b">
        <button
          onClick={() => setActiveTab('general')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeTab === 'general'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Globe className="inline mr-2 h-4 w-4" />
          General
        </button>
        <button
          onClick={() => setActiveTab('notifications')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeTab === 'notifications'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Bell className="inline mr-2 h-4 w-4" />
          Notifications
        </button>
        <button
          onClick={() => setActiveTab('security')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeTab === 'security'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Lock className="inline mr-2 h-4 w-4" />
          Security
        </button>
        <button
          onClick={() => setActiveTab('display')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeTab === 'display'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Eye className="inline mr-2 h-4 w-4" />
          Display
        </button>
      </div>

      {/* General Settings */}
      {activeTab === 'general' && (
        <Card>
          <CardHeader>
            <CardTitle>General Settings</CardTitle>
            <CardDescription>
              Configure basic application preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="appName">Application Name</Label>
                <Input
                  id="appName"
                  value={generalSettings.applicationName}
                  onChange={(e) =>
                    setGeneralSettings({
                      ...generalSettings,
                      applicationName: e.target.value,
                    })
                  }
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="timezone">Timezone</Label>
                <Select
                  value={generalSettings.timezone}
                  onValueChange={(value) =>
                    setGeneralSettings({
                      ...generalSettings,
                      timezone: value,
                    })
                  }
                >
                  <SelectTrigger id="timezone" className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Asia/Kolkata">
                      Asia/Kolkata (IST)
                    </SelectItem>
                    <SelectItem value="America/New_York">
                      America/New_York (EST)
                    </SelectItem>
                    <SelectItem value="Europe/London">
                      Europe/London (GMT)
                    </SelectItem>
                    <SelectItem value="Asia/Singapore">
                      Asia/Singapore (SGT)
                    </SelectItem>
                    <SelectItem value="Australia/Sydney">
                      Australia/Sydney (AEDT)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="language">Language</Label>
                <Select
                  value={generalSettings.language}
                  onValueChange={(value) =>
                    setGeneralSettings({
                      ...generalSettings,
                      language: value,
                    })
                  }
                >
                  <SelectTrigger id="language" className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="hi">Hindi</SelectItem>
                    <SelectItem value="es">Spanish</SelectItem>
                    <SelectItem value="fr">French</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="dateFormat">Date Format</Label>
                <Select
                  value={generalSettings.dateFormat}
                  onValueChange={(value) =>
                    setGeneralSettings({
                      ...generalSettings,
                      dateFormat: value,
                    })
                  }
                >
                  <SelectTrigger id="dateFormat" className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                    <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                    <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="timeFormat">Time Format</Label>
              <Select
                value={generalSettings.timeFormat}
                onValueChange={(value) =>
                  setGeneralSettings({
                    ...generalSettings,
                    timeFormat: value,
                  })
                }
              >
                <SelectTrigger id="timeFormat" className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="24h">24-hour format</SelectItem>
                  <SelectItem value="12h">12-hour format</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={handleSaveGeneral}
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save General Settings'
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Notification Settings */}
      {activeTab === 'notifications' && (
        <Card>
          <CardHeader>
            <CardTitle>Notification Settings</CardTitle>
            <CardDescription>
              Choose what notifications you want to receive
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">Email Notifications</p>
                  <p className="text-sm text-slate-500">
                    Receive updates via email
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={notificationSettings.emailNotifications}
                  onChange={(e) =>
                    setNotificationSettings({
                      ...notificationSettings,
                      emailNotifications: e.target.checked,
                    })
                  }
                  className="w-5 h-5 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">System Notifications</p>
                  <p className="text-sm text-slate-500">
                    Show in-app notifications
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={notificationSettings.systemNotifications}
                  onChange={(e) =>
                    setNotificationSettings({
                      ...notificationSettings,
                      systemNotifications: e.target.checked,
                    })
                  }
                  className="w-5 h-5 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">Daily Reports</p>
                  <p className="text-sm text-slate-500">
                    Get daily summary reports
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={notificationSettings.dailyReports}
                  onChange={(e) =>
                    setNotificationSettings({
                      ...notificationSettings,
                      dailyReports: e.target.checked,
                    })
                  }
                  className="w-5 h-5 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">Weekly Reports</p>
                  <p className="text-sm text-slate-500">
                    Get weekly summary reports
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={notificationSettings.weeklyReports}
                  onChange={(e) =>
                    setNotificationSettings({
                      ...notificationSettings,
                      weeklyReports: e.target.checked,
                    })
                  }
                  className="w-5 h-5 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">School Alerts</p>
                  <p className="text-sm text-slate-500">
                    Alerts about school activities
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={notificationSettings.schoolAlerts}
                  onChange={(e) =>
                    setNotificationSettings({
                      ...notificationSettings,
                      schoolAlerts: e.target.checked,
                    })
                  }
                  className="w-5 h-5 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">Billing Alerts</p>
                  <p className="text-sm text-slate-500">
                    Alerts about billing and payments
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={notificationSettings.billingAlerts}
                  onChange={(e) =>
                    setNotificationSettings({
                      ...notificationSettings,
                      billingAlerts: e.target.checked,
                    })
                  }
                  className="w-5 h-5 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">Security Alerts</p>
                  <p className="text-sm text-slate-500">
                    Important security notifications
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={notificationSettings.securityAlerts}
                  onChange={(e) =>
                    setNotificationSettings({
                      ...notificationSettings,
                      securityAlerts: e.target.checked,
                    })
                  }
                  className="w-5 h-5 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">News & Updates</p>
                  <p className="text-sm text-slate-500">
                    New features and product updates
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={notificationSettings.newsAndUpdates}
                  onChange={(e) =>
                    setNotificationSettings({
                      ...notificationSettings,
                      newsAndUpdates: e.target.checked,
                    })
                  }
                  className="w-5 h-5 cursor-pointer"
                />
              </div>
            </div>

            <Button
              onClick={handleSaveNotifications}
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Notification Settings'
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Security Settings */}
      {activeTab === 'security' && (
        <Card>
          <CardHeader>
            <CardTitle>Security Settings</CardTitle>
            <CardDescription>
              Manage security preferences and access control
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
                <Input
                  id="sessionTimeout"
                  type="number"
                  value={securitySettings.sessionTimeout}
                  onChange={(e) =>
                    setSecuritySettings({
                      ...securitySettings,
                      sessionTimeout: e.target.value,
                    })
                  }
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="passwordExpiry">
                  Password Expiry (days)
                </Label>
                <Input
                  id="passwordExpiry"
                  type="number"
                  value={securitySettings.passwordExpiry}
                  onChange={(e) =>
                    setSecuritySettings({
                      ...securitySettings,
                      passwordExpiry: e.target.value,
                    })
                  }
                  className="mt-2"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">Require Password Change</p>
                  <p className="text-sm text-slate-500">
                    Force users to change password on first login
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={securitySettings.requirePasswordChange}
                  onChange={(e) =>
                    setSecuritySettings({
                      ...securitySettings,
                      requirePasswordChange: e.target.checked,
                    })
                  }
                  className="w-5 h-5 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">Two-Factor Authentication</p>
                  <p className="text-sm text-slate-500">
                    Require 2FA for all admin users
                  </p>
                </div>
                <Badge className="bg-yellow-600">Coming Soon</Badge>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">Activity Logging</p>
                  <p className="text-sm text-slate-500">
                    Log all user activities
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={securitySettings.activityLogging}
                  onChange={(e) =>
                    setSecuritySettings({
                      ...securitySettings,
                      activityLogging: e.target.checked,
                    })
                  }
                  className="w-5 h-5 cursor-pointer"
                />
              </div>
            </div>

            <div className="rounded-lg bg-blue-50 p-4 text-sm text-blue-900 flex gap-3">
              <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Security Tips:</p>
                <ul className="mt-2 space-y-1 list-disc list-inside">
                  <li>
                    Set session timeout to 30 minutes for public computers
                  </li>
                  <li>Enable 2FA for enhanced security</li>
                  <li>Keep activity logging enabled for audit trails</li>
                </ul>
              </div>
            </div>

            <Button
              onClick={handleSaveSecurity}
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Security Settings'
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Display Settings */}
      {activeTab === 'display' && (
        <Card>
          <CardHeader>
            <CardTitle>Display Settings</CardTitle>
            <CardDescription>
              Customize the appearance of the application
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="theme">Theme</Label>
                <Select
                  value={displaySettings.theme}
                  onValueChange={(value) =>
                    setDisplaySettings({
                      ...displaySettings,
                      theme: value,
                    })
                  }
                >
                  <SelectTrigger id="theme" className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="auto">Auto (System)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="itemsPerPage">Items Per Page</Label>
                <Select
                  value={displaySettings.itemsPerPage}
                  onValueChange={(value) =>
                    setDisplaySettings({
                      ...displaySettings,
                      itemsPerPage: value,
                    })
                  }
                >
                  <SelectTrigger id="itemsPerPage" className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5 items</SelectItem>
                    <SelectItem value="10">10 items</SelectItem>
                    <SelectItem value="25">25 items</SelectItem>
                    <SelectItem value="50">50 items</SelectItem>
                    <SelectItem value="100">100 items</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">Collapse Sidebar</p>
                  <p className="text-sm text-slate-500">
                    Minimize sidebar by default
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={displaySettings.sidebarCollapsed}
                  onChange={(e) =>
                    setDisplaySettings({
                      ...displaySettings,
                      sidebarCollapsed: e.target.checked,
                    })
                  }
                  className="w-5 h-5 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">Compact Mode</p>
                  <p className="text-sm text-slate-500">
                    Reduce spacing for more content
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={displaySettings.compactMode}
                  onChange={(e) =>
                    setDisplaySettings({
                      ...displaySettings,
                      compactMode: e.target.checked,
                    })
                  }
                  className="w-5 h-5 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">Show Animations</p>
                  <p className="text-sm text-slate-500">
                    Enable UI animations and transitions
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={displaySettings.showAnimations}
                  onChange={(e) =>
                    setDisplaySettings({
                      ...displaySettings,
                      showAnimations: e.target.checked,
                    })
                  }
                  className="w-5 h-5 cursor-pointer"
                />
              </div>
            </div>

            <Button
              onClick={handleSaveDisplay}
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Display Settings'
              )}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
