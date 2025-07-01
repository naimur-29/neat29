import { DefaultNodeGene, DefaultConnectionGene } from "./src/genes.js";

export function main() {
  // --- 1. Define a Mock Configuration ---
  // Genes need a configuration object to determine how to initialize and mutate their attributes.
  // This object simulates a fully parsed configuration that would normally be loaded by your Config class.
  const mockConfig = {
    // -- Coefficient for distance calculation --
    compatibility_weight_coefficient: 0.5,

    // -- Node Gene Attributes --
    // Bias (FloatAttribute)
    bias_init_mean: 0.0,
    bias_init_stdev: 1.0,
    bias_init_type: "gaussian",
    bias_replace_rate: 0.1,
    bias_mutate_rate: 0.8,
    bias_mutate_power: 0.5,
    bias_max_value: 30.0,
    bias_min_value: -30.0,

    // Response (FloatAttribute)
    response_init_mean: 1.0,
    response_init_stdev: 0.0, // Stdev of 0 means it will always initialize to the mean
    response_init_type: "gaussian",
    response_replace_rate: 0.0,
    response_mutate_rate: 0.7,
    response_mutate_power: 0.2,
    response_max_value: 30.0,
    response_min_value: -30.0,

    // Activation (StringAttribute)
    activation_default: "random",
    activation_options: ["sigmoid", "tanh", "relu"],
    activation_mutate_rate: 0.1,

    // Aggregation (StringAttribute)
    aggregation_default: "sum",
    aggregation_options: ["sum", "product", "max"],
    aggregation_mutate_rate: 0.1,

    // -- Connection Gene Attributes --
    // Weight (FloatAttribute)
    weight_init_mean: 0.0,
    weight_init_stdev: 1.5,
    weight_init_type: "gaussian",
    weight_replace_rate: 0.1,
    weight_mutate_rate: 0.9,
    weight_mutate_power: 0.5,
    weight_max_value: 15.0,
    weight_min_value: -15.0,

    // Enabled (BoolAttribute)
    enabled_default: "true",
    enabled_mutate_rate: 0.05,
    enabled_rate_to_false_add: 0.0,
    enabled_rate_to_true_add: 0.0,
  };

  console.log("--- Demonstrating DefaultNodeGene ---");

  // --- 2. Create and Initialize a Node Gene ---
  const nodeGene1 = new DefaultNodeGene(1); // Create a node gene with key 1 (e.g., an output node)
  nodeGene1.initAttributes(mockConfig);
  console.log("Initial Node Gene 1:", nodeGene1.toString());

  // --- 3. Mutate the Node Gene ---
  // Because mutation is probabilistic, we run it multiple times to see a change.
  console.log("Mutating Node Gene 1...");
  for (let i = 0; i < 5; i++) {
    nodeGene1.mutate(mockConfig);
  }
  console.log("Mutated Node Gene 1:", nodeGene1.toString());

  // --- 4. Copying a Node Gene ---
  const nodeGene1Copy = nodeGene1.copy();
  console.log("\nCopied Node Gene:", nodeGene1Copy.toString());
  console.log(
    "Is copy the same object as original?",
    nodeGene1 === nodeGene1Copy,
  ); // false

  // --- 5. Crossover between two Node Genes ---
  const nodeGene2 = new DefaultNodeGene(1); // Must have the same key for crossover
  nodeGene2.initAttributes(mockConfig);
  // Manually set some values for a clear example
  nodeGene2.bias = 5.0;
  nodeGene2.activation = "relu";
  console.log("\nCreating Node Gene 2 for crossover:", nodeGene2.toString());

  const childNode = nodeGene1.crossover(nodeGene2);
  console.log("Child Node from Crossover:", childNode.toString());
  console.log(`(Child inherits attributes randomly from Gene 1 and Gene 2)`);

  // --- 6. Calculate Distance between two Node Genes ---
  // Manually set values for a clear distance calculation
  nodeGene1.bias = -2.3;
  nodeGene1.response = 0.9;
  nodeGene1.activation = "sigmoid";
  nodeGene1.aggregation = "sum";

  nodeGene2.bias = 1.8;
  nodeGene2.response = 1.2;
  nodeGene2.activation = "tanh"; // different activation adds 1.0 to distance
  nodeGene2.aggregation = "sum"; // same aggregation
  console.log("\nCalculating distance between:");
  console.log("Gene 1:", nodeGene1.toString());
  console.log("Gene 2:", nodeGene2.toString());
  const nodeDistance = nodeGene1.distance(nodeGene2, mockConfig);
  console.log(`Compatibility Distance: ${nodeDistance.toFixed(4)}`);

  console.log("\n\n--- Demonstrating DefaultConnectionGene ---");

  // --- 7. Create and Initialize a Connection Gene ---
  const connGene1 = new DefaultConnectionGene([10, 1]); // Connection from node 10 to node 1
  connGene1.initAttributes(mockConfig);
  console.log("Initial Connection Gene 1:", connGene1.toString());

  // --- 8. Mutate the Connection Gene ---
  console.log("Mutating Connection Gene 1...");
  connGene1.mutate(mockConfig);
  console.log("Mutated Connection Gene 1:", connGene1.toString());

  // --- 9. Crossover between two Connection Genes ---
  const connGene2 = new DefaultConnectionGene([10, 1]); // Must have same key
  connGene2.initAttributes(mockConfig);
  // Manually set values for a clear example
  connGene2.weight = -3.14;
  connGene2.enabled = false;
  console.log(
    "\nCreating Connection Gene 2 for crossover:",
    connGene2.toString(),
  );

  const childConn = connGene1.crossover(connGene2);
  console.log("Child Connection from Crossover:", childConn.toString());

  // --- 10. Calculate Distance between Connection Genes ---
  console.log("\nCalculating distance between:");
  console.log("Gene 1:", connGene1.toString());
  console.log("Gene 2:", connGene2.toString());
  const connDistance = connGene1.distance(connGene2, mockConfig);
  console.log(`Compatibility Distance: ${connDistance.toFixed(4)}`);
}
