import { useCallback, useEffect, useState } from 'react'
import { useWallet } from './useFedimintWallet'
import { ReissueExternalNotesState } from '@fedimint/core-web'

export const useReceiveEcash = () => {
  const wallet = useWallet()

  const [operationId, setOperationId] = useState<string>()
  const [state, setState] = useState<ReissueExternalNotesState | 'Error'>()
  const [error, setError] = useState<string>()

  useEffect(() => {
    if (!operationId || !wallet?.isOpen()) return

    const unsubscribe = wallet.mint.subscribeReissueExternalNotes(
      operationId,
      (_state: ReissueExternalNotesState) => {
        setState(_state)
      },
      (error: string) => {
        setError(error)
      },
    )

    return () => {
      unsubscribe()
    }
  }, [operationId, wallet])

  const redeemEcash = useCallback(
    async (notes: string) => {
      if (!wallet?.isOpen()) throw new Error('Wallet is not open')
      try {
        const operationId = await wallet.mint.reissueExternalNotes(notes)
        setOperationId(operationId)
        return operationId
      } catch (error) {
        setState('Error')
        setError(error instanceof Error ? error.message : String(error))
        throw error
      }
    },
    [wallet],
  )

  return {
    redeemEcash,
    operationId,
    state,
    error,
  }
}
