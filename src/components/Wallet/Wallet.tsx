import React, { useCallback, useEffect, useState } from 'react'
import Header from '../Header'
import { Session } from '@wharfkit/session'
import './Wallet.css'

type NetworkType = 'mainnet' | 'testnet'

interface ResourceBalance {
  key_id: string
  amount: string | number
  resource_name: string
}

interface WalletBalance {
  symbol: string
  amount: number
  contract: string
}

interface WalletProps {
  session: Session
  selectedNetwork: NetworkType
  resourceBalances: ResourceBalance[]
  mobileMenuOpen: boolean
  onNetworkChange: (network: NetworkType) => void
  onMobileMenuToggle: () => void
  onLogout: () => void
  onNavigate: (page: string) => void
  onDeposit: (tokenSymbol: string, amount: string) => Promise<void>
  onWithdraw: (hunyAmount: number, plnAmount: number, bwaxAmount: number, rjAmount: number) => Promise<void>
}

const TOKEN_OPTIONS = [
  { symbol: 'HUNY', name: 'Honey', contract: 'farminghoney' },
  { symbol: 'PLN', name: 'Pollen', contract: 'farminghoney' },
  { symbol: 'BWAX', name: 'Beeswax', contract: 'farminghoney' },
  { symbol: 'RJ', name: 'Royal Jelly', contract: 'farminghoney' }
]

const Wallet: React.FC<WalletProps> = ({
  session,
  selectedNetwork,
  resourceBalances,
  mobileMenuOpen,
  onNetworkChange,
  onMobileMenuToggle,
  onLogout,
  onNavigate,
  onDeposit,
  onWithdraw
}) => {
  const [activeTab, setActiveTab] = useState<'swap' | 'deposit' | 'withdraw'>('swap')
  const [depositAmount, setDepositAmount] = useState('')
  const [depositToken, setDepositToken] = useState('HUNY')
  const [withdrawAmounts, setWithdrawAmounts] = useState({
    HUNY: '',
    PLN: '',
    BWAX: '',
    RJ: ''
  })
  const [walletBalances, setWalletBalances] = useState<WalletBalance[]>([])
  const [isLoadingBalances, setIsLoadingBalances] = useState(false)
  const [isDepositing, setIsDepositing] = useState(false)
  const [isWithdrawing, setIsWithdrawing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Fetch wallet balances for tokens
  const fetchWalletBalances = useCallback(async () => {
    if (!session) return
    
    setIsLoadingBalances(true)
    try {
      const results = await Promise.allSettled(
        TOKEN_OPTIONS.map((token: { symbol: string; name: string; contract: string }) =>
          session.client.v1.chain.get_currency_balance(
            token.contract,
            session.actor.toString(),
            token.symbol
          )
        )
      )

      const balances: WalletBalance[] = results.map((result, index) => {
        const token = TOKEN_OPTIONS[index]
        if (result.status === 'fulfilled') {
          const amount = result.value.length > 0 ? parseFloat(result.value[0].toString().split(' ')[0]) : 0
          return {
            symbol: token.symbol,
            amount,
            contract: token.contract
          }
        }

        console.warn(`Failed to fetch ${token.symbol} balance:`, result.reason)
        return {
          symbol: token.symbol,
          amount: 0,
          contract: token.contract
        }
      })

      setWalletBalances(balances)
    } catch (err) {
      console.error('Failed to fetch wallet balances:', err)
    } finally {
      setIsLoadingBalances(false)
    }
  }, [session])

  useEffect(() => {
    if (activeTab === 'deposit') {
      fetchWalletBalances()
    }
  }, [activeTab, fetchWalletBalances])

  const getResourceBalance = (resourceName: string): number => {
    const resource = resourceBalances.find(r => r.resource_name === resourceName)
    return resource ? parseFloat(resource.amount.toString()) : 0
  }

  const getWalletBalance = (symbol: string): number => {
    const balance = walletBalances.find(b => b.symbol === symbol)
    return balance ? balance.amount : 0
  }

  const handleDeposit = async () => {
    if (!depositAmount || parseFloat(depositAmount) <= 0) {
      setError('Please enter a valid deposit amount')
      return
    }

    setIsDepositing(true)
    setError(null)
    setSuccess(null)

    try {
      await onDeposit(depositToken, depositAmount)
      setSuccess(`Successfully deposited ${depositAmount} ${depositToken}`)
      setDepositAmount('')
    } catch (err) {
      setError(`Failed to deposit: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setIsDepositing(false)
    }
  }

  const handleWithdraw = async () => {
    const hunyAmount = parseFloat(withdrawAmounts.HUNY) || 0
    const plnAmount = parseFloat(withdrawAmounts.PLN) || 0
    const bwaxAmount = parseFloat(withdrawAmounts.BWAX) || 0
    const rjAmount = parseFloat(withdrawAmounts.RJ) || 0

    if (hunyAmount + plnAmount + bwaxAmount + rjAmount <= 0) {
      setError('Please enter at least one withdrawal amount')
      return
    }

    // Check if user has enough balance
    if (hunyAmount > getResourceBalance('HUNY') ||
        plnAmount > getResourceBalance('PLN') ||
        bwaxAmount > getResourceBalance('BWAX') ||
        rjAmount > getResourceBalance('RJ')) {
      setError('Insufficient balance for withdrawal')
      return
    }

    setIsWithdrawing(true)
    setError(null)
    setSuccess(null)

    try {
      await onWithdraw(hunyAmount, plnAmount, bwaxAmount, rjAmount)
      setSuccess('Successfully withdrew tokens')
      setWithdrawAmounts({ HUNY: '', PLN: '', BWAX: '', RJ: '' })
    } catch (err) {
      setError(`Failed to withdraw: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setIsWithdrawing(false)
    }
  }

  const handleWithdrawAmountChange = (token: string, value: string) => {
    setWithdrawAmounts(prev => ({ ...prev, [token]: value }))
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'swap': {
        const swapUrl = selectedNetwork === 'mainnet' 
          ? 'https://wax.alcor.exchange/swap-widget'
          : 'https://waxtest.alcor.exchange/swap-widget'
        
        return (
          <div className="swap-section">
            <h3><span className="section-icon">🔄</span> Token Swap</h3>
            <p className="section-description">
              Swap tokens directly within the app using Alcor Exchange.
            </p>
            <div className="swap-iframe-container">
              <iframe
                src={swapUrl}
                width="100%"
                height="600"
                frameBorder="0"
                title="Alcor Exchange Swap Widget"
                className="swap-iframe"
              />
            </div>
          </div>
        )
      }
      
      case 'deposit':
        return (
          <div className="deposit-section">
            <h3><span className="section-icon">📥</span> Deposit Tokens</h3>
            <p className="section-description">
              Deposit tokens from your wallet to the game contract for use in farming activities.
            </p>
            
            {/* Wallet Balances */}
            <div className="wallet-balances">
              <h4>Your Wallet Balances</h4>
              {isLoadingBalances ? (
                <div className="loading-balances">
                  <div className="loader"></div>
                  <span>Loading wallet balances...</span>
                </div>
              ) : (
                <div className="balance-grid">
                  {TOKEN_OPTIONS.map(token => (
                    <div key={token.symbol} className="balance-item">
                      <span className="token-name">{token.name} ({token.symbol})</span>
                      <span className="token-amount">{getWalletBalance(token.symbol).toFixed(4)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="deposit-form">
              <div className="form-group">
                <label htmlFor="deposit-token">Select Token</label>
                <select
                  id="deposit-token"
                  value={depositToken}
                  onChange={(e) => setDepositToken(e.target.value)}
                >
                  {TOKEN_OPTIONS.map(token => (
                    <option key={token.symbol} value={token.symbol}>
                      {token.name} ({token.symbol}) - Available: {getWalletBalance(token.symbol).toFixed(4)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="deposit-amount">Amount</label>
                <input
                  id="deposit-amount"
                  type="number"
                  step="0.0001"
                  min="0"
                  max={getWalletBalance(depositToken)}
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  placeholder="0.0000"
                />
              </div>
              <button
                className="deposit-btn"
                onClick={handleDeposit}
                disabled={isDepositing || !depositAmount || getWalletBalance(depositToken) === 0}
              >
                {isDepositing ? 'Processing...' : 'Deposit to Game'}
              </button>
            </div>
          </div>
        )
      
      case 'withdraw':
        return (
          <div className="withdraw-section">
            <h3><span className="section-icon">📤</span> Withdraw Tokens</h3>
            <p className="section-description">
              Withdraw tokens from the game contract back to your wallet.
            </p>
            <div className="withdraw-form">
              {TOKEN_OPTIONS.map(token => (
                <div key={token.symbol} className="form-group">
                  <label htmlFor={`withdraw-${token.symbol}`}>
                    {token.name} ({token.symbol}) - Available: {getResourceBalance(token.symbol).toFixed(4)}
                  </label>
                  <input
                    id={`withdraw-${token.symbol}`}
                    type="number"
                    step="0.0001"
                    min="0"
                    max={getResourceBalance(token.symbol)}
                    value={withdrawAmounts[token.symbol as keyof typeof withdrawAmounts]}
                    onChange={(e) => handleWithdrawAmountChange(token.symbol, e.target.value)}
                    placeholder="0.0000"
                  />
                </div>
              ))}
              <button
                className="withdraw-btn"
                onClick={handleWithdraw}
                disabled={isWithdrawing}
              >
                {isWithdrawing ? 'Processing...' : 'Withdraw to Wallet'}
              </button>
            </div>
          </div>
        )
      
      default:
        return null
    }
  }

  return (
    <div className="App wallet">
      <Header
        session={session}
        selectedNetwork={selectedNetwork}
        mobileMenuOpen={mobileMenuOpen}
        onNetworkChange={onNetworkChange}
        onMobileMenuToggle={onMobileMenuToggle}
        onLogout={onLogout}
        onNavigate={onNavigate}
        currentPage="wallet"
      />
      
      <div className="wallet-content">
        <div className="wallet-container">
          <h2>💰 Wallet Management</h2>
          
          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}
          
          {/* Current Game Balances */}
          <div className="balance-section compact">
            <h3>Current Game Balances</h3>
            <div className="balance-grid compact">
              {TOKEN_OPTIONS.map(token => (
                <div key={token.symbol} className="balance-item compact">
                  <span className="token-name">{token.name} ({token.symbol})</span>
                  <span className="token-amount">{getResourceBalance(token.symbol).toFixed(4)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Tab Navigation - Centered */}
          <div className="tab-navigation centered">
            <button
              className={`tab-btn ${activeTab === 'swap' ? 'active' : ''}`}
              onClick={() => setActiveTab('swap')}
            >
              🔄 Swap
            </button>
            <button
              className={`tab-btn ${activeTab === 'deposit' ? 'active' : ''}`}
              onClick={() => setActiveTab('deposit')}
            >
              📥 Deposit
            </button>
            <button
              className={`tab-btn ${activeTab === 'withdraw' ? 'active' : ''}`}
              onClick={() => setActiveTab('withdraw')}
            >
              📤 Withdraw
            </button>
          </div>

          {/* Tab Content */}
          <div className="tab-content">
            {renderTabContent()}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Wallet
