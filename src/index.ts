#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { WalrusClient } from './walrus-client.js';
import { z } from 'zod';

const server = new Server(
  {
    name: 'walrus-mcp-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      resources: {},
      tools: {},
    },
  }
);

const walrusClient = new WalrusClient();

// Tool schemas
const StoreBlobSchema = z.object({
  data: z.string().describe('Base64 encoded data or file path to store'),
  epochs: z.number().optional().describe('Number of epochs to store the blob (default: 5)'),
});

const GetBlobSchema = z.object({
  blobId: z.string().describe('The blob ID to retrieve'),
});

const ListBlobsSchema = z.object({
  limit: z.number().optional().describe('Maximum number of blobs to list (default: 10)'),
});

const DeleteBlobSchema = z.object({
  blobId: z.string().describe('The blob ID to delete'),
});

const GetBlobInfoSchema = z.object({
  blobId: z.string().describe('The blob ID to get information about'),
});

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'store_blob',
        description: 'Store a blob in Walrus decentralized storage',
        inputSchema: {
          type: 'object',
          properties: {
            data: {
              type: 'string',
              description: 'Base64 encoded data or file path to store',
            },
            epochs: {
              type: 'number',
              description: 'Number of epochs to store the blob (default: 5)',
              default: 5,
            },
          },
          required: ['data'],
        },
      },
      {
        name: 'get_blob',
        description: 'Retrieve a blob from Walrus storage',
        inputSchema: {
          type: 'object',
          properties: {
            blobId: {
              type: 'string',
              description: 'The blob ID to retrieve',
            },
          },
          required: ['blobId'],
        },
      },
      {
        name: 'list_blobs',
        description: 'List stored blobs',
        inputSchema: {
          type: 'object',
          properties: {
            limit: {
              type: 'number',
              description: 'Maximum number of blobs to list (default: 10)',
              default: 10,
            },
          },
        },
      },
      {
        name: 'delete_blob',
        description: 'Delete a blob from Walrus storage',
        inputSchema: {
          type: 'object',
          properties: {
            blobId: {
              type: 'string',
              description: 'The blob ID to delete',
            },
          },
          required: ['blobId'],
        },
      },
      {
        name: 'get_blob_info',
        description: 'Get information about a blob (size, availability, etc.)',
        inputSchema: {
          type: 'object',
          properties: {
            blobId: {
              type: 'string',
              description: 'The blob ID to get information about',
            },
          },
          required: ['blobId'],
        },
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'store_blob': {
        const { data, epochs = 5 } = StoreBlobSchema.parse(args);
        const result = await walrusClient.storeBlob(data, epochs);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'get_blob': {
        const { blobId } = GetBlobSchema.parse(args);
        const result = await walrusClient.getBlob(blobId);
        return {
          content: [
            {
              type: 'text',
              text: result,
            },
          ],
        };
      }

      case 'list_blobs': {
        const { limit = 10 } = ListBlobsSchema.parse(args);
        const result = await walrusClient.listBlobs(limit);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'delete_blob': {
        const { blobId } = DeleteBlobSchema.parse(args);
        const result = await walrusClient.deleteBlob(blobId);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'get_blob_info': {
        const { blobId } = GetBlobInfoSchema.parse(args);
        const result = await walrusClient.getBlobInfo(blobId);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
      isError: true,
    };
  }
});

// List available resources
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return {
    resources: [
      {
        uri: 'walrus://status',
        name: 'Walrus Network Status',
        description: 'Current status and health of the Walrus network',
        mimeType: 'application/json',
      },
      {
        uri: 'walrus://config',
        name: 'Walrus Configuration',
        description: 'Current Walrus client configuration',
        mimeType: 'application/json',
      },
    ],
  };
});

// Handle resource reads
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const { uri } = request.params;

  try {
    switch (uri) {
      case 'walrus://status': {
        const status = await walrusClient.getNetworkStatus();
        return {
          contents: [
            {
              uri,
              mimeType: 'application/json',
              text: JSON.stringify(status, null, 2),
            },
          ],
        };
      }

      case 'walrus://config': {
        const config = await walrusClient.getConfig();
        return {
          contents: [
            {
              uri,
              mimeType: 'application/json',
              text: JSON.stringify(config, null, 2),
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown resource: ${uri}`);
    }
  } catch (error) {
    throw new Error(`Failed to read resource ${uri}: ${error instanceof Error ? error.message : String(error)}`);
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Walrus MCP server running on stdio');
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});