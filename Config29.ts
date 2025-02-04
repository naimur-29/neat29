import Genome29 from "./Genome29";

export default class Config29 {
  inputSize: number;
  outputSize: number;
  activationFunction: ActivationFunctionType;

  constructor(
    inputSize: number,
    outputSize: number,
    activationFunction: ActivationFunctionType,
  ) {
    this.inputSize = inputSize;
    this.outputSize = outputSize;
    this.activationFunction = activationFunction;
  }

  generateGenome(): Genome29 {
    const genome = new Genome29(this.inputSize, this.outputSize);
    return genome;
  }
}

export type ActivationFunctionType = "SIGMOID";
