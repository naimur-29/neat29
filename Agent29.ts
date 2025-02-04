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

  forward(input: number[]): number[] {
    let output = this.genome.forward(input);
    output = output.map((ele) =>
      activationFunctions[this.config.activationFunction](ele),
    );
    return output;
  }
}
