# Get Balance

### `balance.getBalance()`

Get the current balance of the wallet in milli-satoshis (MSats).

```ts twoslash
import { FedimintWallet } from '@fedimint/core-web'

// Get the singleton instance and create/open a wallet
const fedimintWallet = FedimintWallet.getInstance()
const wallet = await fedimintWallet.createWallet()
await wallet.joinFederation('fed11qgq...')
await wallet.open()

const mSats = await wallet.balance.getBalance()
// mSats = balance in millisatoshis
// 1000 mSats = 1 satoshi
```
