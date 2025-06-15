import { FedimintWallet, Wallet } from '@fedimint/core-web'
import {
  createContext,
  createElement,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'

let fedimintWallet: FedimintWallet

type FedimintWalletConfig = {
  lazy?: boolean
  debug?: boolean
}

export type WalletStatus = 'open' | 'closed' | 'opening'

export const setupFedimintWallet = (config: FedimintWalletConfig) => {
  // Use getInstance instead of new
  fedimintWallet = FedimintWallet.getInstance()
  if (config.debug) {
    fedimintWallet.setLogLevel('debug')
  }
}

export const FedimintWalletContext = createContext<
  | {
      fedimintWallet: FedimintWallet
      wallet: Wallet | undefined
      walletStatus: WalletStatus
      setWalletStatus: (status: WalletStatus) => void
      createWallet: () => Promise<Wallet>
      openWallet: (walletId: string) => Promise<Wallet>
      setActiveWallet: (wallet: Wallet | undefined) => void
    }
  | undefined
>(undefined)

export type FedimintWalletProviderProps = {}

export const FedimintWalletProvider = (
  parameters: React.PropsWithChildren<FedimintWalletProviderProps>,
) => {
  const [walletStatus, setWalletStatus] = useState<WalletStatus>('closed')
  const [activeWallet, setActiveWallet] = useState<Wallet | undefined>()
  const { children } = parameters

  if (!fedimintWallet)
    throw new Error(
      'You must call setupFedimintWallet() first. See the getting started guide.',
    )

  const createWallet = useCallback(async () => {
    const wallet = await fedimintWallet.createWallet()
    setActiveWallet(wallet)
    return wallet
  }, [])

  const openWallet = useCallback(async (walletId: string) => {
    const wallet = await fedimintWallet.openWallet(walletId)
    setActiveWallet(wallet)
    return wallet
  }, [])

  const setActiveWalletWrapper = useCallback((wallet: Wallet | undefined) => {
    setActiveWallet(wallet)
    setWalletStatus(wallet?.isOpen() ? 'open' : 'closed')
  }, [])

  useEffect(() => {
    if (activeWallet) {
      setWalletStatus(activeWallet.isOpen() ? 'open' : 'closed')
    } else {
      setWalletStatus('closed')
    }
  }, [activeWallet])

  const contextValue = useMemo(
    () => ({
      fedimintWallet,
      wallet: activeWallet,
      walletStatus,
      setWalletStatus,
      createWallet,
      openWallet,
      setActiveWallet: setActiveWalletWrapper,
    }),
    [
      walletStatus,
      activeWallet,
      createWallet,
      openWallet,
      setActiveWalletWrapper,
    ],
  )

  return createElement(
    FedimintWalletContext.Provider,
    { value: contextValue },
    children,
  )
}
