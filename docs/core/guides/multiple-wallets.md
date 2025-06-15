# Multiple Wallets

The Fedimint Web SDK supports managing multiple wallets within a single application. This is useful for scenarios like:

- Supporting multiple federations
- Separating personal and business funds
- Creating isolated wallet contexts for different users

## Creating Wallets

```ts twoslash
import { FedimintWallet } from '@fedimint/core-web'

const fedimintWallet = FedimintWallet.getInstance()

// Create wallets with auto-generated IDs
const wallet1 = await fedimintWallet.createWallet()
const wallet2 = await fedimintWallet.createWallet()

// Create wallets with custom IDs
const personalWallet = await fedimintWallet.createWallet('personal')
const businessWallet = await fedimintWallet.createWallet('business')
```

## Opening Existing Wallets

```ts twoslash
import { FedimintWallet } from '@fedimint/core-web'

const fedimintWallet = FedimintWallet.getInstance()

// Check if a wallet exists
if (fedimintWallet.hasWallet('personal')) {
  // Open an existing wallet
  const wallet = await fedimintWallet.openWallet('personal')
  console.log(`Opened wallet: ${wallet.id}`)
}
```

## Wallet Discovery

```ts twoslash
import { Fedimint Wallet } from '@fedimint/core-web'

const fedimintWallet = FedimintWallet.getInstance()

// Get all active wallet instances
const activeWallets = fedimintWallet.getAllWallets()

// Get wallet metadata (including closed wallets)
const walletPointers = fedimintWallet.getAllWalletPointers()

walletPointers.forEach(pointer => {
  console.log(`Wallet ID: ${pointer.id}`)
  console.log(`Client Name: ${pointer.clientName}`)
  console.log(`Federation: ${pointer.federationId || 'Not joined'}`)
  console.log(`Created: ${new Date(pointer.createdAt).toLocaleString()}`)
  console.log(`Last Used: ${new Date(pointer.lastAccessedAt).toLocaleString()}`)
})
```

## Federation-Based Organization

```ts twoslash
import { FedimintWallet } from '@fedimint/core-web'

const fedimintWallet = FedimintWallet.getInstance()

// Create wallets for different federations
const fedAWallet = await fedimintWallet.createWallet('fed-a-wallet')
const fedBWallet = await fedimintWallet.createWallet('fed-b-wallet')

// Join different federations
await fedAWallet.joinFederation('fed11qgqpw9thwvaz7t...') // Federation A
await fedBWallet.joinFederation('fed11qgqrgvnhwden5te0...') // Federation B

// Later, find all wallets for a specific federation
const federationAWallets =
  fedimintWallet.getWalletsByFederation('federation-a-id')
const federationBWallets =
  fedimintWallet.getWalletsByFederation('federation-b-id')
```

## Wallet Lifecycle Management

```ts twoslash
import { FedimintWallet } from '@fedimint/core-web'

const fedimintWallet = FedimintWallet.getInstance()

// Create and use a wallet
const wallet = await fedimintWallet.createWallet('temp-wallet')
await wallet.open()
await wallet.joinFederation('fed11...')

// Clean up a specific wallet when done
await wallet.cleanup()

// Clean up all wallets (usually on app shutdown)
await fedimintWallet.cleanup()

// Clear all wallet data from storage
await fedimintWallet.clearAllWallets()
```

## Error Handling

```ts twoslash
import { FedimintWallet } from '@fedimint/core-web'

const fedimintWallet = FedimintWallet.getInstance()

try {
  // This will throw if wallet already exists
  await fedimintWallet.createWallet('existing-wallet-id')
} catch (error) {
  console.error('Wallet already exists:', error.message)
}

try {
  // This will throw if wallet doesn't exist
  await fedimintWallet.openWallet('non-existent-wallet')
} catch (error) {
  console.error('Wallet not found:', error.message)
}
```

## Best Practices

1. **Use meaningful wallet IDs**: Choose descriptive IDs for easier management
2. **Check existence before creation**: Use `hasWallet()` to avoid duplicate creation errors
3. **Proper cleanup**: Always cleanup wallets when they're no longer needed
4. **Federation isolation**: Keep wallets for different federations separate
5. **Persist wallet pointers**: The system automatically persists wallet metadata in localStorage
