'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { User, Sliders, Network as NetworkIcon, Save, Mail, Shield, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';

type Network = {
  id: string;
  name: string;
  icon: string;
  color: string;
};

export default function SettingsPage() {
  const [riskLevel, setRiskLevel] = useState(3);
  const [enabledNetworks, setEnabledNetworks] = useState<Record<string, boolean>>({
    ethereum: true,
    arbitrum: true,
    optimism: false,
    polygon: true,
    base: false,
  });

  const networks: Network[] = [
    { id: 'ethereum', name: 'Ethereum', icon: 'Ξ', color: 'from-indigo-500 to-blue-500' },
    { id: 'arbitrum', name: 'Arbitrum', icon: 'A', color: 'from-blue-400 to-cyan-400' },
    { id: 'optimism', name: 'Optimism', icon: 'O', color: 'from-red-500 to-pink-500' },
    { id: 'polygon', name: 'Polygon', icon: 'P', color: 'from-purple-500 to-indigo-500' },
    { id: 'base', name: 'Base', icon: 'B', color: 'from-blue-400 to-blue-600' },
  ];

  const toggleNetwork = (networkId: string) => {
    setEnabledNetworks(prev => ({
      ...prev,
      [networkId]: !prev[networkId]
    }));
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-8 max-w-4xl">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-500 bg-clip-text text-transparent">
          Account Settings
        </h1>
        <p className="text-gray-600 dark:text-gray-400 text-lg">Manage your preferences and security settings</p>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Profile Card */}
          <Card className="border border-gray-200 shadow-lg bg-white dark:bg-gray-900 overflow-hidden">
            <div className="h-2 bg-gradient-to-r from-purple-500 to-blue-500"></div>
            <CardHeader className="pb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
                  <User className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-xl">Profile</CardTitle>
                  <CardDescription>Update your profile information</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                  Name
                </Label>
                <div className="relative">
                  <Input 
                    id="name" 
                    defaultValue="John Doe" 
                    className="pl-10 py-5 border-gray-300 bg-white focus:ring-2 focus:ring-purple-500 focus:border-transparent" 
                  />
                  <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                  Email
                </Label>
                <div className="relative">
                  <Input
                    id="email"
                    type="email"
                    defaultValue="john@example.com"
                    className="pl-10 py-5 border-gray-300 bg-gray-50 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    disabled
                  />
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                </div>
                <p className="text-xs text-gray-500">Contact support to update your email</p>
              </div>
            </CardContent>
          </Card>

          {/* Security Card */}
          <Card className="border border-gray-200 shadow-lg bg-white dark:bg-gray-900 overflow-hidden">
            <div className="h-2 bg-gradient-to-r from-blue-500 to-cyan-500"></div>
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                  <Shield className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-xl">Security</CardTitle>
                  <CardDescription>Manage your account security</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Two-Factor Authentication</h4>
                    <p className="text-sm text-muted-foreground">Add an extra layer of security</p>
                  </div>
                  <Button variant="outline" size="sm">Enable</Button>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Change Password</h4>
                    <p className="text-sm text-muted-foreground">Update your account password</p>
                  </div>
                  <Button variant="outline" size="sm">Change</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Risk Preference Card */}
          <Card className="border border-gray-200 shadow-lg bg-white dark:bg-gray-900 overflow-hidden">
            <div className="h-2 bg-gradient-to-r from-amber-500 to-orange-500"></div>
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400">
                  <Activity className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-xl">Risk Preference</CardTitle>
                  <CardDescription>Configure your investment risk tolerance</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Risk Level</span>
                  <span className={cn(
                    'text-sm font-medium px-3 py-1 rounded-full',
                    riskLevel <= 2 ? 'bg-green-100 text-green-800' :
                    riskLevel <= 4 ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800',
                    'dark:bg-opacity-30 dark:text-opacity-100',
                    riskLevel <= 2 ? 'dark:bg-green-900/30 dark:text-green-400' :
                    riskLevel <= 4 ? 'dark:bg-yellow-900/30 dark:text-yellow-400' :
                    'dark:bg-red-900/30 dark:text-red-400'
                  )}>
                    {riskLevel === 1 && 'Very Conservative'}
                    {riskLevel === 2 && 'Conservative'}
                    {riskLevel === 3 && 'Moderate'}
                    {riskLevel === 4 && 'Aggressive'}
                    {riskLevel === 5 && 'Very Aggressive'}
                  </span>
                </div>
                <div className="px-2">
                  <Slider
                    value={[riskLevel]}
                    onValueChange={(value) => setRiskLevel(value[0])}
                    min={1}
                    max={5}
                    step={1}
                    className="py-6"
                  />
                  <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-2 px-1">
                    <span>Conservative</span>
                    <span>Moderate</span>
                    <span>Aggressive</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Estimated Returns</span>
                    <span className="text-sm font-medium text-green-500">
                      {riskLevel * 2.5}% - {riskLevel * 4.5}% APY
                    </span>
                  </div>
                  <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-green-500 via-yellow-500 to-red-500"
                      style={{ width: `${(riskLevel / 5) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Networks Card */}
          <Card className="border border-gray-200 shadow-lg bg-white dark:bg-gray-900 overflow-hidden">
            <div className="h-2 bg-gradient-to-r from-emerald-500 to-teal-500"></div>
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
                  <NetworkIcon className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-xl">Enabled Networks</CardTitle>
                  <CardDescription>Select which networks to use for your transactions</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-3">
                {networks.map((network) => (
                  <div 
                    key={network.id} 
                    className={cn(
                      'flex items-center justify-between p-3 rounded-lg transition-all duration-200',
                      enabledNetworks[network.id] 
                        ? 'bg-purple-50 border border-purple-200 dark:bg-purple-900/20 dark:border-purple-800' 
                        : 'hover:bg-gray-50 border border-gray-100 hover:border-gray-200 dark:hover:bg-gray-800/50 dark:border-transparent dark:hover:border-gray-700',
                      'dark:bg-opacity-20 dark:border-opacity-20'
                    )}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={cn(
                        'flex h-10 w-10 items-center justify-center rounded-full text-white font-bold shadow-sm',
                        `bg-gradient-to-br ${network.color}`
                      )}>
                        {network.icon}
                      </div>
                      <span className="font-medium text-gray-800 dark:text-gray-200">{network.name}</span>
                    </div>
                    <Checkbox
                      id={network.id}
                      checked={enabledNetworks[network.id]}
                      onCheckedChange={() => toggleNetwork(network.id)}
                      className={cn(
                        'h-5 w-5 rounded-md border-2',
                        enabledNetworks[network.id] 
                          ? 'border-purple-600 bg-purple-600 text-white' 
                          : 'border-gray-300',
                        'transition-colors duration-200 dark:border-gray-600'
                      )}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <Button 
          className="bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600 text-white shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5 px-6 py-5 text-base"
        >
          <Save className="mr-2 h-5 w-5" />
          Save All Changes
        </Button>
      </div>


    </div>
  );
}
