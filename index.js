import { Population } from "./src/population.js";
import { Checkpointer } from "./src/checkpoint.js";
import { DefaultReproduction } from "./src/reproduction.js";
import { DefaultStagnation } from "./src/stagnation.js";
import { DefaultSpeciesSet } from "./src/species.js";
import { ReporterSet, StdOutReporter } from "./src/reporting.js";
import { DefaultGenome } from "./src/genome.js";
import { FeedForwardNetwork } from "./src/nn.js";

export function main() {
  // --- 1. Define the XOR problem data and configuration ---

  const xor_inputs = [
    [0.0, 0.0],
    [0.0, 1.0],
    [1.0, 0.0],
    [1.0, 1.0],
  ];
  const xor_outputs = [[0.0], [1.0], [1.0], [0.0]];

  const config_string = `{
    "NEAT": {
        "fitness_criterion": "max",
        "fitness_threshold": 3.9,
        "pop_size": 300,
        "reset_on_extinction": false
    },
    "DefaultGenome": {
        "activation_default": "sigmoid",
        "activation_mutate_rate": 0.0,
        "activation_options": ["sigmoid"],

        "aggregation_default": "sum",
        "aggregation_mutate_rate": 0.0,
        "aggregation_options": ["sum"],

        "bias_init_mean": 0.0,
        "bias_init_stdev": 1.0,
        "bias_max_value": 30.0,
        "bias_min_value": -30.0,
        "bias_mutate_power": 0.5,
        "bias_mutate_rate": 0.7,
        "bias_replace_rate": 0.1,

        "compatibility_disjoint_coefficient": 1.0,
        "compatibility_weight_coefficient": 0.5,

        "conn_add_prob": 0.5,
        "conn_delete_prob": 0.5,

        "enabled_default": true,
        "enabled_mutate_rate": 0.01,

        "feed_forward": true,
        "initial_connection": "full",

        "node_add_prob": 0.2,
        "node_delete_prob": 0.2,

        "num_hidden": 4,
        "num_inputs": 2,
        "num_outputs": 1,

        "response_init_mean": 1.0,
        "response_init_stdev": 0.0,
        "response_max_value": 30.0,
        "response_min_value": -30.0,
        "response_mutate_power": 0.0,
        "response_mutate_rate": 0.0,
        "response_replace_rate": 0.0,

        "weight_init_mean": 0.0,
        "weight_init_stdev": 1.0,
        "weight_max_value": 30,
        "weight_min_value": -30,
        "weight_mutate_power": 0.5,
        "weight_mutate_rate": 0.8,
        "weight_replace_rate": 0.1
    },
    "DefaultSpeciesSet": {
        "compatibility_threshold": 3.0
    },
    "DefaultStagnation": {
        "species_fitness_func": "max",
        "max_stagnation": 20,
        "species_elitism": 2
    },
    "DefaultReproduction": {
        "elitism": 2,
        "survival_threshold": 0.2
    }
}`;

  // --- 2. Define the Fitness Function ---
  // This function will be called for each generation to evaluate the genomes.
  function eval_genomes(population, config) {
    for (const [genome_id, genome] of population.entries()) {
      genome.fitness = 4.0; // Start with max fitness and subtract error
      const net = FeedForwardNetwork.create(genome, config);

      for (let i = 0; i < xor_inputs.length; i++) {
        const xi = xor_inputs[i];
        const xo = xor_outputs[i];
        const output = net.activate(xi);
        const error = (output[0] - xo[0]) ** 2;
        genome.fitness -= error;
      }
    }
  }

  // --- 3. Main Run Function ---
  function run() {
    // A. Create the main configuration object.
    const raw_config = JSON.parse(config_string);

    // B. Encapsulate the raw config into component-specific config objects.
    // This uses the same pattern as our previous examples.
    const main_config = {
      // Main NEAT config
      ...raw_config.NEAT,
      // Component instances
      genome_type: DefaultGenome,
      genome_config: DefaultGenome.parseConfig(raw_config.DefaultGenome),
      reproduction: new DefaultReproduction(
        DefaultReproduction.parse_config(raw_config.DefaultReproduction),
        new ReporterSet(),
        null, // Stagnation will be added later
      ),
      species_set: new DefaultSpeciesSet(
        DefaultSpeciesSet.parse_config(raw_config.DefaultSpeciesSet),
        new ReporterSet(),
      ),
      stagnation: new DefaultStagnation(
        DefaultStagnation.parse_config(raw_config.DefaultStagnation),
        new ReporterSet(),
      ),
    };
    // Link reporters and stagnation properly
    main_config.reproduction.reporters = main_config.species_set.reporters;
    main_config.stagnation.reporters = main_config.species_set.reporters;
    main_config.reproduction.stagnation = main_config.stagnation;

    // C. Create the population, which is the top-level object for a NEAT run.
    const p = new Population(main_config);

    // D. Add reporters to show progress in the console.
    p.add_reporter(new StdOutReporter(true));
    // p.add_reporter(new Checkpointer(5, null, "xor-checkpoint-")); // Checkpoint every 5 generations

    // E. Run for up to 300 generations.
    const winner = p.run(eval_genomes, 10);
    // F. Display the winning genome and its performance.
    console.log("\n--- Evolution Complete ---");
    console.log("Best genome:\n" + winner.toString());

    console.log("\nOutput from the winning network:");
    const winner_net = FeedForwardNetwork.create(winner, main_config);
    for (let i = 0; i < xor_inputs.length; i++) {
      const xi = xor_inputs[i];
      const xo = xor_outputs[i];
      const output = winner_net.activate(xi);
      console.log(
        `Input: [${xi}], Expected: [${xo}], Got: [${output[0].toFixed(6)}]`,
      );
    }
  }

  // Start the XOR evolution run.
  run();
}
