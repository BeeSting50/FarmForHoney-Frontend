import { Session } from '@wharfkit/session'
import './Header.css'

type NetworkType = 'mainnet' | 'testnet'

interface HeaderProps {
  session: Session | null
  selectedNetwork: NetworkType
  mobileMenuOpen: boolean
  onNetworkChange: (network: NetworkType) => void
  onMobileMenuToggle: () => void
  onLogout: () => void
  onNavigate?: (page: string) => void
  currentPage?: string
}

function Header({
  session,
  selectedNetwork,
  mobileMenuOpen,
  onNetworkChange,
  onMobileMenuToggle,
  onLogout,
  onNavigate,
  currentPage = 'dashboard'
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
      <div className="header-container">
        <div className="header-left">
          <div
            className="logo-group"
            role="button"
            tabIndex={0}
            onClick={() => onNavigate?.('dashboard')}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onNavigate?.('dashboard')
              }
            }}
          >
            <span className="logo-icon">🍯</span>
            <div className="logo-text">
              <h1>HoneyFarmers</h1>
              <span className="version-tag">v1.0 Beta</span>
            </div>
          </div>
        </div>

        <div className={`header-center ${mobileMenuOpen ? 'mobile-open' : ''}`}>
          <nav className="navigation-menu">
            <button 
              className={`nav-item ${currentPage === 'dashboard' ? 'active' : ''}`}
              onClick={() => onNavigate?.('dashboard')}
            >
              <span className="nav-icon">🏠</span>
              <span className="nav-text">Apiary</span>
            </button>
            <button 
              className={`nav-item ${currentPage === 'marketplace' ? 'active' : ''}`}
              onClick={() => onNavigate?.('marketplace')}
            >
              <span className="nav-icon">🛒</span>
              <span className="nav-text">Market</span>
            </button>
            <button 
              className={`nav-item ${currentPage === 'wallet' ? 'active' : ''}`}
              onClick={() => onNavigate?.('wallet')}
            >
              <span className="nav-icon">💰</span>
              <span className="nav-text">Vault</span>
            </button>
            <button
              className="nav-item nav-item-disabled"
              disabled
              aria-disabled="true"
              title="Stats coming soon"
              className={`nav-item ${currentPage === 'stats' ? 'active' : ''}`}
              onClick={() => onNavigate?.('stats')}
            >
              <span className="nav-icon">📊</span>
              <span className="nav-text">Stats (Soon)</span>
            </button>
          </nav>
        </div>
        
        <div className="header-right">
          <div className="user-profile">
            <div className="user-avatar">
              <span className="avatar-icon">🐝</span>
            </div>
            <div className="user-meta">
              <span className="username">{session.actor.toString()}</span>
              <span className="network-badge">{selectedNetwork}</span>
            </div>
          </div>
          
          <button className="logout-btn" onClick={onLogout} title="Sign Out">
            <span className="logout-icon">🚪</span>
          </button>

          <button 
            className={`mobile-menu-toggle ${mobileMenuOpen ? 'active' : ''}`}
            onClick={onMobileMenuToggle}
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default Header
