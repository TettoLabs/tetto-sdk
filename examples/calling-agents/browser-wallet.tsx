/**
 * Browser Example: Call Tetto Agent with Wallet Adapter
 *
 * This example shows how to integrate Tetto SDK in a React application
 * using Solana Wallet Adapter for browser wallet support.
 *
 * Requirements:
 * - @solana/wallet-adapter-react
 * - @solana/wallet-adapter-react-ui
 * - @solana/wallet-adapter-wallets
 * - tetto-sdk
 */

import { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import TettoSDK, {
  createWalletFromAdapter,
  getDefaultConfig,
  type CallResult
} from 'tetto-sdk';

export function AgentCaller() {
  const walletAdapter = useWallet();
  const [result, setResult] = useState<CallResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCallAgent() {
    // Reset state
    setError(null);
    setResult(null);

    // Check wallet connection
    if (!walletAdapter.connected) {
      setError('Please connect your wallet first');
      return;
    }

    setLoading(true);

    try {
      // Step 1: Setup SDK (use mainnet or devnet)
      const network = 'mainnet'; // Change to 'devnet' for testing

      // Step 2: Create wallet object (no connection needed!)
      const wallet = createWalletFromAdapter(walletAdapter);

      // Step 3: Initialize SDK
      const tetto = new TettoSDK(getDefaultConfig(network));

      // Step 4: Find agent dynamically (best practice)
      console.log('Finding TitleGenerator agent...');
      const agents = await tetto.listAgents();
      const titleGen = agents.find(a => a.name === 'TitleGenerator');

      if (!titleGen) {
        throw new Error('TitleGenerator not found in marketplace');
      }

      console.log(`Found agent: ${titleGen.name} (${titleGen.id})`);
      console.log(`Price: $${titleGen.price_display} ${titleGen.token}`);

      // Step 5: Call agent with payment
      const result = await tetto.callAgent(
        titleGen.id,
        {
          text: 'Tetto SDK enables developers to easily integrate AI agents with blockchain-based payments.'
        },
        wallet
      );

      console.log('Success!', result);
      setResult(result);

    } catch (err) {
      console.error('Error calling agent:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="agent-caller">
      <h2>Call TitleGenerator Agent</h2>

      {/* Wallet Connection Button */}
      <WalletMultiButton />

      {/* Call Agent Button */}
      <button
        onClick={handleCallAgent}
        disabled={!walletAdapter.connected || loading}
        className="call-button"
      >
        {loading ? 'Calling Agent...' : 'Generate Title ($0.01)'}
      </button>

      {/* Error Display */}
      {error && (
        <div className="error">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Result Display */}
      {result && (
        <div className="result">
          <h3>Result:</h3>
          <pre>{JSON.stringify(result.output, null, 2)}</pre>

          <h3>Payment Details:</h3>
          <ul>
            <li>Transaction: <code>{result.txSignature}</code></li>
            <li>Receipt ID: <code>{result.receiptId}</code></li>
            <li>Agent Received: ${(result.agentReceived / 1e6).toFixed(3)}</li>
            <li>Protocol Fee: ${(result.protocolFee / 1e6).toFixed(3)}</li>
          </ul>

          <a
            href={result.explorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="explorer-link"
          >
            View on Solana Explorer →
          </a>
        </div>
      )}
    </div>
  );
}

// Styles (optional - use your own CSS framework)
const styles = `
.agent-caller {
  max-width: 600px;
  margin: 0 auto;
  padding: 2rem;
}

.call-button {
  margin-top: 1rem;
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
}

.call-button:disabled {
  background: #9ca3af;
  cursor: not-allowed;
}

.error {
  margin-top: 1rem;
  padding: 1rem;
  background: #fee2e2;
  border: 1px solid #ef4444;
  border-radius: 0.5rem;
  color: #991b1b;
}

.result {
  margin-top: 2rem;
  padding: 1rem;
  background: #f0fdf4;
  border: 1px solid #22c55e;
  border-radius: 0.5rem;
}

.result pre {
  background: #1f2937;
  color: #f3f4f6;
  padding: 1rem;
  border-radius: 0.5rem;
  overflow-x: auto;
}

.result code {
  font-size: 0.875rem;
  word-break: break-all;
}

.explorer-link {
  display: inline-block;
  margin-top: 1rem;
  color: #3b82f6;
  text-decoration: none;
}
`;
