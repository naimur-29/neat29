import { Population } from "./src/population.js";
import { DefaultReproduction } from "./src/reproduction.js";
import { DefaultStagnation } from "./src/stagnation.js";
import { DefaultSpeciesSet } from "./src/species.js";
import { ReporterSet, StdOutReporter } from "./src/reporting.js";
import { DefaultGenome } from "./src/genome.js";

export function main() {
  // --- 1. Define the main configuration ---
  let raw_config = {
    // Genome & Attributes
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
    // Stagnation
    species_fitness_func: "max",
    max_stagnation: 15,
    species_elitism: 1,
    // Reproduction
    elitism: 1,
    survival_threshold: 0.2,
    min_species_size: 2,
    // Species
    compatibility_threshold: 3.0,
  };

  raw_config = {
    ...raw_config,

    // Population
    pop_size: 50,
    fitness_criterion: "max",
    fitness_threshold: 95.0,
    no_fitness_termination: false,
    reset_on_extinction: true,
    // Genome
    num_inputs: 2,
    num_outputs: 1,
    num_hidden: 0,
    feed_forward: true,
    // ... other component configs ...
    compatibility_threshold: 3.0,
    elitism: 2,
    max_stagnation: 15,
    species_fitness_func: "mean",
    // ... and all the attribute configs ...
  };

  // --- 2. Create Component Instances ---
  function create_sub_config(config, class_def) {
    const sub_config = {};
    const param_names = class_def.get_config_params().map((p) => p.name);
    for (const name of param_names) {
      if (config[name] !== undefined) sub_config[name] = config[name];
    }
    return sub_config;
  }

  const reporters = new ReporterSet();
  reporters.add(new StdOutReporter(true));

  const genome_config = DefaultGenome.parseConfig(raw_config);
  const stagnation_config = DefaultStagnation.parse_config(
    create_sub_config(raw_config, DefaultStagnation),
  );
  const reproduction_config = DefaultReproduction.parse_config(
    create_sub_config(raw_config, DefaultReproduction),
  );
  const species_set_config = DefaultSpeciesSet.parse_config(
    create_sub_config(raw_config, DefaultSpeciesSet),
  );

  const stagnation = new DefaultStagnation(stagnation_config, reporters);
  const species_set = new DefaultSpeciesSet(species_set_config, reporters);
  const reproduction = new DefaultReproduction(
    reproduction_config,
    reporters,
    stagnation,
  );

  // --- 3. Create the main, top-level config object for the Population ---
  const main_config = {
    // Pass raw population configs directly
    ...raw_config,
    // Pass component instances
    genome_type: DefaultGenome,
    genome_config: genome_config,
    reproduction: reproduction,
    stagnation: stagnation,
    species_set: species_set,
  };

  // --- 4. Define the Fitness Function ---
  // This is the core task-specific part you provide.
  // It must be an `async` function.
  async function eval_genomes(population, config) {
    // Example: A simple fitness function where fitness is higher
    // for genomes that are "close" to a target value.
    const target = 0.5;
    for (const genome of population.values()) {
      // In a real scenario, you would create a phenotype (neural network)
      // from the genome and evaluate its performance on a task.
      // Here, we'll just use a mock value based on its first gene's weight.
      const first_conn = Object.values(genome.connections)[0];
      const weight = first_conn ? first_conn.weight : 0;

      // Fitness is 100 - distance from target
      const distance = Math.abs(weight - target);
      genome.fitness = 100.0 - distance;
    }
  }

  // --- 5. Run the evolution ---
  async function run_evolution() {
    // Create the population.
    const p = new Population(main_config);

    // Add reporters.
    p.add_reporter(new StdOutReporter(true));

    // Run the algorithm for up to 50 generations.
    try {
      const winner = await p.run(eval_genomes, 50);
      console.log("\n--- Evolution Complete ---");
      console.log("Best genome found:");
      console.log(winner.toString());
    } catch (e) {
      console.error("Evolution failed:", e);
    }
  }

  // Start the process
  run_evolution();
}
