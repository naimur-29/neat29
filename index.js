import { DefaultReproduction } from "./src/reproduction.js";
import { DefaultStagnation } from "./src/stagnation.js"; // From previous translation
import { DefaultSpeciesSet, Species } from "./src/species.js"; // From previous translation
import { ReporterSet, StdOutReporter } from "./src/reporting.js"; // From previous translation
import { DefaultGenome } from "./src/genome.js"; // From previous translation

export function main() {
  // --- 1. Define a SINGLE, comprehensive raw config object ---
  const raw_config = {
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

  // Helper function to create a filtered config object for a specific class.
  function create_sub_config(config, class_def) {
    const sub_config = {};
    const param_names = class_def.get_config_params().map((p) => p.name);
    for (const name of param_names) {
      if (config[name] !== undefined) {
        sub_config[name] = config[name];
      }
    }
    return sub_config;
  }

  // --- 2. Setup All Components ---
  const reporters = new ReporterSet();
  reporters.add(new StdOutReporter(true));

  // Create each component's config object using its static `parse_config` method.
  // This encapsulates the creation logic within each class.
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

  // Instantiate the main components, passing in their specific config objects.
  const stagnation = new DefaultStagnation(stagnation_config, reporters);
  const species_set = new DefaultSpeciesSet(species_set_config, reporters);
  const reproduction = new DefaultReproduction(
    reproduction_config,
    reporters,
    stagnation,
  );

  // Create a main config object that holds all component instances/configs
  const main_config = {
    genome_type: DefaultGenome,
    genome_config: genome_config,
    reproduction: reproduction,
    stagnation: stagnation,
    species_set: species_set,
  };

  // --- 3. Create a mock population and speciate it ---
  const pop_size = 10;
  let population = reproduction.create_new(
    DefaultGenome,
    genome_config,
    pop_size,
  );

  for (const genome of population.values()) {
    genome.fitness = Math.random() * 100;
  }
  species_set.speciate(main_config, population, 0);
  console.log(
    `Initial population created with ${population.size} members in ${species_set.species.size} species.`,
  );

  // --- 4. Run the reproduce method to create the next generation ---
  let generation = 1;
  console.log(`\n--- Reproducing to create generation ${generation} ---`);
  const new_population = reproduction.reproduce(
    main_config,
    species_set,
    pop_size,
    generation,
  );

  // --- 5. Inspect Results ---
  console.log(`\nNew population created with ${new_population.size} members.`);
  console.log(
    `Remaining species after reproduction: ${species_set.species.size}`,
  );

  // Verify that the new genomes have ancestors
  const first_new_genome_key = Array.from(new_population.keys())[
    reproduction_config.elitism
  ]; // Get a non-elite
  if (first_new_genome_key) {
    const ancestors = reproduction.ancestors.get(first_new_genome_key);
    console.log(
      `Genome ${first_new_genome_key} was created from parents: [${ancestors}]`,
    );
  } else {
    console.log("No non-elite genomes were created in this small example.");
  }

  // The new population is now ready for the next round of evaluation.
  population = new_population;
}
