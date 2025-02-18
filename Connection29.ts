import Node29 from "./Node29";

export default class Connection29 {
  node1: Node29;
  node2: Node29;
  weight: number;
  bias: number;
  // id: string;

  constructor(node1: Node29, node2: Node29, weight: number, bias: number) {
    this.node1 = node1;
    this.node2 = node2;
    this.weight = weight;
    this.bias = bias;
    // this.id = `${node1.id}-${node2.id}`;
  }

  copy(node1: Node29, node2: Node29): Connection29 {
    return new Connection29(node1, node2, this.weight, this.bias);
  }

  forward(input: number): number {
    return input * this.weight + this.bias;
  }
}
