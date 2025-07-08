import React from 'react'
import './EarningsPopup.css'

interface ResourceBalance {
  key_id: string
  amount: string | number
  resource_name: string
}

interface EarningsPopupProps {
  isOpen: boolean
  onClose: () => void
  earnings: ResourceBalance[]
}

const EarningsPopup: React.FC<EarningsPopupProps> = ({ isOpen, onClose, earnings }) => {
  if (!isOpen) return null

  const resourceConfig = {
    HNY: { icon: '🍯', displayName: 'Honey', color: '#f39c12' },
    PLN: { icon: '🌱', displayName: 'Pollen', color: '#27ae60' },
    BWAX: { icon: '🕯️', displayName: 'Beeswax', color: '#e67e22' },
    RJ: { icon: '👑', displayName: 'Royal Jelly', color: '#9b59b6' }
  }

  const getResourceConfig = (resourceName: string) => {
    const upperName = resourceName.toUpperCase()
    return resourceConfig[upperName as keyof typeof resourceConfig] || {
      icon: '📦',
      displayName: resourceName,
      color: '#95a5a6'
    }
  }

  const formatAmount = (amount: string | number): string => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount
    return num.toFixed(2)
  }

  const hasEarnings = earnings.some(earning => parseFloat(earning.amount.toString()) > 0)

  return (
    <div className="earnings-popup-overlay" onClick={onClose}>
      <div className="earnings-popup" onClick={(e) => e.stopPropagation()}>
        <div className="earnings-popup-header">
          <h3>🎉 Resources Claimed!</h3>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        
        <div className="earnings-popup-content">
          {hasEarnings ? (
            <>
              <p className="earnings-message">You've successfully claimed the following resources:</p>
              <div className="earnings-list">
                {earnings
                  .filter(earning => parseFloat(earning.amount.toString()) > 0)
                  .map((earning) => {
                    const config = getResourceConfig(earning.resource_name)
                    return (
                      <div key={earning.key_id} className="earning-item">
                        <span className="earning-icon">{config.icon}</span>
                        <span className="earning-name">{config.displayName}</span>
                        <span 
                          className="earning-amount"
                          style={{ color: config.color }}
                        >
                          +{formatAmount(earning.amount)}
                        </span>
                      </div>
                    )
                  })}
              </div>
            </>
          ) : (
            <p className="no-earnings-message">No resources were earned this time. Keep your bees working!</p>
          )}
        </div>
        
        <div className="earnings-popup-footer">
          <button className="ok-button" onClick={onClose}>
            Awesome!
          </button>
        </div>
      </div>
    </div>
  )
}

export default EarningsPopup