// index.ts
console.log("hello there!");

import {
  DefaultClassConfig,
  ConfigParameter,
  UnknownConfigItemError,
} from "./components/config29";
import {
  FloatAttribute,
  IntegerAttribute,
  BoolAttribute,
  StringAttribute,
  BaseAttribute,
  ValueTypeName,
  ConfigValue,
} from "./components/attributes29"; // Path to your attributes.ts file

// Helper function for consistent test output
function runTest(name: string, testFn: () => void) {
  console.log(`\n--- ${name} ---`);
  try {
    testFn();
    console.log(`--- ${name} PASSED ---`);
  } catch (error: any) {
    console.error(`--- ${name} FAILED ---`);
    // Differentiate between expected UnknownConfigItemError and other errors
    if (error instanceof UnknownConfigItemError) {
      console.error(`  Error (Unknown Config Item): ${error.message}`);
    } else {
      console.error(`  Error: ${error.message}`);
    }
    if (error.stack) {
      // console.error(error.stack); // Uncomment for full stack trace
    }
  }
}

// --- Test Common BaseAttribute Functionality ---
runTest("Test BaseAttribute: ConfigItemName and GetConfigParams", () => {
  // We need a concrete class to instantiate BaseAttribute (since it's abstract)
  class TestAttribute extends BaseAttribute {
    protected static _configItems: Record<
      string,
      [ValueTypeName, ConfigValue | undefined]
    > = {
      test_param: ["str", "default_val"] as [
        ValueTypeName,
        ConfigValue | undefined,
      ],
    };
    init_value(): any {
      return null;
    }
    mutate_value(): any {
      return null;
    }
    validate(): void {}
  }

  // Pass an empty object for 'defaultOverrides' to explicitly provide the second argument
  const attr = new TestAttribute("my_attr", {});

  // Test configItemName
  console.log(
    `  Config item name for 'test_param': ${attr.configItemName("test_param")}`,
  );
  if (attr.configItemName("test_param") !== "my_attr_test_param") {
    throw new Error("configItemName failed.");
  }

  // Test get_config_params
  const params = attr.get_config_params();
  if (params.length !== 1) {
    throw new Error(
      "get_config_params did not return expected number of parameters.",
    );
  }
  console.log(`  Generated ConfigParameter: ${JSON.stringify(params[0])}`);
  if (!(params[0] instanceof ConfigParameter)) {
    throw new Error("Returned item is not a ConfigParameter instance.");
  }
  if (
    params[0].name !== "my_attr_test_param" ||
    params[0].valueType !== "str" ||
    params[0].base !== "default_val"
  ) {
    throw new Error("Generated ConfigParameter has incorrect properties.");
  }
});

runTest("Test BaseAttribute: Default Overrides", () => {
  class TestAttrWithOverrides extends BaseAttribute {
    protected static _configItems: Record<
      string,
      [ValueTypeName, ConfigValue | undefined]
    > = {
      param1: ["int", 10] as [ValueTypeName, ConfigValue | undefined],
      param2: ["str", "hello"] as [ValueTypeName, ConfigValue | undefined],
    };
    init_value(): any {
      return null;
    }
    mutate_value(): any {
      return null;
    }
    validate(): void {}
  }

  const overrides = { param1: 20, param2: "world" };
  const attr = new TestAttrWithOverrides("override_attr", overrides);

  const params = attr.get_config_params();
  const param1 = params.find((p) => p.name === "override_attr_param1");
  const param2 = params.find((p) => p.name === "override_attr_param2");

  if (!param1 || param1.base !== 20) {
    throw new Error("Default override for param1 failed.");
  }
  if (!param2 || param2.base !== "world") {
    throw new Error("Default override for param2 failed.");
  }
  console.log("  Default overrides applied successfully.");
});

// --- Test FloatAttribute ---
runTest("Test FloatAttribute: init_value (gaussian)", () => {
  const floatAttr = new FloatAttribute("weight", {});
  const paramList = floatAttr.get_config_params(); // Get parameters for this attribute
  const configDict = {
    weight_init_mean: 0.0,
    weight_init_stdev: 0.1,
    weight_init_type: "gaussian",
    weight_min_value: -1.0,
    weight_max_value: 1.0,
  };
  const config = new DefaultClassConfig(configDict, paramList); // Pass both arguments

  const value = floatAttr.init_value(config) as number;
  console.log(`  Initialized float value (gaussian): ${value}`);
  if (typeof value !== "number" || value < -1.0 || value > 1.0) {
    throw new Error("Float init_value (gaussian) failed validation.");
  }
});

runTest("Test FloatAttribute: init_value (uniform)", () => {
  const floatAttr = new FloatAttribute("bias", {});
  const paramList = floatAttr.get_config_params();
  const configDict = {
    bias_init_mean: 0.5,
    bias_init_stdev: 0.2,
    bias_init_type: "uniform",
    bias_min_value: 0.0,
    bias_max_value: 1.0,
  };
  const config = new DefaultClassConfig(configDict, paramList);

  const value = floatAttr.init_value(config) as number;
  console.log(`  Initialized float value (uniform): ${value}`);
  if (typeof value !== "number" || value < 0.1 || value > 0.9) {
    throw new Error("Float init_value (uniform) failed validation.");
  }
});

runTest("Test FloatAttribute: mutate_value", () => {
  const floatAttr = new FloatAttribute("gene", {});
  const paramList = floatAttr.get_config_params();
  const configDict = {
    gene_mutate_rate: 0.9,
    gene_replace_rate: 0.0,
    gene_mutate_power: 0.05,
    gene_init_mean: 0.5,
    gene_init_stdev: 0.1,
    gene_init_type: "gaussian",
    gene_min_value: 0.0,
    gene_max_value: 1.0,
  };
  const config = new DefaultClassConfig(configDict, paramList);

  let originalValue = 0.5;
  const mutatedValue = floatAttr.mutate_value(originalValue, config) as number;
  console.log(`  Original float: ${originalValue}, Mutated: ${mutatedValue}`);
  if (mutatedValue < 0.0 || mutatedValue > 1.0) {
    throw new Error("Float mutate_value resulted in out-of-bounds value.");
  }
});

runTest("Test FloatAttribute: validate (valid)", () => {
  const floatAttr = new FloatAttribute("valid_range", {});
  const paramList = floatAttr.get_config_params();
  const configDict = {
    valid_range_min_value: 0.0,
    valid_range_max_value: 1.0,
  };
  const config = new DefaultClassConfig(configDict, paramList);
  floatAttr.validate(config);
  console.log("  FloatAttribute validation passed for valid range.");
});

runTest("Test FloatAttribute: validate (invalid min/max)", () => {
  const floatAttr = new FloatAttribute("invalid_range", {});
  const paramList = floatAttr.get_config_params();
  const configDict = {
    invalid_range_min_value: 1.0,
    invalid_range_max_value: 0.0,
  };
  const config = new DefaultClassConfig(configDict, paramList);
  let thrown = false;
  try {
    floatAttr.validate(config);
  } catch (e: any) {
    if (e.message.includes("Invalid min/max configuration")) {
      thrown = true;
    }
  }
  if (!thrown) {
    throw new Error(
      "FloatAttribute validation did not throw for invalid range.",
    );
  }
  console.log(
    "  FloatAttribute validation correctly failed for invalid range.",
  );
});

// --- Test IntegerAttribute ---
runTest("Test IntegerAttribute: init_value", () => {
  const intAttr = new IntegerAttribute("hidden_nodes", {});
  const paramList = intAttr.get_config_params();
  const configDict = {
    hidden_nodes_min_value: 1,
    hidden_nodes_max_value: 10,
  };
  const config = new DefaultClassConfig(configDict, paramList);

  const value = intAttr.init_value(config) as number;
  console.log(`  Initialized integer value: ${value}`);
  if (
    typeof value !== "number" ||
    !Number.isInteger(value) ||
    value < 1 ||
    value > 10
  ) {
    throw new Error("Integer init_value failed validation.");
  }
});

runTest("Test IntegerAttribute: mutate_value", () => {
  const intAttr = new IntegerAttribute("layers", {});
  const paramList = intAttr.get_config_params();
  const configDict = {
    layers_mutate_rate: 0.9,
    layers_replace_rate: 0.0,
    layers_mutate_power: 1.0,
    layers_min_value: 1,
    layers_max_value: 5,
  };
  const config = new DefaultClassConfig(configDict, paramList);

  let originalValue = 3;
  const mutatedValue = intAttr.mutate_value(originalValue, config) as number;
  console.log(`  Original int: ${originalValue}, Mutated: ${mutatedValue}`);
  if (
    typeof mutatedValue !== "number" ||
    !Number.isInteger(mutatedValue) ||
    mutatedValue < 1 ||
    mutatedValue > 5
  ) {
    throw new Error(
      "Integer mutate_value resulted in out-of-bounds or non-integer value.",
    );
  }
});

runTest("Test IntegerAttribute: validate (valid)", () => {
  const intAttr = new IntegerAttribute("int_range", {});
  const paramList = intAttr.get_config_params();
  const configDict = {
    int_range_min_value: -5,
    int_range_max_value: 5,
  };
  const config = new DefaultClassConfig(configDict, paramList);
  intAttr.validate(config);
  console.log("  IntegerAttribute validation passed for valid range.");
});

runTest("Test IntegerAttribute: validate (invalid min/max)", () => {
  const intAttr = new IntegerAttribute("invalid_int_range", {});
  const paramList = intAttr.get_config_params();
  const configDict = {
    invalid_int_range_min_value: 10,
    invalid_int_range_max_value: 1,
  };
  const config = new DefaultClassConfig(configDict, paramList);
  let thrown = false;
  try {
    intAttr.validate(config);
  } catch (e: any) {
    if (e.message.includes("Invalid min/max configuration")) {
      thrown = true;
    }
  }
  if (!thrown) {
    throw new Error(
      "IntegerAttribute validation did not throw for invalid range.",
    );
  }
  console.log(
    "  IntegerAttribute validation correctly failed for invalid range.",
  );
});

// --- Test BoolAttribute ---
runTest("Test BoolAttribute: init_value (true)", () => {
  const boolAttr = new BoolAttribute("enabled", {});
  const paramList = boolAttr.get_config_params();
  const configDict = {
    enabled_default: "true",
  };
  const config = new DefaultClassConfig(configDict, paramList);
  if (boolAttr.init_value(config) !== true) {
    throw new Error("Bool init_value failed for 'true'.");
  }
  console.log("  Bool init_value passed for 'true'.");
});

runTest("Test BoolAttribute: init_value (false)", () => {
  const boolAttr = new BoolAttribute("active", {});
  const paramList = boolAttr.get_config_params();
  const configDict = {
    active_default: "0",
  };
  const config = new DefaultClassConfig(configDict, paramList);
  if (boolAttr.init_value(config) !== false) {
    throw new Error("Bool init_value failed for '0'.");
  }
  console.log("  Bool init_value passed for '0'.");
});

runTest("Test BoolAttribute: init_value (random)", () => {
  const boolAttr = new BoolAttribute("random_flag", {});
  const paramList = boolAttr.get_config_params();
  const configDict = {
    random_flag_default: "random",
  };
  const config = new DefaultClassConfig(configDict, paramList);
  const value = boolAttr.init_value(config);
  console.log(`  Initialized bool value (random): ${value}`);
  if (typeof value !== "boolean") {
    throw new Error("Bool init_value failed for 'random'.");
  }
});

runTest("Test BoolAttribute: mutate_value", () => {
  const boolAttr = new BoolAttribute("flip", {});
  const paramList = boolAttr.get_config_params();
  const configDict = {
    flip_mutate_rate: 1.0,
    flip_rate_to_true_add: 0.0,
    flip_rate_to_false_add: 0.0,
  };
  const config = new DefaultClassConfig(configDict, paramList);

  const originalTrue = true;
  const mutatedTrue = boolAttr.mutate_value(originalTrue, config);
  console.log(`  Original true: ${originalTrue}, Mutated: ${mutatedTrue}`);
  if (typeof mutatedTrue !== "boolean") {
    throw new Error("Bool mutate_value failed for 'true'.");
  }

  const originalFalse = false;
  const mutatedFalse = boolAttr.mutate_value(originalFalse, config);
  console.log(`  Original false: ${originalFalse}, Mutated: ${mutatedFalse}`);
  if (typeof mutatedFalse !== "boolean") {
    throw new Error("Bool mutate_value failed for 'false'.");
  }
});

runTest("Test BoolAttribute: validate (valid)", () => {
  const boolAttr = new BoolAttribute("valid_bool", {});
  const paramList = boolAttr.get_config_params();
  const configDict = {
    valid_bool_default: "yes",
  };
  const config = new DefaultClassConfig(configDict, paramList);
  boolAttr.validate(config);
  console.log("  BoolAttribute validation passed for valid default.");
});

runTest("Test BoolAttribute: validate (invalid)", () => {
  const boolAttr = new BoolAttribute("invalid_bool", {});
  const paramList = boolAttr.get_config_params();
  const configDict = {
    invalid_bool_default: "maybe",
  };
  const config = new DefaultClassConfig(configDict, paramList);
  let thrown = false;
  try {
    boolAttr.validate(config);
  } catch (e: any) {
    if (e.message.includes("Invalid default value")) {
      thrown = true;
    }
  }
  if (!thrown) {
    throw new Error(
      "BoolAttribute validation did not throw for invalid default.",
    );
  }
  console.log(
    "  BoolAttribute validation correctly failed for invalid default.",
  );
});

// --- Test StringAttribute ---
runTest("Test StringAttribute: init_value (default option)", () => {
  const strAttr = new StringAttribute("activation", {});
  const paramList = strAttr.get_config_params();
  const configDict = {
    activation_default: "sigmoid",
    activation_options: ["sigmoid", "relu", "tanh"],
  };
  const config = new DefaultClassConfig(configDict, paramList);
  if (strAttr.init_value(config) !== "sigmoid") {
    throw new Error("String init_value failed for specific default.");
  }
  console.log("  String init_value passed for specific default.");
});

runTest("Test StringAttribute: init_value (random option)", () => {
  const strAttr = new StringAttribute("color", {});
  const paramList = strAttr.get_config_params();
  const configDict = {
    color_default: "random",
    color_options: ["red", "green", "blue"],
  };
  const config = new DefaultClassConfig(configDict, paramList);
  const value = strAttr.init_value(config);
  console.log(`  Initialized string value (random): ${value}`);
  if (!["red", "green", "blue"].includes(value as string)) {
    throw new Error("String init_value failed for random selection.");
  }
});

runTest("Test StringAttribute: init_value (no options for random)", () => {
  const strAttr = new StringAttribute("shape", {});
  const paramList = strAttr.get_config_params();
  const configDict = {
    shape_default: "random",
    shape_options: [], // Empty options
  };
  const config = new DefaultClassConfig(configDict, paramList);
  let thrown = false;
  try {
    strAttr.init_value(config);
  } catch (e: any) {
    if (e.message.includes("no options to choose from")) {
      thrown = true;
    }
  }
  if (!thrown) {
    throw new Error(
      "String init_value did not throw for random with no options.",
    );
  }
  console.log(
    "  String init_value correctly failed for random with no options.",
  );
});

runTest("Test StringAttribute: mutate_value", () => {
  const strAttr = new StringAttribute("style", {});
  const paramList = strAttr.get_config_params();
  const configDict = {
    style_mutate_rate: 1.0,
    style_options: ["bold", "italic", "underline"],
  };
  const config = new DefaultClassConfig(configDict, paramList);

  const originalValue = "bold";
  const mutatedValue = strAttr.mutate_value(originalValue, config);
  console.log(`  Original string: ${originalValue}, Mutated: ${mutatedValue}`);
  if (!["bold", "italic", "underline"].includes(mutatedValue as string)) {
    throw new Error("String mutate_value failed to select from options.");
  }
});

runTest("Test StringAttribute: validate (valid default)", () => {
  const strAttr = new StringAttribute("font", {});
  const paramList = strAttr.get_config_params();
  const configDict = {
    font_default: "Arial",
    font_options: ["Arial", "Verdana"],
  };
  const config = new DefaultClassConfig(configDict, paramList);
  strAttr.validate(config);
  console.log("  StringAttribute validation passed for valid default.");
});

runTest(
  "Test StringAttribute: validate (invalid default not in options)",
  () => {
    const strAttr = new StringAttribute("invalid_font", {});
    const paramList = strAttr.get_config_params();
    const configDict = {
      invalid_font_default: "Times New Roman",
      invalid_font_options: ["Arial", "Verdana"],
    };
    const config = new DefaultClassConfig(configDict, paramList);
    let thrown = false;
    try {
      strAttr.validate(config);
    } catch (e: any) {
      if (e.message.includes("Invalid initial value")) {
        thrown = true;
      }
    }
    if (!thrown) {
      throw new Error(
        "StringAttribute validation did not throw for invalid default not in options.",
      );
    }
    console.log(
      "  StringAttribute validation correctly failed for invalid default not in options.",
    );
  },
);
