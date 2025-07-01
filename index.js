import { AggregationFunctionSet } from "./src/aggregations.js";

export function main() {
  // --- Example Usage ---

  // 1. Create an instance of the aggregation function manager
  const aggregations = new AggregationFunctionSet();

  // 2. Define a sample dataset
  const myData = [-10, 1, 2, 5, -3];
  console.log(`Using data set: [${myData}]`);
  console.log("---------------------------------");

  // 3. Get and use some built-in aggregation functions
  console.log("--- Using Built-in Functions ---");

  // Get the 'sum' function and apply it
  const sumFunc = aggregations.get("sum");
  console.log(`Sum: ${sumFunc(myData)}`); // Expected: -5

  // Get the 'mean' function and apply it
  const meanFunc = aggregations.get("mean");
  console.log(`Mean: ${meanFunc(myData)}`); // Expected: -1

  // Get the 'maxabs' function (returns the number with the largest absolute value)
  const maxabsFunc = aggregations.get("maxabs");
  console.log(`Max Absolute Value: ${maxabsFunc(myData)}`); // Expected: -10 (because abs(-10) > abs(5))
  console.log("---------------------------------");

  // 4. Add a new user-defined aggregation function
  console.log("--- Adding a Custom Function ---");

  // Define a function to calculate the range (max - min)
  const rangeAggregation = (arr) => {
    if (arr.length === 0) return 0;
    return Math.max(...arr) - Math.min(...arr);
  };

  // Add it to the set with the name 'range'
  aggregations.add("range", rangeAggregation);
  console.log("Added custom 'range' aggregation.");

  // Now get and use the new function
  const rangeFunc = aggregations.get("range");
  console.log(`Custom 'range': ${rangeFunc(myData)}`); // Expected: 5 - (-10) = 15
  console.log("---------------------------------");

  // 5. Check if functions are valid
  console.log("--- Checking Validity ---");
  console.log(
    `Is 'mean' a valid function name? ${aggregations.isValid("mean")}`,
  ); // Expected: true
  console.log(
    `Is 'range' a valid function name? ${aggregations.isValid("range")}`,
  ); // Expected: true
  console.log(
    `Is 'foobar' a valid function name? ${aggregations.isValid("foobar")}`,
  ); // Expected: false
  console.log("---------------------------------");

  // 6. Demonstrate error handling for an invalid function name
  console.log("--- Demonstrating Error Handling ---");
  try {
    console.log("Attempting to get a non-existent function...");
    aggregations.get("nonexistent");
  } catch (e) {
    // This will catch the InvalidAggregationFunctionError
    console.error(`${e.name}: ${e.message}`);
  }
}
