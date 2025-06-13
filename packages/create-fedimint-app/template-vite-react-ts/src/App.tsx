import { act, use, useCallback, useEffect, useState } from 'react'
import { FedimintWallet, Wallet } from '@fedimint/core-web'

const TESTNET_FEDERATION_CODE =
  'fed11qgqrgvnhwden5te0v9k8q6rp9ekh2arfdeukuet595cr2ttpd3jhq6rzve6zuer9wchxvetyd938gcewvdhk6tcqqysptkuvknc7erjgf4em3zfh90kffqf9srujn6q53d6r056e4apze5cw27h75'

// Initialize global FedimintWallet
const fedimintWallet = FedimintWallet.getInstance()
// @ts-ignore - Expose for testing
globalThis.fedimintWallet = fedimintWallet

const App = () => {
  const [wallets, setWallets] = useState<Wallet[]>([])
  const [activeWallet, setActiveWallet] = useState<Wallet | undefined>(
    undefined,
  )
  const [walletData, setWalletData] = useState<any>(null)
  const [balance, setBalance] = useState(0)
  const [walletId, setWalletId] = useState('')
  const [opening, setOpening] = useState(false)
  const [error, setError] = useState('')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [invoice, setInvoice] = useState('')
  const [generating, setGenerating] = useState(false)
  const [inviteCode, setInviteCode] = useState(TESTNET_FEDERATION_CODE)
  const [joining, setJoining] = useState(false)
  const [joinSuccess, setJoinSuccess] = useState(false)

  // Wallet management functions
  const createWallet = useCallback(async () => {
    const wallet = await fedimintWallet.createWallet()
    setBalance(0)
    setWalletData(null)
    setJoinSuccess(false)
    setWalletId('')
    setError('')
    setWallets((prev) => [...prev, wallet])
    if (!activeWallet) {
      setActiveWallet(wallet)
    }
    return wallet
  }, [activeWallet])

  const openWallet = useCallback(
    async (walletId: string) => {
      try {
        const wallet = await fedimintWallet.getWallet(walletId)
        const existingWallet = wallets.find((w) => w.id === walletId)
        if (!existingWallet) {
          setWallets((prev) => [...prev, wallet])
        }
        setActiveWallet(wallet)
        setWalletId('')
        setError('')
        return wallet
      } catch (error) {
        console.error('Error opening wallet:', error)
        setError(error instanceof Error ? error.message : String(error))
        throw error
      }
    },
    [wallets],
  )

  const selectWallet = useCallback((walletId: string) => {
    const wallet = fedimintWallet.getWallet(walletId)
    if (wallet) {
      setActiveWallet(wallet)
      setJoinSuccess(wallet.federationId !== undefined ? true : false)
    }
  }, [])

  // Lightning invoice functions
  const generateInvoice = async () => {
    if (!activeWallet) return

    setInvoice('')
    setError('')
    setGenerating(true)

    try {
      if (!activeWallet.federationId) {
        throw new Error(
          'Wallet must be joined to a federation before creating invoices',
        )
      }

      if (!activeWallet.isOpen()) {
        throw new Error('Wallet is not open')
      }

      const response = await activeWallet.lightning.createInvoice(
        Number(amount),
        description,
      )
      setInvoice(response.invoice)
    } catch (e) {
      console.error('Error generating Lightning invoice', e)
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setGenerating(false)
    }
  }

  // Federation functions
  const joinFederation = async () => {
    if (!activeWallet) return

    setJoining(true)
    setJoinSuccess(false)
    setError('')

    try {
      const res = await activeWallet.joinFederation(inviteCode)
      console.log('join federation res', res)
      setJoinSuccess(true)
      console.log('Current Federation Id: ', activeWallet.federationId)
    } catch (error) {
      setError(error instanceof Error ? error.message : String(error))
      setJoinSuccess(false)
    } finally {
      setJoining(false)
    }
  }

  // Open wallet form handler
  const handleOpenWallet = async (e: React.FormEvent) => {
    e.preventDefault()
    setOpening(true)
    setError('')

    try {
      await openWallet(walletId)
    } catch (error) {
      console.error('Error opening wallet:', error)
    } finally {
      setOpening(false)
    }
  }

  useEffect(() => {
    const existingWallets = fedimintWallet.getAllWallets()
    setWallets(existingWallets)
    if (existingWallets.length > 0 && !activeWallet) {
      setActiveWallet(existingWallets[0])
    }
  }, [activeWallet])

  useEffect(() => {
    // Reset balance immediately when wallet changes
    setBalance(0)

    if (!activeWallet?.federationId) {
      return
    }

    // Fetch current balance immediately
    const fetchBalance = async () => {
      try {
        const currentBalance = await activeWallet.balance.getBalance()
        console.log('Current balance:', currentBalance)
        setBalance(currentBalance)
      } catch (error) {
        console.error('Error fetching balance:', error)
        setBalance(0)
      }
    }

    fetchBalance()

    // Subscribe to balance changes
    const unsubscribe = activeWallet.balance.subscribeBalance(
      (balance) => {
        setBalance(balance)
      },
      (error) => {
        console.error('Balance subscription error:', error)
        setBalance(0)
      },
    )

    return () => {
      unsubscribe()
    }
  }, [activeWallet, activeWallet?.federationId])

  return (
    <>
      <header>
        <h1>Multi-Wallet Fedimint Demo</h1>
      </header>
      <main>
        {/* Wallet Management Section */}
        <div className="section">
          <h3>Wallet Management</h3>
          <div className="row">
            <button onClick={createWallet}>Create New Wallet</button>
          </div>

          {/* Open Wallet Form */}
          <div className="section">
            <h3>Open Existing Wallet</h3>
            <form onSubmit={handleOpenWallet}>
              <div className="input-group">
                <label htmlFor="walletId">Wallet ID:</label>
                <input
                  id="walletId"
                  type="text"
                  placeholder="Enter wallet ID"
                  required
                  value={walletId}
                  onChange={(e) => setWalletId(e.target.value)}
                />
              </div>
              <button type="submit" disabled={opening || !walletId.trim()}>
                {opening ? 'Opening...' : 'Open Wallet'}
              </button>
            </form>
          </div>

          {/* Wallet List */}
          {wallets.length > 0 && (
            <div className="wallet-list">
              <strong>Wallets:</strong>
              {wallets.map((wallet) => (
                <div key={wallet.id} className="wallet-item">
                  <button
                    onClick={() => selectWallet(wallet.id)}
                    className={activeWallet?.id === wallet.id ? 'active' : ''}
                  >
                    {wallet.id}...
                    {wallet.federationId
                      ? ` (Fed: ${wallet.federationId}...)`
                      : ' (No Fed)'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {activeWallet && (
          <>
            {/* Wallet Status */}
            <div className="section">
              <h3>Wallet Status</h3>
              <div>
                <strong>Wallet ID:</strong> {activeWallet.id}
              </div>
              <div>
                <strong>Balance:</strong> {balance} sats
              </div>
              <div>
                <strong>Federation ID:</strong>{' '}
                {activeWallet.federationId
                  ? activeWallet.federationId
                  : 'Not joined'}
              </div>
            </div>

            {/* Join Federation */}
            {joinSuccess ? (
              <div className="section">
                <h3>Federation Status</h3>
                <div>
                  Already joined federation: {activeWallet.federationId}
                </div>
              </div>
            ) : (
              <div className="section">
                <h3>Join Federation</h3>
                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    joinFederation()
                  }}
                >
                  <input
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value)}
                    placeholder="Invite code..."
                    required
                  />
                  <button type="submit" disabled={joining}>
                    {joining ? 'Joining...' : 'Join Federation'}
                  </button>
                </form>
              </div>
            )}

            {/* Generate Lightning Invoice */}
            {!activeWallet.federationId ? (
              <div className="section">
                <h3>Generate Lightning Invoice</h3>
                <div className="error">
                  Wallet must be joined to a federation before creating
                  Lightning invoices.
                </div>
                <div>
                  mutinynet faucet:{' '}
                  <a href="https://faucet.mutinynet.com/" target="_blank">
                    https://faucet.mutinynet.com/
                  </a>
                </div>
              </div>
            ) : (
              <div className="section">
                <h3>Generate Lightning Invoice</h3>
                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    generateInvoice()
                  }}
                >
                  <div className="input-group">
                    <label htmlFor="amount">Amount (sats):</label>
                    <input
                      id="amount"
                      type="number"
                      placeholder="Enter amount"
                      required
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                    />
                  </div>
                  <div className="input-group">
                    <label htmlFor="description">Description:</label>
                    <input
                      id="description"
                      placeholder="Enter description"
                      required
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </div>
                  <button type="submit" disabled={generating}>
                    {generating ? 'Generating...' : 'Generate Invoice'}
                  </button>
                </form>

                {invoice && (
                  <div className="success">
                    <strong>Generated Invoice:</strong>
                    <pre className="invoice-wrap">{invoice}</pre>
                    <button
                      onClick={() => navigator.clipboard.writeText(invoice)}
                    >
                      Copy
                    </button>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* Error Display */}
        {error && <div className="error">{error}</div>}
      </main>
    </>
  )
}

export default App
