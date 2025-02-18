import Connection29 from "./Connection29";

export default class Node29 {
  layer: LayerType;
  connections: Connection29[];

  constructor(layer: LayerType) {
    this.layer = layer;
    this.connections = [];
  }

  out(inputs: number[]): number {
    let res = 0;
    for (let i = 0; i < this.connections.length; i++) {
      res += this.connections[i].forward(inputs[i]);
    }
    return res;
  }
}

export type LayerType = "INPUT" | "OUTPUT" | "HIDDEN";
