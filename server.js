import { WebSocketServer } from "ws";

const wss = new WebSocketServer({ port: process.env.PORT || 8080 });

function broadcast(data) {
  const msg = JSON.stringify(data);

  wss.clients.forEach(client => {
    if (client.readyState === 1) {
      client.send(msg);
    }
  });
}

wss.on("connection", (ws) => {
  console.log("user joined");

  ws.isAlive = true;

  broadcast({ type: "user_joined" });

  ws.on("message", (msg) => {
    try {
      const data = JSON.parse(msg);

      if (data.type === "pulse") {
        broadcast({ type: "pulse" });
      }

      if (data.type === "ping") {
        ws.isAlive = true;
      }

    } catch (e) {}
  });

  ws.on("close", () => {
    console.log("user left");
    broadcast({ type: "user_left" });
  });
});

// 🔥 heartbeat (TO DODAJ NA SAMYM DOLE PLIKU)
setInterval(() => {
  wss.clients.forEach(ws => {
    if (!ws.isAlive) {
      ws.terminate();
      return;
    }

    ws.isAlive = false;
    ws.send(JSON.stringify({ type: "ping" }));
  });
}, 30000);