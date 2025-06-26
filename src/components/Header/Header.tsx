import { Session } from '@wharfkit/session'
import './Header.css'

interface ResourceBalance {
  key_id: string
  amount: string | number
  resource_name: string
}

type NetworkType = 'mainnet' | 'testnet'

interface HeaderProps {
  session: Session | null
  selectedNetwork: NetworkType
  resourceBalances: ResourceBalance[]
  mobileMenuOpen: boolean
  onNetworkChange: (network: NetworkType) => void
  onMobileMenuToggle: () => void
  onLogout: () => void
}

function Header({
  session,
  selectedNetwork,
  resourceBalances,
  mobileMenuOpen,
  onNetworkChange,
  onMobileMenuToggle,
  onLogout
}: HeaderProps) {
  if (!session) {
    // Login page header
    return (
      <header className="App-header">
        <div className="header-content">
          <h1>🍯 HoneyFarmers</h1>
          <p>Connect your WAX wallet to manage your honey farm</p>
          <div className="network-selector">
            <label htmlFor="network-select">Network:</label>
            <select 
              id="network-select" 
              value={selectedNetwork} 
              onChange={(e) => onNetworkChange(e.target.value as NetworkType)}
            >
              <option value="mainnet">WAX Mainnet</option>
              <option value="testnet">WAX Testnet</option>
            </select>
          </div>
        </div>
      </header>
    )
  }

  // Dashboard header
  return (
    <div className="dashboard-header">
      <div className="header-top">
        <h1>🍯 HoneyFarmers Dashboard</h1>
        <button 
          className={`mobile-menu-toggle ${mobileMenuOpen ? 'active' : ''}`}
          onClick={onMobileMenuToggle}
          aria-label="Toggle mobile menu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>
      
      <div className={`user-info ${mobileMenuOpen ? 'mobile-open' : ''}`}>
        <div className="user-details">
          <span>👤 {session.actor.toString()}</span>
          <span>🌐 {selectedNetwork}</span>
          {resourceBalances.find(r => r.resource_name === 'ROYAL-JELLY') && (
            <span className="royal-jelly-balance">
              🍯 {parseFloat(resourceBalances.find(r => r.resource_name === 'ROYAL-JELLY')?.amount?.toString() || '0').toFixed(4)}
            </span>
          )}
        </div>
        
        <div className="navigation-menu">
          <button className="nav-item active">🏠 Your Hives</button>
          <button className="nav-item">🛒 Marketplace</button>
          <button className="nav-item">📦 Inventory</button>
          <button className="nav-item">📊 Statistics</button>
        </div>
        
        <button className="logout-btn" onClick={onLogout}>Logout</button>
      </div>
    </div>
  )
}

export default Header