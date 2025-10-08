'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Building2, FileText, BarChart3, Shield, TrendingUp, CheckCircle } from 'lucide-react';
import { VAULT_TYPES } from '@/config/vaults';
import Link from 'next/link';

export function RWAVaultsSection() {
  const rwaVaults = Object.values(VAULT_TYPES).filter(vault => 
    vault.id.includes('creditcoin') && vault.available
  );

  const getVaultIcon = (vaultId: string) => {
    if (vaultId.includes('real-estate')) return <Building2 className="h-6 w-6 text-blue-600" />;
    if (vaultId.includes('invoice')) return <FileText className="h-6 w-6 text-green-600" />;
    if (vaultId.includes('commodity')) return <BarChart3 className="h-6 w-6 text-orange-600" />;
    return <Building2 className="h-6 w-6 text-purple-600" />;
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center space-x-3">
          <div className="p-3 bg-purple-100 rounded-full">
            <Shield className="h-8 w-8 text-purple-600" />
          </div>
          <div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Creditcoin RWA Vaults
            </h2>
            <p className="text-muted-foreground">
              Tokenized Real-World Assets with Credit Scoring & Compliance
            </p>
          </div>
        </div>
        
        <div className="flex flex-wrap justify-center gap-4 text-sm">
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span>Automated Credit Scoring</span>
          </div>
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span>Regulatory Compliance</span>
          </div>
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span>Cross-Chain Native</span>
          </div>
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span>Real-Time Valuation</span>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {rwaVaults.map((vault) => (
          <Card key={vault.id} className="border-2 border-purple-200 hover:border-purple-400 transition-colors bg-gradient-to-br from-purple-50 to-blue-50">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {getVaultIcon(vault.id)}
                  <div>
                    <CardTitle className="text-lg text-purple-800">{vault.name}</CardTitle>
                  </div>
                </div>
                <Badge className={getRiskColor(vault.risk)}>{vault.risk}</Badge>
              </div>
              <p className="text-sm text-purple-600 mt-2">{vault.description}</p>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-muted-foreground">APY</div>
                  <div className="font-bold text-green-600">{vault.apy}%</div>
                </div>
                <div>
                  <div className="text-muted-foreground">TVL</div>
                  <div className="font-bold">
                    ${(Number(vault.tvl) / 1e18 / 1000000).toFixed(1)}M
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">Min Deposit</div>
                  <div className="font-bold">
                    {Number(vault.minDeposit) / 1e18} CTC
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">Chain</div>
                  <div className="font-bold text-purple-600">Creditcoin</div>
                </div>
              </div>

              <div className="flex flex-wrap gap-1">
                {vault.tags?.slice(0, 3).map((tag, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>

              <div className="flex space-x-2">
                <Button 
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
                  size="sm"
                >
                  <TrendingUp className="h-4 w-4 mr-1" />
                  Invest
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="border-purple-300 text-purple-700 hover:bg-purple-100"
                  asChild
                >
                  <Link href={`/vaults/${vault.id}`}>
                    Details
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="text-center">
        <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <Building2 className="h-8 w-8 text-purple-600" />
              <h3 className="text-xl font-bold text-purple-800">
                Explore All RWA Options
              </h3>
            </div>
            <p className="text-purple-600 mb-4">
              Access comprehensive RWA tokenization with automated compliance, 
              credit scoring, and cross-chain capabilities.
            </p>
            <Button 
              asChild
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              <Link href="/creditcoin-rwa">
                View Full RWA Dashboard
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
