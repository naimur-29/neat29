import Genome29 from "./Genome29";
import { ActivationFunctionType } from "./utils";

export default class Config29 {
  inputSize: number;
  outputSize: number;
  hiddenSize: number;
  activationFunction: ActivationFunctionType;

  constructor({
    inputSize,
    outputSize,
    hiddenSize = 1,
    activationFunction,
  }: {
    inputSize: number;
    outputSize: number;
    hiddenSize?: number;
    activationFunction: ActivationFunctionType;
  }) {
    this.inputSize = inputSize;
    this.outputSize = outputSize;
    this.hiddenSize = hiddenSize;
    this.activationFunction = activationFunction;
  }

  generateGenome(): Genome29 {
    const genome = new Genome29(
      this.inputSize,
      this.outputSize,
      this.hiddenSize,
    );
    return genome;
  }
}
