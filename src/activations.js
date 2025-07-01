/**
 * Has the built-in activation functions,
 * code for using them,
 * and code for adding new user-defined ones.
 */

// --- Built-in Activation Functions ---

function sigmoidActivation(z) {
  z = Math.max(-60.0, Math.min(60.0, 5.0 * z));
  return 1.0 / (1.0 + Math.exp(-z));
}

function tanhActivation(z) {
  z = Math.max(-60.0, Math.min(60.0, 2.5 * z));
  return Math.tanh(z);
}

function sinActivation(z) {
  z = Math.max(-60.0, Math.min(60.0, 5.0 * z));
  return Math.sin(z);
}

function gaussActivation(z) {
  z = Math.max(-3.4, Math.min(3.4, z));
  return Math.exp(-5.0 * z * z);
}

function reluActivation(z) {
  return z > 0.0 ? z : 0.0;
}

function eluActivation(z) {
  return z > 0.0 ? z : Math.exp(z) - 1;
}

function leluActivation(z) {
  const leaky = 0.005;
  return z > 0.0 ? z : leaky * z;
}

function seluActivation(z) {
  const lam = 1.0507009873554804934193349852946;
  const alpha = 1.6732632423543772848170429916717;
  return z > 0.0 ? lam * z : lam * alpha * (Math.exp(z) - 1);
}

function softplusActivation(z) {
  z = Math.max(-60.0, Math.min(60.0, 5.0 * z));
  return 0.2 * Math.log(1 + Math.exp(z));
}

function identityActivation(z) {
  return z;
}

function clampedActivation(z) {
  return Math.max(-1.0, Math.min(1.0, z));
}

function invActivation(z) {
  // In JS, division by zero results in Infinity, not an error.
  // We handle this explicitly to match the Python's intent.
  if (z === 0) {
    return 0.0;
  }
  const result = 1.0 / z;
  return isFinite(result) ? result : 0.0;
}

function logActivation(z) {
  z = Math.max(1e-7, z);
  return Math.log(z);
}

function expActivation(z) {
  z = Math.max(-60.0, Math.min(60.0, z));
  return Math.exp(z);
}

function absActivation(z) {
  return Math.abs(z);
}

function hatActivation(z) {
  return Math.max(0.0, 1 - Math.abs(z));
}

function squareActivation(z) {
  return z * z;
}

function cubeActivation(z) {
  return z * z * z;
}

// --- Error Handling and Validation ---

/**
 * Custom error for invalid activation functions.
 * Extends the built-in Error class.
 */
export class InvalidActivationFunctionError extends Error {
  constructor(message) {
    super(message);
    this.name = "InvalidActivationFunctionError";
  }
}

/**
 * Validates that the given item is a function that accepts a single argument.
 * @param {any} func The item to validate.
 */
function validateActivation(func) {
  if (typeof func !== "function") {
    throw new InvalidActivationFunctionError("A function object is required.");
  }
  // In JS, a function's `length` property returns its arity (number of declared parameters).
  if (func.length !== 1) {
    throw new InvalidActivationFunctionError(
      "A single-argument function is required.",
    );
  }
}

// --- Main Class to Manage Activation Functions ---

/**
 * Contains the list of current valid activation functions,
 * including methods for adding and getting them.
 */
export class ActivationFunctionSet {
  constructor() {
    this.functions = {};
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

  /**
   * Adds a new activation function to the set.
   * @param {string} name - The name for the function.
   * @param {function} func - The function to add. Must accept one argument.
   */
  add(name, func) {
    validateActivation(func);
    this.functions[name] = func;
  }

  /**
   * Retrieves an activation function by its name.
   * @param {string} name - The name of the function to get.
   * @returns {function} The requested activation function.
   * @throws {InvalidActivationFunctionError} if the function name is not found.
   */
  get(name) {
    const func = this.functions[name];
    if (!func) {
      throw new InvalidActivationFunctionError(
        `No such activation function: '${name}'`,
      );
    }
    return func;
  }

  /**
   * Checks if a given activation function name is valid.
   * @param {string} name - The name to check.
   * @returns {boolean} True if the function exists, false otherwise.
   */
  isValid(name) {
    return name in this.functions;
  }
}
