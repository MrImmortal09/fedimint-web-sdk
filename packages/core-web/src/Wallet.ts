import { RpcClient } from './rpc'
import {
  BalanceService,
  MintService,
  LightningService,
  FederationService,
  RecoveryService,
  WalletService,
} from './services'
import { logger } from './utils/logger'
import { generateUUID } from './utils/uuid'
import { WalletRegistry } from './WalletRegistry'

export class Wallet {
  public readonly id: string
  private _client: RpcClient
  private _clientName: string
  private _federationId?: string
  private _isOpen: boolean = false
  private _openPromise: Promise<void> | undefined = undefined
  private _resolveOpen: () => void = () => {}

  public balance: BalanceService
  public mint: MintService
  public lightning: LightningService
  public federation: FederationService
  public recovery: RecoveryService
  public wallet: WalletService

  constructor(client: RpcClient, walletId?: string, federationId?: string) {
    this.id = walletId || generateUUID()
    this._client = client
    this._clientName = `wallet-${this.id}`
    this._federationId = federationId // Set federation ID if provided

    this._openPromise = new Promise((resolve) => {
      this._resolveOpen = resolve
    })

    // nit: are both the client and clientName needed??
    this.balance = new BalanceService(this._client, this._clientName)
    this.mint = new MintService(this._client, this._clientName)
    this.lightning = new LightningService(this._client, this._clientName)
    this.federation = new FederationService(this._client, this._clientName)
    this.recovery = new RecoveryService(this._client, this._clientName)
    this.wallet = new WalletService(this._client, this._clientName)

    // Register wallet
    WalletRegistry.getInstance().addWallet(this)

    logger.info(
      `Wallet ${this.id} instantiated${federationId ? ` with federation ${federationId}` : ''}`,
    )
  }

  /**
   * Gets the federation ID associated with this wallet.
   *
   * @returns {string | undefined} The federation ID if the wallet is part of a federation, otherwise undefined.
   */
  get federationId(): string | undefined {
    return this._federationId
  }

  /**
   * Gets the client name used for RPC communication.
   *
   * @returns {string} The client name in the format 'wallet-{walletId}'.
   */
  get clientName(): string {
    return this._clientName
  }

  /**
   * Waits for the wallet to be opened.
   *
   * This method returns a promise that resolves when the wallet is successfully opened.
   * If the wallet is already open, it resolves immediately.
   *
   * @returns {Promise<void>} A promise that resolves when the wallet is open.
   */
  async waitForOpen(): Promise<void> {
    if (this._isOpen) return Promise.resolve()
    return this._openPromise
  }

  /**
   * Opens the wallet for use.
   *
   * This method initializes the RPC client connection and opens the wallet client.
   * If the wallet is already open, it returns true without performing any operations.
   *
   * @returns {Promise<boolean>} A promise that resolves to true if the wallet was opened successfully, false otherwise.
   *
   * @example
   * const wallet = await fedimintWallet.createWallet();
   * const success = await wallet.open();
   * if (success) {
   *   console.log("Wallet opened successfully");
   * }
   */
  async open(): Promise<boolean> {
    if (this._isOpen) {
      logger.warn(`Wallet ${this.id} is already open`)
      return true
    }

    try {
      // Ensure the RPC client is initialized before making the call
      await this._client.initialize()
      await this._client.openClient(this._clientName)
      this._isOpen = true
      this._resolveOpen()
      logger.info(
        `Wallet ${this.id} opened successfully${this._federationId ? ` with federation ${this._federationId}` : ''}`,
      )
      return true
    } catch (e) {
      logger.error(`Error opening wallet ${this.id}:`, e)
      return false
    }
  }

  /**
   * Joins a federation using the provided invite code.
   *
   * This method allows the wallet to join a federation by processing the invite code.
   * The wallet must not be already open or part of another federation.
   *
   * @param {string} inviteCode - The federation invite code to join with.
   * @returns {Promise<boolean>} A promise that resolves to true if the federation was joined successfully, false otherwise.
   * @throws {Error} If the wallet is already open or already part of a federation.
   *
   * @example
   * const wallet = await fedimintWallet.createWallet();
   * const inviteCode = "fed11qgqrgvnhwden5te0v9k8q6t5d9kxy6t5v4jzumn0wd68yvfwvdhk6tcqqysptkuvknca";
   * const success = await wallet.joinFederation(inviteCode);
   * if (success) {
   *   console.log("Successfully joined federation");
   * }
   */
  async joinFederation(inviteCode: string) {
    if (this._isOpen) {
      throw new Error(
        `Wallet ${this.id} is already open. Cannot join federation on an open wallet.`,
      )
    }

    if (this._federationId) {
      throw new Error(
        `Wallet ${this.id} is already part of federation ${this._federationId}`,
      )
    }

    try {
      logger.info('called joinFederation with invite code:', inviteCode)
      const res = await this._client.joinFederation(
        inviteCode,
        this._clientName,
      )
      this._federationId = (
        await this._client.parseInviteCode(inviteCode)
      ).federation_id
      this._isOpen = true
      this._resolveOpen()

      // Update the registry with the new federation ID
      WalletRegistry.getInstance().updateWalletFederation(
        this.id,
        this._federationId,
      )

      logger.info(
        `Wallet ${this.id} successfully joined federation ${this._federationId}`,
      )
      if (res) {
        logger.info(
          `Federation ID for wallet ${this.id} is now ${this._federationId}`,
        )
      }
      return true
    } catch (e) {
      logger.error(`Error joining federation for wallet ${this.id}:`, e)
      this._isOpen = false
      this._federationId = undefined
      return false
    }
  }

  /**
   * Cleans up the wallet resources.
   *
   * This method closes the wallet client connection, removes the wallet from the registry,
   * and resets the wallet state. It should be called when the wallet is no longer needed.
   *
   * @returns {Promise<void>} A promise that resolves when cleanup is complete.
   *
   * @example
   * await wallet.cleanup();
   * console.log("Wallet cleaned up");
   */
  async cleanup(): Promise<void> {
    try {
      if (this._isOpen) {
        await this._client.closeClient(this._clientName)
      }
      WalletRegistry.getInstance().removeWallet(this.id)
      this._isOpen = false
      this._openPromise = undefined
      logger.info(`Wallet ${this.id} cleaned up`)
    } catch (error) {
      logger.error(`Error cleaning up wallet ${this.id}:`, error)
    }
  }

  /**
   * Checks if the wallet is currently open.
   *
   * @returns {boolean} True if the wallet is open and ready for operations, false otherwise.
   *
   * @example
   * if (wallet.isOpen()) {
   *   console.log("Wallet is ready for operations");
   * } else {
   *   await wallet.open();
   * }
   */
  isOpen(): boolean {
    return this._isOpen
  }

  // Debug/Testing methods
  _getActiveSubscriptionIds(): number[] {
    return this._client._getActiveSubscriptionIds()
  }

  _getActiveSubscriptionCount(): number {
    return this._client._getActiveSubscriptionCount()
  }

  _getRequestCounter(): number {
    return this._client._getRequestCounter()
  }
}
