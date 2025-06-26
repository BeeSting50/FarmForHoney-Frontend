import React from 'react'
import Header from '../Header'
import { Session } from '@wharfkit/session'
import './LoginPage.css'

type NetworkType = 'mainnet' | 'testnet'

interface ResourceBalance {
  key_id: string
  amount: string | number
  resource_name: string
}

interface LoginPageProps {
  session: Session | null
  selectedNetwork: NetworkType
  resourceBalances: ResourceBalance[]
  mobileMenuOpen: boolean
  error: string | null
  onNetworkChange: (network: NetworkType) => void
  onMobileMenuToggle: () => void
  onLogout: () => void
  onLogin: () => void
}

const LoginPage: React.FC<LoginPageProps> = ({
  session,
  selectedNetwork,
  resourceBalances,
  mobileMenuOpen,
  error,
  onNetworkChange,
  onMobileMenuToggle,
  onLogout,
  onLogin
}) => {
  return (
    <div className="App login-page">
      <Header
        session={session}
        selectedNetwork={selectedNetwork}
        resourceBalances={resourceBalances}
        mobileMenuOpen={mobileMenuOpen}
        onNetworkChange={onNetworkChange}
        onMobileMenuToggle={onMobileMenuToggle}
        onLogout={onLogout}
      />

      <main className="App-main">
        <div className="login-section">
          <h2>Connect Your Wallet</h2>
          <p>Please connect your WAX wallet to start farming!</p>
          <button className="login-btn" onClick={onLogin}>
            Connect Wallet
          </button>
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}
        </div>
      </main>

      <footer className="App-footer">
        <p>🍯 HoneyFarmers - Powered by WharfKit & WAX Blockchain</p>
      </footer>
    </div>
  )
}

export default LoginPage