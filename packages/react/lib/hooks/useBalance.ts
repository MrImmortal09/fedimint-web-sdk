import { useEffect, useState } from 'react'
import { useWallet } from './useFedimintWallet'

export const useBalance = () => {
  const wallet = useWallet()
  const [balance, setBalance] = useState<number>()

  useEffect(() => {
    if (!wallet?.isOpen()) return

    const unsubscribe = wallet.balance.subscribeBalance((balance: number) => {
      setBalance(balance)
    })

    return () => {
      unsubscribe()
    }
  }, [wallet])

  return balance
}
