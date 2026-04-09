import express from "express";
import cors from "cors";
import { Server } from "colyseus";
import { createServer } from "http";
import { GhostRoom } from "./rooms/GhostRoom";

const port = Number(process.env.PORT || 2567);
const app = express();

// Standard middleware
app.use(cors());
app.use(express.json());

// Attach HTTP over Express
const server = createServer(app);

// Initialize Colyseus Server
const gameServer = new Server({
  server: server
});

// Register the Among Ghosts Room
gameServer.define("ghost_lobby", GhostRoom);

// Start the server
gameServer.listen(port).then(() => {
  console.log(`👻 Among Ghosts server is running on http://localhost:${port}`);
  console.log(`📡 WebSocket endpoint available at ws://localhost:${port}`);
});
