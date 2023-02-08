#!/usr/bin/env node

import * as http from 'http';
import * as fs from 'fs';
import * as parseArgs from 'minimist';
import * as yaml from 'js-yaml';
import * as ws from 'ws';
import * as rpc from '@sourcegraph/vscode-ws-jsonrpc';
import * as rpcServer from '@sourcegraph/vscode-ws-jsonrpc/lib/server';
import { logConnectionCount } from './redisHelper';
import { ConnectionStatus } from './redisData';

let argv = parseArgs(process.argv.slice(2));

if (argv.help || !argv.languageServers) {
  console.log(`Usage: server.js --port 3000 --languageServers config.yml`);
  process.exit(1);
}

let serverPort: number = parseInt(argv.port) || 3000;

let languageServers;
try {
  let parsed = yaml.safeLoad(fs.readFileSync(argv.languageServers), 'utf8');
  if (!parsed.langservers) {
    console.log('Your langservers file is not a valid format, see README.md');
    process.exit(1);
  }
  languageServers = parsed.langservers;
} catch (e) {
  console.error(e);
  process.exit(1);
}

const wss: ws.Server = new ws.Server({
  port: serverPort,
  perMessageDeflate: false
}, () => {
  console.log(`Listening to http and ws requests on ${serverPort}`);
});

function toSocket(webSocket: ws): rpc.IWebSocket {
  return {
    send: content => webSocket.send(content),
    onMessage: cb => webSocket.onmessage = event => cb(event.data),
    onError: cb => webSocket.onerror = event => {
      if ('message' in event) {
        cb((event as any).message)
      }
    },
    onClose: cb => webSocket.onclose = event => cb(event.code, event.reason),
    dispose: () => webSocket.close()
  }
}
const language: string = argv.language
const langServer = languageServers[language]
let connectionCounter = 1

setInterval(() => {
  const totalConnection = connectionCounter - 1
  console.log("VALID CONNECTION:", totalConnection)
  if (totalConnection > 0) {
    logConnectionCount(language, ConnectionStatus.ACTIVE, totalConnection)
  }
  logConnectionCount(language, ConnectionStatus.LIVE)
}, 60000)

wss.on('connection', (client: ws, request: http.IncomingMessage) => {
  if (!langServer || !langServer.length) {
    console.error('Invalid language server');
    client.close();
    return;
  }
  if (connectionCounter > 2) {
    logConnectionCount(language, ConnectionStatus.LANGUAGE_SERVER_IN_USE)
    client.close();
    return;
  }
  const socket: rpc.IWebSocket = toSocket(client);
  const localConnection = rpcServer.createServerProcess(`${langServer[0]}LSP - ${connectionCounter}`, langServer[0], langServer.slice(1));
  const connection = rpcServer.createWebSocketConnection(socket);
  rpcServer.forward(connection, localConnection);
  logConnectionCount(language, ConnectionStatus.INCOMING)
  console.log("Forwarding new client: ", connectionCounter);
  connectionCounter++;
  socket.onClose((code) => {
    console.log('Client closed', code);
    logConnectionCount(language, ConnectionStatus.CLOSED)
    connectionCounter--;
    localConnection.dispose();
  });
});
