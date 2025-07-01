type ActivationFunction = (z: number) => number;

export const sigmoidActivation = (z: number): number => {
  z = Math.max(-60.0, Math.min(60.0, 5.0 * z));
  return 1.0 / (1.0 + Math.exp(-z));
};

export const tanhActivation = (z: number): number => {
  z = Math.max(-60.0, Math.min(60.0, 2.5 * z));
  return Math.tanh(z);
};

export const sinActivation = (z: number): number => {
  z = Math.max(-60.0, Math.min(60.0, 5.0 * z));
  return Math.sin(z);
};

export const gaussActivation = (z: number): number => {
  z = Math.max(-3.4, Math.min(3.4, z));
  return Math.exp(-5.0 * z ** 2);
};

export const reluActivation = (z: number): number => {
  return z > 0.0 ? z : 0.0;
};

export const eluActivation = (z: number): number => {
  return z > 0.0 ? z : Math.exp(z) - 1;
};

export const leluActivation = (z: number): number => {
  const leaky = 0.005;
  return z > 0.0 ? z : leaky * z;
};

export const seluActivation = (z: number): number => {
  const lam = 1.0507009873554804934193349852946;
  const alpha = 1.6732632423543772848170429916717;
  return z > 0.0 ? lam * z : lam * alpha * (Math.exp(z) - 1);
};

export const softplusActivation = (z: number): number => {
  z = Math.max(-60.0, Math.min(60.0, 5.0 * z));
  return 0.2 * Math.log(1 + Math.exp(z));
};

export const identityActivation = (z: number): number => {
  return z;
};

export const clampedActivation = (z: number): number => {
  return Math.max(-1.0, Math.min(1.0, z));
};

export const invActivation = (z: number): number => {
  if (z === 0.0) {
    return 0.0;
  }
  return 1.0 / z;
};

export const logActivation = (z: number): number => {
  z = Math.max(1e-7, z);
  return Math.log(z);
};

export const expActivation = (z: number): number => {
  z = Math.max(-60.0, Math.min(60.0, z));
  return Math.exp(z);
};

export const absActivation = (z: number): number => {
  return Math.abs(z);
};

export const hatActivation = (z: number): number => {
  return Math.max(0.0, 1 - Math.abs(z));
};

export const squareActivation = (z: number): number => {
  return z ** 2;
};

export const cubeActivation = (z: number): number => {
  return z ** 3;
};

export class InvalidActivationFunction extends TypeError {}

export function validateActivation(func: any): void {
  if (typeof func !== "function") {
    throw new InvalidActivationFunction("A function object is required.");
  }

  if (func.length !== 1) {
    throw new InvalidActivationFunction(
      "A single-argument function is required.",
    );
  }
}

export class ActivationFunctionSet {
  private functions: { [key: string]: ActivationFunction } = {};

  constructor() {
    this.add("sigmoid", sigmoidActivation);
    this.add("tanh", tanhActivation);
    this.add("sin", sinActivation);
    this.add("gauss", gaussActivation);
    this.add("relu", reluActivation);
    this.add("elu", eluActivation);
    this.add("lelu", leluActivation);
    this.add("selu", seluActivation);
    this.add("softplus", softplusActivation);
    this.add("identity", identityActivation);
    this.add("clamped", clampedActivation);
    this.add("inv", invActivation);
    this.add("log", logActivation);
    this.add("exp", expActivation);
    this.add("abs", absActivation);
    this.add("hat", hatActivation);
    this.add("square", squareActivation);
    this.add("cube", cubeActivation);
  }

  public add(name: string, func: ActivationFunction): void {
    validateActivation(func);
    this.functions[name] = func;
  }

  public get(name: string): ActivationFunction {
    const f = this.functions[name];
    if (f === undefined) {
      throw new InvalidActivationFunction(
        `No such activation function: '${name}'`,
      );
    }
    return f;
  }

  public isValid(name: string): boolean {
    return name in this.functions;
  }
}
