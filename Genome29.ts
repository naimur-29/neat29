import Node29 from "./Node29";
import Connection29 from "./Connection29";
import { random } from "./utils";

export default class Genome29 {
  inputNodes: Node29[];
  hiddenNodes: Node29[];
  outputNodes: Node29[];

  constructor(inputSize = 0, outputSize = 0, hiddenSize = 0) {
    this.inputNodes = [];
    this.hiddenNodes = [];
    this.outputNodes = [];

    // generate input nodes:
    for (let i = 0; i < inputSize; i++) {
      const inputNode = new Node29("INPUT");
      this.inputNodes.push(inputNode);
    }

    // generate hidden nodes:
    for (let i = 0; i < hiddenSize; i++) {
      const hiddenNode = new Node29("HIDDEN");
      this.inputNodes.forEach((inputNode) => {
        const conn = new Connection29(
          inputNode,
          hiddenNode,
          random(-1, 1),
          random(-1, 1),
        );
        hiddenNode.connections.push(conn);
      });
      this.hiddenNodes.push(hiddenNode);
    }

    // generate output nodes:
    for (let i = 0; i < outputSize; i++) {
      const outputNode = new Node29("OUTPUT");
      this.hiddenNodes.forEach((hiddenNode) => {
        const conn = new Connection29(
          hiddenNode,
          outputNode,
          random(-1, 1),
          random(-1, 1),
        );
        outputNode.connections.push(conn);
      });
      this.outputNodes.push(outputNode);
    }
  }

  copy(): Genome29 {
    const genome = new Genome29(
      this.inputNodes.length,
      this.outputNodes.length,
      this.hiddenNodes.length,
    );

    // hiddenNodes:
    for (let i = 0; i < genome.hiddenNodes.length; i++) {
      for (let k = 0; k < genome.hiddenNodes[i].connections.length; k++) {
        genome.hiddenNodes[i].connections[k] = this.hiddenNodes[i].connections[
          k
        ].copy(
          genome.hiddenNodes[i].connections[k].node1,
          genome.hiddenNodes[i].connections[k].node2,
        );
      }
    }

    // outputNodes:
    for (let i = 0; i < genome.outputNodes.length; i++) {
      for (let k = 0; k < genome.outputNodes[i].connections.length; k++) {
        genome.outputNodes[i].connections[k] = this.outputNodes[i].connections[
          k
        ].copy(
          genome.outputNodes[i].connections[k].node1,
          genome.outputNodes[i].connections[k].node2,
        );
      }
    }

    return genome;
  }

  forward(
    inputs: number[],
    activationFunction: (x: number) => number,
  ): number[] {
    let hiddenOut = [];
    for (let i = 0; i < this.hiddenNodes.length; i++) {
      hiddenOut.push(activationFunction(this.hiddenNodes[i].out(inputs)));
    }

    let out = [];
    for (const node of this.outputNodes) {
      out.push(activationFunction(node.out(hiddenOut)));
    }

    return out;
  }
}
