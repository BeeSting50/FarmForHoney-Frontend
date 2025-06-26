import React from 'react'
import './BeeCard.css'

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

interface BeeCardProps {
  bee: BeeAsset
  isStaked: boolean
  hiveId?: string
  onFeed?: (beeId: string) => void
  onUnstake?: (hiveId: string, beeId: string) => void
  onStake?: (hiveId: string, beeId: string) => void
}

const BeeCard: React.FC<BeeCardProps> = ({
  bee,
  isStaked,
  hiveId,
  onFeed,
  onUnstake,
  onStake
}) => {
  return (
    <div className={`bee-card ${!isStaked ? 'unstaked' : ''}`}>
      <div className="bee-card-content">
        <div className="bee-actions-dropdown">
          {isStaked ? (
            <select 
              className="bee-action-select"
              onChange={(e) => {
                const action = e.target.value
                if (action === 'feed' && onFeed) {
                  onFeed(bee.asset_id)
                } else if (action === 'unstake' && onUnstake && hiveId) {
                  onUnstake(hiveId, bee.asset_id)
                }
                e.target.value = '' // Reset selection
              }}
              defaultValue=""
            >
              <option value="" disabled>⚙️</option>
              <option value="feed">🍯 Feed</option>
              <option value="unstake">📤 Unstake</option>
            </select>
          ) : (
            <button 
              className="stake-btn"
              onClick={() => onStake && hiveId && onStake(hiveId, bee.asset_id)}
              title="Stake this bee"
            >
              📥
            </button>
          )}
        </div>
        <div className="bee-image-container">
          {bee.immutable_data?.img ? (
            <img 
              src={bee.immutable_data.img} 
              alt={bee.immutable_data.name || `Bee #${bee.asset_id}`}
              className="bee-image"
              onError={(e) => {
                e.currentTarget.style.display = 'none'
              }}
            />
          ) : (
            <div className="bee-placeholder">
              🐝
            </div>
          )}
        </div>
        <div className="bee-info">
          <div className="bee-name">
            {bee.immutable_data.name || `Bee #${bee.asset_id}`}
          </div>
          <div className="bee-stats">
            <span>🍯 {bee.immutable_data.farmResource || 'HONEY'}</span>
            <span>⭐ {bee.immutable_data.rarity || 'Common'}</span>
            {isStaked && bee.mutable_data.Hunger && (
              <div className="health-section">
                <div className="health-info">
                  <div className="health-left">
                    <span className="health-label">❤️ Health</span>
                  </div>
                  <span className="hunger-value">Hunger: {bee.mutable_data.Hunger}</span>
                </div>
                <div className="health-bar">
                  <div 
                    className="health-fill"
                    style={{
                      width: `${Math.max(0, Math.min(100, 100 - Number(bee.mutable_data.Hunger)))}%`
                    }}
                  ></div>
                </div>
              </div>
            )}
            {!isStaked && (
              <div className="unstaked-status">
                <span className="status-badge">📦 In Wallet</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default BeeCard