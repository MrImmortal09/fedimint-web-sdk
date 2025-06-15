import { FedimintWallet } from '@fedimint/core-web'

let fedimintWallet: FedimintWallet | undefined

export const initFedimintReact = (lazy: boolean = false) => {
  if (!lazy) {
    fedimintWallet = FedimintWallet.getInstance()
  }

  return {}
}
