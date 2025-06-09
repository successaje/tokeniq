'use client';

import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Switch } from '@/components/ui/Switch';
import { User, Bell, Shield, Key, Globe } from 'lucide-react';

export default function ProfilePage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Profile Settings</h1>
        <p className="text-muted-foreground">Manage your account preferences</p>
      </div>

      {/* Profile Information */}
      <Card className="p-6">
        <div className="flex items-center space-x-4">
          <div className="rounded-full bg-primary/10 p-3">
            <User className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Account Information</h2>
            <p className="text-sm text-muted-foreground">Update your profile details</p>
          </div>
        </div>

        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input id="name" defaultValue="John Doe" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" defaultValue="john@example.com" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="company">Company</Label>
            <Input id="company" defaultValue="Acme Inc." />
          </div>
          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Input id="role" defaultValue="Treasury Manager" />
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <Button>Save Changes</Button>
        </div>
      </Card>

      {/* Preferences */}
      <Card className="p-6">
        <div className="flex items-center space-x-4">
          <div className="rounded-full bg-primary/10 p-3">
            <Bell className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Preferences</h2>
            <p className="text-sm text-muted-foreground">Manage your notification settings</p>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Email Notifications</p>
              <p className="text-sm text-muted-foreground">Receive updates about your portfolio</p>
            </div>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Strategy Alerts</p>
              <p className="text-sm text-muted-foreground">Get notified about strategy changes</p>
            </div>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Market Updates</p>
              <p className="text-sm text-muted-foreground">Receive market analysis and insights</p>
            </div>
            <Switch />
          </div>
        </div>
      </Card>

      {/* Security */}
      <Card className="p-6">
        <div className="flex items-center space-x-4">
          <div className="rounded-full bg-primary/10 p-3">
            <Shield className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Security</h2>
            <p className="text-sm text-muted-foreground">Manage your security settings</p>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Two-Factor Authentication</p>
              <p className="text-sm text-muted-foreground">Add an extra layer of security</p>
            </div>
            <Button variant="outline">Enable</Button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Change Password</p>
              <p className="text-sm text-muted-foreground">Update your password regularly</p>
            </div>
            <Button variant="outline">Change</Button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">API Keys</p>
              <p className="text-sm text-muted-foreground">Manage your API access</p>
            </div>
            <Button variant="outline">Manage</Button>
          </div>
        </div>
      </Card>

      {/* Connected Accounts */}
      <Card className="p-6">
        <div className="flex items-center space-x-4">
          <div className="rounded-full bg-primary/10 p-3">
            <Globe className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Connected Accounts</h2>
            <p className="text-sm text-muted-foreground">Manage your connected services</p>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Wallet Connection</p>
              <p className="text-sm text-muted-foreground">0x1234...5678</p>
            </div>
            <Button variant="outline">Disconnect</Button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Discord</p>
              <p className="text-sm text-muted-foreground">Connected for notifications</p>
            </div>
            <Button variant="outline">Disconnect</Button>
          </div>
        </div>
      </Card>
    </div>
  );
} 