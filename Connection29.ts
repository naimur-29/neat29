import Node29, { LayerType } from "./Node29";

export default class Connection29 {
  node1: Node29;
  node2: Node29;
  weight: number;
  isActive: boolean;
  id: string;

  constructor(node1: Node29, node2: Node29, weight: number, isActive: boolean) {
    this.node1 = node1;
    this.node2 = node2;
    this.weight = weight;
    this.isActive = isActive;
    this.id = `${node1.id}-${node2.id}`;
  }
}
