import React from 'react'
import Header from '../Header'
import HiveCard from '../HiveCard'
import ResourceBalances from '../ResourceBalances'
import { Session } from '@wharfkit/session'
import './Dashboard.css'

type NetworkType = 'mainnet' | 'testnet'

interface ResourceBalance {
  key_id: string
  amount: string | number
  resource_name: string
}

interface BeeAsset {
  asset_id: string
  template_id: number
  mutable_data: {
    lastClaim?: number
    Hunger?: number
  }
  immutable_data: {
    name?: string
    Type?: string
    Rarity?: string
    rarity?: string
    farmResource?: string
    img?: string
  }
}

interface StakedHive {
  hive_id: string
  staked_items: string[]
  health?: number
  availableSlots?: number
  max_slots?: number
  asset_details?: {
    template_id: number
    immutable_data: {
      name?: string
      img?: string
      [key: string]: any
    }
    mutable_data: {
      [key: string]: any
    }
  }
}

interface DashboardProps {
  session: Session
  selectedNetwork: NetworkType
  resourceBalances: ResourceBalance[]
  stakedHives: StakedHive[]
  beeAssets: BeeAsset[]
  unstakedBees: BeeAsset[]
  beevars?: any[]
  hivevars?: any[]
  loadingHives: boolean
  mobileMenuOpen: boolean
  onNetworkChange: (network: NetworkType) => void
  onMobileMenuToggle: () => void
  onLogout: () => void
  onNavigate?: (page: string) => void
  onClaimResources: (hiveId: string) => Promise<void>
  onFeedBee: (beeId: string) => Promise<void>
  onUnstakeBee: (hiveId: string, beeId: string) => Promise<void>
  onUnstakeHive: (hiveId: string) => Promise<void>
  onStakeBee: (hiveId: string, beeId: string) => Promise<void>
  onUpgradeHive: (hiveId: string) => Promise<void>
  getEarningRates: (beeType: string, beeRarity: string) => Promise<number[]>
}

const Dashboard: React.FC<DashboardProps> = ({
  session,
  selectedNetwork,
  resourceBalances,
  stakedHives,
  beeAssets,
  unstakedBees,
  // beevars and hivevars are available as props but not currently used
  loadingHives,
  mobileMenuOpen,
  onNetworkChange,
  onMobileMenuToggle,
  onLogout,
  onNavigate,
  onClaimResources,
  onFeedBee,
  onUnstakeBee,
  onUnstakeHive,
  onStakeBee,
  onUpgradeHive,
  getEarningRates
}) => {
  return (
    <div className="App dashboard">
      <Header
        session={session}
        selectedNetwork={selectedNetwork}
        resourceBalances={resourceBalances}
        mobileMenuOpen={mobileMenuOpen}
        onNetworkChange={onNetworkChange}
        onMobileMenuToggle={onMobileMenuToggle}
        onLogout={onLogout}
        onNavigate={onNavigate}
        currentPage="dashboard"
      />

      <div className="dashboard-content">
        <ResourceBalances 
          resourceBalances={resourceBalances}
          className="dashboard-resources"
        />
        
        <div className="hives-section">
          {loadingHives ? (
            <div className="loading">Loading hives...</div>
          ) : stakedHives.length > 0 ? (
            <div className="hives-grid">
              {stakedHives.map((hive, index) => {
                const hiveBees = beeAssets.filter(bee => 
                  hive.staked_items.includes(bee.asset_id)
                )
                

                
                return (
                  <HiveCard
                    key={index}
                    hive={hive}
                    hiveBees={hiveBees}
                    unstakedBees={unstakedBees}
                    onClaimResources={onClaimResources}
                    onFeedBee={onFeedBee}
                    onUnstakeBee={onUnstakeBee}
                    onUnstakeHive={onUnstakeHive}
                    onStakeBee={onStakeBee}
                    onUpgradeHive={onUpgradeHive}
                    getEarningRates={getEarningRates}
                  />
                )
              })}
            </div>
          ) : (
            <div className="no-hives">
              <h3>No hives found</h3>
              <p>Stake some hives to start farming!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Dashboard