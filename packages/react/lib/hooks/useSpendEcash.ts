import { useCallback, useEffect, useState } from 'react'
import { useWallet } from './useFedimintWallet'
import { type SpendNotesState } from '@fedimint/core-web'

export const useSpendEcash = () => {
  const wallet = useWallet()

  const [operationId, setOperationId] = useState<string>()
  const [notes, setNotes] = useState<string>()

  const [state, setState] = useState<SpendNotesState | 'Error'>()
  const [error, setError] = useState<string>()

  useEffect(() => {
    if (!operationId || !wallet?.isOpen()) return

    const unsubscribe = wallet.mint.subscribeSpendNotes(
      operationId,
      (_state: SpendNotesState) => {
        setState(_state)
      },
      (error: string) => {
        setState('Error')
        setError(error)
      },
    )

    return () => {
      unsubscribe()
    }
  }, [operationId, wallet])

  const spendEcash = useCallback(
    async (amountSats: number, reclaimAfter?: number) => {
      if (!wallet?.isOpen()) throw new Error('Wallet is not open')
      const response = await wallet.mint.spendNotes(amountSats, reclaimAfter)
      setOperationId(response.operation_id)
      setNotes(response.notes)
      return response
    },
    [wallet],
  )

  return {
    spendEcash,
    operationId,
    notes,
    state,
    error,
  }
}
