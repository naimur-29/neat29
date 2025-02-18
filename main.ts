import Agent29 from "./Agent29";
import Config29 from "./Config29";
import Population29 from "./Population29";

const inputs = [
  [0, 0],
  [0, 1],
  [1, 0],
  [1, 1],
];

const outputs = [0, 1, 1, 0];

let agents = [];

const config = new Config29({
  inputSize: 2,
  outputSize: 1,
  hiddenSize: 16,
  activationFunction: "TANH",
});

for (let i = 0; i < 1000; i++) {
  const agent = new Agent29(config);
  agents.push(agent);
}
const population = new Population29(agents);

let generationCount = 0;
let winner = population.agents[0];
while (winner.fitness < 3.8) {
  generationCount++;
  for (const agent of population.agents) {
    agent.fitness = 0;
    for (let i = 0; i < inputs.length; i++) {
      const out = agent.forward(inputs[i]);

      const expectedOutput = outputs[i] * 2 - 1;
      agent.fitness += 2 - Math.abs(expectedOutput - out[0]);
    }
    agent.fitness /= 2;
  }

  population.evaluate();
  winner = population.agents[0];
  console.log("Generation:", generationCount);
  console.log(inputs.map((input) => winner.forward(input)[0]).join(", "));
  console.log(winner.fitness);
  console.log(
    winner.genome.hiddenNodes.map((node) =>
      node.connections.map((conn) => [conn.weight, conn.bias].join(", ")),
    ),
  );
  population.reproduce();
}
