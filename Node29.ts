export default class Node29 {
  layer: LayerType;
  id: number;

  constructor(layer: LayerType, id: number) {
    this.layer = layer;
    this.id = id;
  }
}

export type LayerType = "INPUT" | "OUTPUT" | "HIDDEN";
