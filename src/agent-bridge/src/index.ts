#!/usr/bin/env node

/**
 * Automa Agent Bridge - CLI Entry Point
 *
 * Starts an HTTP + WebSocket server that bridges Hermes AI Agent
 * commands to the Automa Chrome Extension via Native Messaging or CDP.
 */

import { Command } from 'commander';
import { createBridgeServer } from './server';

export type ConnectionMode = 'native' | 'cdp' | 'inject';

export interface BridgeOptions {
  port: number;
  extensionId: string;
  mode: ConnectionMode;
  chromeDebugPort?: number;
  verbose: boolean;
}

const program = new Command();

program
  .name('automa-bridge')
  .description('Bridge server between Hermes AI Agent and Automa Chrome Extension')
  .version('1.0.0')
  .option('-p, --port <number>', 'HTTP/WebSocket server port', '8528')
  .option(
    '-e, --extension-id <id>',
    'Automa Chrome Extension ID',
    'infppggnoaenmfagbfknfkancpbljcca'
  )
  .option(
    '-m, --mode <mode>',
    'Connection mode: native (Native Messaging), cdp (Chrome DevTools Protocol), inject (page injection)',
    'cdp'
  )
  .option(
    '--chrome-debug-port <number>',
    'Chrome remote debugging port (for cdp/inject modes)',
    '9222'
  )
  .option('-v, --verbose', 'Enable verbose logging', false)
  .action(async (opts) => {
    const options: BridgeOptions = {
      port: parseInt(opts.port, 10),
      extensionId: opts.extensionId,
      mode: opts.mode as ConnectionMode,
      chromeDebugPort: parseInt(opts.chromeDebugPort, 10),
      verbose: opts.verbose,
    };

    console.log('=== Automa Agent Bridge ===');
    console.log(`  Port:          ${options.port}`);
    console.log(`  Extension ID:  ${options.extensionId}`);
    console.log(`  Mode:          ${options.mode}`);
    if (options.mode !== 'native') {
      console.log(`  Chrome Debug:  localhost:${options.chromeDebugPort}`);
    }
    console.log(`  Verbose:       ${options.verbose}`);
    console.log('');

    try {
      const server = await createBridgeServer(options);
      console.log(`[bridge] Server listening on http://localhost:${options.port}`);
      console.log(`[bridge] WebSocket available on ws://localhost:${options.port}`);
      console.log(`[bridge] Health check: http://localhost:${options.port}/api/health`);
      console.log('');
      console.log('[bridge] Ready to accept commands from Hermes Agent.');

      const shutdown = async () => {
        console.log('\n[bridge] Shutting down...');
        server.close(() => {
          console.log('[bridge] Server closed.');
          process.exit(0);
        });
      };

      process.on('SIGINT', shutdown);
      process.on('SIGTERM', shutdown);
    } catch (err) {
      console.error('[bridge] Failed to start:', err);
      process.exit(1);
    }
  });

program.parse();
