import { useCallback, useEffect, useState } from 'react'
import { useWallet } from './useFedimintWallet'
import {
  type LnPayState,
  type OutgoingLightningPayment,
} from '@fedimint/core-web'

export const useSendLightning = () => {
  const wallet = useWallet()
  const [payment, setPayment] = useState<OutgoingLightningPayment>()
  const [paymentState, setPaymentState] = useState<LnPayState>()
  const [error, setError] = useState<string>()

  const payInvoice = useCallback(
    async (bolt11: string) => {
      if (!wallet?.isOpen()) throw new Error('Wallet is not open')
      const response = await wallet.lightning.payInvoice(bolt11)
      setPayment(response)
      return response
    },
    [wallet],
  )

  useEffect(() => {
    if (!wallet?.isOpen() || !payment) return

    // Handle both lightning and internal payment types
    let operationId: string
    if ('lightning' in payment.payment_type) {
      operationId = payment.payment_type.lightning
    } else if ('internal' in payment.payment_type) {
      operationId = payment.payment_type.internal
    } else {
      console.error('Unknown payment type:', payment.payment_type)
      return
    }

    const unsubscribe = wallet.lightning.subscribeLnPay(
      operationId,
      (state: LnPayState) => {
        setPaymentState(state)
      },
      (error: string) => {
        setError(error)
      },
    )

    return () => {
      unsubscribe()
    }
  }, [wallet, payment])

  return {
    payInvoice,
    payment,
    paymentStatus: paymentState,
    paymentError: error,
  }
}
