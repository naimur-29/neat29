import Agent29 from "./Agent29";
import { getDiversity, random, selectTwoUniqueWithDiversity } from "./utils";

export default class Population29 {
  agents: Agent29[];

  constructor(agents: Agent29[]) {
    this.agents = [...agents];
  }

  evaluate() {
    this.agents.sort((a, b) => b.fitness - a.fitness);
  }

  mutation(child: Agent29, mutationRate = 0.3) {
    // hiddenNodes:
    for (let i = 0; i < child.genome.hiddenNodes.length; i++) {
      for (let k = 0; k < child.genome.hiddenNodes[i].connections.length; k++) {
        if (Math.random() <= mutationRate) {
          child.genome.hiddenNodes[i].connections[k].weight += random(
            -0.5,
            0.5,
          );
          child.genome.hiddenNodes[i].connections[k].bias += random(-0.5, 0.5);
        }
      }
    }

    // outputNodes:
    for (let i = 0; i < child.genome.outputNodes.length; i++) {
      for (let k = 0; k < child.genome.outputNodes[i].connections.length; k++) {
        if (Math.random() <= mutationRate) {
          child.genome.outputNodes[i].connections[k].weight += random(
            -0.5,
            0.5,
          );
          child.genome.outputNodes[i].connections[k].bias += random(-0.5, 0.5);
        }
      }
    }

    return child;
  }

  crossover(parent1: Agent29, parent2: Agent29) {
    let child1 = new Agent29(parent1.config);
    let child2 = new Agent29(parent2.config);
    child1.genome = parent1.genome.copy();
    child2.genome = parent2.genome.copy();
    child1 = this.mutation(child1);
    child2 = this.mutation(child2);

    // hiddenNodes:
    for (
      let i = 0;
      i < child1.genome.hiddenNodes.length &&
      i < child2.genome.hiddenNodes.length;
      i++
    ) {
      for (
        let k = 0;
        k < child1.genome.hiddenNodes[i].connections.length;
        k++
      ) {
        if (Math.random() >= 0.5) {
          child1.genome.hiddenNodes[i].connections[k].weight =
            parent2.genome.hiddenNodes[i].connections[k].weight;
          child1.genome.hiddenNodes[i].connections[k].bias =
            parent2.genome.hiddenNodes[i].connections[k].bias;
        } else {
          child2.genome.hiddenNodes[i].connections[k].weight =
            parent1.genome.hiddenNodes[i].connections[k].weight;
          child2.genome.hiddenNodes[i].connections[k].bias =
            parent1.genome.hiddenNodes[i].connections[k].bias;
        }
      }
    }

    // outputNodes:
    for (
      let i = 0;
      i < child1.genome.outputNodes.length &&
      i < child2.genome.outputNodes.length;
      i++
    ) {
      for (
        let k = 0;
        k < child1.genome.outputNodes[i].connections.length;
        k++
      ) {
        if (Math.random() >= 0.5) {
          child1.genome.outputNodes[i].connections[k].weight =
            parent2.genome.outputNodes[i].connections[k].weight;
          child1.genome.outputNodes[i].connections[k].bias =
            parent2.genome.outputNodes[i].connections[k].bias;
        } else {
          child2.genome.outputNodes[i].connections[k].weight =
            parent1.genome.outputNodes[i].connections[k].weight;
          child2.genome.outputNodes[i].connections[k].bias =
            parent1.genome.outputNodes[i].connections[k].bias;
        }
      }
    }

    return [child1, child2];
  }

  reproduce() {
    const nextGenAgents: Agent29[] = [];
    // const eliteCount = 2;
    // const elites = this.agents.slice(0, eliteCount);

    for (let i = 0; i < this.agents.length / 2; i++) {
      // const [parent1, parent2] = selectTwoUnique(this.agents);
      const [parent1, parent2] = selectTwoUniqueWithDiversity(
        this.agents,
        getDiversity,
      );

      if (parent1 && parent2) {
        nextGenAgents.push(...this.crossover(parent1, parent2));
      }
    }

    // this.agents = [...elites, ...nextGenAgents.slice(eliteCount)];
    this.agents = nextGenAgents;
  }
}
