import Node29 from "./Node29";
import Connection29 from "./Connection29";

export default class Genome29 {
  nodes: Node29[];
  connections: Connection29[];

  constructor(inputSize: number, outputSize: number) {
    this.nodes = [];
    this.connections = [];

    // generate input nodes:
    for (let i = 0; i < inputSize; i++) {
      const inputNode = new Node29("INPUT", this.nodes.length);
      this.nodes.push(inputNode);
    }

    // generate output nodes:
    for (let i = 0; i < outputSize; i++) {
      const outputNode = new Node29("OUTPUT", this.nodes.length);
      this.nodes.push(outputNode);

      // generate connections:
      let connectionCount = 0;
      this.nodes
        .filter((node) => node.layer === "INPUT")
        .forEach((inputNode) => {
          const connection = new Connection29(
            inputNode,
            outputNode,
            Math.random(),
            Math.random(),
            true,
          );
          if (connectionCount === 0 || Math.random() > 0.5) {
            this.connections.push(connection);
            connectionCount++;
          }
        });
    }
  }

  forward(input: number[]): number[] {
    const output: number[] = [];
    const outputQueue: number[] = [];

    this.connections.forEach((connection) => {
      const id = connection.node2.id;
      const res = connection.forward(input);

      outputQueue.push(id);
      const index = id - Math.min(...outputQueue, id);

      output[index] = output[index] === undefined ? res : output[index] + res;
    });

    return output;
  }
}
