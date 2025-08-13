import axios, { AxiosInstance } from 'axios';
import { promises as fs } from 'fs';
import { createHash } from 'crypto';

export interface BlobInfo {
  blobId: string;
  size: number;
  encodedSize: number;
  storageId: string;
  certified: boolean;
  certifiedEpoch?: number;
  endEpoch?: number;
}

export interface NetworkStatus {
  epoch: number;
  networkSize: number;
  totalStored: number;
  availableStorage: number;
}

export interface WalrusConfig {
  aggregatorUrl: string;
  publisherUrl: string;
  systemObject: string;
  wallet?: string;
}

export class WalrusClient {
  private httpClient: AxiosInstance;
  private config: WalrusConfig;

  constructor(config?: Partial<WalrusConfig>) {
    this.config = {
      aggregatorUrl: config?.aggregatorUrl || process.env.WALRUS_AGGREGATOR_URL || 'https://aggregator-devnet.walrus.space',
      publisherUrl: config?.publisherUrl || process.env.WALRUS_PUBLISHER_URL || 'https://publisher-devnet.walrus.space',
      systemObject: config?.systemObject || process.env.WALRUS_SYSTEM_OBJECT || '0x37c0e4d7b36a2f64d51bba262a1791f844cfd88f19c35b5ca709e1a6991e90dc',
      wallet: config?.wallet || process.env.WALRUS_WALLET_PATH,
    };

    this.httpClient = axios.create({
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  async storeBlob(data: string, epochs: number = 5): Promise<BlobInfo> {
    try {
      let blobData: Buffer;
      
      // Check if data is a file path or base64 encoded data
      if (data.startsWith('/') || data.startsWith('./') || data.startsWith('../')) {
        // It's a file path
        blobData = await fs.readFile(data);
      } else {
        // It's base64 encoded data
        blobData = Buffer.from(data, 'base64');
      }

      const response = await this.httpClient.put(
        `${this.config.publisherUrl}/v1/store`,
        blobData,
        {
          headers: {
            'Content-Type': 'application/octet-stream',
          },
          params: {
            epochs: epochs.toString(),
          },
        }
      );

      if (response.data.newlyCreated) {
        return {
          blobId: response.data.newlyCreated.blobObject.blobId,
          size: response.data.newlyCreated.blobObject.size,
          encodedSize: response.data.newlyCreated.blobObject.encodedSize,
          storageId: response.data.newlyCreated.blobObject.id,
          certified: response.data.newlyCreated.resourceObject ? true : false,
          certifiedEpoch: response.data.newlyCreated.resourceObject?.storage?.startEpoch,
          endEpoch: response.data.newlyCreated.resourceObject?.storage?.endEpoch,
        };
      } else if (response.data.alreadyCertified) {
        return {
          blobId: response.data.alreadyCertified.blobId,
          size: 0, // Size not provided for already certified blobs
          encodedSize: 0,
          storageId: response.data.alreadyCertified.blobId,
          certified: true,
          certifiedEpoch: response.data.alreadyCertified.certifiedEpoch,
          endEpoch: response.data.alreadyCertified.endEpoch,
        };
      }

      throw new Error('Unexpected response format from Walrus publisher');
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Failed to store blob: ${error.response?.data?.error || error.message}`);
      }
      throw new Error(`Failed to store blob: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async getBlob(blobId: string): Promise<string> {
    try {
      const response = await this.httpClient.get(
        `${this.config.aggregatorUrl}/v1/${blobId}`,
        {
          responseType: 'arraybuffer',
        }
      );

      // Return as base64 encoded string
      return Buffer.from(response.data).toString('base64');
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          throw new Error(`Blob not found: ${blobId}`);
        }
        throw new Error(`Failed to retrieve blob: ${error.response?.data?.error || error.message}`);
      }
      throw new Error(`Failed to retrieve blob: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async getBlobInfo(blobId: string): Promise<BlobInfo> {
    try {
      // Try to get blob head information
      const response = await this.httpClient.head(`${this.config.aggregatorUrl}/v1/${blobId}`);
      
      const size = parseInt(response.headers['content-length'] || '0');
      
      return {
        blobId,
        size,
        encodedSize: size, // Approximate, actual encoded size may differ
        storageId: blobId,
        certified: true, // If we can access it, it's certified
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          throw new Error(`Blob not found: ${blobId}`);
        }
        throw new Error(`Failed to get blob info: ${error.response?.data?.error || error.message}`);
      }
      throw new Error(`Failed to get blob info: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async listBlobs(limit: number = 10): Promise<string[]> {
    // Note: Walrus doesn't provide a native list blobs API
    // This would typically require maintaining a local index or using Sui blockchain queries
    // For now, return empty array with a note
    console.warn('listBlobs: Walrus does not provide native blob listing. Consider maintaining a local index.');
    return [];
  }

  async deleteBlob(blobId: string): Promise<{ success: boolean; message: string }> {
    // Note: Walrus blobs cannot be deleted once stored - they expire based on their epoch settings
    return {
      success: false,
      message: 'Walrus blobs cannot be manually deleted. They will expire automatically based on their storage epochs.',
    };
  }

  async getNetworkStatus(): Promise<NetworkStatus> {
    try {
      // This would typically query Sui blockchain for network information
      // For now, return mock data
      return {
        epoch: 1,
        networkSize: 100,
        totalStored: 1000000,
        availableStorage: 10000000,
      };
    } catch (error) {
      throw new Error(`Failed to get network status: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async getConfig(): Promise<WalrusConfig> {
    return { ...this.config };
  }

  // Utility method to check if a blob exists
  async blobExists(blobId: string): Promise<boolean> {
    try {
      await this.httpClient.head(`${this.config.aggregatorUrl}/v1/${blobId}`);
      return true;
    } catch (error) {
      return false;
    }
  }

  // Utility method to get blob hash
  getBlobHash(data: string): string {
    const buffer = Buffer.isBuffer(data) ? data : Buffer.from(data, 'base64');
    return createHash('sha256').update(buffer).digest('hex');
  }
}