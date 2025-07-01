/**
 * Deals with the attributes (variable parameters) of genes.
 * This version consistently uses snake_case for all configuration properties.
 */
import { ConfigParameter } from "./config.js";
import { choice, gauss, random, uniform } from "./randomUtil.js";

class BaseAttribute {
  constructor(name, defaultOverride = {}) {
    this.name = name;
    this._config_items = { ...this.constructor._config_items };
    for (const [key, value] of Object.entries(defaultOverride)) {
      if (this._config_items[key]) {
        this._config_items[key] = [this._config_items[key][0], value];
      }
    }

    // Create properties for the full config item names (e.g., this.mutate_rate_name)
    // These will hold the final snake_case key, like 'bias_mutate_rate'.
    for (const key in this._config_items) {
      this[`${key}_name`] = this.configItemName(key);
    }
  }

  configItemName(configItemBaseName) {
    return `${this.name}_${configItemBaseName}`;
  }

  getConfigParams() {
    return Object.entries(this._config_items).map(
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

export class FloatAttribute extends BaseAttribute {
  static _config_items = {
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
    const min_value = config[this.min_value_name];
    const max_value = config[this.max_value_name];
    return Math.max(Math.min(value, max_value), min_value);
  }

  initValue(config) {
    const mean = config[this.init_mean_name];
    const stdev = config[this.init_stdev_name];
    const init_type = config[this.init_type_name].toLowerCase();

    if (init_type.includes("gauss") || init_type.includes("normal")) {
      return this.clamp(gauss(mean, stdev), config);
    }
    if (init_type.includes("uniform")) {
      const min = Math.max(config[this.min_value_name], mean - 2 * stdev);
      const max = Math.min(config[this.max_value_name], mean + 2 * stdev);
      return uniform(min, max);
    }
    throw new Error(
      `Unknown init_type '${config[this.init_type_name]}' for '${this.init_type_name}'`,
    );
  }

  mutateValue(value, config) {
    const mutate_rate = config[this.mutate_rate_name];
    if (random() < mutate_rate) {
      const mutate_power = config[this.mutate_power_name];
      return this.clamp(value + gauss(0.0, mutate_power), config);
    }

    const replace_rate = config[this.replace_rate_name];
    if (random() < replace_rate) {
      return this.initValue(config);
    }
    return value;
  }

  validate(config) {
    if (config[this.max_value_name] < config[this.min_value_name]) {
      throw new Error(
        `Invalid min/max configuration for attribute ${this.name}`,
      );
    }
  }
}

export class StringAttribute extends BaseAttribute {
  static _config_items = {
    default: ["string", "random"],
    options: ["array", null],
    mutate_rate: ["number", null],
  };

  initValue(config) {
    const default_value = config[this.default_name];
    if (
      default_value.toLowerCase() === "random" ||
      default_value.toLowerCase() === "none"
    ) {
      const options = config[this.options_name];
      return choice(options);
    }
    return default_value;
  }

  mutateValue(value, config) {
    const mutate_rate = config[this.mutate_rate_name];
    if (random() < mutate_rate) {
      const options = config[this.options_name];
      return choice(options);
    }
    return value;
  }

  validate(config) {
    const default_value = config[this.default_name];
    if (
      default_value.toLowerCase() !== "random" &&
      default_value.toLowerCase() !== "none"
    ) {
      const options = config[this.options_name];
      if (!options.includes(default_value)) {
        throw new Error(
          `Invalid initial value '${default_value}' for attribute ${this.name}`,
        );
      }
    }
  }
}

export class BoolAttribute extends BaseAttribute {
  static _config_items = {
    default: ["string", null],
    mutate_rate: ["number", null],
    rate_to_true_add: ["number", 0.0],
    rate_to_false_add: ["number", 0.0],
  };

  initValue(config) {
    const default_value = String(config[this.default_name]).toLowerCase();
    if (["1", "on", "yes", "true"].includes(default_value)) return true;
    if (["0", "off", "no", "false"].includes(default_value)) return false;
    if (["random", "none"].includes(default_value)) return random() < 0.5;
    throw new Error(
      `Unknown default value '${default_value}' for '${this.name}'`,
    );
  }

  mutateValue(value, config) {
    let mutate_rate = config[this.mutate_rate_name];
    if (value) {
      mutate_rate += config[this.rate_to_false_add_name];
    } else {
      mutate_rate += config[this.rate_to_true_add_name];
    }

    if (mutate_rate > 0 && random() < mutate_rate) {
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
    const default_value = String(config[this.default_name]).toLowerCase();
    if (!validDefaults.has(default_value)) {
      throw new Error(`Invalid default value for ${this.name}`);
    }
  }
}
