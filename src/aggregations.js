import { sum, mean, median2 } from "./mathUtil.js";

// Aggregation Functions
function productAggregation(x) {
  return Array.from(x).reduce((product, value) => product * value, 1.0);
}

function sumAggregation(x) {
  return sum(x);
}

function maxAggregation(x) {
  return Math.max(...x);
}

function minAggregation(x) {
  return Math.min(...x);
}

function maxabsAggregation(x) {
  const arr = Array.from(x);
  if (arr.length === 0) {
    throw new Error("maxabsAggregation() arg is an empty sequence");
  }
  return arr.reduce((a, b) => (Math.abs(a) > Math.abs(b) ? a : b));
}

function medianAggregation(x) {
  return median2(x);
}

function meanAggregation(x) {
  return mean(x);
}

export class InvalidAggregationFunctionError extends Error {
  constructor(message) {
    super(message);
    this.name = "InvalidAggregationFunctionError";
  }
}

function validateAggregation(func) {
  if (typeof func !== "function") {
    throw new InvalidAggregationFunctionError("A function object is required.");
  }
  if (func.length < 1) {
    throw new InvalidAggregationFunctionError(
      "A function taking at least one argument is required",
    );
  }
}

export class AggregationFunctionSet {
  constructor() {
    this.functions = {};
    this.add("product", productAggregation);
    this.add("sum", sumAggregation);
    this.add("max", maxAggregation);
    this.add("min", minAggregation);
    this.add("maxabs", maxabsAggregation);
    this.add("median", medianAggregation);
    this.add("mean", meanAggregation);
  }

  add(name, func) {
    validateAggregation(func);
    this.functions[name] = func;
  }

  get(name) {
    const func = this.functions[name];
    if (func === undefined) {
      throw new InvalidAggregationFunctionError(
        `No such aggregation function: '${name}'`,
      );
    }
    return func;
  }

  isValid(name) {
    return name in this.functions;
  }
}
