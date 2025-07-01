type ConfigValue = string | number | boolean | string[];
type ValueTypeName = "int" | "bool" | "float" | "list" | "str";

export class ConfigParameter {
  constructor(
    public name: string,
    public valueType: ValueTypeName,
    public base?: ConfigValue,
  ) {}

  public interpret(configDict: Record<string, any>): ConfigValue {
    let value = configDict[this.name];

    if (value === undefined || value === null) {
      if (this.base === undefined) {
        throw new Error(`Missing configuration item: ${this.name}`);
      }
      console.warn(
        `Using default ${JSON.stringify(this.base)} for '${this.name}'`,
      );
      return this.base;
    }

    // Type validation
    switch (this.valueType) {
      case "str":
        if (typeof value !== "string")
          throw new TypeError(`'${this.name}' must be a string.`);
        break;
      case "int":
        if (typeof value !== "number" || !Number.isInteger(value))
          throw new TypeError(`'${this.name}' must be an integer.`);
        break;
      case "float":
        if (typeof value !== "number")
          throw new TypeError(`'${this.name}' must be a number.`);
        break;
      case "bool":
        if (typeof value !== "boolean")
          throw new TypeError(`'${this.name}' must be a boolean.`);
        break;
      case "list":
        if (
          !Array.isArray(value) ||
          !value.every((item) => typeof item === "string")
        ) {
          throw new TypeError(`'${this.name}' must be an array of strings.`);
        }
        break;
      default:
        throw new Error(`Unexpected configuration type: '${this.valueType}'`);
    }

    return value;
  }
}

export class UnknownConfigItemError extends Error {}

export class baseClassConfig {
  protected _params: ConfigParameter[];
  [key: string]: any; // Allow property access by string index

  constructor(paramDict: Record<string, any>, paramList: ConfigParameter[]) {
    this._params = paramList;
    const paramListNames: string[] = [];

    for (const p of paramList) {
      this[p.name] = p.interpret(paramDict);
      paramListNames.push(p.name);
    }

    const unknownList = Object.keys(paramDict).filter(
      (x) => !paramListNames.includes(x),
    );
    if (unknownList.length > 0) {
      const message =
        unknownList.length > 1
          ? `Unknown configuration items:\n\t${unknownList.join("\n\t")}`
          : `Unknown configuration item ${unknownList[0]}`;
      throw new UnknownConfigItemError(message);
    }
  }

  public toJsonObject(): Record<string, ConfigValue> {
    const obj: Record<string, ConfigValue> = {};
    for (const p of this._params) {
      obj[p.name] = this[p.name];
    }
    return obj;
  }
}

export interface IConfigurableClass {
  new (
    paramDict: Record<string, any>,
    paramList: ConfigParameter[],
  ): baseClassConfig;
  name: string;
  getParams(): ConfigParameter[];
}

export class Config {
  private static readonly __params = [
    new ConfigParameter("pop_size", "int"),
    new ConfigParameter("fitness_criterion", "str"),
    new ConfigParameter("fitness_threshold", "float"),
    new ConfigParameter("reset_on_extinction", "bool"),
    new ConfigParameter("no_fitness_termination", "bool", false),
  ];

  public pop_size!: number;
  public fitness_criterion!: string;
  public fitness_threshold!: number;
  public reset_on_extinction!: boolean;
  public no_fitness_termination!: boolean;

  public genome_config: baseClassConfig;
  public reproduction_config: baseClassConfig;
  public species_set_config: baseClassConfig;
  public stagnation_config: baseClassConfig;

  constructor(
    genomeType: IConfigurableClass,
    reproductionType: IConfigurableClass,
    speciesSetType: IConfigurableClass,
    stagnationType: IConfigurableClass,
    jsonString: string,
  ) {
    const configData = JSON.parse(jsonString);

    const neatSection = configData["NEAT"];
    if (!neatSection) {
      throw new Error("'NEAT' section not found in configuration.");
    }

    const neatConfig = new baseClassConfig(neatSection, Config.__params);
    for (const p of Config.__params) {
      (this as any)[p.name] = (neatConfig as any)[p.name];
    }

    this.genome_config = new genomeType(
      configData[genomeType.name] || {},
      genomeType.getParams(),
    );
    this.reproduction_config = new reproductionType(
      configData[reproductionType.name] || {},
      reproductionType.getParams(),
    );
    this.species_set_config = new speciesSetType(
      configData[speciesSetType.name] || {},
      speciesSetType.getParams(),
    );
    this.stagnation_config = new stagnationType(
      configData[stagnationType.name] || {},
      stagnationType.getParams(),
    );
  }

  public save(): string {
    const neatData: Record<string, ConfigValue> = {};
    for (const p of Config.__params) {
      neatData[p.name] = (this as any)[p.name]; // Copy values from 'this' (the Config instance)
    }

    const output = {
      NEAT: new baseClassConfig(neatData, Config.__params).toJsonObject(),
      [this.genome_config.constructor.name]: this.genome_config.toJsonObject(),
      [this.reproduction_config.constructor.name]:
        this.reproduction_config.toJsonObject(),
      [this.species_set_config.constructor.name]:
        this.species_set_config.toJsonObject(),
      [this.stagnation_config.constructor.name]:
        this.stagnation_config.toJsonObject(),
    };

    return JSON.stringify(output, null, 2);
  }
}
