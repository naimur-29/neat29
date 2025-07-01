// exampleUsage.js
import {
  createsCycle,
  requiredForOutput,
  feedForwardLayers,
} from "./src/graphs.js";

export function main() {
  // Define a simple feed-forward network structure.
  // Inputs: 0, 1
  // Outputs: 4
  // Hidden: 2, 3
  const inputs = [0, 1];
  const outputs = [4];
  const connections = [
    [0, 2], // Input 0 -> Hidden 2
    [1, 2], // Input 1 -> Hidden 2
    [0, 3], // Input 0 -> Hidden 3
    [2, 4], // Hidden 2 -> Output 4
    [3, 4], // Hidden 3 -> Output 4
    [1, 5], // A "dangling" node 5 that is not required for output
  ];

  console.log("--- Testing createsCycle ---");
  // Test 1: A valid feed-forward connection.
  const validConnection = [2, 3];
  console.log(
    `Adding connection [2, 3] creates cycle:`,
    createsCycle(connections, validConnection),
  ); // false

  // Test 2: A connection that creates a cycle (4 -> 2).
  const cycleConnection = [4, 2];
  console.log(
    `Adding connection [4, 2] creates cycle:`,
    createsCycle(connections, cycleConnection),
  ); // true

  // Test 3: A self-loop.
  const selfLoop = [3, 3];
  console.log(
    `Adding connection [3, 3] creates cycle:`,
    createsCycle(connections, selfLoop),
  ); // true

  console.log("\n--- Testing requiredForOutput ---");
  const required = requiredForOutput(inputs, outputs, connections);
  console.log("Required nodes (should be 2, 3, 4):", required);

  console.log("\n--- Testing feedForwardLayers ---");
  const layers = feedForwardLayers(inputs, outputs, connections);
  console.log("Feed-forward layers:");
  layers.forEach((layer, i) => console.log(`Layer ${i}:`, layer));
  // Expected output:
  // Layer 0: Set { 2, 3 }
  // Layer 1: Set { 4 }
}
