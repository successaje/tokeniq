'use client'

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { 
  User, 
  Shield, 
  Bell, 
  Zap, 
  Settings as SettingsIcon, 
  Brain, 
  Link,
  Wallet,
  TrendingUp,
  Globe,
  AlertCircle,
  Check,
  ChevronLeft
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const SettingsPage = () => {
  const { toast } = useToast();
  const [activeSection, setActiveSection] = useState("account");

  const handleSave = () => {
    toast({
      title: "Settings saved",
      description: "Your preferences have been updated successfully.",
    });
  };

  const sections = [
    { id: "account", label: "Account", icon: User },
    { id: "security", label: "Security", icon: Shield },
    { id: "treasury", label: "Treasury Management", icon: TrendingUp },
    { id: "ai", label: "AI Configuration", icon: Brain },
    { id: "chains", label: "Cross-Chain", icon: Globe },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "integrations", label: "Integrations", icon: Link },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="lg:hidden">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <SettingsIcon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Settings</h1>
                <p className="text-sm text-muted-foreground">
                  Manage your TokenIQ platform preferences
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:w-64 flex-shrink-0">
            <nav className="space-y-2">
              {sections.map((section) => {
                const Icon = section.icon;
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left rounded-lg transition-all ${
                      activeSection === section.id
                        ? "bg-primary/10 text-primary border border-primary/20"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="font-medium">{section.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1 space-y-6">
            {/* Account Settings */}
            {activeSection === "account" && (
              <div className="space-y-6">
                <Card className="bg-gradient-card border-border/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5 text-primary" />
                      Profile Information
                    </CardTitle>
                    <CardDescription>
                      Update your account details and preferences
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="company">Company Name</Label>
                        <Input id="company" placeholder="Acme Corporation" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email Address</Label>
                        <Input id="email" type="email" placeholder="admin@acme.com" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="wallet">Primary Wallet Address</Label>
                      <div className="flex gap-2">
                        <Input id="wallet" value="0x742d35Cc6C..." readOnly />
                        <Button variant="outline" size="sm">
                          <Wallet className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-card border-border/50">
                  <CardHeader>
                    <CardTitle>Plan & Usage</CardTitle>
                    <CardDescription>
                      Your current subscription and usage statistics
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <Badge variant="default" className="bg-primary/10 text-primary">
                          Enterprise Plan
                        </Badge>
                        <p className="text-sm text-muted-foreground mt-1">
                          Unlimited vaults, AI strategies, and cross-chain operations
                        </p>
                      </div>
                      <Button variant="outline" size="sm">Upgrade</Button>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <p className="text-2xl font-bold text-primary">$2.4M</p>
                        <p className="text-xs text-muted-foreground">Assets Under Management</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-success">12.4%</p>
                        <p className="text-xs text-muted-foreground">Average APY</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-foreground">47</p>
                        <p className="text-xs text-muted-foreground">Active Strategies</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Security Settings */}
            {activeSection === "security" && (
              <div className="space-y-6">
                <Card className="bg-gradient-card border-border/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5 text-primary" />
                      Security Preferences
                    </CardTitle>
                    <CardDescription>
                      Configure security settings for your treasury operations
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-base">Two-Factor Authentication</Label>
                        <p className="text-sm text-muted-foreground">
                          Add an extra layer of security to your account
                        </p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-base">Transaction Signing</Label>
                        <p className="text-sm text-muted-foreground">
                          Require manual approval for large transactions
                        </p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    <Separator />
                    <div className="space-y-3">
                      <Label className="text-base">Transaction Limits</Label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="daily-limit" className="text-sm">Daily Limit (USD)</Label>
                          <Input id="daily-limit" placeholder="100,000" />
                        </div>
                        <div>
                          <Label htmlFor="single-tx" className="text-sm">Single Transaction (USD)</Label>
                          <Input id="single-tx" placeholder="50,000" />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Treasury Management */}
            {activeSection === "treasury" && (
              <div className="space-y-6">
                <Card className="bg-gradient-card border-border/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-primary" />
                      Treasury Strategy
                    </CardTitle>
                    <CardDescription>
                      Configure your automated treasury management preferences
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-3">
                      <Label>Risk Tolerance</Label>
                      <div className="space-y-3">
                        <Slider defaultValue={[60]} max={100} step={10} className="w-full" />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Conservative</span>
                          <span>Moderate</span>
                          <span>Aggressive</span>
                        </div>
                      </div>
                    </div>
                    <Separator />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="min-yield">Minimum Yield Threshold</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Select threshold" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="3">3% APY</SelectItem>
                            <SelectItem value="5">5% APY</SelectItem>
                            <SelectItem value="8">8% APY</SelectItem>
                            <SelectItem value="12">12% APY</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="rebalance">Auto-Rebalancing</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Select frequency" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="daily">Daily</SelectItem>
                            <SelectItem value="weekly">Weekly</SelectItem>
                            <SelectItem value="monthly">Monthly</SelectItem>
                            <SelectItem value="manual">Manual Only</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-card border-border/50">
                  <CardHeader>
                    <CardTitle>Asset Allocation</CardTitle>
                    <CardDescription>
                      Define your preferred asset allocation strategy
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {[
                      { name: "Stablecoins", percentage: 40, color: "bg-blue-500" },
                      { name: "DeFi Protocols", percentage: 30, color: "bg-primary" },
                      { name: "RWA Tokens", percentage: 20, color: "bg-green-500" },
                      { name: "Liquidity Pools", percentage: 10, color: "bg-yellow-500" },
                    ].map((asset) => (
                      <div key={asset.name} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <Label className="text-sm">{asset.name}</Label>
                          <span className="text-sm text-muted-foreground">{asset.percentage}%</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${asset.color}`}
                            style={{ width: `${asset.percentage}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* AI Configuration */}
            {activeSection === "ai" && (
              <div className="space-y-6">
                <Card className="bg-gradient-card border-border/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Brain className="h-5 w-5 text-primary" />
                      AI Strategy Engine
                    </CardTitle>
                    <CardDescription>
                      Configure your AI-powered treasury management settings
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-base">AI Auto-Trading</Label>
                        <p className="text-sm text-muted-foreground">
                          Allow AI to execute trades based on market conditions
                        </p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    <Separator />
                    <div className="space-y-3">
                      <Label>AI Aggressiveness Level</Label>
                      <Slider defaultValue={[40]} max={100} step={10} className="w-full" />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Conservative</span>
                        <span>Balanced</span>
                        <span>Aggressive</span>
                      </div>
                    </div>
                    <Separator />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Market Analysis Frequency</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Select frequency" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="realtime">Real-time</SelectItem>
                            <SelectItem value="15min">Every 15 minutes</SelectItem>
                            <SelectItem value="1hour">Hourly</SelectItem>
                            <SelectItem value="4hour">Every 4 hours</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Strategy Optimization</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Select model" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="yield">Yield Optimization</SelectItem>
                            <SelectItem value="risk">Risk Minimization</SelectItem>
                            <SelectItem value="balanced">Balanced Approach</SelectItem>
                            <SelectItem value="custom">Custom Model</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Cross-Chain Settings */}
            {activeSection === "chains" && (
              <div className="space-y-6">
                <Card className="bg-gradient-card border-border/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Globe className="h-5 w-5 text-primary" />
                      Cross-Chain Configuration
                    </CardTitle>
                    <CardDescription>
                      Manage your multi-chain strategy and preferences
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <Label className="text-base">Supported Networks</Label>
                      {[
                        { name: "Ethereum", status: "active", color: "bg-blue-500" },
                        { name: "Avalanche", status: "active", color: "bg-red-500" },
                        { name: "Sei", status: "active", color: "bg-green-500" },
                        // { name}
                        { name: "Base", status: "active", color: "bg-blue-600" },
                        { name: "Optimism", status: "inactive", color: "bg-red-600" },
                        { name: "Polygon", status: "inactive", color: "bg-purple-500" },
                      ].map((network) => (
                        <div key={network.name} className="flex items-center justify-between p-3 rounded-lg border border-border">
                          <div className="flex items-center gap-3">
                            <div className={`w-3 h-3 rounded-full ${network.color}`} />
                            <span className="font-medium">{network.name}</span>
                            <Badge 
                              variant={network.status === "active" ? "default" : "secondary"}
                              className={network.status === "active" ? "bg-success/10 text-success" : ""}
                            >
                              {network.status}
                            </Badge>
                          </div>
                          <Switch checked={network.status === "active"} />
                        </div>
                      ))}
                    </div>
                    <Separator />
                    <div className="space-y-3">
                      <Label>Gas Optimization</Label>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm">Smart Gas Management</p>
                          <p className="text-xs text-muted-foreground">
                            Automatically optimize gas fees across chains
                          </p>
                        </div>
                        <Switch defaultChecked />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Notifications */}
            {activeSection === "notifications" && (
              <div className="space-y-6">
                <Card className="bg-gradient-card border-border/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Bell className="h-5 w-5 text-primary" />
                      Notification Preferences
                    </CardTitle>
                    <CardDescription>
                      Choose what notifications you want to receive
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {[
                      {
                        title: "Transaction Alerts",
                        description: "Get notified of all treasury transactions",
                        enabled: true,
                      },
                      {
                        title: "Yield Opportunities",
                        description: "Alert when new high-yield opportunities are found",
                        enabled: true,
                      },
                      {
                        title: "Risk Warnings",
                        description: "Receive warnings about potential risks",
                        enabled: true,
                      },
                      {
                        title: "Portfolio Updates",
                        description: "Daily portfolio performance summaries",
                        enabled: false,
                      },
                      {
                        title: "Market Analysis",
                        description: "AI-generated market insights and recommendations",
                        enabled: true,
                      },
                    ].map((notification) => (
                      <div key={notification.title} className="flex items-center justify-between">
                        <div>
                          <Label className="text-base">{notification.title}</Label>
                          <p className="text-sm text-muted-foreground">
                            {notification.description}
                          </p>
                        </div>
                        <Switch defaultChecked={notification.enabled} />
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Integrations */}
            {activeSection === "integrations" && (
              <div className="space-y-6">
                <Card className="bg-gradient-card border-border/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Link className="h-5 w-5 text-primary" />
                      API & Integrations
                    </CardTitle>
                    <CardDescription>
                      Manage your API keys and third-party integrations
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 rounded-lg border border-border">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-primary/10">
                            <Zap className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">Chainlink Data Feeds</p>
                            <p className="text-sm text-muted-foreground">Real-time price data</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-success" />
                          <span className="text-sm text-success">Connected</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-4 rounded-lg border border-border">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-warning/10">
                            <AlertCircle className="h-4 w-4 text-warning" />
                          </div>
                          <div>
                            <p className="font-medium">CoinGecko API</p>
                            <p className="text-sm text-muted-foreground">Market data and analytics</p>
                          </div>
                        </div>
                        <Button variant="outline" size="sm">Connect</Button>
                      </div>

                      <div className="flex items-center justify-between p-4 rounded-lg border border-border">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-primary/10">
                            <Brain className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">ElizaOS AI Agent</p>
                            <p className="text-sm text-muted-foreground">AI-powered decision making</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-success" />
                          <span className="text-sm text-success">Active</span>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-3">
                      <Label className="text-base">API Configuration</Label>
                      <div className="space-y-3">
                        <div>
                          <Label htmlFor="api-key" className="text-sm">API Key</Label>
                          <div className="flex gap-2">
                            <Input 
                              id="api-key" 
                              type="password" 
                              value="tk_prod_••••••••••••••••" 
                              readOnly 
                            />
                            <Button variant="outline" size="sm">Regenerate</Button>
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="webhook" className="text-sm">Webhook URL</Label>
                          <Input 
                            id="webhook" 
                            placeholder="https://your-app.com/webhooks/tokeniq" 
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Save Button */}
            <div className="flex justify-end pt-6">
              <Button onClick={handleSave} className="bg-gradient-primary hover:opacity-90">
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;