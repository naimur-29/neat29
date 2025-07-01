/**
 * Deals with the attributes (variable parameters) of genes.
 */
import { ConfigParameter } from "./config.js";
import { choice, gauss, random, uniform, randint } from "./randomUtil.js";

/** Helper to convert snake_case to camelCase */
const snakeToCamel = (s) => s.replace(/(_\w)/g, (m) => m[1].toUpperCase());

/**
 * Superclass for the type-specialized attribute subclasses, used by genes.
 */
class BaseAttribute {
  /**
   * @param {string} name - The base name of the attribute (e.g., 'bias', 'weight').
   * @param {Object} [defaultOverride={}] - An object to override the default values of config items.
   */
  constructor(name, defaultOverride = {}) {
    this.name = name;

    this._configItems = { ...this.constructor._configItems };
    for (const [key, value] of Object.entries(defaultOverride)) {
      if (this._configItems[key]) {
        this._configItems[key] = [this._configItems[key][0], value];
      }
    }

    // --- THIS IS THE FIX ---
    // Create properties for the full config item names (e.g., this.mutateRateName)
    // by converting the snake_case key to camelCase.
    for (const key in this._configItems) {
      const camelCaseKey = snakeToCamel(key);
      this[`${camelCaseKey}Name`] = this.configItemName(key);
    }
  }

  /**
   * Generates the full configuration parameter name.
   * @param {string} configItemBaseName - The base name (e.g., 'mutate_rate').
   * @returns {string} The full name (e.g., 'bias_mutate_rate').
   */
  configItemName(configItemBaseName) {
    return `${this.name}_${configItemBaseName}`;
  }

  /**
   * Gets the configuration parameters for this attribute.
   * @returns {ConfigParameter[]} An array of ConfigParameter instances.
   */
  getConfigParams() {
    return Object.entries(this._configItems).map(
      ([name, [type, defaultValue]]) => {
        return new ConfigParameter(
          this.configItemName(name),
          type,
          defaultValue,
        );
      },
    );
  }
}

// ... the rest of the file (FloatAttribute, IntegerAttribute, etc.) remains exactly the same ...

/**
 * Class for floating-point numeric attributes, such as the response
 * of a node or the weight of a connection.
 */
export class FloatAttribute extends BaseAttribute {
  static _configItems = {
    init_mean: ["number", null],
    init_stdev: ["number", null],
    init_type: ["string", "gaussian"],
    replace_rate: ["number", null],
    mutate_rate: ["number", null],
    mutate_power: ["number", null],
    max_value: ["number", null],
    min_value: ["number", null],
  };

  clamp(value, config) {
    const minValue = config[this.minValueName];
    const maxValue = config[this.maxValueName];
    return Math.max(Math.min(value, maxValue), minValue);
  }

  initValue(config) {
    const mean = config[this.initMeanName];
    const stdev = config[this.initStdevName];
    const initType = config[this.initTypeName].toLowerCase();

    if (initType.includes("gauss") || initType.includes("normal")) {
      return this.clamp(gauss(mean, stdev), config);
    }

    if (initType.includes("uniform")) {
      const min = Math.max(config[this.minValueName], mean - 2 * stdev);
      const max = Math.min(config[this.maxValueName], mean + 2 * stdev);
      return uniform(min, max);
    }

    throw new Error(
      `Unknown init_type '${config[this.initTypeName]}' for '${this.initTypeName}'`,
    );
  }

  mutateValue(value, config) {
    const mutateRate = config[this.mutateRateName];
    const r = random();
    if (r < mutateRate) {
      const mutatePower = config[this.mutatePowerName];
      return this.clamp(value + gauss(0.0, mutatePower), config);
    }

    const replaceRate = config[this.replaceRateName];
    if (r < replaceRate + mutateRate) {
      return this.initValue(config);
    }

    return value;
  }

  validate(config) {
    if (config[this.maxValueName] < config[this.minValueName]) {
      throw new Error(
        `Invalid min/max configuration for attribute ${this.name}`,
      );
    }
  }
}

/**
 * Class for integer numeric attributes.
 */
export class IntegerAttribute extends BaseAttribute {
  static _configItems = {
    replace_rate: ["number", null],
    mutate_rate: ["number", null],
    mutate_power: ["number", null],
    max_value: ["number", null],
    min_value: ["number", null],
  };

  clamp(value, config) {
    const minValue = config[this.minValueName];
    const maxValue = config[this.maxValueName];
    return Math.max(Math.min(value, maxValue), minValue);
  }

  initValue(config) {
    return randint(config[this.minValueName], config[this.maxValueName]);
  }

  mutateValue(value, config) {
    const mutateRate = config[this.mutateRateName];
    const r = random();
    if (r < mutateRate) {
      const mutatePower = config[this.mutatePowerName];
      const delta = Math.round(gauss(0.0, mutatePower));
      return this.clamp(value + delta, config);
    }

    const replaceRate = config[this.replaceRateName];
    if (r < replaceRate + mutateRate) {
      return this.initValue(config);
    }

    return value;
  }

  validate(config) {
    if (config[this.maxValueName] < config[this.minValueName]) {
      throw new Error(
        `Invalid min/max configuration for attribute ${this.name}`,
      );
    }
  }
}

/**
 * Class for boolean attributes such as whether a connection is enabled or not.
 */
export class BoolAttribute extends BaseAttribute {
  static _configItems = {
    default: ["string", null],
    mutate_rate: ["number", null],
    rate_to_true_add: ["number", 0.0],
    rate_to_false_add: ["number", 0.0],
  };

  initValue(config) {
    const defaultValue = String(config[this.defaultName]).toLowerCase();
    if (["1", "on", "yes", "true"].includes(defaultValue)) return true;
    if (["0", "off", "no", "false"].includes(defaultValue)) return false;
    if (["random", "none"].includes(defaultValue)) return random() < 0.5;

    throw new Error(
      `Unknown default value '${defaultValue}' for '${this.name}'`,
    );
  }

  mutateValue(value, config) {
    let mutateRate = config[this.mutateRateName];
    if (value) {
      mutateRate += config[this.rateToFalseAddName];
    } else {
      mutateRate += config[this.rateToTrueAddName];
    }

    if (mutateRate > 0 && random() < mutateRate) {
      // Re-randomize the value. This matches the behavior of other attributes where
      // mutation may not necessarily change the value.
      return random() < 0.5;
    }

    return value;
  }

  validate(config) {
    const validDefaults = new Set([
      "1",
      "on",
      "yes",
      "true",
      "0",
      "off",
      "no",
      "false",
      "random",
      "none",
    ]);
    const defaultValue = String(config[this.defaultName]).toLowerCase();
    if (!validDefaults.has(defaultValue)) {
      throw new Error(`Invalid default value for ${this.name}`);
    }
  }
}

/**
 * Class for string attributes such as the aggregation function of a node,
 * which are selected from a list of options.
 */
export class StringAttribute extends BaseAttribute {
  static _configItems = {
    default: ["string", "random"],
    options: ["array", null],
    mutate_rate: ["number", null],
  };

  initValue(config) {
    const defaultValue = config[this.defaultName];
    if (
      defaultValue.toLowerCase() === "random" ||
      defaultValue.toLowerCase() === "none"
    ) {
      const options = config[this.optionsName];
      return choice(options);
    }
    return defaultValue;
  }

  mutateValue(value, config) {
    const mutateRate = config[this.mutateRateName];
    if (mutateRate > 0 && random() < mutateRate) {
      const options = config[this.optionsName];
      return choice(options);
    }
    return value;
  }

  validate(config) {
    const defaultValue = config[this.defaultName];
    if (
      defaultValue.toLowerCase() !== "random" &&
      defaultValue.toLowerCase() !== "none"
    ) {
      const options = config[this.optionsName];
      if (!options.includes(defaultValue)) {
        throw new Error(
          `Invalid initial value '${defaultValue}' for attribute ${this.name}`,
        );
      }
    }
  }
}
