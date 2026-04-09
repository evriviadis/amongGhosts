import { Room, Client } from "colyseus";
import { GhostState, Player, Ectoplasm, MachinePart } from "./schema/GhostState";
import * as geolib from "geolib";

export class GhostRoom extends Room<GhostState> {
  // Max players for a game
  maxClients = 15;

  onCreate(options: any) {
    this.setState(new GhostState());

    // 1. Set Game Area Boundaries
    this.onMessage("set_game_area", (client, payload: { baseLat: number, baseLng: number, zoneCenterLat: number, zoneCenterLng: number, zoneRadius: number }) => {
      // Typically we'd check if this client is the Room Host before allowing this
      this.state.baseLat = payload.baseLat;
      this.state.baseLng = payload.baseLng;
      this.state.zoneCenterLat = payload.zoneCenterLat;
      this.state.zoneCenterLng = payload.zoneCenterLng;
      this.state.zoneRadius = payload.zoneRadius;
      console.log(`Game area set. Radius: ${payload.zoneRadius}m`);
    });

    // 2. Player Movement
    this.onMessage("move", (client, payload: { lat: number, lng: number }) => {
      const player = this.state.players.get(client.sessionId);
      if (player && player.isAlive) {
        player.latitude = payload.lat;
        player.longitude = payload.lng;
      }
    });

    // 3. Collecting Machine Parts
    this.onMessage("collect_part", (client, payload: { partId: string }) => {
      const player = this.state.players.get(client.sessionId);
      if (!player || !player.isAlive || player.isGhostbuster) return;

      const part = this.state.machineParts.find(p => p.id === payload.partId);
      if (part && !part.isCollected) {
        // Distance check (Math happens in RAM, server asserts authority)
        const distance = geolib.getDistance(
          { latitude: player.latitude, longitude: player.longitude },
          { latitude: part.latitude, longitude: part.longitude }
        );

        // Within 5 meters threshold
        if (distance <= 5) {
          part.isCollected = true;
          console.log(`${player.username} collected part ${part.id}`);
          // TODO: Check if all parts collected -> Ghosts win!
        }
      }
    });

    // 4. Ghostbuster Catching Ghosts
    this.onMessage("catch_ghost", (client, payload: { targetPlayerId: string }) => {
      const ghostbuster = this.state.players.get(client.sessionId);
      const targetGhost = this.state.players.get(payload.targetPlayerId);

      // Verify the sender is a living Ghostbuster, and target is a living Ghost
      if (!ghostbuster || !ghostbuster.isAlive || !ghostbuster.isGhostbuster) return;
      if (!targetGhost || !targetGhost.isAlive || targetGhost.isGhostbuster) return;

      // Distance check
      const distance = geolib.getDistance(
        { latitude: ghostbuster.latitude, longitude: ghostbuster.longitude },
        { latitude: targetGhost.latitude, longitude: targetGhost.longitude }
      );

      // Within 5 meters threshold
      if (distance <= 5) {
        // Kill the Ghost
        targetGhost.isAlive = false;

        // Spawn Ectoplasm (dead body) at the exact catch coordinates
        const ectoplasm = new Ectoplasm();
        ectoplasm.id = `ecto_${Date.now()}`;
        ectoplasm.deadGhostId = targetGhost.userId;
        ectoplasm.latitude = targetGhost.latitude;
        ectoplasm.longitude = targetGhost.longitude;
        
        this.state.ectoplasms.push(ectoplasm);
        console.log(`${ghostbuster.username} eliminated ${targetGhost.username}!`);
        // TODO: Check ratio -> If 1 Ghostbuster to 1 Ghost, Ghostbuster wins!
      }
    });
  }

  onJoin(client: Client, options: any) {
    console.log(client.sessionId, "joined!");
    const player = new Player();
    player.userId = client.sessionId;
    player.username = options.username || `Player_${Math.floor(Math.random() * 1000)}`;
    
    if (this.state.players.size === 0) {
      player.isHost = true;
    }
    
    this.state.players.set(client.sessionId, player);
  }

  onLeave(client: Client, consented: boolean) {
    console.log(client.sessionId, "left!");
    this.state.players.delete(client.sessionId);
  }

  onDispose() {
    console.log("Room", this.roomId, "disposing...");
  }
}
