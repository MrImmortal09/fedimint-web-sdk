import { FedimintWallet } from '@fedimint/core-web'

// Use getInstance instead of new constructor
const fedimintWallet = FedimintWallet.getInstance()
fedimintWallet.setLogLevel('debug')

// Create a default wallet named 'fm-client'
const wallet = await fedimintWallet.createWallet()

export { wallet, fedimintWallet }
