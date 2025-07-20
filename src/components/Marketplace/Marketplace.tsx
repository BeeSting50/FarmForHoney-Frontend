import React, { useEffect } from 'react'
import Header from '../Header'
import { Session } from '@wharfkit/session'
import './Marketplace.css'

// Declare the custom element for TypeScript
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'neftyblocks-market': {
        collection: string
        limit?: number | string
        network?: 'mainnet' | 'testnet'
        chain?: 'wax'
        redirect?: string
        endpoint?: string
        custom?: string
        id?: string
        className?: string
        style?: any
        [key: string]: any
      }
    }
  }
}

type NetworkType = 'mainnet' | 'testnet'

interface ResourceBalance {
  key_id: string
  amount: string | number
  resource_name: string
}

interface MarketplaceProps {
  session: Session
  selectedNetwork: NetworkType
  resourceBalances: ResourceBalance[]
  mobileMenuOpen: boolean
  onNetworkChange: (network: NetworkType) => void
  onMobileMenuToggle: () => void
  onLogout: () => void
  onNavigate: (page: string) => void
}

const Marketplace: React.FC<MarketplaceProps> = ({
  session,
  selectedNetwork,
  resourceBalances,
  mobileMenuOpen,
  onNetworkChange,
  onMobileMenuToggle,
  onLogout,
  onNavigate
}) => {
  // Dynamically import the NeftyBlocks market library only when needed
  useEffect(() => {
    const loadNeftyBlocks = async () => {
      try {
        await import('@neftyblocks/market')
      } catch (error) {
        console.error('Failed to load NeftyBlocks market:', error)
      }
    }
    
    loadNeftyBlocks()
  }, [])

  return (
    <div className="App marketplace-page">
      <Header
        session={session}
        selectedNetwork={selectedNetwork}
        resourceBalances={resourceBalances}
        mobileMenuOpen={mobileMenuOpen}
        onNetworkChange={onNetworkChange}
        onMobileMenuToggle={onMobileMenuToggle}
        onLogout={onLogout}
        onNavigate={onNavigate}
        currentPage="marketplace"
      />
      
      <main className="marketplace-content">
        <div className="marketplace-container">
          <h2>🛒 NFT Marketplace</h2>
          <p>Browse and trade HoneyFarmers NFTs</p>
          
          {/* NeftyBlocks Marketplace Embed */}
          <div className="neftyblocks-marketplace">
            {React.createElement('neftyblocks-market', {
              collection: 'farmforhoney',
              network: selectedNetwork
            })}
          </div>
        </div>
      </main>
    </div>
  )
}

export default Marketplace