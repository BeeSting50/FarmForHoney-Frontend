/// <reference path="../../types/neftyblocks.d.ts" />
import React from 'react'
import Header from '../Header'
import { Session } from '@wharfkit/session'
import '@neftyblocks/market'
import './Marketplace.css'

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
            <neftyblocks-market 
              collection="farmforhoney"
              network={selectedNetwork}
            ></neftyblocks-market>
          </div>
        </div>
      </main>
    </div>
  )
}

export default Marketplace