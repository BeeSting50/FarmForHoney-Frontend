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
    Type?: string
    type?: string
    Rarity?: string
    rarity?: string
    farmResource?: string
    img?: string
  }
}

interface BeeCardProps {
  bee: BeeAsset
  isStaked: boolean
  hiveId?: string
  onFeed?: (hiveId: string) => void
  onUnstake?: (hiveId: string, beeId: string) => void
  onStake?: (hiveId: string, beeId: string) => void
  getEarningRates?: (beeType: string, beeRarity: string) => Promise<number[]>
}

const BeeCard: React.FC<BeeCardProps> = ({
  bee,
  isStaked,
  hiveId,
  onFeed,
  onUnstake,
  onStake,
  getEarningRates
}) => {
  const [earningRates, setEarningRates] = React.useState<number[]>([0, 0, 0, 0])
  const [loadingRates, setLoadingRates] = React.useState(false)

  React.useEffect(() => {
    const fetchEarningRates = async () => {
      const beeType = (bee.immutable_data.Type || bee.immutable_data.type || '').toLowerCase()
      const beeRarity = (bee.immutable_data.Rarity || bee.immutable_data.rarity || '').toLowerCase()
      if (getEarningRates && beeType && beeRarity) {
        setLoadingRates(true)
        try {
          const rates = await getEarningRates(beeType, beeRarity)
          setEarningRates(rates)
        } catch {
          // Silently handle error
        } finally {
          setLoadingRates(false)
        }
      }
    }

    fetchEarningRates()
  }, [getEarningRates, bee.immutable_data.Type, bee.immutable_data.type, bee.immutable_data.Rarity, bee.immutable_data.rarity])
  const rarity = (bee.immutable_data.Rarity || bee.immutable_data.rarity || 'common').toLowerCase()

  return (
    <div className={`bee-card rarity-${rarity} ${!isStaked ? 'unstaked' : ''}`}>
      <div className="bee-card-content">
        <div className="bee-header">
          <span className={`rarity-badge ${rarity}`}>{rarity}</span>
          <div className="bee-actions-dropdown">
            {isStaked ? (
              <div className="action-select-wrapper">
                <select 
                  className="bee-action-select"
                  onChange={(e) => {
                    const action = e.target.value
                    if (action === 'feed' && onFeed && hiveId) {
                      onFeed(hiveId)
                    } else if (action === 'unstake' && onUnstake && hiveId) {
                      onUnstake(hiveId, bee.asset_id)
                    }
                    e.target.value = '' // Reset selection
                  }}
                  defaultValue=""
                >
                  <option value="" disabled>⚙️</option>
                  <option value="feed">🍯 Feed Hive</option>
                  <option value="unstake">📤 Unstake</option>
                </select>
              </div>
            ) : (
              <button 
                className="stake-btn"
                onClick={() => onStake && hiveId && onStake(hiveId, bee.asset_id)}
                title="Stake this bee"
              >
                <span className="btn-icon">📥</span>
              </button>
            )}
          </div>
        </div>

        <div className="bee-image-container">
          {bee.immutable_data?.img ? (
            <img 
              src={bee.immutable_data.img.startsWith('http') ? bee.immutable_data.img : `https://ipfs.io/ipfs/${bee.immutable_data.img}`} 
              alt={bee.immutable_data.name || `Bee #${bee.asset_id}`}
              className="bee-image"
              onError={(e) => {
                e.currentTarget.style.display = 'none'
              }}
            />
          ) : (
            <div className="bee-placeholder">
              <span className="placeholder-icon">🐝</span>
            </div>
          )}
        </div>

        <div className="bee-info">
          <div className="bee-name-group">
            <span className="bee-name">
              {bee.immutable_data.name || `Bee #${bee.asset_id}`}
            </span>
          </div>

          {getEarningRates && (
            <div className="earning-rates-container">
              {loadingRates ? (
                <div className="loading-shimmer"></div>
              ) : (
                <div className="rates-grid">
                  <div className="rate-item" title="Honey per hour">
                    <span className="rate-icon">🍯</span>
                    <span className="rate-value">{earningRates[0].toFixed(2)}</span>
                  </div>
                  <div className="rate-item" title="Pollen per hour">
                    <span className="rate-icon">🌸</span>
                    <span className="rate-value">{earningRates[1].toFixed(2)}</span>
                  </div>
                  <div className="rate-item" title="Beeswax per hour">
                    <span className="rate-icon">🕯️</span>
                    <span className="rate-value">{earningRates[2].toFixed(2)}</span>
                  </div>
                  <div className="rate-item" title="Royal Jelly per hour">
                    <span className="rate-icon">👑</span>
                    <span className="rate-value">{earningRates[3].toFixed(2)}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="bee-stats">
            {isStaked && bee.mutable_data.Hunger !== undefined && (
              <div className="stat-card hunger-section">
                <div className="stat-header">
                  <div className="stat-label">
                    <span className="stat-icon">🍽️</span>
                    <span>Energy</span>
                  </div>
                  <span className="stat-value">{bee.mutable_data.Hunger}/100</span>
                </div>
                <div className="progress-bar-container">
                  <div 
                    className="progress-fill hunger-fill"
                    style={{
                      width: `${Math.max(0, Math.min(100, Number(bee.mutable_data.Hunger)))}%`
                    }}
                  >
                    <div className="shimmer"></div>
                  </div>
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
