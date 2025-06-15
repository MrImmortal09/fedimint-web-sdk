# Subscribe Balance

### `balance.subscribeBalance()` <Badge type="info" text="Streaming" />

Subscribe to balance updates as they occur.

```ts twoslash
import { FedimintWallet } from '@fedimint/core-web'

const fedimintWallet = FedimintWallet.getInstance()
const wallet = await fedimintWallet.createWallet()
await wallet.joinFederation('fed11qgq...')
await wallet.open()

const unsubscribe = wallet.balance.subscribeBalance((mSats) => {
  console.log('Balance updated:', mSats)
  // mSats = 1 satoshi
})

// Cleanup Later
unsubscribe()
```
