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
  unstakedHives: BeeAsset[]
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
  onStakeHive: (hiveId: string) => Promise<void>
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
  unstakedHives,
  beevars,
  hivevars,
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
  onStakeHive,
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
        
        {(loadingHives || stakedHives.length > 0) && (
          <div className="hives-section">
            <h2>Staked Hives</h2>
            {loadingHives ? (
              <div className="loading">Loading hives...</div>
            ) : (
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
                      hivevars={hivevars}
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
            )}
          </div>
        )}

        {stakedHives.length === 0 && (
          <div className="inventory-section">
            <h2>Inventory</h2>
            
            {unstakedHives.length > 0 ? (
              <div className="inventory-category">
                <h3>Unstaked Hives</h3>
                <div className="inventory-grid">
                  {unstakedHives
                    .filter(hive => !stakedHives.some(stakedHive => stakedHive.hive_id === hive.asset_id))
                    .map((hive) => (
                    <div key={hive.asset_id} className="inventory-item hive-item">
                      <div className="item-image">
                        {hive.immutable_data.img ? (
                          <img
                            src={hive.immutable_data.img.startsWith('http') ? hive.immutable_data.img : `https://ipfs.io/ipfs/${hive.immutable_data.img}`}
                            alt={hive.immutable_data.name || 'Hive'}
                            onError={(e) => {
                              const target = e.target as HTMLImageElement
                              target.style.display = 'none'
                            }}
                          />
                        ) : (
                          <div className="placeholder-image">🏠</div>
                        )}
                      </div>
                      <div className="item-info">
                        <h4>{hive.immutable_data.name || 'Hive'}</h4>
                        <p className="item-rarity">{hive.immutable_data.rarity || hive.immutable_data.Rarity || 'Common'}</p>
                        <button
                          className="stake-button"
                          onClick={() => onStakeHive(hive.asset_id)}
                        >
                          Stake Hive
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="no-inventory">
                <p>No unstaked items found. Visit the marketplace to get hives and bees!</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default Dashboard