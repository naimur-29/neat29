import Node29 from "./Node29";
import Connection29 from "./Connection29";

export default class Genome29 {
  nodes: Node29[];
  connections: Connection29[];

  constructor(inputSize: number, outputSize: number) {
    this.nodes = [];
    this.connections = [];

    for (let i = 0; i < inputSize; i++) {
      const inputNode = new Node29("INPUT", this.nodes.length + 1);
      this.nodes.push(inputNode);
    }
    for (let i = 0; i < outputSize; i++) {
      const outputNode = new Node29("OUTPUT", this.nodes.length + 1);
      this.nodes.push(outputNode);

      this.nodes
        .filter((node) => node.layer === "INPUT")
        .forEach((inputNode) => {
          const connection = new Connection29(
            inputNode,
            outputNode,
            Math.random(),
            true,
          );
          if (this.connections.length === 0 || Math.random() > 0.5)
            this.connections.push(connection);
        });
    }
  }
}
