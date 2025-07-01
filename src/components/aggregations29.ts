import { mean, median2 as median } from "./mathUtil29";

type AggregationFunction = (x: number[]) => number;

export const productAggregation = (x: number[]): number => {
  return x.reduce((product, value) => product * value, 1.0);
};

export const sumAggregation = (x: number[]): number => {
  return x.reduce((sum, value) => sum + value, 0.0);
};

export const maxAggregation = (x: number[]): number => {
  return x.reduce((a, b) => Math.max(a, b));
};

export const minAggregation = (x: number[]): number => {
  return x.reduce((a, b) => Math.min(a, b));
};

export const maxabsAggregation = (x: number[]): number => {
  return x.reduce((a, b) => (Math.abs(a) > Math.abs(b) ? a : b));
};

export const medianAggregation = (x: number[]): number => {
  return median(x);
};

export const meanAggregation = (x: number[]): number => {
  return mean(x);
};

export class InvalidAggregationFunction extends TypeError {}

export function validateAggregation(func: any): void {
  if (typeof func !== "function") {
    throw new InvalidAggregationFunction("A function object is required.");
  }
  if (func.length < 1) {
    throw new InvalidAggregationFunction(
      "A function taking at least one argument is required",
    );
  }
}

export class AggregationFunctionSet {
  private functions: { [key: string]: AggregationFunction } = {};

  constructor() {
    this.add("product", productAggregation);
    this.add("sum", sumAggregation);
    this.add("max", maxAggregation);
    this.add("min", minAggregation);
    this.add("maxabs", maxabsAggregation);
    this.add("median", medianAggregation);
    this.add("mean", meanAggregation);
  }

  public add(name: string, func: AggregationFunction): void {
    validateAggregation(func);
    this.functions[name] = func;
  }

  public get(name: string): AggregationFunction {
    const f = this.functions[name];
    if (f === undefined) {
      throw new InvalidAggregationFunction(
        `No such aggregation function: '${name}'`,
      );
    }
    return f;
  }

  public isValid(name: string): boolean {
    return name in this.functions;
  }
}
