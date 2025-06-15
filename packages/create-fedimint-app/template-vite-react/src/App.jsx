import { useCallback, useEffect, useState } from 'react'
import { fedimintWallet } from './wallet'

const TESTNET_FEDERATION_CODE =
  'fed11qgqrgvnhwden5te0v9k8q6rp9ekh2arfdeukuet595cr2ttpd3jhq6rzve6zuer9wchxvetyd938gcewvdhk6tcqqysptkuvknc7erjgf4em3zfh90kffqf9srujn6q53d6r056e4apze5cw27h75'

// Expose the fedimintWallet to the global window object for testing
// @ts-ignore
globalThis.fedimintWallet = fedimintWallet

const useIsOpen = () => {
  const [open, setIsOpen] = useState(false)
  const [wallet, setWallet] = useState(null)

  const checkIsOpen = useCallback(() => {
    if (wallet && open !== wallet.isOpen()) {
      setIsOpen(wallet.isOpen())
    }
  }, [open, wallet])

  useEffect(() => {
    // Create or get the first wallet
    const initWallet = async () => {
      try {
        const existingWallets = fedimintWallet.getAllWallets()
        let activeWallet

        if (existingWallets.length > 0) {
          activeWallet = existingWallets[0]
        } else {
          activeWallet = await fedimintWallet.createWallet()
        }

        setWallet(activeWallet)
        setIsOpen(activeWallet.isOpen())
      } catch (error) {
        console.error('Error initializing wallet:', error)
      }
    }

    initWallet()
  }, [])

  useEffect(() => {
    checkIsOpen()
  }, [checkIsOpen])

  return { open, checkIsOpen, wallet }
}

const useBalance = (wallet, checkIsOpen) => {
  const [balance, setBalance] = useState(0)

  useEffect(() => {
    if (!wallet?.isOpen()) return

    const unsubscribe = wallet.balance.subscribeBalance((balance) => {
      // checks if the wallet is open when the first
      // subscription event fires.
      // TODO: make a subscription to the wallet open status
      checkIsOpen()
      setBalance(balance)
    })

    return () => {
      unsubscribe()
    }
  }, [checkIsOpen, wallet])

  return balance
}

const App = () => {
  const { open, checkIsOpen, wallet } = useIsOpen()
  const balance = useBalance(wallet, checkIsOpen)

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
        <WalletStatus
          wallet={wallet}
          open={open}
          checkIsOpen={checkIsOpen}
          balance={balance}
        />
        <JoinFederation wallet={wallet} open={open} checkIsOpen={checkIsOpen} />
        <GenerateLightningInvoice wallet={wallet} />
        <RedeemEcash wallet={wallet} />
        <SendLightning wallet={wallet} />
        <InviteCodeParser />
        <ParseLightningInvoice />
      </main>
    </>
  )
}

const WalletStatus = ({ wallet, open, checkIsOpen, balance }) => {
  return (
    <div className="section">
      <h3>Wallet Status</h3>
      <div className="row">
        <strong>Wallet ID:</strong>
        <div>{wallet?.id || 'Loading...'}</div>
      </div>
      <div className="row">
        <strong>Balance:</strong>
        <div className="balance">{balance}</div>
        Msats
      </div>
      <div className="row">
        <strong>Federation ID:</strong>
        <div>{wallet?.federationId ? wallet.federationId : 'Not joined'}</div>
      </div>
    </div>
  )
}

const JoinFederation = ({ wallet, open, checkIsOpen }) => {
  const [inviteCode, setInviteCode] = useState(TESTNET_FEDERATION_CODE)
  const [previewData, setPreviewData] = useState(null)
  const [previewing, setPreviewing] = useState(false)
  const [joinResult, setJoinResult] = useState('')
  const [joinError, setJoinError] = useState('')
  const [joining, setJoining] = useState(false)

  const previewFederation = async () => {
    if (!inviteCode.trim()) return

    setPreviewing(true)
    setJoinError('')

    try {
      const data = await fedimintWallet.previewFederation(inviteCode)
      setPreviewData(data)
      console.log('Preview federation:', data)
    } catch (error) {
      console.error('Error previewing federation:', error)
      setJoinError(error.message || String(error))
      setPreviewData(null)
    } finally {
      setPreviewing(false)
    }
  }

  const joinFederation = async (e) => {
    e.preventDefault()
    if (!wallet) return

    checkIsOpen()
    setJoining(true)
    setJoinError('')
    setJoinResult('')

    try {
      await wallet.joinFederation(inviteCode)
      setJoinResult('Joined federation!')
      checkIsOpen()
    } catch (error) {
      console.error('Error joining federation:', error)
      setJoinError(error.message || String(error))
    } finally {
      setJoining(false)
    }
  }

  return (
    <div className="section">
      <h3>Join Federation</h3>
      <form onSubmit={joinFederation}>
        <div className="input-group">
          <label htmlFor="inviteCode">Federation Invite Code:</label>
          <textarea
            id="inviteCode"
            placeholder="Enter federation invite code"
            required
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value)}
            rows={3}
          />
        </div>
        <div className="button-group">
          <button
            type="button"
            onClick={previewFederation}
            disabled={previewing}
          >
            {previewing ? 'Previewing...' : 'Preview Federation'}
          </button>
          <button type="submit" disabled={joining || !wallet}>
            {joining ? 'Joining...' : 'Join Federation'}
          </button>
        </div>
      </form>

      {previewData && (
        <div className="success">
          <strong>Federation Preview:</strong>
          <div>
            <strong>Federation ID:</strong> {previewData.federation_id}
          </div>
          <div>
            <strong>URL:</strong> {previewData.url}
          </div>
          <details>
            <summary>Full Details</summary>
            <pre>{JSON.stringify(previewData, null, 2)}</pre>
          </details>
        </div>
      )}

      {joinResult && <div className="success">{joinResult}</div>}
      {joinError && <div className="error">{joinError}</div>}
    </div>
  )
}

const RedeemEcash = ({ wallet }) => {
  const [ecashInput, setEcashInput] = useState('')
  const [redeemResult, setRedeemResult] = useState('')
  const [redeemError, setRedeemError] = useState('')

  const handleRedeem = async (e) => {
    e.preventDefault()
    if (!wallet) return

    try {
      const res = await wallet.mint.redeemEcash(ecashInput)
      console.log('redeem ecash res', res)
      setRedeemResult('Redeemed!')
      setRedeemError('')
    } catch (e) {
      console.log('Error redeeming ecash', e)
      setRedeemError(e)
      setRedeemResult('')
    }
  }

  return (
    <div className="section">
      <h3>Redeem Ecash</h3>
      <form onSubmit={handleRedeem} className="row">
        <input
          className="ecash-input"
          placeholder="Long ecash string..."
          required
          value={ecashInput}
          onChange={(e) => setEcashInput(e.target.value)}
        />
        <button type="submit" disabled={!wallet}>
          Redeem
        </button>
      </form>
      {redeemResult && <div className="success">{redeemResult}</div>}
      {redeemError && <div className="error">{redeemError}</div>}
    </div>
  )
}

const SendLightning = ({ wallet }) => {
  const [lightningInput, setLightningInput] = useState('')
  const [lightningResult, setLightningResult] = useState('')
  const [lightningError, setLightningError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!wallet) return

    try {
      await wallet.lightning.payInvoice(lightningInput)
      setLightningResult('Paid!')
      setLightningError('')
    } catch (e) {
      console.log('Error paying lightning', e)
      setLightningError(e)
      setLightningResult('')
    }
  }

  return (
    <div className="section">
      <h3>Pay Lightning</h3>
      <form onSubmit={handleSubmit} className="row">
        <input
          placeholder="lnbc..."
          required
          value={lightningInput}
          onChange={(e) => setLightningInput(e.target.value)}
        />
        <button type="submit" disabled={!wallet}>
          Pay
        </button>
      </form>
      {lightningResult && <div className="success">{lightningResult}</div>}
      {lightningError && <div className="error">{lightningError}</div>}
    </div>
  )
}

const GenerateLightningInvoice = ({ wallet }) => {
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [invoice, setInvoice] = useState('')
  const [error, setError] = useState('')
  const [generating, setGenerating] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!wallet) return

    setInvoice('')
    setError('')
    setGenerating(true)
    try {
      const response = await wallet.lightning.createInvoice(
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

  return (
    <div className="section">
      <h3>Generate Lightning Invoice</h3>
      <form onSubmit={handleSubmit}>
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
        <button type="submit" disabled={generating || !wallet}>
          {generating ? 'Generating...' : 'Generate Invoice'}
        </button>
      </form>
      <div>
        mutinynet faucet:{' '}
        <a href="https://faucet.mutinynet.com/" target="_blank">
          https://faucet.mutinynet.com/
        </a>
      </div>
      {invoice && (
        <div className="success">
          <strong>Generated Invoice:</strong>
          <pre className="invoice-wrap">{invoice}</pre>
          <button onClick={() => navigator.clipboard.writeText(invoice)}>
            Copy
          </button>
        </div>
      )}
      {error && <div className="error">{error}</div>}
    </div>
  )
}

const InviteCodeParser = () => {
  const [inviteCode, setInviteCode] = useState('')
  const [parseResult, setParseResult] = useState(null)
  const [parseError, setParseError] = useState('')
  const [parsingStatus, setParsingStatus] = useState(false)

  const handleParse = async (e) => {
    e.preventDefault()
    setParseResult(null)
    setParseError('')
    setParsingStatus(true)

    try {
      const result = await fedimintWallet.parseInviteCode(inviteCode)
      setParseResult(result)
    } catch (e) {
      console.error('Error parsing invite code', e)
      setParseError(e.message || String(e))
    } finally {
      setParsingStatus(false)
    }
  }

  return (
    <div className="section">
      <h3>Parse Invite Code</h3>
      <form onSubmit={handleParse} className="row">
        <input
          placeholder="Enter invite code..."
          value={inviteCode}
          onChange={(e) => setInviteCode(e.target.value)}
          required
        />
        <button type="submit" disabled={parsingStatus}>
          {parsingStatus ? 'Parsing...' : 'Parse'}
        </button>
      </form>
      {parseResult && (
        <div className="success">
          <div className="row">
            <strong>Federation ID:</strong>
            <div className="id">{parseResult.federation_id}</div>
          </div>
          <div className="row">
            <strong>URL:</strong>
            <div className="url">{parseResult.url}</div>
          </div>
        </div>
      )}
      {parseError && <div className="error">{parseError}</div>}
    </div>
  )
}

const ParseLightningInvoice = () => {
  const [invoiceStr, setInvoiceStr] = useState('')
  const [parseResult, setParseResult] = useState(null)
  const [parseError, setParseError] = useState('')
  const [parsingStatus, setParsingStatus] = useState(false)

  const handleParse = async (e) => {
    e.preventDefault()
    setParseResult(null)
    setParseError('')
    setParsingStatus(true)

    try {
      const result = await fedimintWallet.parseBolt11Invoice(invoiceStr)
      setParseResult(result)
    } catch (e) {
      console.error('Error parsing bolt11 invoice', e)
      setParseError(e.message || String(e))
    } finally {
      setParsingStatus(false)
    }
  }

  return (
    <div className="section">
      <h3>Parse Lightning Invoice</h3>
      <form onSubmit={handleParse} className="row">
        <input
          placeholder="Enter invoice..."
          value={invoiceStr}
          onChange={(e) => setInvoiceStr(e.target.value)}
          required
        />
        <button type="submit" disabled={parsingStatus}>
          {parsingStatus ? 'Parsing...' : 'Parse'}
        </button>
      </form>
      {parseResult && (
        <div className="success">
          <div className="row">
            <strong>Amount :</strong>
            <div className="id">{parseResult.amount}</div>
            sats
          </div>
          <div className="row">
            <strong>Expiry :</strong>
            <div className="url">{parseResult.expiry}</div>
          </div>
          <div className="row">
            <strong>Memo :</strong>
            <div className="url">{parseResult.memo}</div>
          </div>
        </div>
      )}
      {parseError && <div className="error">{parseError}</div>}
    </div>
  )
}

export default App
