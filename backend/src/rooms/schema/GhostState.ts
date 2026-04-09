import { Schema, type, MapSchema, ArraySchema } from "@colyseus/schema";

export class Player extends Schema {
  @type("string") userId: string = "";
  @type("string") username: string = "";
  @type("number") latitude: number = 0;
  @type("number") longitude: number = 0;
  @type("boolean") isGhostbuster: boolean = false;
  @type("boolean") isAlive: boolean = true;
}

export class MachinePart extends Schema {
  @type("string") id: string = "";
  @type("number") latitude: number = 0;
  @type("number") longitude: number = 0;
  @type("boolean") isCollected: boolean = false;
}

export class Ectoplasm extends Schema {
  @type("string") id: string = "";
  @type("string") deadGhostId: string = "";
  @type("number") latitude: number = 0;
  @type("number") longitude: number = 0;
}

export class GhostState extends Schema {
  // Map Variables
  @type("string") status: string = "waiting"; // "waiting", "playing", "voting"
  @type("number") baseLat: number = 0;
  @type("number") baseLng: number = 0;
  @type("number") zoneCenterLat: number = 0;
  @type("number") zoneCenterLng: number = 0;
  @type("number") zoneRadius: number = 0;

  // Entities
  @type({ map: Player }) players = new MapSchema<Player>();
  @type([ MachinePart ]) machineParts = new ArraySchema<MachinePart>();
  @type([ Ectoplasm ]) ectoplasms = new ArraySchema<Ectoplasm>();
}
