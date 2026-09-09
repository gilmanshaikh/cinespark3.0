require('dotenv').config()
const mongoose = require('mongoose')
const Question = require('../models/Question')

const MONGODB_URI = process.env.MONGODB_URI

const baseQuestions = [
  {
    setNumber: 1,
    sequence: 1,
    questionNumber: 1,
    title: 'What does HTML stand for?',
    description: 'Choose the correct full form of HTML used in web development.',
    codeSnippet: '',
    options: [
      'Hyper Text Markup Language',
      'High Tech Modern Language',
      'Hyper Transfer Markup Language',
      'Hyperlink and Text Markup Language',
    ],
    correctOptionIndex: 0,
    hint: 'HTML is the standard language for creating web pages. Think "Hyper Text".',
    binaryClue: '01000011 01001111 01000100 01000101',
    decodedWord: 'CODE',
  },
  {
    setNumber: 1,
    sequence: 2,
    questionNumber: 2,
    title: 'Which data structure uses LIFO?',
    description: 'Identify the data structure that follows Last In First Out principle.',
    codeSnippet: '',
    options: ['Queue', 'Stack', 'Linked List', 'Tree'],
    correctOptionIndex: 1,
    hint: 'Think of a stack of plates — the last plate placed is the first one removed.',
    binaryClue: '01000110 01001001 01001100 01001101',
    decodedWord: 'FILM',
  },
  {
    setNumber: 1,
    sequence: 3,
    questionNumber: 3,
    title: 'What is the output of this code?',
    description: 'Predict what the following JavaScript code will print to the console.',
    codeSnippet: 'console.log(typeof null)',
    options: ['"null"', '"undefined"', '"object"', '"boolean"'],
    correctOptionIndex: 2,
    hint: 'This is a famous JavaScript quirk — typeof null returns something unexpected.',
    binaryClue: '01010011 01000011 01000101 01001110 01000101',
    decodedWord: 'SCENE',
  },
  {
    setNumber: 1,
    sequence: 4,
    questionNumber: 4,
    title: 'What does CSS stand for?',
    description: 'Select the correct expansion for the abbreviation CSS.',
    codeSnippet: '',
    options: [
      'Creative Style Sheets',
      'Cascading Style Sheets',
      'Computer Style Sheets',
      'Colorful Style Sheets',
    ],
    correctOptionIndex: 1,
    hint: 'It describes how HTML elements should be displayed. The C stands for "Cascading".',
    binaryClue: '01010011 01010100 01000001 01010010',
    decodedWord: 'STAR',
  },
  {
    setNumber: 1,
    sequence: 5,
    questionNumber: 5,
    title: 'Binary to Decimal: What is 1010 in decimal?',
    description: 'Convert the binary number 1010 to its decimal equivalent.',
    codeSnippet: '',
    options: ['8', '10', '12', '14'],
    correctOptionIndex: 1,
    hint: 'Use positional values: 8+0+2+0 = ?',
    binaryClue: '01001100 01001001 01000111 01001000 01010100',
    decodedWord: 'LIGHT',
  },
  {
    setNumber: 1,
    sequence: 6,
    questionNumber: 6,
    title: 'Which HTTP method is used to send data to a server?',
    description: 'Select the HTTP method primarily used to submit data to a server.',
    codeSnippet: '',
    options: ['GET', 'DELETE', 'POST', 'PATCH'],
    correctOptionIndex: 2,
    hint: 'This method is used when submitting a form or creating a resource.',
    binaryClue: '01000001 01000011 01010100 01001111 01010010',
    decodedWord: 'ACTOR',
  },
  {
    setNumber: 1,
    sequence: 7,
    questionNumber: 7,
    title: 'What does this Python snippet return?',
    description: 'Determine the return value of the function below.',
    codeSnippet: 'def mystery(n):\n    return n * 2 if n > 0 else -n\n\nprint(mystery(-3))',
    options: ['-6', '6', '3', '-3'],
    correctOptionIndex: 2,
    hint: 'When n is -3, the else branch executes: -(-3) = ?',
    binaryClue: '01000110 01010010 01000001 01001101 01000101',
    decodedWord: 'FRAME',
  },
  {
    setNumber: 1,
    sequence: 8,
    questionNumber: 8,
    title: 'Which sorting algorithm has O(n log n) average complexity?',
    description: 'Identify the algorithm known for O(n log n) average-case time complexity.',
    codeSnippet: '',
    options: ['Bubble Sort', 'Insertion Sort', 'Merge Sort', 'Selection Sort'],
    correctOptionIndex: 2,
    hint: 'It uses a divide-and-conquer strategy by splitting the array in half.',
    binaryClue: '01010011 01001000 01001111 01010100',
    decodedWord: 'SHOT',
  },
  {
    setNumber: 1,
    sequence: 9,
    questionNumber: 9,
    title: 'What is the primary role of a database index?',
    description: 'Select the statement that best describes the purpose of a database index.',
    codeSnippet: '',
    options: [
      'To store backup copies of data',
      'To speed up data retrieval operations',
      'To encrypt sensitive data',
      'To compress table rows',
    ],
    correctOptionIndex: 1,
    hint: 'Think of it like the index at the back of a book — it helps you find things faster.',
    binaryClue: '01000100 01010010 01000001 01001101 01000001',
    decodedWord: 'DRAMA',
  },
  {
    setNumber: 1,
    sequence: 10,
    questionNumber: 10,
    title: 'What keyword is used to define a class in Python?',
    description: 'Identify the correct Python keyword to declare a class.',
    codeSnippet: '',
    options: ['def', 'function', 'class', 'object'],
    correctOptionIndex: 2,
    hint: 'It is the same keyword used in most object-oriented languages like Java and C++.',
    binaryClue: '01000001 01010111 01000001 01010010 01000100',
    decodedWord: 'AWARD',
  },
]

const setThemes = [
  'Web Foundations', 'JavaScript Systems', 'Python Engineering', 'Data Structures',
  'Algorithms Lab', 'Database Design', 'Cloud Computing', 'Cybersecurity',
  'Networks and APIs', 'Operating Systems', 'Artificial Intelligence', 'Mobile Development',
  'DevOps Practice', 'Software Architecture', 'Computer Graphics', 'IoT Systems',
  'Data Science', 'Open Source', 'Testing Engineering', 'Future Technology',
]

const storySentences = [
  'BUILD YOUR IDEA WITH LOGIC AND TURN CODE INTO CINEMA',
  'CURIOUS MINDS CONNECT DATA AND CREATE STORIES WORTH SHARING TODAY',
  'STRONG TEAMS SOLVE HARD PROBLEMS AND SHIP BRILLIANT IDEAS TOGETHER',
  'EVERY ALGORITHM CAN GUIDE A NEW STORY TOWARD DISCOVERY TODAY',
  'CLEAR QUESTIONS BECOME GREAT ANSWERS WHEN TEAMS THINK TOGETHER WISELY',
  'DESIGN WITH PURPOSE TEST WITH CARE AND MAKE IT LAST',
  'SECURE SYSTEMS PROTECT CREATIVE IDEAS FROM EVERY HIDDEN THREAT TODAY',
  'CLOUDS SCALE FAST WHEN ARCHITECTS PLAN FOR REAL PEOPLE EVERYWHERE',
  'GOOD DATA REVEALS PATTERNS THAT TURN NOISE INTO KNOWLEDGE TODAY',
  'NETWORKS CARRY IDEAS ACROSS DISTANCE WITH SPEED AND TRUST ALWAYS',
  'PATIENT DEBUGGING TURNS MYSTERIOUS FAILURES INTO USEFUL LESSONS FOR GROWTH',
  'SMALL DEVICES GATHER SIGNALS THAT INSPIRE BIGGER DECISIONS EVERY DAY',
  'AUTOMATION GIVES CREATIVE TEAMS MORE TIME TO IMAGINE AND BUILD',
  'TESTING BUILDS CONFIDENCE BEFORE A PRODUCT MEETS THE WORLD SAFELY',
  'OPEN COLLABORATION MAKES COMPLEX TECHNOLOGY FEEL HUMAN AND POSSIBLE TODAY',
  'EVERY SCREEN CAN BECOME A WINDOW INTO ANOTHER POSSIBILITY TODAY',
  'BRAVE BUILDERS LEARN QUICKLY ADAPT OFTEN AND KEEP MOVING FORWARD',
  'MEANINGFUL PRODUCTS START WITH EMPATHY AND END WITH IMPACT TODAY',
  'CODE IS A TOOL FOR QUESTIONS CURIOSITY AND CHANGE ALWAYS',
  'THE BEST SOLUTIONS BALANCE PRECISION CREATIVITY AND COURAGE WITH PURPOSE',
]

function toBinary(value) {
  return [...value].map((character) => character.charCodeAt(0).toString(2).padStart(8, '0')).join(' ')
}

const questions = setThemes.flatMap((theme, setIndex) => {
  const words = storySentences[setIndex].split(' ')
  return baseQuestions.map((base, sequenceIndex) => ({
    ...base,
    setNumber: setIndex + 1,
    sequence: sequenceIndex + 1,
    questionNumber: (setIndex * 10) + sequenceIndex + 1,
    title: `${theme}: ${base.title}`,
    description: `Set ${setIndex + 1} technical challenge. ${base.description}`,
    binaryClue: toBinary(words[sequenceIndex]),
    decodedWord: words[sequenceIndex],
  }))
})

if (questions.length !== 200 || new Set(questions.map((question) => question.questionNumber)).size !== 200) {
  throw new Error('Question seed must contain exactly 200 unique questions.')
}
if (storySentences.some((sentence) => sentence.split(' ').length !== 10)) {
  throw new Error('Every seeded story sentence must contain exactly 10 words.')
}

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI)
    console.log('MongoDB connected for seeding...')

    await Question.deleteMany({})
    console.log('Cleared existing questions.')

    await Question.insertMany(questions)
    console.log(`Seeded ${questions.length} questions across ${setThemes.length} complete sets.`)

    await mongoose.disconnect()
    console.log('Done. MongoDB disconnected.')
    process.exit(0)
  } catch (err) {
    console.error('Seed error:', err.message)
    process.exit(1)
  }
}

seed()
