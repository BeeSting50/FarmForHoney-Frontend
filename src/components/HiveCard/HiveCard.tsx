import React, { useState } from 'react'
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

interface HiveCardProps {
  hive: StakedHive
  hiveBees: BeeAsset[]
  unstakedBees: BeeAsset[]
  hivevars?: any[]
  onClaimResources: (hiveId: string) => void
  onFeedBee: (beeId: string) => void
  onUnstakeBee: (hiveId: string, beeId: string) => void
  onUnstakeHive: (hiveId: string) => void
  onStakeBee: (hiveId: string, beeId: string) => void
  onUpgradeHive: (hiveId: string) => void
  getEarningRates: (beeType: string, beeRarity: string) => Promise<number[]>
}

const HiveCard: React.FC<HiveCardProps> = ({
  hive,
  hiveBees,
  unstakedBees,
  hivevars,
  onClaimResources,
  onFeedBee,
  onUnstakeBee,
  onUnstakeHive,
  onStakeBee,
  onUpgradeHive,
  getEarningRates
}) => {
  // Calculate hive level based on max_slots
  const hiveLevel = Math.max((hive.max_slots || 5) - 4, 1)
  
  // Get hive rarity from immutable data (template data) or fallback to level-based calculation
  const hiveRarity = hive.asset_details?.immutable_data?.rarity || hive.asset_details?.immutable_data?.Rarity
  let rarityIndex = Math.min(hiveLevel - 1, 4) // Default fallback: 0-4 for common to legendary
  
  // Map rarity string to index if available
  if (hiveRarity) {
    const rarityMap: { [key: string]: number } = {
      'common': 0,
      'uncommon': 1, 
      'rare': 2,
      'epic': 3,
      'legendary': 4
    }
    rarityIndex = rarityMap[hiveRarity.toLowerCase()] ?? rarityIndex
  }
  
  // Get max health from hivevars based on rarity
  const healthRow = hivevars?.find(row => row.category === 'health')
  const maxHealth = healthRow?.values?.[rarityIndex] || 1000
  
  // Get rarity display name
  const rarityNames = ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary']
  const rarityDisplayName = rarityNames[rarityIndex] || 'Unknown'
  
  // State for dropdown
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  
  return (
    <div className="hive-card">
      <div className="hive-header">
        <h3>{hive.asset_details?.immutable_data?.name || `Hive #${hive.hive_id}`}</h3>
        <div className="hive-actions">
          <button 
            className="claim-btn"
            onClick={() => onClaimResources(hive.hive_id)}
          >
            💰 Claim Resources
          </button>
          <div className="dropdown-container">
            <button 
              className="dropdown-toggle"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            >
              ⚙️ Actions ▼
            </button>
            {isDropdownOpen && (
              <div className="dropdown-menu">
                <button 
                  className="dropdown-item upgrade-item"
                  onClick={() => {
                    onUpgradeHive(hive.hive_id)
                    setIsDropdownOpen(false)
                  }}
                >
                  ⬆️ Upgrade Hive
                </button>
                <button 
                  className="dropdown-item unstake-item"
                  onClick={() => {
                    onUnstakeHive(hive.hive_id)
                    setIsDropdownOpen(false)
                  }}
                >
                  📤 Unstake Hive
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="hive-main-content">
        <div className="hive-image-container">
          {hive.asset_details?.immutable_data?.img ? (
            <img
              src={hive.asset_details.immutable_data.img.startsWith('http') ?
                   hive.asset_details.immutable_data.img :
                   `https://ipfs.neftyblocks.io/ipfs/${hive.asset_details.immutable_data.img}`}
              alt={hive.asset_details.immutable_data.name || `Hive #${hive.hive_id}`}
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
        
        <div className="hive-stats">
          <div className="health-section">
            <div className="health-label">
              <span className="health-icon">❤️</span>
              <span>Health ({rarityDisplayName})</span>
              <span className="health-value">
                {hive.health || 0}/{maxHealth}
              </span>
            </div>
            <div className="health-bar">
              <div 
                className="health-fill" 
                style={{
                  width: `${Math.min(((hive.health || 0) / maxHealth) * 100, 100)}%`
                }}
              ></div>
            </div>
          </div>
          
          <div className="slots-section">
            <div className="slots-label">
              <span className="slots-icon">🏠</span>
              <span>Level {hiveLevel}</span>
              <span className="slots-value">
                {hive.availableSlots || 0}/{hive.max_slots || 0}
              </span>
            </div>
          </div>
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
                hiveId={hive.hive_id}
                onFeed={onFeedBee}
                onUnstake={onUnstakeBee}
                getEarningRates={getEarningRates}
              />
            ))}
          </div>
        ) : (
          <div className="no-bees">No bees staked in this hive</div>
        )}
        
        {/* Show unstaked bees if there are available slots and unstaked bees */}
        {(hive.availableSlots || 0) > 0 && unstakedBees.length > 0 && (
          <div className="unstaked-bees-section">
            <h5>🐝 Available Bees to Stake ({unstakedBees.length})</h5>
            <div className="bees-grid">
              {unstakedBees.map((bee, beeIndex) => (
                <BeeCard
                  key={beeIndex}
                  bee={bee}
                  isStaked={false}
                  hiveId={hive.hive_id}
                  onStake={onStakeBee}
                  getEarningRates={getEarningRates}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default HiveCard