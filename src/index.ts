import { v4 as uuidv4 } from "uuid";
import WebSocket from "ws";

const wss = new WebSocket.Server({ port: 8080 });

const clients = new Map();

wss.on("connection", (ws) => {
  const id = uuidv4();
  clients.set(id, ws);
  console.log(`Client connected: ${id}`);

  ws.on("open", () => {
    console.log(`Client opened: ${id}`);
  });

  ws.on("message", (message) => {
    console.log(`Received message from ${id}: ${message}`);

    // Assuming message is in JSON format with action type
    const data = JSON.parse(message.toString());

    switch (data.action) {
      case "get-id":
        ws.send(JSON.stringify({ action: "get-id", id }));
        break;
      case "connect":
        handleConnect(data, ws);
        break;
      case "vote":
        handleVote(data, ws);
        break;
      case "disconnect":
        handleDisconnect(data, ws);
        break;
      case "sign":
        handleSign(data, ws);
        break;
      case "signed":
        handleSigned(data, ws);
        break;
      case "cancel-signature-request":
        handleCancelSignatureRequest(data, ws);
        break;
      default:
        console.log(`Unknown action: ${data.action}`);
    }
  });

  ws.on("close", () => {
    handleDisconnect({}, ws);
    clients.delete(id);
    console.log(`Client disconnected: ${id}`);
  });
});

function handleDisconnect(data: any, ws: WebSocket.WebSocket) {
  if ((ws as any).peer) {
    (ws as any).peer.peer = null;
    (ws as any).peer.send(JSON.stringify({ action: "disconnected" }));
    (ws as any).peer = null;
    ws.send(JSON.stringify({ action: "disconnected" }));
  } else {
    ws.send(JSON.stringify({ action: "error", message: "No peer connected" }));
  }
}

function handleSign(data: any, ws: WebSocket.WebSocket) {
  if ((ws as any).peer) {
    (ws as any).peer.send(JSON.stringify(data));
  } else {
    ws.send(JSON.stringify({ action: "error", message: "No peer connected" }));
  }
}

function handleSigned(data: any, ws: WebSocket.WebSocket) {
  if ((ws as any).peer) {
    (ws as any).peer.send(JSON.stringify(data));
  } else {
    ws.send(JSON.stringify({ action: "error", message: "No peer connected" }));
  }
}

function handleCancelSignatureRequest(data: any, ws: WebSocket.WebSocket) {
  if ((ws as any).peer) {
    (ws as any).peer.send(JSON.stringify(data));
    (ws as any).send(JSON.stringify(data));
  } else {
    ws.send(JSON.stringify({ action: "error", message: "No peer connected" }));
  }
}

function handleConnect(data: any, ws: WebSocket.WebSocket) {
  // check if it is already connected
  if ((ws as any).peer) {
    ws.send(JSON.stringify({ action: "error", message: "Already connected" }));
    return;
  }

  const { peerId, publicKey } = data;
  const peer = clients.get(peerId);

  if (peer) {
    // check if peer is already connected
    if ((peer as any).peer) {
      ws.send(
        JSON.stringify({
          action: "error",
          message: "Peer is already connected",
        })
      );
      return;
    }

    // Establish bi-directional connection
    (ws as any).peer = peer;
    peer.peer = ws;

    ws.send(JSON.stringify({ action: "connected", peerId }));
    peer.send(
      JSON.stringify({ action: "connected", peerId: (ws as any).id, publicKey })
    );
  } else {
    ws.send(JSON.stringify({ action: "error", message: "Peer not found" }));
  }
}

function handleVote(data: any, ws: WebSocket.WebSocket) {
  if ((ws as any).peer) {
    // Forward vote message to the connected peer
    (ws as any).peer.send(JSON.stringify(data));
  } else {
    ws.send(JSON.stringify({ action: "error", message: "No peer connected" }));
  }
}

console.log("WebSocket server is running on ws://localhost:8080");
