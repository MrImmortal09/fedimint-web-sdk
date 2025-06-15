import { RpcClient, TransportFactory } from './rpc'
import { createWebWorkerTransport } from './worker/WorkerTransport'
import { logger, type LogLevel } from './utils/logger'
import { Wallet } from './Wallet'
import { WalletRegistry } from './WalletRegistry'
import type {
  ParsedInviteCode,
  PreviewFederation,
  ParsedBolt11Invoice,
} from './types'

logger.setLevel('debug')

export { Wallet }
export class FedimintWallet {
  // Manager
  private static instance: FedimintWallet
  private _client: RpcClient
  private _initialized: boolean = false
  private _initPromise?: Promise<void>

  constructor(createTransport: TransportFactory = createWebWorkerTransport) {
    this._client = new RpcClient(createTransport)
    logger.info('FedimintWallet global instance created')
  }

  static getInstance(createTransport?: TransportFactory): FedimintWallet {
    if (!FedimintWallet.instance) {
      FedimintWallet.instance = new FedimintWallet(createTransport)
    }
    return FedimintWallet.instance
  }

  /**
   * Initializes the global RpcClient.
   *
   * This method ensures that the RpcClient is initialized only once,
   * and subsequent calls will return the same promise.
   *
   * @returns {Promise<void>} A promise that resolves when the RpcClient is initialized.
   */
  async initialize(): Promise<void> {
    if (this._initialized) {
      return
    }

    if (this._initPromise) {
      return this._initPromise
    }

    this._initPromise = this._initializeInner()
    return this._initPromise
  }

  private async _initializeInner(): Promise<void> {
    logger.info('Initializing global RpcClient')
    await this._client.initialize()
    this._initialized = true
    logger.info('Global RpcClient initialized')
  }

  /**
   * Creates a new wallet instance.
   *
   * @param {string} [walletId] - Optional ID for the new wallet. If not provided, a new ID will be generated.
   * @returns {Promise<Wallet>} A promise that resolves to the newly created Wallet instance.
   * @throws {Error} If a wallet with the specified ID already exists.
   */
  async createWallet(walletId?: string): Promise<Wallet> {
    await this.initialize()

    // check if walletId already exists in registry
    if (walletId && WalletRegistry.getInstance().hasWallet(walletId)) {
      throw new Error(`Wallet with ID ${walletId} already exists`)
    }
    const wallet = new Wallet(this._client, walletId)
    logger.info(`Created new wallet with ID: ${wallet.id}`)
    return wallet
  }

  /**
   * Opens an existing wallet by its ID.
   *
   * @param {string} walletId - The ID of the wallet to open.
   * @returns {Promise<Wallet>} A promise that resolves to the opened Wallet instance.
   * @throws {Error} If the wallet with the specified ID does not exist.
   */
  async openWallet(walletId: string): Promise<Wallet> {
    await this.initialize()
    logger.info(`called initialize for openWallet`)

    // Check if wallet exists in storage
    const pointer = WalletRegistry.getInstance().getWalletPointer(walletId)
    if (!pointer) {
      throw new Error(`Wallet ${walletId} not found`)
    }

    let wallet = new Wallet(this._client, walletId, pointer.federationId)
    await wallet.open()
    return wallet
  }

  /**
   * Retrieves a wallet by its ID from the WalletRegistry.
   *
   * @param {string} walletId - The ID of the wallet to retrieve.
   * @returns {Wallet | undefined} The Wallet instance if found, otherwise undefined.
   */
  getWallet(walletId: string): Wallet | undefined {
    return WalletRegistry.getInstance().getWallet(walletId)
  }

  /**
   * Retrieves all wallet pointers from the WalletRegistry.
   *
   * @returns {Array<{ id: string, clientName: string, federationId?: string, createdAt: number, lastAccessedAt: number }>}
   *          An array of objects representing wallet pointers.
   */
  getAllWalletPointers(): Array<{
    id: string
    clientName: string
    federationId?: string
    createdAt: number
    lastAccessedAt: number
  }> {
    return WalletRegistry.getInstance().getAllWalletPointers()
  }

  /**
   * Checks if a wallet with the given ID exists in the WalletRegistry.
   *
   * @param {string} walletId - The ID of the wallet to check.
   * @returns {boolean} True if the wallet exists, false otherwise.
   */
  hasWallet(walletId: string): boolean {
    return WalletRegistry.getInstance().hasWallet(walletId)
  }

  /**
   * Retrieves all wallets from the WalletRegistry.
   *
   * @returns {Wallet[]} An array of all Wallet instances.
   */
  getAllWallets(): Wallet[] {
    return WalletRegistry.getInstance().getAllWallets()
  }

  /**
   * Retrieves all wallets associated with a specific federation.
   *
   * @param {string} federationId - The ID of the federation to filter wallets by.
   * @returns {Wallet[]} An array of Wallet instances that belong to the specified federation.
   */
  getWalletsByFederation(federationId: string): Wallet[] {
    return WalletRegistry.getInstance().getWalletsByFederation(federationId)
  }

  /**
   * Cleans up the FedimintWallet instance.
   *
   * This method performs a cleanup of the global RpcClient and WalletRegistry,
   * resetting the initialized state and clearing any pending initialization promises.
   */
  async cleanup(): Promise<void> {
    await WalletRegistry.getInstance().cleanup()
    await this._client.cleanup()
    this._initialized = false
    this._initPromise = undefined
    logger.info('FedimintWallet global cleanup completed')
  }

  /**
   * Clears all wallets from the WalletRegistry.
   *
   * This method removes all wallet entries from the registry, effectively resetting it.
   */
  async clearAllWallets(): Promise<void> {
    await WalletRegistry.getInstance().clearAllWallets()
  }

  /**
   * Sets the global log level for the FedimintWallet instance.
   *
   * @param {LogLevel} level - The log level to set. Valid values are 'debug', 'info', 'warn', 'error'.
   */
  setLogLevel(level: LogLevel): void {
    logger.setLevel(level)
    logger.info(`Global log level set to ${level}`)
  }

  /**
   * Checks if the FedimintWallet instance has been initialized.
   *
   * @returns {boolean} True if the instance is initialized, false otherwise.
   */
  isInitialized(): boolean {
    return this._initialized
  }

  /**
   * Parses a federation invite code and retrieves its details.
   *
   * This method sends the provided invite code to the WorkerClient for parsing.
   * The response includes the federation_id and url.
   *
   * @param {string} inviteCode - The invite code to be parsed.
   * @returns {Promise<{ federation_id: string, url: string}>}
   *          A promise that resolves to an object containing:
   *          - `federation_id`: The id of the feder.
   *          - `url`: One of the apipoints to connect to the federation
   *
   * @throws {Error} If the WorkerClient encounters an issue during the parsing process.
   *
   * @example
   * const inviteCode = "example-invite-code";
   * const parsedCode = await wallet.parseInviteCode(inviteCode);
   * console.log(parsedCode.federation_id, parsedCode.url);
   */
  async parseInviteCode(inviteCode: string): Promise<ParsedInviteCode> {
    const data = await this._client.parseInviteCode(inviteCode)
    logger.info(`Parsed invite code: ${inviteCode}`, data)
    return data
  }

  /**
   * Previews a federation using the provided invite code.
   *
   * This method sends the invite code to the WorkerClient to retrieve
   * a preview of the federation details.
   *
   * @param {string} inviteCode - The invite code for the federation.
   * @returns {Promise<PreviewFederation>} A promise that resolves to an object containing:
   *          - `federation_id`: The ID of the federation.
   *          - `name`: The name of the federation.
   *          - `description`: A description of the federation.
   *          - `url`: The URL to connect to the federation.
   *
   * @throws {Error} If the WorkerClient encounters an issue during the preview process.
   *
   * @example
   * const inviteCode = "example-invite-code";
   * const preview = await wallet.previewFederation(inviteCode);
   * console.log(preview.federation_id, preview.config);
   */
  async previewFederation(inviteCode: string): Promise<PreviewFederation> {
    const data = await this._client.previewFederation(inviteCode)
    logger.info(`Previewed federation for invite code: ${inviteCode}`, data)
    return data
  }

  /**
   * Parses a BOLT11 Lightning invoice and retrieves its details.
   *
   * This method sends the provided invoice string to the WorkerClient for parsing.
   * The response includes details such as the amount, expiry, and memo.
   *
   * @param {string} invoiceStr - The BOLT11 invoice string to be parsed.
   * @returns {Promise<{ amount: string, expiry: number, memo: string }>}
   *          A promise that resolves to an object containing:
   *          - `amount`: The amount specified in the invoice.
   *          - `expiry`: The expiry time of the invoice in seconds.
   *          - `memo`: A description or memo attached to the invoice.
   *
   * @throws {Error} If the WorkerClient encounters an issue during the parsing process.
   *
   * @example
   * const invoiceStr = "lnbc1...";
   * const parsedInvoice = await wallet.parseBolt11Invoice(invoiceStr);
   * console.log(parsedInvoice.amount, parsedInvoice.expiry, parsedInvoice.memo);
   */
  async parseBolt11Invoice(invoice: string): Promise<ParsedBolt11Invoice> {
    const data = await this._client.parseBolt11Invoice(invoice)
    logger.info(`Parsed Bolt11 invoice: ${invoice}`, data)
    return data
  }
}

// Legacy support umm might be
// export { FedimintWallet as FedimintWalletLegacy }
