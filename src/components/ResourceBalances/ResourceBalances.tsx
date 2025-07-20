import React from 'react'
import './ResourceBalances.css'

interface ResourceBalance {
  key_id: string
  amount: string | number
  resource_name: string
}

interface ResourceBalancesProps {
  resourceBalances: ResourceBalance[]
  className?: string
}

const ResourceBalances: React.FC<ResourceBalancesProps> = ({ 
  resourceBalances, 
  className = '' 
}) => {
  // Resource icons and display names mapping
  const resourceConfig = {
    'HONEY': { icon: '🍯', displayName: 'Honey', color: '#f39c12' },
    'HNY': { icon: '🍯', displayName: 'Honey', color: '#f39c12' },
    'POLLEN': { icon: '🌼', displayName: 'Pollen', color: '#f1c40f' },
    'PLN': { icon: '🌼', displayName: 'Pollen', color: '#f1c40f' },
    'BEESWAX': { icon: '🕯️', displayName: 'Beeswax', color: '#e67e22' },
    'BWAX': { icon: '🕯️', displayName: 'Beeswax', color: '#e67e22' },
    'ROYAL-JELLY': { icon: '👑', displayName: 'Royal Jelly', color: '#9b59b6' },
    'RJ': { icon: '👑', displayName: 'Royal Jelly', color: '#9b59b6' },
    'PROPOLIS': { icon: '🧪', displayName: 'Propolis', color: '#27ae60' },
    'PROP': { icon: '🧪', displayName: 'Propolis', color: '#27ae60' }
  }

  // Get resource config with fallback
  const getResourceConfig = (resourceName: string) => {
    const upperName = resourceName.toUpperCase()
    return resourceConfig[upperName as keyof typeof resourceConfig] || {
      icon: '📦',
      displayName: resourceName,
      color: '#95a5a6'
    }
  }

  // Format amount for display
  const formatAmount = (amount: string | number): string => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount
    if (isNaN(numAmount)) return '0'
    
    // Show more decimals for very small amounts
    if (numAmount < 0.01) {
      return numAmount.toFixed(6)
    }
    // Show 2 decimals for normal amounts
    return numAmount.toFixed(2)
  }

  if (!resourceBalances || resourceBalances.length === 0) {
    return (
      <div className={`resource-balances empty ${className}`}>
        <div className="empty-state">
          <span className="empty-icon">📦</span>
          <p>No resources yet</p>
          <small>Start farming to earn resources!</small>
        </div>
      </div>
    )
  }

  return (
    <div className={`resource-balances ${className}`}>
      <div className="resource-balances-header">
        <h3>💰 Resource Balances</h3>
      </div>
      
      <div className="resource-grid">
        {resourceBalances.map((resource, index) => {
          const config = getResourceConfig(resource.resource_name)
          const amount = formatAmount(resource.amount)
          
          return (
            <div 
              key={`${resource.key_id}-${index}`} 
              className="resource-card"
              style={{ '--resource-color': config.color } as React.CSSProperties}
            >
              <div className="resource-icon">
                {config.icon}
              </div>
              <div className="resource-info">
                <div className="resource-name">{config.displayName}</div>
                <div className="resource-amount">{amount}</div>
              </div>
              <div className="resource-glow"></div>
            </div>
          )
        })}
      </div>
      
    </div>
  )
}

export default ResourceBalances