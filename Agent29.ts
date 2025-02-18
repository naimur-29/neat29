import Genome29 from "./Genome29";
import Config29 from "./Config29";
import { activationFunctions } from "./utils";

export default class Agent29 {
  config: Config29;
  genome: Genome29;
  fitness: number;

  constructor(config: Config29, fitness = 0) {
    this.config = config;
    this.genome = this.config.generateGenome();
    this.fitness = fitness;
  }

  forward(inputs: number[]): number[] {
    const activationFunction =
      activationFunctions[this.config.activationFunction];
    return this.genome.forward(inputs, activationFunction);
  }
}
