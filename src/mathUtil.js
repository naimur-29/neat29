/**
 * Commonly used statistical functions.
 * (Inspired by functions that were not in Python 2's standard library).
 */

// --- Helper functions (equivalent to Python built-ins) ---

/**
 * Calculates the sum of an array of numbers.
 * @param {number[]} values - An array of numbers.
 * @returns {number} The sum of the numbers.
 */
export const sum = (values) =>
  values.reduce((acc, val) => (!Number.isNaN(val) ? acc + val : acc + 0), 0);

// --- Main Statistical Functions ---

/**
 * Calculates the arithmetic mean (average) of a set of values.
 * @param {number[]} values - An array of numbers.
 * @returns {number} The mean of the values.
 */
export function mean(values) {
  const arr = Array.from(values);
  if (arr.length === 0) return 0;
  return sum(arr) / arr.length;
}

/**
 * Calculates the median of a set of values (simple version).
 * Note: For even-length arrays, this returns the lower of the two middle elements.
 * @param {number[]} values - An array of numbers.
 * @returns {number} The median value.
 */
export function median(values) {
  const arr = Array.from(values);
  if (arr.length === 0) return 0;
  // Sorts numbers correctly (unlike the default string sort)
  arr.sort((a, b) => a - b);
  const midIndex = Math.floor(arr.length / 2);
  return arr[midIndex];
}

/**
 * Calculates the true median of a set of values.
 * Averages the two middle elements for even-length arrays.
 * @param {number[]} values - An array of numbers.
 * @returns {number} The median value.
 */
export function median2(values) {
  const arr = Array.from(values);
  const n = arr.length;

  if (n === 0) return 0;
  if (n <= 2) return mean(arr);

  arr.sort((a, b) => a - b);

  if (n % 2 === 1) {
    // Odd number of elements
    return arr[Math.floor(n / 2)];
  } else {
    // Even number of elements
    const i = n / 2;
    return (arr[i - 1] + arr[i]) / 2.0;
  }
}

/**
 * Calculates the population variance of a set of values.
 * @param {number[]} values - An array of numbers.
 * @returns {number} The variance.
 */
export function variance(values) {
  const arr = Array.from(values);
  if (arr.length === 0) return 0;
  const m = mean(arr);
  const sumOfSquares = arr.reduce(
    (acc, val) => (!Number.isNaN(val) ? acc + (val - m) ** 2 : acc + 0),
    0,
  );
  return sumOfSquares / arr.length;
}

/**
 * Calculates the population standard deviation of a set of values.
 * @param {number[]} values - An array of numbers.
 * @returns {number} The standard deviation.
 */
export function stdev(values) {
  return Math.sqrt(variance(values));
}

/**
 * Computes the softmax of a set of values.
 * Softmax converts a vector of numbers into a probability distribution.
 * @param {number[]} values - An array of numbers.
 * @returns {number[]} A new array with the softmax-applied values.
 */
export function softmax(values) {
  const arr = Array.from(values);
  if (arr.length === 0) return [];
  const expValues = arr.map((v) => Math.exp(v));
  const sumExpValues = sum(expValues);
  if (sumExpValues === 0) {
    // Avoid division by zero; return a uniform distribution
    return arr.map(() => 1 / arr.length);
  }
  return expValues.map((ev) => ev / sumExpValues);
}

// --- Lookup table for commonly used functions ---

/**
 * A collection of statistical functions accessible by name.
 */
export const statFunctions = {
  // Math.min/max work on arguments, not arrays, so we wrap them.
  min: (values) => Math.min(...values),
  max: (values) => Math.max(...values),
  mean: mean,
  median: median,
  median2: median2, // The more correct median implementation
};
