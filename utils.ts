import Agent29 from "./Agent29";

export type ActivationFunctionType = "SIGMOID" | "TANH";
export const activationFunctions = {
  SIGMOID: (x: number): number => 1 / (1 + Math.exp(-x)),
  TANH: (x: number): number => Math.tanh(x),
};

export function random(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

export function weightedAverage(
  value1: number,
  value2: number,
  weight1: number,
  weight2: number,
): number {
  return (value1 * weight1 + value2 * weight2) / (weight1 + weight2);
}

export function weightedRandomSelection<T>(arr: T[]): T | undefined {
  if (arr.length === 0) return undefined;

  const weights = arr.map((_, index) => 1 / (index + 1)); // Inverse rank weighting
  const totalWeight = weights.reduce((sum, w) => sum + w, 0);
  const probabilities = weights.map((w) => w / totalWeight);

  let rand = Math.random();
  let cumulativeProbability = 0;

  for (let i = 0; i < arr.length; i++) {
    cumulativeProbability += probabilities[i];
    if (rand < cumulativeProbability) {
      return arr[i]; // Return the chosen object
    }
  }

  return arr[arr.length - 1]; // Fallback (shouldn't happen)
}

export function selectTwoUnique<T>(arr: T[]): [T, T] | [] {
  if (arr.length < 2) return []; // Ensure the return type is always iterable

  const first = weightedRandomSelection(arr);
  if (!first) return [];

  // Remove the first selection to avoid duplicates
  const remainingArr = arr.filter((item) => item !== first);

  const second = weightedRandomSelection(remainingArr);
  if (!second) return [];

  return [first, second];
}

// Example diversity function: higher value means more different.
export function getDiversity(agent1: Agent29, agent2: Agent29): number {
  let sumDiff = 0;
  let count = 0;

  // Compare hidden nodes
  for (let i = 0; i < agent1.genome.hiddenNodes.length; i++) {
    const node1 = agent1.genome.hiddenNodes[i];
    const node2 = agent2.genome.hiddenNodes[i];
    for (let k = 0; k < node1.connections.length; k++) {
      sumDiff += Math.abs(
        node1.connections[k].weight - node2.connections[k].weight,
      );
      sumDiff += Math.abs(
        node1.connections[k].bias - node2.connections[k].bias,
      );
      count += 2;
    }
  }

  // Compare output nodes
  for (let i = 0; i < agent1.genome.outputNodes.length; i++) {
    const node1 = agent1.genome.outputNodes[i];
    const node2 = agent2.genome.outputNodes[i];
    for (let k = 0; k < node1.connections.length; k++) {
      sumDiff += Math.abs(
        node1.connections[k].weight - node2.connections[k].weight,
      );
      sumDiff += Math.abs(
        node1.connections[k].bias - node2.connections[k].bias,
      );
      count += 2;
    }
  }

  const avgDiff = count > 0 ? sumDiff / count : 0;
  // If weights and biases are roughly in [-1,1], the maximum average difference might be about 2.
  return Math.min(avgDiff / 2, 1); // Normalize diversity to [0, 1]
}

export function weightedDiversityRandomSelection<T>(
  arr: T[],
  reference: T,
  diversityFn: (a: T, b: T) => number,
): T | undefined {
  if (arr.length === 0) return undefined;

  // Here we assume arr is sorted by fitness (best first).
  // Calculate composite weights: rank weight * diversity factor.
  const weights = arr.map((item, index) => {
    const rankWeight = 1 / (index + 1);
    const diversityFactor = diversityFn(reference, item);
    return rankWeight * diversityFactor;
  });

  const totalWeight = weights.reduce((sum, w) => sum + w, 0);
  if (totalWeight === 0) return weightedRandomSelection(arr); // fallback if all diversity factors are 0

  const probabilities = weights.map((w) => w / totalWeight);

  let rand = Math.random();
  let cumulativeProbability = 0;
  for (let i = 0; i < arr.length; i++) {
    cumulativeProbability += probabilities[i];
    if (rand < cumulativeProbability) {
      return arr[i];
    }
  }
  return arr[arr.length - 1];
}

export function selectTwoUniqueWithDiversity<T>(
  arr: T[],
  diversityFn: (a: T, b: T) => number,
): [T, T] | [] {
  if (arr.length < 2) return [];

  // Select the first parent by rank.
  const first = weightedRandomSelection(arr);
  if (!first) return [];

  // Remove the first from the candidate pool.
  const remainingArr = arr.filter((item) => item !== first);

  // Select the second using diversity bias (combining rank and how different it is from the first).
  const second = weightedDiversityRandomSelection(
    remainingArr,
    first,
    diversityFn,
  );
  if (!second) return [];

  return [first, second];
}
