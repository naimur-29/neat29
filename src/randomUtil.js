/**
 * A collection of random number generation utilities, mimicking Python's `random` module.
 */

/**
 * Returns a random float in the range [0.0, 1.0).
 * @returns {number}
 */
export const random = () => Math.random();

/**
 * Returns a random floating point number N such that min <= N <= max.
 * @param {number} min - The minimum value.
 * @param {number} max - The maximum value.
 * @returns {number}
 */
export const uniform = (min, max) => min + Math.random() * (max - min);

/**
 * Returns a random integer N such that min <= N <= max.
 * @param {number} min - The minimum integer value.
 * @param {number} max - The maximum integer value.
 * @returns {number}
 */
export const randint = (min, max) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

/**
 * Returns a random element from a non-empty array.
 * @param {Array<T>} arr - The array to choose from.
 * @returns {T} A random element from the array.
 */
export const choice = (arr) => {
  if (!arr || arr.length === 0) {
    throw new Error("Cannot choose from an empty array.");
  }
  return arr[Math.floor(Math.random() * arr.length)];
};

// --- Gaussian (Normal) Distribution ---
// Uses the Box-Muller transform to generate a normally distributed random number.
let _z1 = null;
let _generate = false;

/**
 * Returns a random number from a Gaussian (normal) distribution.
 * @param {number} mean - The mean of the distribution.
 * @param {number} stdev - The standard deviation of the distribution.
 * @returns {number}
 */
export const gauss = (mean, stdev) => {
  _generate = !_generate;

  if (!_generate) {
    return _z1 * stdev + mean;
  }

  let u1, u2;
  do {
    u1 = random();
    u2 = random();
  } while (u1 <= Number.EPSILON);

  const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
  _z1 = Math.sqrt(-2.0 * Math.log(u1)) * Math.sin(2.0 * Math.PI * u2);

  return z0 * stdev + mean;
};
