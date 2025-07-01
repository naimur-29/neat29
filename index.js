// exampleUsage.js
import { Config, DefaultClassConfig, ConfigParameter } from "./src/config.js";

// --- Define Mock Component Classes ---

// Mock Genome configuration class
class DefaultGenome extends DefaultClassConfig {
  static get_params() {
    return [
      new ConfigParameter("num_inputs", "number"),
      new ConfigParameter("num_outputs", "number"),
      new ConfigParameter("hidden_nodes", "array", []),
    ];
  }

  static parseConfig(paramDict) {
    return new DefaultGenome(paramDict, DefaultGenome.get_params());
  }
}

// Mock Reproduction configuration class
class DefaultReproduction extends DefaultClassConfig {
  static get_params() {
    return [
      new ConfigParameter("elitism", "number", 0),
      new ConfigParameter("survival_threshold", "number", 0.2),
    ];
  }

  static parseConfig(paramDict) {
    return new DefaultReproduction(paramDict, DefaultReproduction.get_params());
  }
}

// For simplicity, let's use the same mock class for the other components
class MockSpeciesSet extends DefaultReproduction {}
class MockStagnation extends DefaultReproduction {}

// --- Create Configuration String (JSON) ---

const configJsonString = `
{
  "NEAT": {
    "fitness_criterion": "max",
    "fitness_threshold": 3.95,
    "pop_size": 150,
    "reset_on_extinction": true
  },
  "DefaultGenome": {
    "num_inputs": 2,
    "num_outputs": 1,
    "hidden_nodes": [10, 5]
  },
  "DefaultReproduction": {
    "elitism": 2,
    "survival_threshold": 0.25
  },
  "MockSpeciesSet": {
      "elitism": 1
  },
  "MockStagnation": {
      "survival_threshold": 0.15
  }
}
`;

export function main() {
  try {
    const config = new Config(
      DefaultGenome,
      DefaultReproduction,
      MockSpeciesSet,
      MockStagnation,
      configJsonString,
    );

    // Access parsed configuration values
    console.log("Population Size:", config.pop_size); // 150
    console.log("Fitness Threshold:", config.fitness_threshold); // 3.95
    console.log(
      "No Fitness Termination (defaulted):",
      config.no_fitness_termination,
    ); // false

    console.log("Genome Inputs:", config.genomeConfig.num_inputs); // 2
    console.log("Genome Hidden Nodes:", config.genomeConfig.hidden_nodes); // [10, 5]

    console.log("Reproduction Elitism:", config.reproductionConfig.elitism); // 2

    // Serialize the config back to a JSON string
    console.log("\n--- Serialized Config ---");
    console.log(config.toJsonString());
  } catch (error) {
    console.error("Configuration Error:", error.message);
  }
}
