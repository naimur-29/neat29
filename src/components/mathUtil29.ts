export const mean = (values: number[]): number => {
  if (values.length === 0) {
    throw new Error("Cannot calculate mean of an empty array.");
  }
  return values.reduce((sum, val) => sum + val, 0) / values.length;
};

export const median = (values: number[]): number => {
  if (values.length === 0) {
    throw new Error("Cannot calculate median of an empty array.");
  }
  const sortedValues = [...values].sort((a, b) => a - b);
  return sortedValues[Math.floor(sortedValues.length / 2)];
};

export const median2 = (values: number[]): number => {
  const n = values.length;
  if (n === 0) {
    throw new Error("Cannot calculate median of an empty array.");
  }
  if (n <= 2) {
    return mean(values);
  }
  const sortedValues = [...values].sort((a, b) => a - b);
  if (n % 2 === 1) {
    return sortedValues[Math.floor(n / 2)];
  }
  const i = n / 2;
  return (sortedValues[i - 1] + sortedValues[i]) / 2.0;
};

export const variance = (values: number[]): number => {
  if (values.length === 0) {
    throw new Error("Cannot calculate variance of an empty array.");
  }
  const m = mean(values);
  return (
    values.map((v) => (v - m) ** 2).reduce((sum, val) => sum + val, 0) /
    values.length
  );
};

export const stdev = (values: number[]): number => {
  return Math.sqrt(variance(values));
};

export const softmax = (values: number[]): number[] => {
  const eValues = values.map((v) => Math.exp(v));
  const s = eValues.reduce((sum, val) => sum + val, 0);
  if (s === 0) {
    return Array(values.length).fill(1 / values.length);
  }
  const invS = 1.0 / s;
  return eValues.map((ev) => ev * invS);
};

type StatFunction = (values: number[]) => number;

const minFunc = (values: number[]): number => {
  if (values.length === 0) {
    throw new Error("min() arg is an empty sequence");
  }
  return Math.min(...values);
};

const maxFunc = (values: number[]): number => {
  if (values.length === 0) {
    throw new Error("max() arg is an empty sequence");
  }
  return Math.max(...values);
};

export const statFunctions: { [key: string]: StatFunction } = {
  min: minFunc,
  max: maxFunc,
  mean: mean,
  median: median,
  median2: median2,
};
