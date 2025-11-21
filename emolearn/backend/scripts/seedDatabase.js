const mongoose = require('mongoose');
const Content = require('../models/Content');
require('dotenv').config();

const seedData = [
  {
    subject: 'mathematics',
    title: 'Mathematics',
    description: 'Explore numbers, equations, and mathematical concepts',
    icon: '🔢',
    color: '#4CAF50',
    modules: [
      {
        title: 'Basic Algebra',
        description: 'Learn fundamental algebraic concepts and equations',
        content: 'Algebra is a branch of mathematics dealing with symbols and the rules for manipulating those symbols. In elementary algebra, those symbols represent quantities without fixed values, known as variables.',
        duration: 30,
        difficulty: 'beginner',
        learningObjectives: [
          'Understand variables and constants',
          'Solve linear equations',
          'Work with algebraic expressions'
        ],
        quiz: [
          {
            question: 'What is the value of x in the equation 2x + 5 = 15?',
            options: ['3', '5', '7', '10'],
            correctAnswer: 1,
            explanation: 'Subtract 5 from both sides: 2x = 10, then divide by 2: x = 5'
          }
        ],
        funFacts: [
          'The word "algebra" comes from the Arabic word "al-jabr"',
          'Ancient Babylonians were solving quadratic equations 4000 years ago'
        ],
        motivationalTips: [
          'Practice makes perfect - solve one equation at a time',
          'Break complex problems into smaller, manageable steps'
        ]
      },
      {
        title: 'Geometry Basics',
        description: 'Understanding shapes, angles, and spatial relationships',
        content: 'Geometry is concerned with properties of space that are related with distance, shape, size, and relative position of figures.',
        duration: 25,
        difficulty: 'beginner',
        learningObjectives: [
          'Identify basic geometric shapes',
          'Calculate area and perimeter',
          'Understand angles and their properties'
        ],
        quiz: [
          {
            question: 'What is the area of a rectangle with length 8 and width 5?',
            options: ['13', '26', '40', '80'],
            correctAnswer: 2,
            explanation: 'Area = length × width = 8 × 5 = 40'
          }
        ],
        funFacts: [
          'The ancient Greeks used geometry to measure the Earth',
          'A circle has infinite lines of symmetry'
        ],
        motivationalTips: [
          'Visualize problems by drawing diagrams',
          'Remember: geometry is all around us in everyday life'
        ]
      }
    ]
  },
  {
    subject: 'science',
    title: 'Science',
    description: 'Discover the wonders of physics, chemistry, and biology',
    icon: '🔬',
    color: '#2196F3',
    modules: [
      {
        title: 'Introduction to Physics',
        description: 'Basic concepts of motion, force, and energy',
        content: 'Physics is the natural science that studies matter, its motion and behavior through space and time, and the related entities of energy and force.',
        duration: 35,
        difficulty: 'intermediate',
        learningObjectives: [
          'Understand Newton\'s laws of motion',
          'Calculate velocity and acceleration',
          'Explore concepts of energy and work'
        ],
        quiz: [
          {
            question: 'What is Newton\'s first law of motion?',
            options: [
              'Force equals mass times acceleration',
              'An object at rest stays at rest unless acted upon by a force',
              'For every action there is an equal and opposite reaction',
              'Energy cannot be created or destroyed'
            ],
            correctAnswer: 1,
            explanation: 'Newton\'s first law states that an object will remain at rest or in uniform motion unless acted upon by an external force.'
          }
        ],
        funFacts: [
          'Light travels at 299,792,458 meters per second',
          'A day on Venus is longer than its year'
        ],
        motivationalTips: [
          'Physics explains how everything in the universe works',
          'Start with everyday examples to understand complex concepts'
        ]
      }
    ]
  },
  {
    subject: 'computer-science',
    title: 'Computer Science',
    description: 'Learn programming, algorithms, and computational thinking',
    icon: '💻',
    color: '#FF9800',
    modules: [
      {
        title: 'Programming Fundamentals',
        description: 'Basic programming concepts and logic',
        content: 'Programming is the process of creating a set of instructions that tell a computer how to perform a task. Programming can be done using a variety of computer programming languages.',
        duration: 40,
        difficulty: 'beginner',
        learningObjectives: [
          'Understand variables and data types',
          'Learn control structures (loops, conditionals)',
          'Write simple programs'
        ],
        quiz: [
          {
            question: 'What is a variable in programming?',
            options: [
              'A fixed value that never changes',
              'A container that stores data values',
              'A type of loop',
              'A programming language'
            ],
            correctAnswer: 1,
            explanation: 'A variable is a storage location with an associated name that contains data, which can be modified during program execution.'
          }
        ],
        funFacts: [
          'The first computer bug was an actual bug - a moth trapped in a computer',
          'There are over 700 programming languages in existence'
        ],
        motivationalTips: [
          'Every expert was once a beginner',
          'Practice coding every day, even if just for 15 minutes'
        ]
      }
    ]
  }
];

async function seedDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/emolearn');
    console.log('Connected to MongoDB');

    // Clear existing content
    await Content.deleteMany({});
    console.log('Cleared existing content');

    // Insert seed data
    const insertedContent = await Content.insertMany(seedData);
    console.log(`Inserted ${insertedContent.length} subjects with content`);

    console.log('Database seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

// Run the seed function
seedDatabase();
