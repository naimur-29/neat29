console.log("hello world!");
function weightedRandomSelection(arr) {
  // Step 1: Assign weights (higher rank = higher probability)
  const weights = arr.map((_, index) => 1 / (index + 1)); // Using inverse rank weighting

  // Step 2: Normalize the weights to create probabilities
  const totalWeight = weights.reduce((sum, w) => sum + w, 0);
  const probabilities = weights.map((w) => w / totalWeight);

  // Step 3: Generate a weighted random selection
  let rand = Math.random();
  let cumulativeProbability = 0;

  for (let i = 0; i < arr.length; i++) {
    cumulativeProbability += probabilities[i];
    if (rand < cumulativeProbability) {
      return arr[i]; // Return the chosen object
    }
  }
}

// Example usage
const items = [{ name: "A" }, { name: "B" }, { name: "C" }, { name: "D" }];
const chosenItem = weightedRandomSelection(items);
console.log(chosenItem);
