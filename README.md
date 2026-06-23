# Sounder
Adapted from Stephanie-va

Here is the complete translation of the Sounder algorithm into pure JavaScript.

Because Python's sounder.py relied on two major external libraries (difflib.SequenceMatcher for string similarity and munkres for the Hungarian assignment algorithm), I have rewritten the core logic and provided instructions on how to include those dependencies in a standard web/NPM project.

1. Dependencies

If you are building a modern web app (React, Vue, or just vanilla JS with a bundler), you should install these two lightweight equivalents:

npm install munkres string-similarity
(Note: string-similarity uses Dice's Coefficient which behaves very similarly to Python's difflib.SequenceMatcher.ratio() for word matching).

2. The Sounder.js Class

Save this as Sounder.js in your project:

import munkres from 'munkres';
import stringSimilarity from 'string-similarity';

export class Sounder {
  constructor(dataset = []) {
    this.dataset = dataset;
    this.reservedSubWords = this.getReservedSubWords();
  }

  setDataset(dataset) {
    this.dataset = dataset;
    return this;
  }

  getReservedSubWords() {
    return new Set([
      "what", "where", "which", "how", "when", "who",
      "is", "are", "makes", "made", "make", "did", "do",
      "to", "the", "of", "from", "against", "and", "or",
      "you", "me", "we", "us", "your", "my", "mine", 'yours',
      "could", "would", "may", "might", "let", "possibly",
      'tell', "give", "told", "gave", "know", "knew",
      'a', 'am', 'an', 'i', 'like', 'has', 'have', 'need',
      'will', 'be', "this", 'that', "for"
    ]);
  }

  filter(query) {
    const subWords = [];
    const rawTextArray = query.toLowerCase().split(/\s+/);
    const keyWords = [];

    for (const rawText of rawTextArray) {
      if (this.reservedSubWords.has(rawText)) {
        subWords.push(rawText);
      } else {
        keyWords.push(rawText);
      }
    }
    return { subWords, keyWords };
  }

  search(query, dataset = null) {
    if (dataset) {
      this.dataset = dataset;
    }
    if (!this.dataset || this.dataset.length === 0) {
      throw new Error("Missing dataset parameter since it's not been initialized either.");
    }
    
    // query is expected to be an array of keyWords, exactly like Python's search()
    return this.process(this.dataset, query);
  }

  process(dataset, query) {
    const scores = [];
    for (const data of dataset) {
      const tempScores = this.processWords(data, query);
      const wordScore = this.pickMostProbableWord(tempScores, data.length);
      const avgScore = wordScore.reduce((a, b) => a + b, 0) / wordScore.length;
      scores.push([avgScore, wordScore]);
    }
    return this.pick(scores);
  }

  processWords(data, query) {
    const avgScoresList = [];
    for (const sWord of data) {
      const avgScores = new Array(query.length).fill(0);
      for (let index = 0; index < query.length; index++) {
        avgScores[index] = this.loop2(query[index], sWord);
      }
      avgScoresList.push(avgScores);
    }
    return this.hungarianAlgorithm(avgScoresList);
  }

  pickMostProbableWord(tempScores, length) {
    const wordScore = new Array(length).fill(0);
    for (let index = 0; index < tempScores.length; index++) {
      wordScore[index] = tempScores[index][0];
    }
    return wordScore;
  }

  hungarianAlgorithm(matrix) {
    const tempScores = [];
    const costMatrix = [];
    
    // Munkres minimizes cost, but we want to maximize score. 
    // We invert the score by subtracting from a large number.
    const MAX_VAL = 10000; 
    
    for (const row of matrix) {
      const costRow = [];
      for (const col of row) {
        costRow.push(MAX_VAL - col);
      }
      costMatrix.push(costRow);
    }

    const indexes = munkres(costMatrix);
    
    for (const [row, column] of indexes) {
      const score = matrix[row][column];
      tempScores.push([score, column]);
    }
    return tempScores;
  }

  loop2(kWord, sWord) {
    // Equivalent to difflib.SequenceMatcher.ratio() * 100
    const ratio = stringSimilarity.compareTwoStrings(kWord, sWord);
    return Math.round(ratio * 100);
  }

  pick(scores) {
    let maxScore = 0;
    let maxIndex = 0;

    for (let index = 0; index < scores.length; index++) {
      if (scores[index][0] > maxScore) {
        maxScore = scores[index][0];
        maxIndex = index;
      }
    }

    const picked = scores[maxIndex][1];
    let permSum = picked.reduce((a, b) => a + b, 0);
    let permAvg = permSum / picked.length;

    for (let index = 0; index < scores.length; index++) {
      if (scores[index][0] === maxScore && index !== maxIndex) {
        const item = scores[index][1];
        const tempSum = item.reduce((a, b) => a + b, 0);
        const tempAvg = tempSum / item.length;
        
        if (tempAvg > permAvg) {
          maxIndex = index;
          permSum = tempSum;
          permAvg = tempAvg;
        } else if (tempAvg === permAvg) {
          if (tempSum > permSum) {
            maxIndex = index;
            permSum = tempSum;
            permAvg = tempAvg;
          }
        }
      }
    }
    return maxIndex;
  }
}
3. Usage Example

You can test the logic directly like this:

import { Sounder } from './Sounder.js';

const brain = new Sounder();

// Example Modules dataset: 
// Index 0: Play Music intent
// Index 1: Weather intent
// Index 2: Time intent
brain.setDataset([
  ['play', 'song', 'music', 'track'],
  ['what', 'weather', 'forecast', 'rain'],
  ['what', 'time', 'clock']
]);

// 1. User says something
const userInput = "Can you play some good music please";

// 2. Filter stop words
const { keyWords } = brain.filter(userInput);
// keyWords = ['can', 'play', 'some', 'good', 'music', 'please']

// 3. Search dataset to find the matching module index
const predictedModuleIndex = brain.search(keyWords);

console.log(`Matched Module Index: ${predictedModuleIndex}`); 
// Should output 0 (The Play Music intent)
This translates the exact logic, including the stop words dictionary, the nested array scoring logic, and the Munkres mapping. Since you are building a web-native version, you can now tie this directly to the window.SpeechRecognition API on your iPad to feed voice text straight into brain.filter().
