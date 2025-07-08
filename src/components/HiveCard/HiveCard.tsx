import React from 'react'
import BeeCard from '../BeeCard'
import './HiveCard.css'

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

interface HiveCardProps {
  hive: StakedHive
  hiveBees: BeeAsset[]
  unstakedBees: BeeAsset[]
  onClaimResources: (hiveId: string) => void
  onFeedBee: (beeId: string) => void
  onUnstakeBee: (hiveId: string, beeId: string) => void
  onStakeBee: (hiveId: string, beeId: string) => void
  onUpgradeHive: (hiveId: string) => void
  getEarningRates: (beeType: string, beeRarity: string) => Promise<number[]>
}

const HiveCard: React.FC<HiveCardProps> = ({
  hive,
  hiveBees,
  unstakedBees,
  onClaimResources,
  onFeedBee,
  onUnstakeBee,
  onStakeBee,
  onUpgradeHive,
  getEarningRates
}) => {
  return (
    <div className="hive-card">
      <div className="hive-image-container">
        {hive.asset_details?.immutable_data?.img ? (
          <img 
            src={hive.asset_details.immutable_data.img} 
            alt={hive.asset_details.immutable_data.name || `Hive #${hive.asset_id}`}
            className="hive-image"
            onError={(e) => {
              e.currentTarget.style.display = 'none'
            }}
          />
        ) : (
          <div className="hive-placeholder">
            🏠
          </div>
        )}
      </div>
      <div className="hive-header">
        <h3>{hive.asset_details?.immutable_data?.name || `Hive #${hive.asset_id}`}</h3>
        <div className="hive-actions">
          <button 
            className="claim-btn"
            onClick={() => onClaimResources(hive.asset_id)}
          >
            💰 Claim Resources
          </button>
          <button 
            className="upgrade-btn"
            onClick={() => onUpgradeHive(hive.asset_id)}
          >
            ⬆️ Upgrade Hive
          </button>
        </div>
      </div>
      
      <div className="bees-section">
        <h4>🐝 Staked Bees ({hiveBees.length})</h4>
        {hiveBees.length > 0 ? (
          <div className="bees-grid">
            {hiveBees.map((bee, beeIndex) => (
              <BeeCard
                key={beeIndex}
                bee={bee}
                isStaked={true}
                hiveId={hive.asset_id}
                onFeed={onFeedBee}
                onUnstake={onUnstakeBee}
                getEarningRates={getEarningRates}
              />
            ))}
          </div>
        ) : (
          <div className="unstaked-bees-section">
            <div className="no-bees">No bees staked in this hive</div>
            {unstakedBees.length > 0 && (
              <div className="unstaked-bees">
                <h5>🐝 Available Bees to Stake ({unstakedBees.length})</h5>
                <div className="bees-grid">
                  {unstakedBees.map((bee, beeIndex) => (
                    <BeeCard
                      key={beeIndex}
                      bee={bee}
                      isStaked={false}
                      hiveId={hive.asset_id}
                      onStake={onStakeBee}
                      getEarningRates={getEarningRates}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default HiveCard