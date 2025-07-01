import { ConfigParameter, DefaultClassConfig } from "./config29";

export type ConfigValue = string | number | boolean | string[];
export type ValueTypeName = "int" | "bool" | "float" | "list" | "str";

const gauss = (mu: number, sigma: number): number => {
  let u1 = 0,
    u2 = 0;
  while (u1 === 0) u1 = Math.random();
  while (u2 === 0) u2 = Math.random();
  const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
  return z0 * sigma + mu;
};

const randint = (min: number, max: number): number => {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

const choice = <T>(arr: T[]): T => {
  if (arr.length === 0) {
    throw new Error("Cannot choose from an empty array.");
  }
  return arr[randint(0, arr.length - 1)];
};

const uniform = (min: number, max: number): number => {
  return Math.random() * (max - min) + min;
};

export abstract class BaseAttribute {
  public name: string;
  [key: string]: any;

  protected _configItems: Record<
    string,
    [ValueTypeName, ConfigValue | undefined]
  >;

  protected static _configItems: Record<
    string,
    [ValueTypeName, ConfigValue | undefined]
  >;

  constructor(
    name: string,
    defaultOverrides: Record<string, ConfigValue> = {},
  ) {
    this.name = name;

    this._configItems = JSON.parse(
      JSON.stringify((this.constructor as typeof BaseAttribute)._configItems),
    );

    for (const [key, value] of Object.entries(defaultOverrides)) {
      if (this._configItems[key]) {
        this._configItems[key][1] = value;
      }
    }

    for (const itemName of Object.keys(this._configItems)) {
      this[`${itemName}_name`] = this.configItemName(itemName);
    }
  }

  public configItemName(configItemBaseName: string): string {
    return `${this.name}_${configItemBaseName}`;
  }

  public get_config_params(): ConfigParameter[] {
    return Object.entries(this._configItems).map(([name, ci]) => {
      const [valueType, defaultValue] = ci;
      return new ConfigParameter(
        this.configItemName(name),
        valueType,
        defaultValue,
      );
    });
  }

  public abstract init_value(config: DefaultClassConfig): ConfigValue;
  public abstract mutate_value(
    value: any,
    config: DefaultClassConfig,
  ): ConfigValue;
  public abstract validate(config: DefaultClassConfig): void;
}

export class FloatAttribute extends BaseAttribute {
  protected static _configItems: Record<
    string,
    [ValueTypeName, ConfigValue | undefined]
  > = {
    init_mean: ["float", undefined],
    init_stdev: ["float", undefined],
    init_type: ["str", "gaussian"],
    replace_rate: ["float", undefined],
    mutate_rate: ["float", undefined],
    mutate_power: ["float", undefined],
    max_value: ["float", undefined],
    min_value: ["float", undefined],
  };

  public clamp(value: number, config: DefaultClassConfig): number {
    const minValue = config[this.min_value_name] as number;
    const maxValue = config[this.max_value_name] as number;
    return Math.max(Math.min(value, maxValue), minValue);
  }

  public init_value(config: DefaultClassConfig): number {
    const mean = config[this.init_mean_name] as number;
    const stdev = config[this.init_stdev_name] as number;
    const initType = (config[this.init_type_name] as string).toLowerCase();

    if (initType.includes("gauss") || initType.includes("normal")) {
      return this.clamp(gauss(mean, stdev), config);
    }

    if (initType.includes("uniform")) {
      const minValue = Math.max(
        config[this.min_value_name] as number,
        mean - 2 * stdev,
      );
      const maxValue = Math.min(
        config[this.max_value_name] as number,
        mean + 2 * stdev,
      );
      return uniform(minValue, maxValue);
    }

    throw new Error(
      `Unknown init_type '${config[this.init_type_name]}' for ${this.init_type_name}`,
    );
  }

  public mutate_value(value: number, config: DefaultClassConfig): number {
    const mutateRate = config[this.mutate_rate_name] as number;
    const r = Math.random();

    if (r < mutateRate) {
      const mutatePower = config[this.mutate_power_name] as number;
      return this.clamp(value + gauss(0.0, mutatePower), config);
    }

    const replaceRate = config[this.replace_rate_name] as number;
    if (r < replaceRate + mutateRate) {
      return this.init_value(config);
    }

    return value;
  }

  public validate(config: DefaultClassConfig): void {
    const minValue = config[this.min_value_name] as number;
    const maxValue = config[this.max_value_name] as number;
    if (maxValue < minValue) {
      throw new Error(`Invalid min/max configuration for ${this.name}`);
    }
  }
}

export class IntegerAttribute extends BaseAttribute {
  protected static _configItems: Record<
    string,
    [ValueTypeName, ConfigValue | undefined]
  > = {
    replace_rate: ["float", undefined],
    mutate_rate: ["float", undefined],
    mutate_power: ["float", undefined],
    max_value: ["int", undefined],
    min_value: ["int", undefined],
  };

  public clamp(value: number, config: DefaultClassConfig): number {
    const minValue = config[this.min_value_name] as number;
    const maxValue = config[this.max_value_name] as number;
    return Math.max(Math.min(value, maxValue), minValue);
  }

  public init_value(config: DefaultClassConfig): number {
    const minValue = config[this.min_value_name] as number;
    const maxValue = config[this.max_value_name] as number;
    return randint(minValue, maxValue);
  }

  public mutate_value(value: number, config: DefaultClassConfig): number {
    const mutateRate = config[this.mutate_rate_name] as number;
    const r = Math.random();

    if (r < mutateRate) {
      const mutatePower = config[this.mutate_power_name] as number;
      const mutation = Math.round(gauss(0.0, mutatePower));
      return this.clamp(value + mutation, config);
    }

    const replaceRate = config[this.replace_rate_name] as number;
    if (r < replaceRate + mutateRate) {
      return this.init_value(config);
    }

    return value;
  }

  public validate(config: DefaultClassConfig): void {
    const minValue = config[this.min_value_name] as number;
    const maxValue = config[this.max_value_name] as number;
    if (maxValue < minValue) {
      throw new Error(`Invalid min/max configuration for ${this.name}`);
    }
  }
}

export class BoolAttribute extends BaseAttribute {
  protected static _configItems: Record<
    string,
    [ValueTypeName, ConfigValue | undefined]
  > = {
    default: ["str", undefined],
    mutate_rate: ["float", undefined],
    rate_to_true_add: ["float", 0.0],
    rate_to_false_add: ["float", 0.0],
  };

  public init_value(config: DefaultClassConfig): boolean {
    const defaultValue = String(config[this.default_name]).toLowerCase();

    const trueValues = ["1", "on", "yes", "true"];
    const falseValues = ["0", "off", "no", "false"];

    if (trueValues.includes(defaultValue)) return true;
    if (falseValues.includes(defaultValue)) return false;
    if (defaultValue === "random" || defaultValue === "none")
      return Math.random() < 0.5;

    throw new Error(`Unknown default value '${defaultValue}' for ${this.name}`);
  }

  public mutate_value(value: boolean, config: DefaultClassConfig): boolean {
    let mutateRate = config[this.mutate_rate_name] as number;

    if (value) {
      mutateRate += config[this.rate_to_false_add_name] as number;
    } else {
      mutateRate += config[this.rate_to_true_add_name] as number;
    }

    if (mutateRate > 0) {
      if (Math.random() < mutateRate) {
        return Math.random() < 0.5;
      }
    }

    return value;
  }

  public validate(config: DefaultClassConfig): void {
    const defaultValue = String(config[this.default_name]).toLowerCase();
    const validValues = [
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
    ];
    if (!validValues.includes(defaultValue)) {
      throw new Error(`Invalid default value for ${this.name}`);
    }
  }
}

export class StringAttribute extends BaseAttribute {
  protected static _configItems: Record<
    string,
    [ValueTypeName, ConfigValue | undefined]
  > = {
    default: ["str", "random"],
    options: ["list", undefined],
    mutate_rate: ["float", undefined],
  };

  public init_value(config: DefaultClassConfig): string {
    const defaultValue = (config[this.default_name] as string).toLowerCase();

    if (defaultValue === "none" || defaultValue === "random") {
      const options = config[this.options_name] as string[];
      if (!options || options.length === 0) {
        throw new Error(
          `Attribute ${this.name} has no options to choose from for random initialization.`,
        );
      }
      return choice(options);
    }

    return defaultValue;
  }

  public mutate_value(value: string, config: DefaultClassConfig): string {
    const mutateRate = config[this.mutate_rate_name] as number;

    if (mutateRate > 0) {
      if (Math.random() < mutateRate) {
        const options = config[this.options_name] as string[];
        if (!options || options.length === 0) {
          throw new Error(
            `Attribute ${this.name} has no options to choose from for mutation.`,
          );
        }
        return choice(options);
      }
    }

    return value;
  }

  public validate(config: DefaultClassConfig): void {
    const defaultValue = config[this.default_name] as string;
    if (
      defaultValue.toLowerCase() !== "none" &&
      defaultValue.toLowerCase() !== "random"
    ) {
      const options = config[this.options_name] as string[];
      if (!options.includes(defaultValue)) {
        throw new Error(
          `Invalid initial value ${defaultValue} for ${this.name}`,
        );
      }
    }
  }
}
