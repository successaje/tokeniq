'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { 
  BellIcon,
  ShieldCheckIcon,
  UserCircleIcon,
  GlobeAltIcon,
  KeyIcon,
  DevicePhoneMobileIcon,
  EnvelopeIcon,
  BellAlertIcon
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

// Mock data for notification settings
const NOTIFICATION_SETTINGS = [
  {
    id: 1,
    name: 'Portfolio Updates',
    description: 'Get notified about changes in your portfolio value',
    icon: BellIcon,
    enabled: true
  },
  {
    id: 2,
    name: 'Security Alerts',
    description: 'Receive alerts about security-related events',
    icon: ShieldCheckIcon,
    enabled: true
  },
  {
    id: 3,
    name: 'Market Updates',
    description: 'Stay informed about market movements',
    icon: GlobeAltIcon,
    enabled: false
  },
  {
    id: 4,
    name: 'Transaction Notifications',
    description: 'Get notified about completed transactions',
    icon: BellAlertIcon,
    enabled: true
  }
];

export default function SettingsPage() {
  const { address, isConnected } = useAccount();
  const [activeTab, setActiveTab] = useState('preferences');

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] p-4">
        <h1 className="text-2xl font-bold mb-4 text-foreground">Please connect your wallet</h1>
        <p className="text-muted-foreground">
          Connect your wallet to access settings
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground">
            Manage your account preferences and settings
          </p>
        </div>
        <Button
          className="flex items-center"
        >
          Save Changes
        </Button>
      </div>

      {/* Settings Navigation */}
      <div className="flex gap-4 mb-8">
        <Button
          variant={activeTab === 'preferences' ? 'default' : 'outline'}
          onClick={() => setActiveTab('preferences')}
          className="flex items-center"
        >
          <UserCircleIcon className="h-5 w-5 mr-2" />
          Preferences
        </Button>
        <Button
          variant={activeTab === 'notifications' ? 'default' : 'outline'}
          onClick={() => setActiveTab('notifications')}
          className="flex items-center"
        >
          <BellIcon className="h-5 w-5 mr-2" />
          Notifications
        </Button>
        <Button
          variant={activeTab === 'security' ? 'default' : 'outline'}
          onClick={() => setActiveTab('security')}
          className="flex items-center"
        >
          <ShieldCheckIcon className="h-5 w-5 mr-2" />
          Security
        </Button>
      </div>

      {/* Preferences Section */}
      {activeTab === 'preferences' && (
        <div className="space-y-6">
          <Card className="bg-card hover:bg-accent/50 transition-colors">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-6 text-card-foreground">Profile Settings</h2>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-accent/40 flex items-center justify-center">
                    <UserCircleIcon className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-foreground">Profile Picture</h3>
                    <p className="text-sm text-muted-foreground">Update your profile picture</p>
                  </div>
                  <Button variant="outline">Change</Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-foreground">Display Name</label>
                    <input
                      type="text"
                      className="w-full mt-1 p-2 rounded-lg bg-accent/20 border border-accent/30 text-foreground"
                      placeholder="Enter your display name"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground">Email</label>
                    <input
                      type="email"
                      className="w-full mt-1 p-2 rounded-lg bg-accent/20 border border-accent/30 text-foreground"
                      placeholder="Enter your email"
                    />
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <Card className="bg-card hover:bg-accent/50 transition-colors">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-6 text-card-foreground">Display Settings</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-foreground">Dark Mode</h3>
                    <p className="text-sm text-muted-foreground">Enable dark mode for better visibility</p>
                  </div>
                  <Button variant="outline">Toggle</Button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-foreground">Language</h3>
                    <p className="text-sm text-muted-foreground">Select your preferred language</p>
                  </div>
                  <select className="p-2 rounded-lg bg-accent/20 border border-accent/30 text-foreground">
                    <option>English</option>
                    <option>Spanish</option>
                    <option>French</option>
                  </select>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Notifications Section */}
      {activeTab === 'notifications' && (
        <div className="space-y-6">
          <Card className="bg-card hover:bg-accent/50 transition-colors">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-6 text-card-foreground">Notification Preferences</h2>
              <div className="space-y-4">
                {NOTIFICATION_SETTINGS.map((setting) => (
                  <div key={setting.id} className="flex items-center justify-between p-4 bg-accent/20 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <setting.icon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-medium text-foreground">{setting.name}</h3>
                        <p className="text-sm text-muted-foreground">{setting.description}</p>
                      </div>
                    </div>
                    <Button
                      variant={setting.enabled ? 'default' : 'outline'}
                      onClick={() => {}}
                    >
                      {setting.enabled ? 'Enabled' : 'Disabled'}
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          <Card className="bg-card hover:bg-accent/50 transition-colors">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-6 text-card-foreground">Notification Channels</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-accent/20 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <EnvelopeIcon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium text-foreground">Email Notifications</h3>
                      <p className="text-sm text-muted-foreground">Receive notifications via email</p>
                    </div>
                  </div>
                  <Button variant="outline">Configure</Button>
                </div>
                <div className="flex items-center justify-between p-4 bg-accent/20 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <DevicePhoneMobileIcon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium text-foreground">Push Notifications</h3>
                      <p className="text-sm text-muted-foreground">Receive push notifications on your device</p>
                    </div>
                  </div>
                  <Button variant="outline">Configure</Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Security Section */}
      {activeTab === 'security' && (
        <div className="space-y-6">
          <Card className="bg-card hover:bg-accent/50 transition-colors">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-6 text-card-foreground">Security Settings</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-accent/20 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <KeyIcon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium text-foreground">Two-Factor Authentication</h3>
                      <p className="text-sm text-muted-foreground">Add an extra layer of security to your account</p>
                    </div>
                  </div>
                  <Button variant="outline">Enable</Button>
                </div>
                <div className="flex items-center justify-between p-4 bg-accent/20 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <ShieldCheckIcon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium text-foreground">Password</h3>
                      <p className="text-sm text-muted-foreground">Change your account password</p>
                    </div>
                  </div>
                  <Button variant="outline">Change</Button>
                </div>
              </div>
            </div>
          </Card>

          <Card className="bg-card hover:bg-accent/50 transition-colors">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-6 text-card-foreground">Connected Devices</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-accent/20 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <DevicePhoneMobileIcon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium text-foreground">Current Device</h3>
                      <p className="text-sm text-muted-foreground">MacBook Pro • Last active now</p>
                    </div>
                  </div>
                  <span className="px-2 py-1 text-xs rounded-full bg-emerald-500/10 text-emerald-500">
                    Active
                  </span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}
    </>
  );
} 