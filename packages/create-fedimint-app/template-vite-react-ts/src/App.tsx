import { useCallback, useEffect, useState } from 'react'
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
  // Add preview state
  const [previewData, setPreviewData] = useState<any>(null)
  const [previewing, setPreviewing] = useState(false)

  // New state for utility functions
  const [parseInviteInput, setParseInviteInput] = useState('')
  const [parsedInviteData, setParsedInviteData] = useState<any>(null)
  const [parseBolt11Input, setParseBolt11Input] = useState('')
  const [parsedBolt11Data, setParsedBolt11Data] = useState<any>(null)
  const [parsing, setParsing] = useState(false)

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

  // Add preview federation function
  const previewFederation = async () => {
    if (!inviteCode.trim()) return

    setPreviewing(true)
    setError('')

    try {
      const data = await fedimintWallet.previewFederation(inviteCode)
      setPreviewData(data)
      console.log('Preview federation:', data)
    } catch (error) {
      console.error('Error previewing federation:', error)
      setError(error instanceof Error ? error.message : String(error))
      setPreviewData(null)
    } finally {
      setPreviewing(false)
    }
  }

  // Utility functions
  const parseInviteCode = async () => {
    if (!parseInviteInput.trim()) return

    setParsing(true)
    setError('')

    try {
      const data = await fedimintWallet.parseInviteCode(parseInviteInput)
      setParsedInviteData(data)
      console.log('Parsed invite code:', data)
    } catch (error) {
      console.error('Error parsing invite code:', error)
      setError(error instanceof Error ? error.message : String(error))
      setParsedInviteData(null)
    } finally {
      setParsing(false)
    }
  }

  const parseBolt11Invoice = async () => {
    if (!parseBolt11Input.trim()) return

    setParsing(true)
    setError('')

    try {
      const data = await fedimintWallet.parseBolt11Invoice(parseBolt11Input)
      setParsedBolt11Data(data)
      console.log('Parsed Bolt11 invoice:', data)
    } catch (error) {
      console.error('Error parsing Bolt11 invoice:', error)
      setError(error instanceof Error ? error.message : String(error))
      setParsedBolt11Data(null)
    } finally {
      setParsing(false)
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
        <h1>Fedimint Typescript Library Demo</h1>

        <div className="steps">
          <strong>Steps to get started:</strong>
          <ol>
            <li>Join a Federation (persists across sessions)</li>
            <li>Generate an Invoice</li>
            <li>
              Pay the Invoice using the{' '}
              <a href="https://faucet.mutinynet.com/" target="_blank">
                mutinynet faucet
              </a>
            </li>
            <li>
              Investigate the Browser Tools
              <ul>
                <li>Browser Console for logs</li>
                <li>Network Tab (websocket) for guardian requests</li>
                <li>Application Tab for state</li>
              </ul>
            </li>
          </ol>
        </div>
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
                <strong>Balance:</strong> {balance} Msats
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
                    onChange={(e) => {
                      setInviteCode(e.target.value)
                      setPreviewData(null) // Clear preview when invite code changes
                    }}
                    placeholder="Invite code..."
                    required
                  />
                  <div className="button-group">
                    <button
                      type="button"
                      onClick={previewFederation}
                      disabled={previewing || !inviteCode.trim()}
                    >
                      {previewing ? 'Previewing...' : 'Preview Federation'}
                    </button>
                    <button type="submit" disabled={joining}>
                      {joining ? 'Joining...' : 'Join Federation'}
                    </button>
                  </div>
                </form>

                {/* Preview Results */}
                {previewData && (
                  <div className="preview-result">
                    <h4>Federation Preview:</h4>
                    <div className="preview-info">
                      <div>
                        <strong>Federation ID:</strong>{' '}
                        {previewData.federation_id}
                      </div>
                      <div>
                        <strong>Config :</strong> {previewData.url}
                      </div>
                      {previewData.federation_name && (
                        <div>
                          <strong>Name:</strong> {previewData.federation_name}
                        </div>
                      )}
                      {/* Show other federation details if available */}
                      <details>
                        <summary>Full Details</summary>
                        <pre>{JSON.stringify(previewData, null, 2)}</pre>
                      </details>
                    </div>
                  </div>
                )}
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
                    <label htmlFor="amount">Amount (Msats):</label>
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

        {/* Parse Invite Code Section */}
        <div className="section">
          <h3>Parse Invite Code</h3>
          <div className="input-group">
            <input
              type="text"
              placeholder="Enter invite code to parse"
              value={parseInviteInput}
              onChange={(e) => setParseInviteInput(e.target.value)}
            />
            <button onClick={parseInviteCode} disabled={parsing}>
              {parsing ? 'Parsing...' : 'Parse Invite Code'}
            </button>
          </div>
          {parsedInviteData && (
            <div className="success">
              <strong>Parsed Invite Code:</strong>
              <div>
                <strong>Federation ID:</strong> {parsedInviteData.federation_id}
              </div>
              <div>
                <strong>URL:</strong> {parsedInviteData.url}
              </div>
              <details>
                <summary>Full Details</summary>
                <pre>{JSON.stringify(parsedInviteData, null, 2)}</pre>
              </details>
            </div>
          )}
        </div>

        {/* Parse Bolt11 Invoice Section */}
        <div className="section">
          <h3>Parse Bolt11 Invoice</h3>
          <div className="input-group">
            <textarea
              placeholder="Enter Bolt11 invoice to parse (e.g. lnbc1...)"
              value={parseBolt11Input}
              onChange={(e) => setParseBolt11Input(e.target.value)}
              rows={3}
            />
            <button onClick={parseBolt11Invoice} disabled={parsing}>
              {parsing ? 'Parsing...' : 'Parse Bolt11 Invoice'}
            </button>
          </div>
          {parsedBolt11Data && (
            <div className="success">
              <strong>Parsed Bolt11 Invoice:</strong>
              <details>
                <summary>Full Details</summary>
                <pre>{JSON.stringify(parsedBolt11Data, null, 2)}</pre>
              </details>
            </div>
          )}
        </div>

        {/* Error Display */}
        {error && <div className="error">{error}</div>}
      </main>
    </>
  )
}

export default App
