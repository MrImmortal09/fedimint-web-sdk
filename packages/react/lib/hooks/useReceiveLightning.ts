import { useCallback, useEffect, useState } from 'react'
import { useWallet } from './useFedimintWallet'
import { LnReceiveState, type CreateBolt11Response } from '@fedimint/core-web'

export const useReceiveLightning = () => {
  const wallet = useWallet()
  const [invoice, setInvoice] = useState<CreateBolt11Response>()
  const [invoiceReceiveState, setInvoiceReceiveState] =
    useState<LnReceiveState>()
  const [error, setError] = useState<string>()

  const generateInvoice = useCallback(
    async (amount: number, description: string) => {
      if (!wallet?.isOpen()) throw new Error('Wallet is not open')
      const response = await wallet.lightning.createInvoice(amount, description)
      setInvoice(response)
      return response.invoice
    },
    [wallet],
  )

  useEffect(() => {
    if (!wallet?.isOpen() || !invoice) return

    const unsubscribe = wallet.lightning.subscribeLnReceive(
      invoice.operation_id,
      (state: LnReceiveState) => {
        setInvoiceReceiveState(state)
      },
      (error: string) => {
        setError(error)
      },
    )

    return () => {
      unsubscribe()
    }
  }, [wallet, invoice])

  return {
    generateInvoice,
    bolt11: invoice?.invoice,
    invoiceStatus: invoiceReceiveState,
    error,
  }
}
