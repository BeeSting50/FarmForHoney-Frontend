import { useState, useEffect } from 'react'
import { Session, SessionKit } from '@wharfkit/session'
import { WebRenderer } from '@wharfkit/web-renderer'
import { WalletPluginCloudWallet } from '@wharfkit/wallet-plugin-cloudwallet'
import { WalletPluginAnchor } from '@wharfkit/wallet-plugin-anchor'
import { WalletPluginWombat } from '@wharfkit/wallet-plugin-wombat'
import { LoginPage, Dashboard } from './components'
import './App.css'

interface ResourceBalance {
  key_id: string
  amount: string | number
  resource_name: string
}

interface StakedHive {
  asset_id: string
  staked_items: string[]
  asset_details?: {
    template_id: number
    immutable_data: {
      name?: string
      img?: string
      [key: string]: any
    }
    mutable_data: {
      [key: string]: any
    }
  }
}

interface BeeAsset {
  asset_id: string
  template_id: number
  mutable_data: {
    lastClaim?: number
    Hunger?: number
  }
  immutable_data: {
    name?: string
    type?: string
    rarity?: string
    farmResource?: string
    img?: string
  }
}

type NetworkType = 'mainnet' | 'testnet'

function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [sessionKit, setSessionKit] = useState<SessionKit | null>(null)
  const [, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedNetwork, setSelectedNetwork] = useState<NetworkType>('mainnet')
  const [resourceBalances, setResourceBalances] = useState<ResourceBalance[]>([])
  const [stakedHives, setStakedHives] = useState<StakedHive[]>([])
  const [beeAssets, setBeeAssets] = useState<BeeAsset[]>([])  
  const [unstakedBees, setUnstakedBees] = useState<BeeAsset[]>([])
  const [loadingHives, setLoadingHives] = useState(false)
  const [, setLoadingBees] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const networks = {
    mainnet: {
      id: '1064487b3cd1a897ce03ae5b6a865651747e2e152090f99c1d19d44e01aea5a4',
      url: 'https://wax.greymass.com',
      contractAccount: 'farmforhoney' // Replace with actual contract account
    },
    testnet: {
      id: 'f16b1833c747c43682f4386fca9cbb327929334a762755ebec17f6f23c9b8a12',
      url: 'https://testnet.waxsweden.org',
      contractAccount: 'farmforhoney' // Replace with actual testnet contract account
    }
  }

  useEffect(() => {
    initializeSessionKit()
  }, [selectedNetwork])

  useEffect(() => {
    if (session) {
      fetchResourceBalances()
      fetchStakedHives()
    }
  }, [session])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (mobileMenuOpen && !target.closest('.dashboard-header')) {
        setMobileMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [mobileMenuOpen])

  const initializeSessionKit = () => {
    const network = networks[selectedNetwork]
    const kit = new SessionKit({
      appName: 'HoneyFarmers',
      chains: [
        {
          id: network.id,
          url: network.url,
          name: selectedNetwork === 'mainnet' ? 'WAX' : 'WAX Testnet'
        },
      ],
      ui: new WebRenderer(),
      walletPlugins: [
        new WalletPluginCloudWallet(),
        new WalletPluginAnchor(),
        new WalletPluginWombat(),
      ],
    })
    setSessionKit(kit)

    // Check for existing session with error handling
    kit.restore().then((restored) => {
      if (restored) {
        setSession(restored)
      }
    }).catch((err) => {
      console.warn('Failed to restore session:', err)
      // Don't set error state for restore failures as it's not critical
    })
  }

  const fetchResourceBalances = async () => {
    if (!session) return
    
    setError(null)
    
    try {
      const network = networks[selectedNetwork]
      const result = await session.client.v1.chain.get_table_rows({
        code: network.contractAccount,
        scope: session.actor.toString(),
        table: 'resources',
        limit: 100
      })
      
      setResourceBalances(result.rows || [])
    } catch (err) {
      console.error('Failed to fetch resource balances:', err)
      setError(`Failed to load resource balances: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }

  const fetchStakedHives = async () => {
    if (!session) return
    
    setLoadingHives(true)
    try {
      const network = networks[selectedNetwork]
      const result = await session.client.v1.chain.get_table_rows({
        code: network.contractAccount,
        scope: session.actor.toString(),
        table: 'staked',
        limit: 100
      })
      
      // Fetch hive asset details from AtomicAssets API
      const hivesWithDetails = await Promise.all(
        (result.rows || []).map(async (hive: StakedHive) => {
          try {
            // Use AtomicAssets API to get properly deserialized data
              const apiUrl = `https://test.wax.api.atomicassets.io/atomicassets/v1/assets/${hive.asset_id}`
               const response = await fetch(apiUrl)
               if (response.ok) {
                 const assetData = await response.json()
                 if (assetData.success && assetData.data) {
                    const asset = assetData.data

                    return {
                      ...hive,
                      asset_details: {
                        template_id: asset.template?.template_id,
                        immutable_data: asset.template?.immutable_data || asset.immutable_data || {},
                        mutable_data: asset.mutable_data || {}
                      }
                    }
                  }
               }
            return hive
          } catch (err) {
            console.error(`Failed to fetch asset details for hive ${hive.asset_id}:`, err)
            return hive
          }
        })
      )
      
      setStakedHives(hivesWithDetails)
      
      // Fetch bee assets for each staked hive
      if (hivesWithDetails.length > 0) {
        await fetchBeeAssets(hivesWithDetails)
      }
      
      // Fetch unstaked bees from user's wallet
      await fetchUnstakedBees()
    } catch (err) {
      console.error('Failed to fetch staked hives:', err)
      setError(`Failed to load staked hives: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setLoadingHives(false)
    }
  }

  const fetchBeeAssets = async (hives: StakedHive[]) => {
    if (!session) return
    
    setLoadingBees(true)
    try {
      const allBeeIds: string[] = []
      
      // Collect all bee IDs from all hives
      hives.forEach(hive => {
        allBeeIds.push(...hive.staked_items)
      })
      
      // Fetch asset details from AtomicAssets API
      const beeAssets: BeeAsset[] = []
      for (const beeId of allBeeIds) {
        try {
          // Use AtomicAssets API to get properly deserialized data
            const apiUrl = `https://test.wax.api.atomicassets.io/atomicassets/v1/assets/${beeId}`
             const response = await fetch(apiUrl)
             if (response.ok) {
               const assetData = await response.json()
               if (assetData.success && assetData.data) {
                  const asset = assetData.data

                  beeAssets.push({
                    asset_id: asset.asset_id,
                    template_id: asset.template?.template_id,
                    mutable_data: asset.mutable_data || {},
                    immutable_data: asset.template?.immutable_data || asset.immutable_data || {}
                  })
                }
             }
        } catch (err) {
          console.warn(`Failed to fetch bee asset ${beeId}:`, err)
        }
      }
      
      setBeeAssets(beeAssets)
    } catch (err) {
      console.error('Failed to fetch bee assets:', err)
    } finally {
      setLoadingBees(false)
    }
  }

  const fetchUnstakedBees = async () => {
    if (!session) return
    
    try {
      // Get all staked bee IDs to filter them out
      const stakedBeeIds = new Set<string>()
      stakedHives.forEach(hive => {
        hive.staked_items.forEach(beeId => stakedBeeIds.add(beeId))
      })
      
      // Fetch user's assets from AtomicAssets API
      const apiUrl = `https://test.wax.api.atomicassets.io/atomicassets/v1/assets?owner=${session.actor}&collection_name=farmforhoney&schema_name=bees&page=1&limit=100`
      const response = await fetch(apiUrl)
      
      if (response.ok) {
        const assetData = await response.json()
        if (assetData.success && assetData.data) {
          const unstaked: BeeAsset[] = []
          
          for (const asset of assetData.data) {
            // Only include bees that are not staked
            if (!stakedBeeIds.has(asset.asset_id)) {
              unstaked.push({
                asset_id: asset.asset_id,
                template_id: asset.template?.template_id,
                mutable_data: asset.mutable_data || {},
                immutable_data: asset.template?.immutable_data || asset.immutable_data || {}
              })
            }
          }
          
          setUnstakedBees(unstaked)
        }
      }
    } catch (err) {
      console.error('Failed to fetch unstaked bees:', err)
    }
  }

  const claimResources = async (hiveId: string) => {
    if (!session) {
      setError('No session available')
      return
    }
    
    try {
      const network = networks[selectedNetwork]
      const action = {
        account: network.contractAccount,
        name: 'claim',
        authorization: [{
          actor: session.actor,
          permission: session.permission
        }],
        data: {
          owner: session.actor,
          hive: parseInt(hiveId)
        }
      }
      
      const result = await session.transact({ actions: [action] })
      console.log('Claim successful:', result)
      
      // Refresh data after successful claim
      await fetchResourceBalances()
      await fetchStakedHives()
      
    } catch (err) {
      console.error('Failed to claim resources:', err)
      setError(`Failed to claim resources: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }
  
  // Note: feedBee action implementation
  const feedBee = async (beeId: string) => {
    if (!session) {
      setError('No session available')
      return
    }
    
    try {
      const network = networks[selectedNetwork]
      const action = {
        account: network.contractAccount,
        name: 'feedbee',
        authorization: [{
          actor: session.actor,
          permission: session.permission
        }],
        data: {
          owner: session.actor,
          bee_id: parseInt(beeId)
        }
      }
      
      const result = await session.transact({ actions: [action] })
      console.log('Feed successful:', result)
      
      // Refresh data after successful feed
      await fetchResourceBalances()
      await fetchStakedHives()
      
    } catch (err) {
      console.error('Failed to feed bee:', err)
      setError(`Failed to feed bee: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }
  
  const unstakeBee = async (hiveId: string, beeId: string) => {
    if (!session) {
      setError('No session available')
      return
    }
    
    try {
      const network = networks[selectedNetwork]
      const action = {
        account: network.contractAccount,
        name: 'unstakebee',
        authorization: [{
          actor: session.actor,
          permission: session.permission
        }],
        data: {
          owner: session.actor,
          hive_id: parseInt(hiveId),
          bee_id: parseInt(beeId)
        }
      }
      
      const result = await session.transact({ actions: [action] })
      console.log('Unstake successful:', result)
      
      // Refresh data after successful unstake
      await fetchResourceBalances()
      await fetchStakedHives()
      
    } catch (err) {
      console.error('Failed to unstake bee:', err)
      setError(`Failed to unstake bee: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }

  const stakeBee = async (hiveId: string, beeId: string) => {
    if (!session) {
      setError('No session available')
      return
    }
    
    try {
      const network = networks[selectedNetwork]
      const action = {
        account: 'atomicassets',
        name: 'transfer',
        authorization: [{
          actor: session.actor,
          permission: session.permission
        }],
        data: {
          from: session.actor,
          to: network.contractAccount,
          asset_ids: [beeId],
          memo: `stakebees:${hiveId}`
        }
      }
      
      const result = await session.transact({ actions: [action] })
      console.log('Stake successful:', result)
      
      // Refresh data after successful stake
      await fetchResourceBalances()
      await fetchStakedHives()
      await fetchUnstakedBees()
      
    } catch (err) {
      console.error('Failed to stake bee:', err)
      setError(`Failed to stake bee: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }

  const handleLogin = async () => {
    if (!sessionKit) return
    
    setLoading(true)
    setError(null)
    
    try {
      const response = await sessionKit.login()
      setSession(response.session)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  const handleNetworkChange = (network: NetworkType) => {
    setSelectedNetwork(network)
    setSession(null)
    setResourceBalances([])
    setStakedHives([])
    setBeeAssets([])
    setUnstakedBees([])
  }

  const handleLogout = async () => {
    if (sessionKit && session) {
      await sessionKit.logout()
      setSession(null)
      setResourceBalances([])
      setStakedHives([])
      setBeeAssets([])
      setUnstakedBees([])
      setError(null)
    }
  }

  if (!session) {
    return (
      <LoginPage
        session={session}
        selectedNetwork={selectedNetwork}
        resourceBalances={resourceBalances}
        mobileMenuOpen={mobileMenuOpen}
        error={error}
        onNetworkChange={handleNetworkChange}
        onMobileMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)}
        onLogout={handleLogout}
        onLogin={handleLogin}
      />
    )
  }

  return (
    <Dashboard
      session={session}
      selectedNetwork={selectedNetwork}
      resourceBalances={resourceBalances}
      stakedHives={stakedHives}
      beeAssets={beeAssets}
      unstakedBees={unstakedBees}
      loadingHives={loadingHives}
      mobileMenuOpen={mobileMenuOpen}
      onNetworkChange={handleNetworkChange}
      onMobileMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)}
      onLogout={handleLogout}
      onClaimResources={claimResources}
      onFeedBee={feedBee}
      onUnstakeBee={unstakeBee}
      onStakeBee={stakeBee}
    />
  )
}

export default App
