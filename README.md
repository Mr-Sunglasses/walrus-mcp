# 🦭 Walrus MCP Server

<div align="center">

**MCP Server for Walrus Decentralized Storage Protocol**

_Built with ❤️ by [Motion Labs](https://motionecosystem.com)_

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

[🌐 Walrus Docs](https://docs.wal.app/) • [📚 MCP Documentation](https://modelcontextprotocol.io/docs)

</div>

## ✨ Features

### 🗄️ Decentralized Storage Operations

- **Store blobs** in Walrus decentralized storage network
- **Retrieve blobs** by blob ID with high availability
- **Get blob information** including size and certification status
- **Check blob availability** and network health

### 🔗 Blockchain Integration

- **Sui blockchain coordination** for storage metadata
- **Storage epoch management** for blob lifecycle
- **Proof of availability** through blockchain verification
- **Storage resource management**

### 🛠️ Developer Experience

- **Simple MCP tools** for AI assistants and automation
- **Base64 encoding** for binary data handling  
- **File path support** for direct file uploads
- **Comprehensive error handling** with clear messages

## 🚀 Quick Start

### Prerequisites

- **Node.js** >= 18.0.0
- **npm** >= 8.0.0
- **Claude Desktop** or compatible MCP client

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/MotionEcosystem/walrus-mcp.git
   cd walrus-mcp
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Build the server**

   ```bash
   npm run build
   ```

### MCP Setup

Add to your Claude Desktop configuration:

```json
{
  "mcpServers": {
    "walrus": {
      "command": "node",
      "args": ["path/to/walrus-mcp/dist/index.js"],
      "env": {
        "WALRUS_AGGREGATOR_URL": "https://aggregator-devnet.walrus.space",
        "WALRUS_PUBLISHER_URL": "https://publisher-devnet.walrus.space"
      }
    }
  }
}
```

## 🛠️ Available Tools

### `store_blob`
Store data in Walrus decentralized storage.
- **data**: Base64 encoded data or file path
- **epochs** (optional): Number of epochs to store (default: 5)

### `get_blob`
Retrieve a blob from Walrus storage.
- **blobId**: The blob ID to retrieve

### `get_blob_info`
Get information about a blob.
- **blobId**: The blob ID to get information about

### `list_blobs`
List stored blobs (requires local indexing).
- **limit** (optional): Maximum number of blobs to list

### `delete_blob`
Attempt to delete a blob (note: Walrus blobs expire automatically).
- **blobId**: The blob ID to delete

## 📊 Resources

### `walrus://status`
Current status and health of the Walrus network

### `walrus://config`
Current Walrus client configuration

## 🔧 Development

### Available Scripts

| Script               | Description                  |
| -------------------- | ---------------------------- |
| `npm run dev`        | Start development server     |
| `npm run build`      | Build for production         |
| `npm run start`      | Start production server      |
| `npm run lint`       | Run ESLint                   |
| `npm run type-check` | Run TypeScript type checking |
| `npm run format`     | Format code with Prettier    |

### Tech Stack

- **Runtime**: [Node.js](https://nodejs.org/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **MCP SDK**: [@modelcontextprotocol/sdk](https://www.npmjs.com/package/@modelcontextprotocol/sdk)
- **HTTP Client**: [Axios](https://axios-http.com/)
- **Validation**: [Zod](https://zod.dev/)

## 🏗️ Architecture

The Walrus MCP Server provides a bridge between AI assistants and the Walrus decentralized storage network through the Model Context Protocol (MCP).

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   AI Assistant  │    │  Walrus MCP     │    │ Walrus Network  │
│  (Claude, etc.) │◄──►│     Server      │◄──►│   (DevNet)      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌─────────────────┐
                       │  Sui Blockchain │
                       │   (Metadata)    │
                       └─────────────────┘
```

### Components

- **MCP Server**: Handles tool calls and resource requests from AI assistants
- **Walrus Client**: Manages HTTP communication with Walrus aggregator and publisher
- **Aggregator**: Provides blob retrieval functionality
- **Publisher**: Handles blob storage operations
- **Sui Integration**: Manages storage metadata and epochs

## 📚 Detailed Documentation

### Environment Configuration

Create a `.env` file based on `.env.example`:

```bash
# Required: Walrus network endpoints
WALRUS_AGGREGATOR_URL=https://aggregator-devnet.walrus.space
WALRUS_PUBLISHER_URL=https://publisher-devnet.walrus.space

# Optional: Custom system object ID
WALRUS_SYSTEM_OBJECT=0x37c0e4d7b36a2f64d51bba262a1791f844cfd88f19c35b5ca709e1a6991e90dc

# Optional: Wallet for transaction signing
WALRUS_WALLET_PATH=/path/to/your/wallet.json
```

### Tool Usage Examples

#### Storing a Blob

```typescript
// Store text data
await tool_call("store_blob", {
  data: "SGVsbG8sIFdhbHJ1cyE=", // Base64 encoded "Hello, Walrus!"
  epochs: 10
})

// Store a file
await tool_call("store_blob", {
  data: "/path/to/file.jpg",
  epochs: 5
})
```

#### Retrieving a Blob

```typescript
// Get blob content as Base64
const blob = await tool_call("get_blob", {
  blobId: "0xabc123..."
})
```

#### Getting Blob Information

```typescript
// Get blob metadata
const info = await tool_call("get_blob_info", {
  blobId: "0xabc123..."
})

console.log(info.size, info.certified, info.endEpoch)
```

### Resource Usage Examples

#### Check Network Status

```typescript
// Get Walrus network health
const status = await resource_read("walrus://status")
console.log(status.epoch, status.networkSize)
```

#### View Configuration

```typescript
// Get current client configuration
const config = await resource_read("walrus://config")
console.log(config.aggregatorUrl, config.publisherUrl)
```

### Error Handling

The server provides comprehensive error handling for common scenarios:

- **Blob not found**: Clear error message with blob ID
- **Network issues**: Timeout and connectivity error details
- **Invalid data**: Validation errors for malformed inputs
- **Storage limits**: Epoch and capacity constraint messages

### Data Format Support

#### Supported Input Formats

- **Base64 encoded strings**: For binary data transmission
- **File paths**: Direct file reading (relative or absolute)
- **Text content**: Automatically encoded for storage

#### Output Format

All retrieved blobs are returned as Base64 encoded strings for consistent handling across different data types.

### Security Considerations

⚠️ **Important Security Notes:**

- All blobs stored in Walrus are **public and discoverable**
- Do not store sensitive or confidential information without encryption
- Consider client-side encryption for private data
- Validate all inputs before processing

### Network Information

#### DevNet Configuration

- **Aggregator**: `https://aggregator-devnet.walrus.space`
- **Publisher**: `https://publisher-devnet.walrus.space`
- **System Object**: `0x37c0e4d7b36a2f64d51bba262a1791f844cfd88f19c35b5ca709e1a6991e90dc`

#### TestNet Configuration

For TestNet usage, update environment variables:

```bash
WALRUS_AGGREGATOR_URL=https://aggregator-testnet.walrus.space
WALRUS_PUBLISHER_URL=https://publisher-testnet.walrus.space
```

### Storage Economics

#### Epochs and Pricing

- **Epoch Duration**: Fixed time periods for storage commitment
- **Minimum Storage**: 5 epochs (configurable)
- **Cost Calculation**: Based on blob size and storage duration
- **Payment**: Handled through Sui blockchain transactions

### Troubleshooting

#### Common Issues

1. **Connection Errors**
   - Verify network connectivity
   - Check aggregator/publisher URLs
   - Ensure DevNet/TestNet endpoints are accessible

2. **Storage Failures**
   - Check blob size limits
   - Verify sufficient SUI tokens for storage fees
   - Ensure proper epoch configuration

3. **Retrieval Issues**
   - Confirm blob ID format and validity
   - Check if blob has expired (past end epoch)
   - Verify aggregator availability

#### Debug Mode

Enable detailed logging:

```bash
DEBUG=walrus-mcp:* npm run dev
```

### Contributing

We welcome contributions! Please:

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Update documentation
5. Submit a pull request

### Roadmap

- [ ] **Enhanced blob management**: Batch operations and metadata indexing
- [ ] **Encryption support**: Client-side encryption for private data
- [ ] **WebSocket support**: Real-time blob status updates
- [ ] **CLI tool**: Standalone command-line interface
- [ ] **Performance metrics**: Storage and retrieval analytics
- [ ] **MainNet support**: Production network integration

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🤝 Support

- **Documentation**: [Walrus Official Docs](https://docs.wal.app/)
- **Community**: [Motion Labs Discord](https://discord.gg/motionlabs)
- **Issues**: [GitHub Issues](https://github.com/MotionEcosystem/walrus-mcp/issues)
- **Email**: [hello@motionecosystem.com](mailto:hello@motionecosystem.com)

---

<div align="center">
  <sub>Built with 🦭 for the decentralized future</sub>
</div>
