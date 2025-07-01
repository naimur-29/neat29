// --- Example Usage ---
console.log("--- Example Usage ---");

// 1. Create an instance of the function set
const activationFunctions = new ActivationFunctionSet();

// 2. Get and use a built-in function
const relu = activationFunctions.get("relu");
console.log(`relu(-2) = ${relu(-2)}`); // Expected: 0
console.log(`relu(3.5) = ${relu(3.5)}`); // Expected: 3.5

// 3. Check if a function is valid
console.log(
  `Is 'sigmoid' a valid function? ${activationFunctions.isValid("sigmoid")}`,
); // Expected: true
console.log(
  `Is 'myfunc' a valid function? ${activationFunctions.isValid("myfunc")}`,
); // Expected: false

// 4. Add a new user-defined function
const myCustomActivation = (x) => 0.1 * x;
activationFunctions.add("myCustom", myCustomActivation);
console.log(
  `Is 'myCustom' now a valid function? ${activationFunctions.isValid("myCustom")}`,
); // Expected: true

const customFunc = activationFunctions.get("myCustom");
console.log(`myCustom(50) = ${customFunc(50)}`); // Expected: 5

// 5. Demonstrate error handling
console.log("\n--- Demonstrating Error Handling ---");
try {
  // Attempt to get a non-existent function
  activationFunctions.get("nonexistent");
} catch (e) {
  console.error(e.name, ":", e.message);
}

try {
  // Attempt to add an invalid item (not a function)
  activationFunctions.add("invalid1", 123);
} catch (e) {
  console.error(e.name, ":", e.message);
}

try {
  // Attempt to add a function with the wrong number of arguments
  activationFunctions.add("invalid2", (a, b) => a + b);
} catch (e) {
  console.error(e.name, ":", e.message);
}

function setup() {
  createCanvas(600, 400);
  background(220);
}

function draw() {
  fill(100, 150, 250);
  ellipse(mouseX, mouseY, 50, 50);
}
