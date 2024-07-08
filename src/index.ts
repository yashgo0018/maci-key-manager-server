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
      case "register":
        ws.send(JSON.stringify({ action: "register", id }));
        break;
      case "connect":
        handleConnect(data, ws);
        break;
      case "vote":
        handleVote(data, ws);
        break;
      default:
        console.log(`Unknown action: ${data.action}`);
    }
  });

  ws.on("close", () => {
    clients.delete(id);
    console.log(`Client disconnected: ${id}`);
  });
});

function handleConnect(data: any, ws: WebSocket.WebSocket) {
  const { peerId } = data;
  const peer = clients.get(peerId);

  if (peer) {
    // Establish bi-directional connection
    (ws as any).peer = peer;
    peer.peer = ws;

    ws.send(JSON.stringify({ action: "connected", peerId }));
    peer.send(JSON.stringify({ action: "connected", peerId: (ws as any).id }));
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
