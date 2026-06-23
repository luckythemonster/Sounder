import { Sounder } from './Sounder.js';

const brain = new Sounder();

brain.setDataset([
  ['play', 'song', 'music', 'track'],
  ['what', 'weather', 'forecast', 'rain'],
  ['what', 'time', 'clock']
]);

const userInput = "Can you play some good music please";
const { keyWords } = brain.filter(userInput);
const predictedModuleIndex = brain.search(keyWords);

console.log(`Input: "${userInput}"`);
console.log(`Matched Module Index: ${predictedModuleIndex}`);
