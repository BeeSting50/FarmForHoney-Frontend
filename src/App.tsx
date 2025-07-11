import { useState, useEffect } from 'react'
import { Session, SessionKit } from '@wharfkit/session'
import { WebRenderer } from '@wharfkit/web-renderer'
import { WalletPluginCloudWallet } from '@wharfkit/wallet-plugin-cloudwallet'
import { WalletPluginAnchor } from '@wharfkit/wallet-plugin-anchor'
import { WalletPluginWombat } from '@wharfkit/wallet-plugin-wombat'
import { LoginPage, Dashboard, Marketplace, EarningsPopup, Wallet } from './components'
import './App.css'

interface ResourceBalance {
  key_id: string
  amount: string | number
  resource_name: string
}

interface StakedHive {
  hive_id: string
  staked_items: string[]
  health?: number
  availableSlots?: number
  max_slots?: number
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
    Type?: string
    Rarity?: string
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
  const [selectedNetwork, setSelectedNetwork] = useState<NetworkType>(() => {
    // Restore selected network from localStorage on app load
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('honeyfarmers-selected-network')
      if (stored && (stored === 'mainnet' || stored === 'testnet')) {
        return stored as NetworkType
      }
    }
    return 'mainnet'
  })
  const [resourceBalances, setResourceBalances] = useState<ResourceBalance[]>([])
  const [stakedHives, setStakedHives] = useState<StakedHive[]>([])
  const [beevars, setBeevars] = useState<any[]>([])
  const [hivevars, setHivevars] = useState<any[]>([])
  const [beeAssets, setBeeAssets] = useState<BeeAsset[]>([])  
  const [unstakedBees, setUnstakedBees] = useState<BeeAsset[]>([])
  const [loadingHives, setLoadingHives] = useState(false)
  const [, setLoadingBees] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isInitializing, setIsInitializing] = useState(false)
  const [showEarningsPopup, setShowEarningsPopup] = useState(false)
  const [earnings, setEarnings] = useState<ResourceBalance[]>([])
  const [currentPage, setCurrentPage] = useState('dashboard')

  const networks = {
    mainnet: {
      chain: {
        id: '1064487b3cd1a897ce03ae5b6a865651747e2e152090f99c1d19d44e01aea5a4',
        url: 'https://wax.greymass.com',
        name: 'WAX'
      },
      contractAccount: 'farmforhoney' // Replace with actual contract account
    },
    testnet: {
      chain: {
        id: 'f16b1833c747c43682f4386fca9cbb327929334a762755ebec17f6f23c9b8a12',
        url: 'https://testnet.waxsweden.org',
        name: 'WAX Testnet'
      },
      contractAccount: 'farmforhoney' // Replace with actual testnet contract account
    }
  }

  useEffect(() => {
    if (!isInitializing) {
      initializeSessionKit()
    }
  }, [selectedNetwork, isInitializing])

  useEffect(() => {
    if (session) {
      fetchResourceBalances()
      fetchStakedHives()
      fetchBeeVars().then(data => setBeevars(data || []))
      fetchHiveVars().then(data => setHivevars(data || []))
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

  // Session persistence helpers
  const SESSION_STORAGE_KEY = 'honeyfarmers-session-data'
  const NETWORK_STORAGE_KEY = 'honeyfarmers-selected-network'
  const SESSION_EXPIRY_DAYS = 7

  // Save selected network to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(NETWORK_STORAGE_KEY, selectedNetwork)
    }
  }, [selectedNetwork])

  const saveSessionData = (sessionData: any, network: string) => {
    if (typeof window !== 'undefined') {
      const expiryDate = new Date()
      expiryDate.setDate(expiryDate.getDate() + SESSION_EXPIRY_DAYS)
      
      const sessionInfo = {
        data: sessionData,
        network: network,
        expiryDate: expiryDate.toISOString(),
        createdAt: new Date().toISOString()
      }
      
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionInfo))
      console.log('Session data saved for network:', network, sessionData)
    }
  }

  const getStoredSessionData = (currentNetwork: string, allowNetworkSwitch = true) => {
    if (typeof window === 'undefined') return null
    
    try {
      const stored = localStorage.getItem(SESSION_STORAGE_KEY)
      if (!stored) {
        console.log('No stored session data found')
        return null
      }
      
      const sessionInfo = JSON.parse(stored)
      const now = new Date()
      const expiryDate = new Date(sessionInfo.expiryDate)
      
      // Check if session is expired
      if (now > expiryDate) {
        console.log('Stored session data expired')
        localStorage.removeItem(SESSION_STORAGE_KEY)
        return null
      }
      
      // Check if network matches - if not, switch to the stored network (only if allowed)
      if (sessionInfo.network !== currentNetwork) {
        if (allowNetworkSwitch) {
          console.log('Stored session network mismatch:', sessionInfo.network, 'vs', currentNetwork)
          console.log('Switching to stored session network:', sessionInfo.network)
          // Update the selected network to match the stored session
          setSelectedNetwork(sessionInfo.network as NetworkType)
        }
        return sessionInfo.data
      }
      
      console.log('Found valid stored session data for network:', currentNetwork, sessionInfo.data)
      return sessionInfo.data
    } catch (err) {
      console.warn('Failed to parse stored session data:', err)
      localStorage.removeItem(SESSION_STORAGE_KEY)
      return null
    }
  }

  const clearSessionData = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(SESSION_STORAGE_KEY)
    }
  }

  const clearNetworkSpecificStorage = (preserveSessionKit = false) => {
    if (typeof window !== 'undefined') {
      if (!preserveSessionKit) {
        // Clear all wharf-related storage when doing a full logout
        const keysToRemove = ['wharf-session', 'wharf-session-kit', 'wharfkit-session', 'wharfkit-sessionkit']
        
        keysToRemove.forEach(key => {
          localStorage.removeItem(key)
          sessionStorage.removeItem(key)
        })
        
        // Clear any keys that might contain old chain-specific data
        Object.keys(localStorage).forEach(key => {
          if (key === SESSION_STORAGE_KEY) return // Preserve our session data
          if (key.includes('wharf') || key.includes('chain')) {
            localStorage.removeItem(key)
          }
        })
        Object.keys(sessionStorage).forEach(key => {
          if (key.includes('wharf') || key.includes('chain')) {
            sessionStorage.removeItem(key)
          }
        })
      } else {
        // Only clear potentially conflicting chain-specific data, preserve SessionKit storage
        Object.keys(localStorage).forEach(key => {
          if (key === SESSION_STORAGE_KEY) return // Preserve our session data
          if (key.includes('chain') && !key.includes('wharf')) {
            localStorage.removeItem(key)
          }
        })
        Object.keys(sessionStorage).forEach(key => {
          if (key.includes('chain') && !key.includes('wharf')) {
            sessionStorage.removeItem(key)
          }
        })
      }
    }
  }

  const initializeSessionKit = async () => {
    if (isInitializing) return
    setIsInitializing(true)
    
    const network = networks[selectedNetwork]
    
    // Check for stored session data first
    const storedSession = getStoredSessionData(selectedNetwork, true)
    
    // If stored session is for a different network, clear conflicting storage first
    if (storedSession && storedSession.chainId !== network.chain.id) {
      console.log('Stored session chain ID mismatch, clearing conflicting storage')
      clearNetworkSpecificStorage(true)
      setIsInitializing(false)
      return // Exit early to let the network switch trigger a new initialization
    }
    
    const kit = new SessionKit({
      appName: 'HoneyFarmers',
      chains: [network.chain],
      ui: new WebRenderer(),
      walletPlugins: [
        new WalletPluginCloudWallet(),
        new WalletPluginAnchor(),
        new WalletPluginWombat(),
      ],
    })
    setSessionKit(kit)

    // If we have stored session data for the current network, try to restore
    if (storedSession && storedSession.chainId === network.chain.id) {
      try {
        const restored = await kit.restore()
        if (restored && restored.actor.toString() === storedSession.actor) {
          // Session restored successfully and matches our stored data
          setSession(restored)
          console.log('Session restored successfully from storage')
          return
        } else {
          console.warn('Restored session does not match stored data, clearing stored session')
          clearSessionData()
        }
      } catch (err) {
        console.warn('Failed to restore session:', err)
        // Clear stored data if restoration fails
        clearSessionData()
      }
    }
    
    // If no valid stored session or restoration failed, clear conflicting storage
    if (!storedSession || storedSession.chainId !== network.chain.id) {
      clearNetworkSpecificStorage(true)
    }
    
    // Try one more restore attempt after clearing conflicting storage
    try {
      const restored = await kit.restore()
      if (restored) {
        setSession(restored)
        // Save the restored session for future persistence
        saveSessionData({
          actor: restored.actor.toString(),
          permission: restored.permission.toString(),
          chainId: restored.chain.id.toString()
        }, selectedNetwork)
        console.log('Session restored after clearing conflicting storage')
      }
    } catch (err) {
      console.warn('Final restore attempt failed:', err)
    }
    
    setIsInitializing(false)
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

  const fetchBeeVars = async () => {
    if (!session) return null
    
    try {
      const network = networks[selectedNetwork]
      const result = await session.client.v1.chain.get_table_rows({
        code: network.contractAccount,
        scope: network.contractAccount,
        table: 'beevars',
        limit: 100
      })
      
      return result.rows || []
    } catch (err) {
      console.error('Failed to fetch beevars:', err)
    }
    return []
  }

  const fetchHiveVars = async () => {
    if (!session) return null
    
    try {
      const network = networks[selectedNetwork]
      const result = await session.client.v1.chain.get_table_rows({
        code: network.contractAccount,
        scope: network.contractAccount,
        table: 'hivevars',
        limit: 100
      })
      
      return result.rows || []
    } catch (err) {
      console.error('Failed to fetch hivevars:', err)
    }
    return []
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
        (result.rows || []).map(async (hive: any) => {
          try {
            // Map blockchain data structure to frontend interface
            // Combine worker_ids and queen_id into staked_items array
            const staked_items: string[] = []
            if (hive.worker_ids && Array.isArray(hive.worker_ids)) {
              staked_items.push(...hive.worker_ids.map((id: any) => id.toString()))
            }
            if (hive.queen_id && hive.queen_id !== 0) {
              staked_items.push(hive.queen_id.toString())
            }
            
            // Use AtomicAssets API to get properly deserialized data
            const apiUrl = `https://aa-testnet.neftyblocks.com/atomicassets/v1/assets/${hive.hive_id}`
            const response = await fetch(apiUrl)
            
            let health = 0
            let availableSlots = 0
            let max_slots = 0
            let asset_details = undefined
            
            if (response.ok) {
              const assetData = await response.json()
              if (assetData.success && assetData.data) {
                const asset = assetData.data
                const mutableData = asset.mutable_data || {}
                const immutableData = asset.template?.immutable_data || asset.immutable_data || {}
                
                // Extract health from mutable data
                health = mutableData.health || 0
                
                // Extract availableSlots from mutable data
                availableSlots = mutableData.availableSlots || 0
                
                // Extract max_slots from immutable template data
                max_slots = immutableData.max_Slots || 0
                
                asset_details = {
                  template_id: asset.template?.template_id,
                  immutable_data: immutableData,
                  mutable_data: mutableData
                }
              }
            }
            
            const mappedHive: StakedHive = {
              hive_id: hive.hive_id.toString(),
              staked_items: staked_items,
              health: health,
              availableSlots: availableSlots,
              max_slots: max_slots,
              asset_details: asset_details
            }
            
            return mappedHive
          } catch (err) {
            console.error(`Failed to fetch asset details for hive ${hive.hive_id}:`, err)
            // Return basic mapped structure even on error
            const staked_items: string[] = []
            if (hive.worker_ids && Array.isArray(hive.worker_ids)) {
              staked_items.push(...hive.worker_ids.map((id: any) => id.toString()))
            }
            if (hive.queen_id && hive.queen_id !== 0) {
              staked_items.push(hive.queen_id.toString())
            }
            return {
              hive_id: hive.hive_id.toString(),
              staked_items: staked_items,
              health: 0, // Default values since we couldn't fetch from NFT data
              availableSlots: 0,
              max_slots: 0,
              asset_details: undefined
            }
          }
        })
      )
      
      // Debug: Log the processed hives with staked_items
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
    if (!session) {
      return
    }
    
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
            const apiUrl = `https://aa-testnet.neftyblocks.com/atomicassets/v1/assets/${beeId}`
             const response = await fetch(apiUrl)
             if (response.ok) {
               const assetData = await response.json()
               if (assetData.success && assetData.data) {
                  const asset = assetData.data

                  const processedAsset = {
                    asset_id: asset.asset_id,
                    template_id: asset.template?.template_id,
                    mutable_data: asset.mutable_data || {},
                    immutable_data: asset.template?.immutable_data || asset.immutable_data || {}
                  }
                  
                  beeAssets.push(processedAsset)
                }
             }
        } catch (err) {
          // Silently handle individual asset fetch errors
        }
      }
      
      setBeeAssets(beeAssets)
    } catch (err) {
      // Silently handle errors
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
      const apiUrl = `https://aa-testnet.neftyblocks.com/atomicassets/v1/assets?owner=${session.actor}&collection_name=farmforhoney&schema_name=bees&page=1&limit=100`
      const response = await fetch(apiUrl)
      
      if (response.ok) {
        const assetData = await response.json()
        if (assetData.success && assetData.data) {
          const unstaked: BeeAsset[] = []
          
          for (const asset of assetData.data) {
            // Only include bees that are not staked
            if (!stakedBeeIds.has(asset.asset_id)) {
              const processedAsset = {
                asset_id: asset.asset_id,
                template_id: asset.template?.template_id,
                mutable_data: asset.mutable_data || {},
                immutable_data: asset.template?.immutable_data || asset.immutable_data || {}
              }
              
              unstaked.push(processedAsset)
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
      // Capture resource balances before claiming
      const balancesBefore = [...resourceBalances]
      
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
          hiveitem: parseInt(hiveId)
        }
      }
      
      await session.transact({ actions: [action] })
      
      // Refresh data after successful claim
      await fetchResourceBalances()
      await fetchStakedHives()
      
      // Calculate earnings by fetching fresh balances and comparing
      const calculateEarnings = async () => {
        try {
          // Fetch fresh balances after claim
          const network = networks[selectedNetwork]
          const result = await session.client.v1.chain.get_table_rows({
            code: network.contractAccount,
            scope: session.actor.toString(),
            table: 'resources',
            limit: 100
          })
          
          const balancesAfter = result.rows || []
          const earningsData: ResourceBalance[] = []
          
          // Create a map of before balances for easy lookup
          const beforeMap = new Map<string, number>()
          balancesBefore.forEach(balance => {
            const amount = typeof balance.amount === 'string' ? parseFloat(balance.amount) : balance.amount
            beforeMap.set(balance.key_id, amount)
          })
          
          // Calculate differences
          balancesAfter.forEach((afterBalance: any) => {
            const afterAmount = typeof afterBalance.amount === 'string' ? parseFloat(afterBalance.amount) : afterBalance.amount
            const beforeAmount = beforeMap.get(afterBalance.key_id) || 0
            const earned = afterAmount - beforeAmount
            
            if (earned > 0) {
              earningsData.push({
                key_id: afterBalance.key_id,
                amount: earned,
                resource_name: afterBalance.resource_name
              })
            }
          })
          
          return earningsData
        } catch (err) {
          console.error('Failed to calculate earnings:', err)
          return []
        }
      }
      
      // Calculate and show earnings
      const calculatedEarnings = await calculateEarnings()
      setEarnings(calculatedEarnings)
      setShowEarningsPopup(true)
      
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
      
      await session.transact({ actions: [action] })
      
      // Refresh data after successful feed
      await fetchResourceBalances()
      await fetchStakedHives()
      
    } catch (err) {
      console.error('Failed to feed bee:', err)
      setError(`Failed to feed bee: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }

  const upgradeHive = async (hiveId: string) => {
    if (!session) {
      setError('No session available')
      return
    }
    
    try {
      const network = networks[selectedNetwork]
      const action = {
        account: network.contractAccount,
        name: 'upgradehive',
        authorization: [{
          actor: session.actor,
          permission: session.permission
        }],
        data: {
          owner: session.actor,
          hive_id: parseInt(hiveId)
        }
      }
      
      await session.transact({ actions: [action] })
      
      // Refresh data after successful upgrade
      await fetchResourceBalances()
      await fetchStakedHives()
      
    } catch (err) {
      console.error('Failed to upgrade hive:', err)
      setError(`Failed to upgrade hive: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }

  const getEarningRates = async (beeType: string, beeRarity: string): Promise<number[]> => {
    if (!session) {
      return [0, 0, 0, 0]
    }
    
    try {
      const network = networks[selectedNetwork]
      
      // Check if beeType and beeRarity are valid
      if (!beeType || !beeRarity) {
        return [0, 0, 0, 0]
      }
      
      const result = await session.client.v1.chain.get_table_rows({
        code: network.contractAccount,
        scope: network.contractAccount,
        table: 'beevars',
        limit: 1000,
        json: true
      })
      
      if (result.rows.length > 0) {
        const row = result.rows.find((r: any) => 
           r.type === beeType && r.rarity === beeRarity && r.category === 'earning'
         )
        
        if (row && row.values) {
          const rates = Array.isArray(row.values) ? row.values : [row.values]
          // Convert string values to numbers
          const numericRates = rates.map((rate: any) => parseFloat(rate) || 0)
          return numericRates
        }
      }
      
      return [0, 0, 0, 0] // Default values if not found
    } catch (err) {
      return [0, 0, 0, 0]
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
        name: 'unstake',
        authorization: [{
          actor: session.actor,
          permission: session.permission
        }],
        data: {
          owner: session.actor,
          asset_id: parseInt(beeId),
          hive_id: parseInt(hiveId)
        }
      }
      
      await session.transact({ actions: [action] })
      
      // Refresh data after successful unstake
      await fetchResourceBalances()
      await fetchStakedHives()
      await fetchUnstakedBees()
      
    } catch (err) {
      console.error('Failed to unstake bee:', err)
      setError(`Failed to unstake bee: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }

  const unstakeHive = async (hiveId: string) => {
    if (!session) {
      setError('No session available')
      return
    }
    
    try {
      const network = networks[selectedNetwork]
      const action = {
        account: network.contractAccount,
        name: 'unstake',
        authorization: [{
          actor: session.actor,
          permission: session.permission
        }],
        data: {
          owner: session.actor,
          asset_id: parseInt(hiveId),
          hive_id: 0  // For hives, hive_id should be 0
        }
      }
      
      await session.transact({ actions: [action] })
      
      // Refresh data after successful unstake
      await fetchResourceBalances()
      await fetchStakedHives()
      await fetchUnstakedBees()
      
    } catch (err) {
      console.error('Failed to unstake hive:', err)
      setError(`Failed to unstake hive: ${err instanceof Error ? err.message : 'Unknown error'}`)
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
      
      await session.transact({ actions: [action] })
      
      // Refresh data after successful stake
      await fetchResourceBalances()
      await fetchStakedHives()
      await fetchUnstakedBees()
      
    } catch (err) {
      console.error('Failed to stake bee:', err)
      setError(`Failed to stake bee: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }

  const handleDeposit = async (tokenSymbol: string, amount: string) => {
    if (!session) {
      throw new Error('No session available')
    }
    
    try {
      const network = networks[selectedNetwork]
      const tokenContract = 'farminghoney' // Token contract for all game tokens
      
      // Fetch the correct precision from the token contract's stats table
      const rpc = session.client
      const statsResult = await rpc.v1.chain.get_table_rows({
        code: tokenContract,
        scope: tokenSymbol,
        table: 'stat',
        limit: 1
      })
      
      if (!statsResult.rows || statsResult.rows.length === 0) {
        throw new Error(`Token ${tokenSymbol} not found in contract stats table`)
      }
      
      // Extract precision from the supply field (e.g., "1000.0000 HUNY" -> precision is 4)
      const supply = statsResult.rows[0].supply
      const precisionMatch = supply.match(/\.(\d+)/)
      const precision = precisionMatch ? precisionMatch[1].length : 0
      
      const formattedAmount = parseFloat(amount).toFixed(precision)
      
      const action = {
        account: tokenContract,
        name: 'transfer',
        authorization: [{
          actor: session.actor,
          permission: session.permission
        }],
        data: {
          from: session.actor,
          to: network.contractAccount,
          quantity: `${formattedAmount} ${tokenSymbol}`,
          memo: 'deposit'
        }
      }
      
      await session.transact({ actions: [action] })
      
      // Refresh resource balances after successful deposit
      await fetchResourceBalances()
      
    } catch (err) {
      console.error('Failed to deposit:', err)
      throw new Error(`Failed to deposit: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }

  const handleWithdraw = async (hunyAmount: number, plnAmount: number, bwaxAmount: number, rjAmount: number) => {
    if (!session) {
      throw new Error('No session available')
    }
    
    try {
      const network = networks[selectedNetwork]
      const action = {
        account: network.contractAccount,
        name: 'withdraw',
        authorization: [{
          actor: session.actor,
          permission: session.permission
        }],
        data: {
          owner: session.actor,
          huny_amount: hunyAmount,
          pln_amount: plnAmount,
          bwax_amount: bwaxAmount,
          rj_amount: rjAmount
        }
      }
      
      await session.transact({ actions: [action] })
      
      // Refresh resource balances after successful withdrawal
      await fetchResourceBalances()
      
    } catch (err) {
      console.error('Failed to withdraw:', err)
      throw new Error(`Failed to withdraw: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }

  const handleLogin = async () => {
    if (!sessionKit) return
    
    setLoading(true)
    setError(null)
    
    try {
      const response = await sessionKit.login()
      setSession(response.session)
      
      // Save session data for persistence
      saveSessionData({
        actor: response.session.actor.toString(),
        permission: response.session.permission.toString(),
        chainId: response.session.chain.id.toString()
      }, selectedNetwork)
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  const handleNetworkChange = (network: NetworkType) => {
    console.log('Network change requested to:', network)
    
    setSelectedNetwork(network)
    
    // Clear current session data - initializeSessionKit will handle restoration
    setSession(null)
    setResourceBalances([])
    setStakedHives([])
    setBeeAssets([])
    setUnstakedBees([])
    setError(null)
  }

  const handleLogout = async () => {
    if (sessionKit && session) {
      await sessionKit.logout()
      
      // Clear our persistent session data
      clearSessionData()
      
      // Clear all session-related storage
      clearNetworkSpecificStorage(false)
      
      setSession(null)
      setResourceBalances([])
      setStakedHives([])
      setBeeAssets([])
      setUnstakedBees([])
      setError(null)
      setCurrentPage('dashboard')
    }
  }

  const handleNavigate = (page: string) => {
    setCurrentPage(page)
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

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'marketplace':
        return (
          <Marketplace
            session={session}
            selectedNetwork={selectedNetwork}
            resourceBalances={resourceBalances}
            mobileMenuOpen={mobileMenuOpen}
            onNetworkChange={handleNetworkChange}
            onMobileMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)}
            onLogout={handleLogout}
            onNavigate={handleNavigate}
          />
        )
      case 'wallet':
        return (
          <Wallet
            session={session}
            selectedNetwork={selectedNetwork}
            resourceBalances={resourceBalances}
            mobileMenuOpen={mobileMenuOpen}
            onNetworkChange={handleNetworkChange}
            onMobileMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)}
            onLogout={handleLogout}
            onNavigate={handleNavigate}
            onDeposit={handleDeposit}
            onWithdraw={handleWithdraw}
          />
        )
      case 'dashboard':
      default:
        return (
          <Dashboard
            session={session}
            selectedNetwork={selectedNetwork}
            resourceBalances={resourceBalances}
            stakedHives={stakedHives}
            beeAssets={beeAssets}
            unstakedBees={unstakedBees}
            beevars={beevars}
            hivevars={hivevars}
            loadingHives={loadingHives}
            mobileMenuOpen={mobileMenuOpen}
            onNetworkChange={handleNetworkChange}
            onMobileMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)}
            onLogout={handleLogout}
            onNavigate={handleNavigate}
            onClaimResources={claimResources}
            onFeedBee={feedBee}
            onUnstakeBee={unstakeBee}
            onUnstakeHive={unstakeHive}
            onStakeBee={stakeBee}
            onUpgradeHive={upgradeHive}
            getEarningRates={getEarningRates}
          />
        )
    }
  }

  return (
    <>
      {renderCurrentPage()}
      <EarningsPopup
        isOpen={showEarningsPopup}
        onClose={() => setShowEarningsPopup(false)}
        earnings={earnings}
      />
    </>
  )
}

export default App
