import { DefaultGenome } from "./src/genome.js";

export function main() {
  // The mock config is already in snake_case, so it's correct.
  const mockRawConfig = {
    num_inputs: 2,
    num_outputs: 1,
    num_hidden: 1,
    feed_forward: true,
    initial_connection: "full_nodirect",
    compatibility_disjoint_coefficient: 1.0,
    compatibility_weight_coefficient: 0.5,
    conn_add_prob: 0.1,
    conn_delete_prob: 0.1,
    node_add_prob: 0.05,
    node_delete_prob: 0.05,
    single_structural_mutation: false,
    bias_init_mean: 0.0,
    bias_init_stdev: 1.0,
    bias_replace_rate: 0.1,
    bias_mutate_rate: 0.7,
    bias_mutate_power: 0.5,
    bias_max_value: 30.0,
    bias_min_value: -30.0,
    response_init_mean: 1.0,
    response_init_stdev: 0.0,
    response_replace_rate: 0.0,
    response_mutate_rate: 0.0,
    response_mutate_power: 0.0,
    response_max_value: 30.0,
    response_min_value: -30.0,
    activation_default: "sigmoid",
    activation_options: ["sigmoid", "tanh", "relu"],
    activation_mutate_rate: 0.0,
    aggregation_default: "sum",
    aggregation_options: ["sum", "product"],
    aggregation_mutate_rate: 0.0,
    weight_init_mean: 0.0,
    weight_init_stdev: 1.0,
    weight_replace_rate: 0.1,
    weight_mutate_rate: 0.8,
    weight_mutate_power: 0.5,
    weight_max_value: 15.0,
    weight_min_value: -15.0,
    enabled_default: "true",
    enabled_mutate_rate: 0.01,
  };

  console.log("--- Step 1: Create Genome Configuration ---");
  const genomeConfig = DefaultGenome.parseConfig(mockRawConfig);
  console.log("GenomeConfig created successfully.");
  console.log(`Input keys: [${genomeConfig.input_keys}]`); // snake_case
  console.log(`Output keys: [${genomeConfig.output_keys}]`); // snake_case
  console.log(`Initial connection type: ${genomeConfig.initial_connection}`); // snake_case

  console.log("\n--- Step 2: Create a New Genome (Parent 1) ---");
  const parent1 = new DefaultGenome(1);
  parent1.configure_new(genomeConfig);
  parent1.fitness = 10.0;
  console.log("Parent 1 (initial state):");
  console.log(parent1.toString());

  console.log("\n--- Step 3: Mutate Parent 1 ---");
  for (let i = 0; i < 5; i++) parent1.mutate(genomeConfig);
  console.log("Parent 1 (after mutation):");
  console.log(parent1.toString());

  console.log("\n--- Step 4: Create a Second Genome (Parent 2) ---");
  const parent2 = new DefaultGenome(2);
  parent2.configure_new(genomeConfig);
  parent2.fitness = 8.0;
  console.log("Parent 2 (initial state):");
  console.log(parent2.toString());

  console.log("\n--- Step 5: Crossover ---");
  const child = new DefaultGenome(3);
  child.configure_crossover(parent1, parent2);
  console.log("Child Genome (from crossover):");
  console.log(child.toString());

  console.log("\n--- Step 6: Calculate Genetic Distance ---");
  const distance = parent1.distance(parent2, genomeConfig);
  console.log(
    `Genetic distance between Parent 1 and Parent 2: ${distance.toFixed(4)}`,
  );

  console.log("\n--- Verification Complete ---");
}
