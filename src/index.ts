// index.ts
console.log("hello there!");

import {
  Config,
  ConfigParameter,
  IConfigurableClass,
  baseClassConfig,
  UnknownConfigItemError,
} from "./components/config29"; // Assuming your provided code is in config.ts

// --- 1. Define Dummy IConfigurableClass Implementations ---
// These classes simulate the 'genome', 'reproduction', 'species_set', and 'stagnation'
// components that would have their own configuration sections.
// They must implement the IConfigurableClass interface.

class GenomeConfig extends baseClassConfig {
  public static readonly nname: string = "Genome"; // Static name property
  private static readonly _params = [
    new ConfigParameter("activation_default", "str", "tanh"),
    new ConfigParameter("activation_options", "list", ["sigmoid", "relu"]),
    new ConfigParameter("compatibility_threshold", "float", 3.0),
  ];

  // Static method to provide parameters
  public static getParams(): ConfigParameter[] {
    return GenomeConfig._params;
  }

  // Properties that baseClassConfig will populate
  public activation_default!: string;
  public activation_options!: string[];
  public compatibility_threshold!: number;

  constructor(paramDict: Record<string, any>, paramList: ConfigParameter[]) {
    super(paramDict, paramList);
  }
}

class ReproductionConfig extends baseClassConfig {
  public static readonly nname: string = "Reproduction";
  private static readonly _params = [
    new ConfigParameter("elitism", "int", 1),
    new ConfigParameter("survival_threshold", "float", 0.2),
  ];

  public static getParams(): ConfigParameter[] {
    return ReproductionConfig._params;
  }

  public elitism!: number;
  public survival_threshold!: number;

  constructor(paramDict: Record<string, any>, paramList: ConfigParameter[]) {
    super(paramDict, paramList);
  }
}

class SpeciesSetConfig extends baseClassConfig {
  public static readonly nname: string = "SpeciesSet";
  private static readonly _params = [
    new ConfigParameter("compatibility_threshold", "float", 3.0),
    new ConfigParameter("species_fitness_func", "str", "mean"),
  ];

  public static getParams(): ConfigParameter[] {
    return SpeciesSetConfig._params;
  }

  public compatibility_threshold!: number;
  public species_fitness_func!: string;

  constructor(paramDict: Record<string, any>, paramList: ConfigParameter[]) {
    super(paramDict, paramList);
  }
}

class StagnationConfig extends baseClassConfig {
  public static readonly nname: string = "Stagnation";
  private static readonly _params = [
    new ConfigParameter("species_fitness_func", "str", "mean"),
    new ConfigParameter("max_stagnation", "int", 15),
  ];

  public static getParams(): ConfigParameter[] {
    return StagnationConfig._params;
  }

  public species_fitness_func!: string;
  public max_stagnation!: number;

  constructor(paramDict: Record<string, any>, paramList: ConfigParameter[]) {
    super(paramDict, paramList);
  }
}

// --- 2. Sample JSON Configuration Strings ---
const sampleJsonContent = `
{
  "NEAT": {
    "pop_size": 150,
    "fitness_criterion": "max",
    "fitness_threshold": 1000.0,
    "reset_on_extinction": true,
    "no_fitness_termination": false
  },
  "Genome": {
    "activation_default": "sigmoid",
    "activation_options": ["tanh", "relu", "identity"],
    "compatibility_threshold": 2.5
  },
  "Reproduction": {
    "elitism": 2,
    "survival_threshold": 0.3
  },
  "SpeciesSet": {
    "compatibility_threshold": 3.5,
    "species_fitness_func": "max"
  },
  "Stagnation": {
    "max_stagnation": 20
  }
}
`;

const sampleJsonContentWithMissingAndUnknown = `
{
  "NEAT": {
    "pop_size": 50,
    "fitness_criterion": "min",
    "unknown_neat_param": "some_value"
  },
  "Genome": {
    "activation_default": "relu",
    "unknown_genome_param": "another_value"
  },
  "Reproduction": {},
  "SpeciesSet": {},
  "Stagnation": {}
}
`;

const invalidJsonContent_BadType = `
{
  "NEAT": {
    "pop_size": "abc",  
    "fitness_criterion": "max",
    "fitness_threshold": 100.0,
    "reset_on_extinction": true
  },
  "Genome": {},
  "Reproduction": {},
  "SpeciesSet": {},
  "Stagnation": {}
}
`;

const invalidJsonContent_MissingRequired = `
{
  "NEAT": {
    "fitness_criterion": "max",
    "fitness_threshold": 100.0,
    "reset_on_extinction": true
  },
  "Genome": {},
  "Reproduction": {},
  "SpeciesSet": {},
  "Stagnation": {}
}
`;

// --- 3. Test Runner Function ---
function runTest(nname: string, testFn: () => void) {
  console.log(`\n--- ${nname} ---`);
  try {
    testFn();
    console.log(`--- ${nname} PASSED ---`);
  } catch (error: any) {
    if (error instanceof UnknownConfigItemError) {
      console.error(`--- ${nname} FAILED: Unknown Config Item Error ---`);
      console.error(`  ${error.message}`);
    } else if (error instanceof TypeError) {
      console.error(`--- ${nname} FAILED: Type Error ---`);
      console.error(`  ${error.message}`);
    } else if (error instanceof SyntaxError) {
      // For JSON.parse errors
      console.error(`--- ${nname} FAILED: JSON Syntax Error ---`);
      console.error(`  ${error.message}`);
    } else {
      console.error(`--- ${nname} FAILED: Unexpected Error ---`);
      console.error(`  ${error.message}`);
    }
  }
}

// --- 4. Test Cases ---

runTest("Test Case 1: Valid Configuration", () => {
  const config = new Config(
    GenomeConfig, // Pass the class constructor
    ReproductionConfig,
    SpeciesSetConfig,
    StagnationConfig,
    sampleJsonContent,
  );

  console.log("\nParsed Config Values:");
  console.log(
    `  NEAT.pop_size: ${config.pop_size} (type: ${typeof config.pop_size})`,
  );
  console.log(
    `  NEAT.fitness_criterion: ${config.fitness_criterion} (type: ${typeof config.fitness_criterion})`,
  );
  console.log(
    `  NEAT.fitness_threshold: ${config.fitness_threshold} (type: ${typeof config.fitness_threshold})`,
  );
  console.log(
    `  NEAT.reset_on_extinction: ${config.reset_on_extinction} (type: ${typeof config.reset_on_extinction})`,
  );
  console.log(
    `  NEAT.no_fitness_termination: ${config.no_fitness_termination} (type: ${typeof config.no_fitness_termination})`,
  );

  console.log("\nGenome Config Values:");
  console.log(
    `  Genome.activation_default: ${config.genome_config.activation_default}`,
  );
  console.log(
    `  Genome.activation_options: ${config.genome_config.activation_options}`,
  );
  console.log(
    `  Genome.compatibility_threshold: ${config.genome_config.compatibility_threshold}`,
  );

  console.log("\n--- Reconstructed JSON Content (config.save()) ---");
  const savedConfig = config.save();
  console.log(savedConfig);

  // Optional: Parse back and compare to ensure round-trip
  const parsedSavedConfig = JSON.parse(savedConfig);
  const originalParsedConfig = JSON.parse(sampleJsonContent);
  // Note: Deep comparison might be needed for complex objects, but for basic check:
  if (
    JSON.stringify(parsedSavedConfig.NEAT) !==
    JSON.stringify(originalParsedConfig.NEAT)
  ) {
    console.warn("NEAT section mismatch after save/load!");
  }
});

runTest(
  "Test Case 2: Missing Parameters (with/without base) and Unknown Items",
  () => {
    // To make this test pass as expected, we need to ensure 'reset_on_extinction'
    // in Config.__params has a base value, or it will throw a 'Missing' error.
    // For this test, let's assume it *does* have a base in config.ts for demonstration.
    // (If not, this test will fail with "Missing configuration item: reset_on_extinction")

    const config = new Config(
      GenomeConfig,
      ReproductionConfig,
      SpeciesSetConfig,
      StagnationConfig,
      sampleJsonContentWithMissingAndUnknown,
    );

    console.log("\nParsed Config Values (with warnings for missing):");
    console.log(`  NEAT.pop_size: ${config.pop_size}`);
    console.log(`  NEAT.fitness_criterion: ${config.fitness_criterion}`);
    // fitness_threshold should use its default (if defined in Config.__params)
    console.log(
      `  NEAT.fitness_threshold: ${config.fitness_threshold} (should be default)`,
    );
    // reset_on_extinction should use its default (if defined in Config.__params)
    console.log(
      `  NEAT.reset_on_extinction: ${config.reset_on_extinction} (should be default)`,
    );

    console.log("\nGenome Config Values (with warnings for missing):");
    console.log(
      `  Genome.activation_default: ${config.genome_config.activation_default}`,
    );
    console.log(
      `  Genome.activation_options: ${config.genome_config.activation_options} (should be default)`,
    );

    console.log("\n--- Reconstructed JSON Content (config.save()) ---");
    const savedConfig = config.save();
    console.log(savedConfig);
  },
);

runTest("Test Case 3: Invalid Value Type (e.g., string for int)", () => {
  new Config(
    GenomeConfig,
    ReproductionConfig,
    SpeciesSetConfig,
    StagnationConfig,
    invalidJsonContent_BadType,
  );
});

runTest("Test Case 4: Missing Required Parameter (no base)", () => {
  new Config(
    GenomeConfig,
    ReproductionConfig,
    SpeciesSetConfig,
    StagnationConfig,
    invalidJsonContent_MissingRequired,
  );
});

runTest("Test Case 5: Invalid JSON Syntax", () => {
  const malformedJson = `{ "NEAT": { "pop_size": 100, "fitness_criterion": "max", }`; // Trailing comma, missing closing brace
  new Config(
    GenomeConfig,
    ReproductionConfig,
    SpeciesSetConfig,
    StagnationConfig,
    malformedJson,
  );
});

runTest("Test Case 6: Empty Config File (Missing NEAT section)", () => {
  const emptyJson = `{}`;
  new Config(
    GenomeConfig,
    ReproductionConfig,
    SpeciesSetConfig,
    StagnationConfig,
    emptyJson,
  );
});

runTest("Test Case 7: Unknown Config Item in Sub-Section", () => {
  const jsonWithUnknownSub = `
  {
    "NEAT": {
      "pop_size": 100,
      "fitness_criterion": "max",
      "fitness_threshold": 100.0,
      "reset_on_extinction": true,
      "no_fitness_termination": false
    },
    "Genome": {
      "activation_default": "relu",
      "extra_genome_param": "unexpected"
    },
    "Reproduction": {},
    "SpeciesSet": {},
    "Stagnation": {}
  }
  `;
  new Config(
    GenomeConfig,
    ReproductionConfig,
    SpeciesSetConfig,
    StagnationConfig,
    jsonWithUnknownSub,
  );
});

runTest("Test Case 8: List Type Handling", () => {
  const listJson = `
  {
    "NEAT": {
      "pop_size": 100,
      "fitness_criterion": "max",
      "fitness_threshold": 100.0,
      "reset_on_extinction": true,
      "no_fitness_termination": false
    },
    "Genome": {
      "activation_default": "relu",
      "activation_options": ["linear", "sigmoid", "tanh"],
      "compatibility_threshold": 1.0
    },
    "Reproduction": {},
    "SpeciesSet": {},
    "Stagnation": {}
  }
  `;
  const config = new Config(
    GenomeConfig,
    ReproductionConfig,
    SpeciesSetConfig,
    StagnationConfig,
    listJson,
  );
  console.log(
    `  Genome.activation_options: ${config.genome_config.activation_options}`,
  );
  console.log(
    `  Type: ${typeof config.genome_config.activation_options}, IsArray: ${Array.isArray(config.genome_config.activation_options)}`,
  );
});

runTest("Test Case 9: Boolean Type Handling", () => {
  const boolJson = `
  {
    "NEAT": {
      "pop_size": 100,
      "fitness_criterion": "max",
      "fitness_threshold": 100.0,
      "reset_on_extinction": true,
      "no_fitness_termination": false
    },
    "Genome": {},
    "Reproduction": {},
    "SpeciesSet": {},
    "Stagnation": {}
  }
  `;
  const config = new Config(
    GenomeConfig,
    ReproductionConfig,
    SpeciesSetConfig,
    StagnationConfig,
    boolJson,
  );
  console.log(`  NEAT.reset_on_extinction: ${config.reset_on_extinction}`);
  console.log(
    `  NEAT.no_fitness_termination: ${config.no_fitness_termination}`,
  );
  console.log(
    `  Type reset_on_extinction: ${typeof config.reset_on_extinction}`,
  );
  console.log(
    `  Type no_fitness_termination: ${typeof config.no_fitness_termination}`,
  );
});
