/**
 * Does general configuration parsing; used by other classes for their configuration.
 */

/**
 * Custom error for unknown configuration options, useful for catching typos.
 */
export class UnknownConfigItemError extends Error {
  constructor(message) {
    super(message);
    this.name = "UnknownConfigItemError";
  }
}

/**
 * Contains information about a single configuration item.
 */
export class ConfigParameter {
  /**
   * @param {string} name - The parameter name.
   * @param {string} valueType - The expected type ('string', 'number', 'boolean', 'array').
   * @param {*} [defaultValue=null] - The default value if not provided.
   */
  constructor(name, valueType, defaultValue = null) {
    this.name = name;
    this.valueType = valueType;
    this.default = defaultValue;
  }

  /**
   * @returns {string} A string representation of the ConfigParameter.
   */
  toString() {
    if (this.default === null) {
      return `ConfigParameter('${this.name}', '${this.valueType}')`;
    }
    return `ConfigParameter('${this.name}', '${this.valueType}', ${JSON.stringify(this.default)})`;
  }

  /**
   * Converts the config value into the proper type,
   * supplies defaults if available and needed, and checks for errors.
   * @param {Object} configDict - The configuration object for a specific section.
   * @returns {*} The parsed and validated value.
   */
  interpret(configDict) {
    let value = configDict[this.name];

    if (value === undefined || value === null) {
      if (this.default === null) {
        throw new Error(`Missing configuration item: ${this.name}`);
      } else {
        console.warn(
          `Using default value '${this.default}' for '${this.name}'`,
        );
        return this.default;
      }
    }

    try {
      switch (this.valueType) {
        case "string":
          if (typeof value !== "string") return String(value);
          return value;
        case "number":
          if (typeof value !== "number") throw new Error("must be a number");
          return value;
        case "boolean":
          if (typeof value !== "boolean") throw new Error("must be a boolean");
          return value;
        case "array":
          if (!Array.isArray(value)) throw new Error("must be an array");
          return value;
        default:
          throw new Error(`Unexpected configuration type: '${this.valueType}'`);
      }
    } catch (e) {
      throw new Error(
        `Error interpreting config item '${this.name}' with value ${JSON.stringify(value)}: ${e.message}`,
      );
    }
  }
}

/**
 * A base class for configuration of components like reproduction, species_set, and stagnation.
 * It automates the process of parsing a configuration dictionary based on a list of parameters.
 */
export class DefaultClassConfig {
  /**
   * @param {Object} paramDict - The configuration object for a specific section.
   * @param {ConfigParameter[]} paramList - A list of ConfigParameter objects defining the expected parameters.
   */
  constructor(paramDict, paramList) {
    this._params = paramList;
    const paramListNames = new Set();

    for (const p of paramList) {
      this[p.name] = p.interpret(paramDict);
      paramListNames.add(p.name);
    }

    const unknownKeys = Object.keys(paramDict).filter(
      (key) => !paramListNames.has(key),
    );
    if (unknownKeys.length > 0) {
      if (unknownKeys.length > 1) {
        throw new UnknownConfigItemError(
          `Unknown configuration items:\n\t${unknownKeys.join("\n\t")}`,
        );
      }
      throw new UnknownConfigItemError(
        `Unknown configuration item ${unknownKeys[0]}`,
      );
    }
  }

  /**
   * Converts the configuration instance to a plain JavaScript object.
   * @returns {Object} A plain object representing the configuration.
   */
  toObject() {
    const obj = {};
    for (const p of this._params) {
      obj[p.name] = this[p.name];
    }
    return obj;
  }
}

/**
 * A container for user-configurable parameters of the main algorithm (e.g., NEAT).
 */
export class Config {
  // Defines the main parameters for the NEAT section of the configuration.
  static _params = [
    new ConfigParameter("pop_size", "number"),
    new ConfigParameter("fitness_criterion", "string"),
    new ConfigParameter("fitness_threshold", "number"),
    new ConfigParameter("reset_on_extinction", "boolean"),
    new ConfigParameter("no_fitness_termination", "boolean", false),
  ];

  /**
   * @param {Object} genome_type - The class/constructor for the genome.
   * @param {Object} reproduction_type - The class/constructor for reproduction.
   * @param {Object} species_set_type - The class/constructor for the species set.
   * @param {Object} stagnation_type - The class/constructor for stagnation.
   * @param {string} configString - The configuration as a JSON string.
   */
  constructor(
    genome_type,
    reproduction_type,
    species_set_type,
    stagnation_type,
    configString,
  ) {
    // Check that the provided types have the required static `parseConfig` method.
    for (const type of [
      genome_type,
      reproduction_type,
      species_set_type,
      stagnation_type,
    ]) {
      if (typeof type.parseConfig !== "function") {
        throw new Error(
          `Type ${type.name} must have a static 'parseConfig' method.`,
        );
      }
    }

    // --- Changed to snake_case ---
    this.genome_type = genome_type;
    this.reproduction_type = reproduction_type;
    this.species_set_type = species_set_type;
    this.stagnation_type = stagnation_type;

    const parameters = JSON.parse(configString);

    // --- NEAT configuration ---
    const neatConfig = parameters["NEAT"];
    if (!neatConfig) {
      throw new Error("'NEAT' section not found in configuration.");
    }

    const neatParamNames = new Set();
    for (const p of Config._params) {
      this[p.name] = p.interpret(neatConfig);
      neatParamNames.add(p.name);
    }

    // Check for unknown configuration items in the NEAT section.
    const unknownNeatKeys = Object.keys(neatConfig).filter(
      (key) => !neatParamNames.has(key),
    );
    if (unknownNeatKeys.length > 0) {
      const items = unknownNeatKeys.join("\n\t");
      throw new UnknownConfigItemError(
        `Unknown (section 'NEAT') configuration items:\n\t${items}`,
      );
    }

    // --- Parse type-specific sections ---
    // --- Changed to snake_case ---
    const genomeDict = parameters[genome_type.name] || {};
    this.genome_config = genome_type.parseConfig(genomeDict);

    const speciesSetDict = parameters[species_set_type.name] || {};
    this.species_set_config = species_set_type.parseConfig(speciesSetDict);

    const stagnationDict = parameters[stagnation_type.name] || {};
    this.stagnation_config = stagnation_type.parseConfig(stagnationDict);

    const reproductionDict = parameters[reproduction_type.name] || {};
    this.reproduction_config = reproduction_type.parseConfig(reproductionDict);
  }

  /**
   * Serializes the current configuration into a pretty-formatted JSON string.
   * Assumes that component configs (genome, reproduction, etc.) have a `toObject()` method.
   * @returns {string} The JSON string representing the full configuration.
   */
  toJsonString() {
    const configData = {};

    // NEAT section
    configData.NEAT = {};
    for (const p of Config._params) {
      configData.NEAT[p.name] = this[p.name];
    }

    // Other component sections
    // --- Changed to snake_case ---
    if (
      this.genome_config &&
      typeof this.genome_config.toObject === "function"
    ) {
      configData[this.genome_type.name] = this.genome_config.toObject();
    }
    if (
      this.species_set_config &&
      typeof this.species_set_config.toObject === "function"
    ) {
      configData[this.species_set_type.name] =
        this.species_set_config.toObject();
    }
    if (
      this.stagnation_config &&
      typeof this.stagnation_config.toObject === "function"
    ) {
      configData[this.stagnation_type.name] = this.stagnation_config.toObject();
    }
    if (
      this.reproduction_config &&
      typeof this.reproduction_config.toObject === "function"
    ) {
      configData[this.reproduction_type.name] =
        this.reproduction_config.toObject();
    }

    return JSON.stringify(configData, null, 2);
  }
}
