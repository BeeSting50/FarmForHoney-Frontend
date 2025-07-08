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
    Rarity?: string
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
      if (getEarningRates && bee.immutable_data.Type && bee.immutable_data.Rarity) {
        setLoadingRates(true)
        try {
          const rates = await getEarningRates(bee.immutable_data.Type?.toLowerCase() || '', bee.immutable_data.Rarity?.toLowerCase() || '')
          setEarningRates(rates)
        } catch (error) {
          // Silently handle error
        } finally {
          setLoadingRates(false)
        }
      }
    }

    fetchEarningRates()
  }, [getEarningRates, bee.immutable_data.Type, bee.immutable_data.Rarity])
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
          <div className="bee-rarity">
            <span>⭐ {bee.immutable_data.Rarity || 'common'}</span>
          </div>
          {getEarningRates && (
            <div className="earning-rates">
              {loadingRates ? (
                <span className="loading-rates">Loading rates...</span>
              ) : (
                <div className="rates-grid">
                  <span className="rate-item" title="Honey per hour">🍯 {earningRates[0].toFixed(4)}/h</span>
                  <span className="rate-item" title="Pollen per hour">🌸 {earningRates[1].toFixed(4)}/h</span>
                  <span className="rate-item" title="Beeswax per hour">🕯️ {earningRates[2].toFixed(4)}/h</span>
                  <span className="rate-item" title="Royal Jelly per hour">👑 {earningRates[3].toFixed(4)}/h</span>
                </div>
              )}
            </div>
          )}
          <div className="bee-stats">
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