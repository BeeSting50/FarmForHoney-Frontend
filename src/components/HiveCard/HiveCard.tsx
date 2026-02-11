import React, { useState } from 'react'
import BeeCard from '../BeeCard'
import { IPFS_GATEWAY } from '../../constants/ipfs'
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
  onFeedBee: (hiveId: string) => void
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
  const totalSlots = hive.availableSlots ?? hive.max_slots ?? 0
  const freeSlots = Math.max(totalSlots - hiveBees.length, 0)
  
  return (
    <div className={`hive-card rarity-${(hiveRarity || 'common').toLowerCase()}`}>
      <div className="hive-header">
        <div className="hive-title-group">
          <span className={`rarity-badge ${(hiveRarity || 'common').toLowerCase()}`}>
            {rarityDisplayName}
          </span>
          <h3>{hive.asset_details?.immutable_data?.name || `Hive #${hive.hive_id}`}</h3>
        </div>
        <div className="hive-actions">
          <button 
            className="claim-btn"
            onClick={() => onClaimResources(hive.hive_id)}
          >
            <span className="btn-icon">💰</span>
            <span className="btn-text">Claim Resources</span>
          </button>
          <div className="dropdown-container">
            <button 
              className="dropdown-toggle"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              title="Hive Settings"
            >
              <span className="settings-icon">⚙️</span>
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
                  <span className="item-icon">⬆️</span> Upgrade Hive
                </button>
                <button 
                  className="dropdown-item unstake-item"
                  onClick={() => {
                    onUnstakeHive(hive.hive_id)
                    setIsDropdownOpen(false)
                  }}
                >
                  <span className="item-icon">📤</span> Unstake Hive
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
                   `${IPFS_GATEWAY}${hive.asset_details.immutable_data.img}`}
              alt={hive.asset_details.immutable_data.name || `Hive #${hive.hive_id}`}
              className="hive-image"
              onError={(e) => {
                e.currentTarget.style.display = 'none'
              }}
            />
          ) : (
            <div className="hive-placeholder">
              <span className="placeholder-icon">🏠</span>
            </div>
          )}
          <div className="hive-level-tag">LVL {hiveLevel}</div>
        </div>
        
        <div className="hive-stats">
          <div className="stat-card health-section">
            <div className="stat-header">
              <div className="stat-label">
                <span className="stat-icon">❤️</span>
                <span>Durability</span>
              </div>
              <span className="stat-value">
                {hive.health || 0} / {maxHealth}
              </span>
            </div>
            <div className="progress-bar-container">
              <div 
                className="progress-fill health-fill" 
                style={{
                  width: `${Math.min(((hive.health || 0) / maxHealth) * 100, 100)}%`
                }}
              >
                <div className="shimmer"></div>
              </div>
            </div>
          </div>
          
          <div className="stat-card slots-section">
            <div className="stat-header">
              <div className="stat-label">
                <span className="stat-icon">🐝</span>
                <span>Capacity</span>
              </div>
              <span className="stat-value">
                {hiveBees.length} / {totalSlots}
              </span>
            </div>
            <div className="progress-bar-container">
              <div 
                className="progress-fill slots-fill" 
                style={{
                  width: `${Math.min((hiveBees.length / (totalSlots || 1)) * 100, 100)}%`
                }}
              >
                <div className="shimmer"></div>
              </div>
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
        {freeSlots > 0 && unstakedBees.length > 0 && (
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
