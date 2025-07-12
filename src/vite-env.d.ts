/// <reference types="vite/client" />

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'neftyblocks-market': {
        collection: string // Required - your collection name
        limit?: number | string // Optional - number between 1 and 100, default 50
        network?: 'mainnet' | 'testnet' // Optional - default 'mainnet'
        chain?: 'wax' // Optional - default 'wax'
        redirect?: string // Optional - redirect URL after transaction
        endpoint?: string // Optional - API endpoint, default 'api.neftyblocks.me'
        custom?: string // Optional - custom config for card information
        // Standard HTML attributes
        id?: string
        className?: string
        style?: any
        [key: string]: any
      }
    }
  }
}

declare module '@neftyblocks/market' {
  // Module declaration for the npm package
}