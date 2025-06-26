import React from 'react'
import Header from '../Header'
import HiveCard from '../HiveCard'
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
    type?: string
    rarity?: string
    farmResource?: string
    img?: string
  }
}

interface StakedHive {
  asset_id: string
  staked_items: string[]
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
  loadingHives: boolean
  mobileMenuOpen: boolean
  onNetworkChange: (network: NetworkType) => void
  onMobileMenuToggle: () => void
  onLogout: () => void
  onClaimResources: (hiveId: string) => void
  onFeedBee: (beeId: string) => void
  onUnstakeBee: (hiveId: string, beeId: string) => void
  onStakeBee: (hiveId: string, beeId: string) => void
}

const Dashboard: React.FC<DashboardProps> = ({
  session,
  selectedNetwork,
  resourceBalances,
  stakedHives,
  beeAssets,
  unstakedBees,
  loadingHives,
  mobileMenuOpen,
  onNetworkChange,
  onMobileMenuToggle,
  onLogout,
  onClaimResources,
  onFeedBee,
  onUnstakeBee,
  onStakeBee
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
      />

      <div className="dashboard-content">
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
                    onStakeBee={onStakeBee}
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