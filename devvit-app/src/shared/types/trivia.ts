export interface TriviaQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  source?: string;
  dateAdded?: string;
}

export interface DailyTriviaSet {
  date: string;
  questions: TriviaQuestion[];
  theme?: string;
  specialEvent?: string;
}

// Expanded Michigan Trivia Database
export const MICHIGAN_TRIVIA_QUESTIONS: TriviaQuestion[] = [
  // Geography & Landmarks
  {
    id: 'capital-1',
    question: 'What is the capital of Michigan?',
    options: ['Detroit', 'Lansing', 'Grand Rapids', 'Ann Arbor'],
    correctIndex: 1,
    explanation: 'Lansing has been Michigan\'s capital since 1847, chosen for its central location.',
    category: 'Geography',
    difficulty: 'easy'
  },
  {
    id: 'great-lakes-1',
    question: 'Which Great Lake does NOT border Michigan?',
    options: ['Lake Superior', 'Lake Michigan', 'Lake Erie', 'Lake Ontario'],
    correctIndex: 3,
    explanation: 'Michigan borders Lakes Superior, Michigan, Huron, and Erie, but not Lake Ontario.',
    category: 'Geography',
    difficulty: 'medium'
  },
  {
    id: 'mackinac-bridge-1',
    question: 'What is the nickname for the Mackinac Bridge?',
    options: ['Big Mac', 'Mighty Mac', 'Great Connector', 'Bridge of Sighs'],
    correctIndex: 1,
    explanation: 'The Mackinac Bridge is affectionately known as "Mighty Mac" and connects Michigan\'s two peninsulas.',
    category: 'Landmarks',
    difficulty: 'easy'
  },
  {
    id: 'sleeping-bear-1',
    question: 'Sleeping Bear Dunes National Lakeshore is located along which Great Lake?',
    options: ['Lake Superior', 'Lake Michigan', 'Lake Huron', 'Lake Erie'],
    correctIndex: 1,
    explanation: 'Sleeping Bear Dunes stretches along Lake Michigan\'s eastern shore and was voted "Most Beautiful Place in America" by Good Morning America.',
    category: 'Geography',
    difficulty: 'medium'
  },
  {
    id: 'pictured-rocks-1',
    question: 'Pictured Rocks National Lakeshore features colorful cliffs along which lake?',
    options: ['Lake Michigan', 'Lake Superior', 'Lake Huron', 'Lake Erie'],
    correctIndex: 1,
    explanation: 'Pictured Rocks National Lakeshore showcases stunning multicolored cliffs along Lake Superior in the Upper Peninsula.',
    category: 'Geography',
    difficulty: 'medium'
  },

  // History
  {
    id: 'statehood-1',
    question: 'In what year did Michigan become a state?',
    options: ['1835', '1837', '1840', '1845'],
    correctIndex: 1,
    explanation: 'Michigan became the 26th state on January 26, 1837, after resolving the Toledo War boundary dispute.',
    category: 'History',
    difficulty: 'medium'
  },
  {
    id: 'detroit-founding-1',
    question: 'Who founded Detroit in 1701?',
    options: ['Jacques Marquette', 'Antoine de la Mothe Cadillac', 'René-Robert Cavelier', 'Louis Jolliet'],
    correctIndex: 1,
    explanation: 'Antoine de la Mothe Cadillac founded Detroit in 1701 as Fort Pontchartrain du Détroit.',
    category: 'History',
    difficulty: 'hard'
  },
  {
    id: 'underground-railroad-1',
    question: 'Which Michigan city was a major terminus of the Underground Railroad?',
    options: ['Lansing', 'Grand Rapids', 'Detroit', 'Kalamazoo'],
    correctIndex: 2,
    explanation: 'Detroit was a crucial final stop on the Underground Railroad, with many freedom seekers crossing into Canada.',
    category: 'History',
    difficulty: 'medium'
  },

  // Culture & Universities
  {
    id: 'university-michigan-1',
    question: 'Which university is located in Ann Arbor?',
    options: ['Michigan State', 'University of Michigan', 'Wayne State', 'Western Michigan'],
    correctIndex: 1,
    explanation: 'The University of Michigan, founded in 1817, is located in Ann Arbor and is known for its Wolverines.',
    category: 'Education',
    difficulty: 'easy'
  },
  {
    id: 'michigan-state-1',
    question: 'What is the mascot of Michigan State University?',
    options: ['Wolverines', 'Spartans', 'Eagles', 'Broncos'],
    correctIndex: 1,
    explanation: 'Michigan State University Spartans are based in East Lansing and known for their green and white colors.',
    category: 'Education',
    difficulty: 'easy'
  },
  {
    id: 'motown-1',
    question: 'What does "Motown" stand for?',
    options: ['Motor Town', 'Music Town', 'Modern Town', 'Metropolitan Town'],
    correctIndex: 0,
    explanation: 'Motown is short for "Motor Town," referring to Detroit\'s role as the center of the automotive industry.',
    category: 'Culture',
    difficulty: 'easy'
  },

  // Industry & Economy
  {
    id: 'ford-model-t-1',
    question: 'Where was the Ford Model T first mass-produced?',
    options: ['Dearborn', 'Detroit', 'Highland Park', 'River Rouge'],
    correctIndex: 2,
    explanation: 'The Ford Model T was first mass-produced at the Highland Park Ford Plant using the revolutionary assembly line method.',
    category: 'Industry',
    difficulty: 'medium'
  },
  {
    id: 'cereal-1',
    question: 'Which Michigan city is known as the "Cereal Capital of the World"?',
    options: ['Grand Rapids', 'Battle Creek', 'Kalamazoo', 'Jackson'],
    correctIndex: 1,
    explanation: 'Battle Creek is home to Kellogg\'s and Post cereals, earning it the nickname "Cereal Capital of the World."',
    category: 'Industry',
    difficulty: 'medium'
  },
  {
    id: 'furniture-1',
    question: 'Which Michigan city was historically known as "Furniture City"?',
    options: ['Grand Rapids', 'Holland', 'Muskegon', 'Zeeland'],
    correctIndex: 0,
    explanation: 'Grand Rapids was known as "Furniture City" due to its thriving furniture manufacturing industry in the 19th and early 20th centuries.',
    category: 'Industry',
    difficulty: 'medium'
  },

  // Sports
  {
    id: 'red-wings-1',
    question: 'What NHL team plays in Detroit?',
    options: ['Red Wings', 'Blue Wings', 'Blackhawks', 'Rangers'],
    correctIndex: 0,
    explanation: 'The Detroit Red Wings are one of the "Original Six" NHL teams and play at Little Caesars Arena.',
    category: 'Sports',
    difficulty: 'easy'
  },
  {
    id: 'pistons-1',
    question: 'In what year did the Detroit Pistons win their first NBA championship?',
    options: ['1989', '1990', '2004', '1988'],
    correctIndex: 0,
    explanation: 'The Detroit Pistons won their first NBA championship in 1989, followed by another in 1990 and 2004.',
    category: 'Sports',
    difficulty: 'hard'
  },

  // Nature & Wildlife
  {
    id: 'state-bird-1',
    question: 'What is Michigan\'s state bird?',
    options: ['Cardinal', 'Blue Jay', 'American Robin', 'Goldfinch'],
    correctIndex: 2,
    explanation: 'The American Robin has been Michigan\'s state bird since 1931, known for its red breast and melodic song.',
    category: 'Nature',
    difficulty: 'medium'
  },
  {
    id: 'state-tree-1',
    question: 'What is Michigan\'s state tree?',
    options: ['Oak', 'Maple', 'White Pine', 'Birch'],
    correctIndex: 2,
    explanation: 'The White Pine (Pinus strobus) became Michigan\'s state tree in 1955, representing the state\'s lumber heritage.',
    category: 'Nature',
    difficulty: 'medium'
  },
  {
    id: 'isle-royale-1',
    question: 'Isle Royale National Park is famous for studying which animals?',
    options: ['Bears and Deer', 'Wolves and Moose', 'Eagles and Fish', 'Beavers and Otters'],
    correctIndex: 1,
    explanation: 'Isle Royale is famous for the longest-running predator-prey study in the world, focusing on wolves and moose.',
    category: 'Nature',
    difficulty: 'hard'
  },

  // Food & Culture
  {
    id: 'coney-dog-1',
    question: 'What makes a Detroit-style Coney dog unique?',
    options: ['Mustard and onions', 'Chili, mustard, and onions', 'Ketchup and relish', 'Cheese and bacon'],
    correctIndex: 1,
    explanation: 'A Detroit Coney dog features chili, yellow mustard, and diced white onions on a natural casing hot dog.',
    category: 'Food',
    difficulty: 'medium'
  },
  {
    id: 'pasty-1',
    question: 'What is a "pasty" in Upper Peninsula cuisine?',
    options: ['A type of pie', 'A meat and vegetable pastry', 'A fish dish', 'A dessert'],
    correctIndex: 1,
    explanation: 'A pasty is a baked pastry filled with meat and vegetables, brought to the UP by Cornish miners.',
    category: 'Food',
    difficulty: 'medium'
  },

  // Unique Michigan Facts
  {
    id: 'two-peninsulas-1',
    question: 'Michigan is the only state that consists of how many peninsulas?',
    options: ['One', 'Two', 'Three', 'Four'],
    correctIndex: 1,
    explanation: 'Michigan is unique as the only state consisting of two peninsulas: the Lower Peninsula (mitten) and Upper Peninsula.',
    category: 'Geography',
    difficulty: 'easy'
  },
  {
    id: 'lighthouses-1',
    question: 'Michigan has more lighthouses than any other state. Approximately how many?',
    options: ['50', '75', '100', '130'],
    correctIndex: 3,
    explanation: 'Michigan has over 130 lighthouses, more than any other state, due to its extensive Great Lakes coastline.',
    category: 'Geography',
    difficulty: 'hard'
  },
  {
    id: 'cherries-1',
    question: 'Michigan produces what percentage of America\'s tart cherries?',
    options: ['50%', '65%', '75%', '85%'],
    correctIndex: 2,
    explanation: 'Michigan produces about 75% of America\'s tart cherries, primarily in the Traverse City area.',
    category: 'Agriculture',
    difficulty: 'hard'
  },

  // Modern Michigan
  {
    id: 'largest-city-1',
    question: 'What is Michigan\'s largest city by population?',
    options: ['Detroit', 'Grand Rapids', 'Warren', 'Sterling Heights'],
    correctIndex: 0,
    explanation: 'Detroit is Michigan\'s largest city and was once the 4th largest city in the United States.',
    category: 'Geography',
    difficulty: 'easy'
  },
  {
    id: 'nickname-1',
    question: 'Which is NOT a nickname for Michigan?',
    options: ['The Wolverine State', 'The Great Lake State', 'The Mitten State', 'The Prairie State'],
    correctIndex: 3,
    explanation: 'The Prairie State is Illinois\'s nickname. Michigan is known as the Wolverine State, Great Lake State, and Mitten State.',
    category: 'General',
    difficulty: 'medium'
  }
];

// Categories for organizing questions
export const TRIVIA_CATEGORIES = [
  'Geography',
  'History', 
  'Culture',
  'Education',
  'Industry',
  'Sports',
  'Nature',
  'Food',
  'Agriculture',
  'General'
] as const;

export type TriviaCategory = typeof TRIVIA_CATEGORIES[number];

// Function to get questions by category
export function getQuestionsByCategory(category: TriviaCategory): TriviaQuestion[] {
  return MICHIGAN_TRIVIA_QUESTIONS.filter(q => q.category === category);
}

// Function to get questions by difficulty
export function getQuestionsByDifficulty(difficulty: 'easy' | 'medium' | 'hard'): TriviaQuestion[] {
  return MICHIGAN_TRIVIA_QUESTIONS.filter(q => q.difficulty === difficulty);
}

// Function to get random questions
export function getRandomQuestions(count: number = 5): TriviaQuestion[] {
  const shuffled = [...MICHIGAN_TRIVIA_QUESTIONS].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

// Function to get daily question set
export function getDailyQuestionSet(date: Date = new Date()): TriviaQuestion[] {
  // Use date as seed for consistent daily questions
  const dateString = date.toISOString().split('T')[0];
  const seed = dateString.split('-').reduce((acc, val) => acc + parseInt(val), 0);
  
  // Create a seeded random function
  let seedValue = seed;
  const seededRandom = () => {
    seedValue = (seedValue * 9301 + 49297) % 233280;
    return seedValue / 233280;
  };
  
  // Shuffle questions using seeded random
  const shuffled = [...MICHIGAN_TRIVIA_QUESTIONS].sort(() => seededRandom() - 0.5);
  
  // Select 5 questions with good difficulty distribution
  const easy = shuffled.filter(q => q.difficulty === 'easy').slice(0, 2);
  const medium = shuffled.filter(q => q.difficulty === 'medium').slice(0, 2);
  const hard = shuffled.filter(q => q.difficulty === 'hard').slice(0, 1);
  
  return [...easy, ...medium, ...hard];
}