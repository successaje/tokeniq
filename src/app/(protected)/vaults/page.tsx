import { VaultList } from './components/vault-list';
import { VaultStats } from './components/vault-stats';
import { BtcVaultsSection } from './components/btc-vaults-section';

export default function VaultsPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight bg-gradient-to-r from-blue-700 via-blue-600 to-purple-700 bg-clip-text text-transparent">
            Vaults
          </h1>
          <p className="text-muted-foreground mt-2">
            Deposit your assets into automated yield strategies
          </p>
        </div>
        
        <VaultStats />
        <BtcVaultsSection />
        <div className="mt-12">
          <VaultList />
        </div>
      </div>
    </div>
  );
}
