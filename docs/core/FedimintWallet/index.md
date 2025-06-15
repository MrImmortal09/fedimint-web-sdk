# FedimintWallet Overview

The `FedimintWallet` class serves as the main entry point and wallet manager for the library. It uses a singleton pattern to provide centralized wallet management capabilities.

::: info
The `FedimintWallet` class now manages multiple wallet instances. Use `FedimintWallet.getInstance()` to get the singleton instance, then create and manage individual wallets through its methods.
:::

::: info
Check out the [Getting Started](../getting-started) guide to get started using the Fedimint Web SDK.
:::

<img src="/architecture-diagram.svg" alt="Architecture" />

## Static Methods

### getInstance()

> **getInstance**(`createTransport?`): [`FedimintWallet`](index.md)

Gets or creates the singleton FedimintWallet instance.

#### Parameters

• **createTransport**: `TransportFactory` = `createWebWorkerTransport`

#### Returns

[`FedimintWallet`](index.md)

---

## Instance Methods

### createWallet()

> **createWallet**(`walletId?`): `Promise`\<[`Wallet`](../Wallet/index.md)\>

Creates a new wallet instance.

#### Parameters

• **walletId**: `string` = `undefined`

Optional ID for the new wallet. If not provided, a new ID will be generated.

#### Returns

`Promise`\<[`Wallet`](../Wallet/index.md)\>

#### Throws

`Error` if a wallet with the specified ID already exists.

---

### openWallet()

> **openWallet**(`walletId`): `Promise`\<[`Wallet`](../Wallet/index.md)\>

Opens an existing wallet by its ID.

#### Parameters

• **walletId**: `string`

The ID of the wallet to open.

#### Returns

`Promise`\<[`Wallet`](../Wallet/index.md)\>

#### Throws

`Error` if the wallet with the specified ID does not exist.

---

### getWallet()

> **getWallet**(`walletId`): [`Wallet`](../Wallet/index.md) \| `undefined`

Retrieves a wallet by its ID from the WalletRegistry.

#### Parameters

• **walletId**: `string`

#### Returns

[`Wallet`](../Wallet/index.md) \| `undefined`

---

### getAllWallets()

> **getAllWallets**(): [`Wallet`](../Wallet/index.md)[]

Retrieves all active wallet instances.

#### Returns

[`Wallet`](../Wallet/index.md)[]

---

### getAllWalletPointers()

> **getAllWalletPointers**(): `WalletPointer`[]

Retrieves all wallet pointers (metadata) from storage.

#### Returns

`WalletPointer`[]

Array of objects containing wallet metadata including ID, federation info, and timestamps.

---

### getWalletsByFederation()

> **getWalletsByFederation**(`federationId`): [`Wallet`](../Wallet/index.md)[]

Retrieves all wallets associated with a specific federation.

#### Parameters

• **federationId**: `string`

#### Returns

[`Wallet`](../Wallet/index.md)[]

---

### hasWallet()

> **hasWallet**(`walletId`): `boolean`

Checks if a wallet with the given ID exists.

#### Parameters

• **walletId**: `string`

#### Returns

`boolean`

---

### clearAllWallets()

> **clearAllWallets**(): `Promise`\<`void`\>

Clears all wallets from storage and registry.

#### Returns

`Promise`\<`void`\>

---

### cleanup()

> **cleanup**(): `Promise`\<`void`\>

Cleans up the FedimintWallet instance and all associated resources.

#### Returns

`Promise`\<`void`\>

---

### initialize()

> **initialize**(): `Promise`\<`void`\>

Initializes the global RpcClient if not already initialized.

#### Returns

`Promise`\<`void`\>

---

### isInitialized()

> **isInitialized**(): `boolean`

Checks if the FedimintWallet instance has been initialized.

#### Returns

`boolean`

---

### setLogLevel()

> **setLogLevel**(`level`): `void`

Sets the global log level for the library.

#### Parameters

• **level**: `"debug"` \| `"info"` \| `"warn"` \| `"error"` \| `"none"`

#### Returns

`void`

---

### parseInviteCode()

> **parseInviteCode**(`inviteCode`): `Promise`\<`ParsedInviteCode`\>

Parses a federation invite code and retrieves its details.

#### Parameters

• **inviteCode**: `string`

#### Returns

`Promise`\<`ParsedInviteCode`\>

---

### previewFederation()

> **previewFederation**(`inviteCode`): `Promise`\<`PreviewFederation`\>

Previews a federation using the provided invite code.

#### Parameters

• **inviteCode**: `string`

#### Returns

`Promise`\<`PreviewFederation`\>

---

### parseBolt11Invoice()

> **parseBolt11Invoice**(`invoice`): `Promise`\<`ParsedBolt11Invoice`\>

Parses a BOLT11 Lightning invoice and retrieves its details.

#### Parameters

• **invoice**: `string`

#### Returns

`Promise`\<`ParsedBolt11Invoice`\>
