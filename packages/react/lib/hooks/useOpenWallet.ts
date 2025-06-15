import { useCallback, useContext } from 'react'
import { FedimintWalletContext } from '../contexts/FedimintWalletContext'

export const useOpenWallet = () => {
  const value = useContext(FedimintWalletContext)

  if (!value) {
    throw new Error(
      'useOpenWallet must be used within a FedimintWalletProvider',
    )
  }

  const {
    wallet,
    walletStatus,
    setWalletStatus,
    createWallet,
    openWallet,
    setActiveWallet,
  } = value

  const openExistingWallet = useCallback(
    async (walletId: string) => {
      if (walletStatus === 'opening') return false

      setWalletStatus('opening')
      try {
        const openedWallet = await openWallet(walletId)
        setWalletStatus(openedWallet.isOpen() ? 'open' : 'closed')
        return openedWallet.isOpen()
      } catch (error) {
        setWalletStatus('closed')
        return false
      }
    },
    [openWallet, walletStatus, setWalletStatus],
  )

  const joinFederation = useCallback(
    async (invite: string) => {
      if (!wallet) return false
      if (walletStatus === 'opening') return false

      setWalletStatus('opening')

      try {
        const result = await wallet.joinFederation(invite)
        setWalletStatus(result ? 'open' : 'closed')
        return result
      } catch (error) {
        setWalletStatus('closed')
        return false
      }
    },
    [wallet, walletStatus, setWalletStatus],
  )

  const createNewWallet = useCallback(async () => {
    try {
      await createWallet()
      return true
    } catch (error) {
      return false
    }
  }, [createWallet])

  return {
    wallet,
    walletStatus,
    openWallet: openExistingWallet,
    joinFederation,
    createWallet: createNewWallet,
    setActiveWallet,
  }
}
