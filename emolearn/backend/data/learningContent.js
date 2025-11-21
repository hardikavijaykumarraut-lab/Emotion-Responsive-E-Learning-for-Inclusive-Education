// Learning content data for all subjects
const learningContent = {
  mathematics: {
    name: 'Mathematics',
    modules: [
      {
        title: 'Introduction to Algebra',
        content: 'Algebra is a branch of mathematics that uses letters and symbols to represent numbers and quantities in formulas and equations. The fundamental concept is that we can use variables (like x or y) to represent unknown values that we want to find.',
        keyPoints: [
          'Variables represent unknown quantities',
          'Equations show relationships between variables',
          'We can solve for unknown values using algebraic operations',
          'The same operations must be applied to both sides of an equation'
        ]
      },
      {
        title: 'Linear Equations',
        content: 'A linear equation is an equation that makes a straight line when graphed. The general form is y = mx + b, where m is the slope and b is the y-intercept. Linear equations are fundamental in algebra and have many real-world applications.',
        keyPoints: [
          'Linear equations graph as straight lines',
          'Slope (m) determines how steep the line is',
          'Y-intercept (b) is where the line crosses the y-axis',
          'Can be used to model real-world relationships'
        ]
      },
      {
        title: 'Quadratic Equations',
        content: 'Quadratic equations are polynomial equations of degree 2, typically written as ax² + bx + c = 0. They form parabolic curves when graphed and can be solved using various methods including factoring, completing the square, or the quadratic formula.',
        keyPoints: [
          'Standard form: ax² + bx + c = 0',
          'Graph forms a parabola',
          'Can have 0, 1, or 2 real solutions',
          'Quadratic formula: x = (-b ± √(b²-4ac)) / 2a'
        ]
      }
    ],
    funFacts: [
      'The word "algebra" comes from the Arabic word "al-jabr" meaning "reunion of broken parts"',
      'The equals sign (=) was invented by Welsh mathematician Robert Recorde in 1557',
      'Zero was not considered a number by ancient Greeks - it was introduced much later'
    ],
    quizzes: [
      {
        question: 'What is the slope of the line y = 3x + 2?',
        options: ['2', '3', '5', '3x'],
        correct: 1,
        explanation: 'In the equation y = mx + b, the coefficient of x (which is 3) represents the slope.'
      },
      {
        question: 'Which of these is a quadratic equation?',
        options: ['y = 2x + 1', 'x² + 3x - 4 = 0', 'y = 1/x', '2x + 3y = 6'],
        correct: 1,
        explanation: 'A quadratic equation has a variable raised to the power of 2 as its highest degree term.'
      }
    ]
  },
  science: {
    name: 'Science',
    modules: [
      {
        title: 'The Scientific Method',
        content: 'The scientific method is a systematic approach to understanding the natural world. It involves making observations, forming hypotheses, conducting experiments, and drawing conclusions based on evidence.',
        keyPoints: [
          'Observation: Notice something in the natural world',
          'Hypothesis: Form a testable explanation',
          'Experiment: Test the hypothesis under controlled conditions',
          'Analysis: Examine the data and draw conclusions'
        ]
      },
      {
        title: 'States of Matter',
        content: 'Matter exists in different states: solid, liquid, gas, and plasma. These states depend on the arrangement and movement of particles. Temperature and pressure can cause matter to change from one state to another.',
        keyPoints: [
          'Solids have fixed shape and volume',
          'Liquids have fixed volume but take the shape of their container',
          'Gases expand to fill their container completely',
          'Plasma is ionized gas found in stars'
        ]
      },
      {
        title: 'Photosynthesis',
        content: 'Photosynthesis is the process by which plants convert sunlight, carbon dioxide, and water into glucose and oxygen. This process is essential for life on Earth as it produces the oxygen we breathe and forms the base of most food chains.',
        keyPoints: [
          'Occurs in chloroplasts of plant cells',
          'Requires sunlight, CO₂, and water',
          'Produces glucose and oxygen',
          'Chemical equation: 6CO₂ + 6H₂O + light → C₆H₁₂O₆ + 6O₂'
        ]
      }
    ],
    funFacts: [
      'A single tree can produce enough oxygen for two people for one day',
      'Lightning is five times hotter than the surface of the Sun',
      'Water can exist in all three states of matter at the same time (triple point)'
    ],
    quizzes: [
      {
        question: 'What do plants produce during photosynthesis besides glucose?',
        options: ['Carbon dioxide', 'Oxygen', 'Nitrogen', 'Water'],
        correct: 1,
        explanation: 'During photosynthesis, plants produce glucose for energy and oxygen as a byproduct.'
      },
      {
        question: 'Which state of matter has particles that are closest together?',
        options: ['Gas', 'Liquid', 'Solid', 'Plasma'],
        correct: 2,
        explanation: 'In solids, particles are tightly packed and vibrate in fixed positions.'
      }
    ]
  },
  history: {
    name: 'History',
    modules: [
      {
        title: 'Ancient Civilizations',
        content: 'Ancient civilizations laid the foundation for modern society. From Mesopotamia to Egypt, Greece to Rome, these early societies developed writing systems, laws, architecture, and cultural practices that influence us today.',
        keyPoints: [
          'Mesopotamia: First cities and writing system (cuneiform)',
          'Egypt: Pyramids, hieroglyphics, and mummification',
          'Greece: Democracy, philosophy, and Olympic Games',
          'Rome: Republic, empire, and legal system'
        ]
      },
      {
        title: 'The Renaissance',
        content: 'The Renaissance (14th-17th centuries) was a period of cultural rebirth in Europe. It marked a renewed interest in art, science, and learning, moving away from medieval traditions toward humanism and scientific inquiry.',
        keyPoints: [
          'Began in Italy in the 14th century',
          'Revival of classical Greek and Roman culture',
          'Great artists: Leonardo da Vinci, Michelangelo, Raphael',
          'Scientific advances by Galileo, Copernicus'
        ]
      },
      {
        title: 'Industrial Revolution',
        content: 'The Industrial Revolution (1760-1840) transformed society from agricultural to industrial. New machines, factories, and transportation systems changed how people lived and worked, leading to urbanization and social changes.',
        keyPoints: [
          'Steam power revolutionized manufacturing',
          'Factory system replaced cottage industries',
          'Railroad and steamship improved transportation',
          'Led to urbanization and new social classes'
        ]
      }
    ],
    funFacts: [
      'The Great Wall of China is not visible from space with the naked eye',
      'Cleopatra lived closer in time to the Moon landing than to the building of the Great Pyramid',
      'The shortest war in history lasted only 38-45 minutes (Anglo-Zanzibar War, 1896)'
    ],
    quizzes: [
      {
        question: 'Which ancient civilization is credited with inventing democracy?',
        options: ['Rome', 'Egypt', 'Greece', 'Mesopotamia'],
        correct: 2,
        explanation: 'Ancient Greece, particularly Athens, developed the first known democracy around 508 BCE.'
      },
      {
        question: 'The Renaissance began in which country?',
        options: ['France', 'Germany', 'Italy', 'England'],
        correct: 2,
        explanation: 'The Renaissance began in Italy in the 14th century, starting in cities like Florence.'
      }
    ]
  },
  geography: {
    name: 'Geography',
    modules: [
      {
        title: 'Earth\'s Structure',
        content: 'Earth consists of several layers: the crust (outermost solid layer), mantle (hot, dense rock), outer core (liquid iron and nickel), and inner core (solid iron and nickel). Understanding Earth\'s structure helps explain geological processes.',
        keyPoints: [
          'Crust: Thin outermost layer where we live',
          'Mantle: Largest layer, made of hot rock',
          'Outer core: Liquid metal, creates magnetic field',
          'Inner core: Solid metal, extremely hot and dense'
        ]
      },
      {
        title: 'Climate and Weather',
        content: 'Climate refers to long-term weather patterns in a region, while weather describes short-term atmospheric conditions. Climate is influenced by factors like latitude, altitude, ocean currents, and geographic features.',
        keyPoints: [
          'Weather: Short-term atmospheric conditions',
          'Climate: Long-term weather patterns',
          'Factors: Latitude, altitude, water bodies, landforms',
          'Climate zones: Tropical, temperate, polar, arid'
        ]
      },
      {
        title: 'Natural Resources',
        content: 'Natural resources are materials from Earth that humans use for survival and development. They include renewable resources (like solar energy and forests) and non-renewable resources (like fossil fuels and minerals).',
        keyPoints: [
          'Renewable: Can be replenished naturally',
          'Non-renewable: Limited supply, cannot be replaced quickly',
          'Examples: Water, minerals, fossil fuels, forests',
          'Conservation is essential for sustainability'
        ]
      }
    ],
    funFacts: [
      'Russia spans 11 time zones, more than any other country',
      'The Pacific Ocean is larger than all land masses combined',
      'Antarctica is the world\'s largest desert, not the Sahara'
    ],
    quizzes: [
      {
        question: 'Which layer of Earth creates our planet\'s magnetic field?',
        options: ['Crust', 'Mantle', 'Outer core', 'Inner core'],
        correct: 2,
        explanation: 'The outer core, made of liquid iron and nickel, generates Earth\'s magnetic field through its movement.'
      },
      {
        question: 'What is the difference between weather and climate?',
        options: ['No difference', 'Weather is long-term, climate is short-term', 'Weather is short-term, climate is long-term', 'Weather is temperature, climate is precipitation'],
        correct: 2,
        explanation: 'Weather refers to short-term atmospheric conditions, while climate describes long-term weather patterns.'
      }
    ]
  },
  english: {
    name: 'English Literature',
    modules: [
      {
        title: 'Elements of Literature',
        content: 'Literature uses various elements to create meaning and engage readers. These include plot (sequence of events), character (people in the story), setting (time and place), theme (central message), and literary devices (techniques like metaphor and symbolism).',
        keyPoints: [
          'Plot: Beginning, middle, end with conflict and resolution',
          'Character: Protagonist, antagonist, supporting characters',
          'Setting: Time period, location, atmosphere',
          'Theme: Universal message or lesson'
        ]
      },
      {
        title: 'Poetry and Figurative Language',
        content: 'Poetry uses condensed language and literary devices to express emotions and ideas. Figurative language includes metaphors, similes, personification, and imagery to create vivid pictures and deeper meanings.',
        keyPoints: [
          'Metaphor: Direct comparison without "like" or "as"',
          'Simile: Comparison using "like" or "as"',
          'Personification: Giving human qualities to non-human things',
          'Imagery: Vivid descriptive language appealing to senses'
        ]
      },
      {
        title: 'Shakespeare and Drama',
        content: 'William Shakespeare is considered the greatest playwright in English literature. His works, including tragedies like Hamlet and comedies like A Midsummer Night\'s Dream, explore universal themes of love, power, betrayal, and human nature.',
        keyPoints: [
          'Wrote 37 plays and 154 sonnets',
          'Tragedies: Hamlet, Macbeth, Romeo and Juliet',
          'Comedies: A Midsummer Night\'s Dream, Much Ado About Nothing',
          'Invented over 1,700 words still used today'
        ]
      }
    ],
    funFacts: [
      'Shakespeare invented common words like "eyeball," "fashionable," and "lonely"',
      'The word "bookworm" originally referred to actual worms that ate through books',
      'The longest sentence in literature has 823 words (in "Absalom, Absalom!" by William Faulkner)'
    ],
    quizzes: [
      {
        question: 'What is a metaphor?',
        options: ['A comparison using "like" or "as"', 'A direct comparison without "like" or "as"', 'Giving human qualities to objects', 'Exaggeration for effect'],
        correct: 1,
        explanation: 'A metaphor is a direct comparison between two unlike things without using "like" or "as".'
      },
      {
        question: 'Which of these is a Shakespeare tragedy?',
        options: ['A Midsummer Night\'s Dream', 'Much Ado About Nothing', 'Hamlet', 'The Tempest'],
        correct: 2,
        explanation: 'Hamlet is one of Shakespeare\'s most famous tragedies, along with Macbeth and King Lear.'
      }
    ]
  },
  'computer-science': {
    name: 'Computer Science',
    modules: [
      {
        title: 'Introduction to Programming',
        content: 'Programming is the process of creating instructions for computers to follow. Programs are written in programming languages like Python, Java, or JavaScript. The basic concepts include variables, loops, conditions, and functions.',
        keyPoints: [
          'Variables store data and information',
          'Loops repeat actions multiple times',
          'Conditions make decisions in programs',
          'Functions organize code into reusable blocks'
        ]
      },
      {
        title: 'Algorithms and Problem Solving',
        content: 'An algorithm is a step-by-step procedure for solving a problem. Good algorithms are efficient, clear, and correct. Common algorithms include sorting (arranging data in order) and searching (finding specific information).',
        keyPoints: [
          'Algorithm: Step-by-step problem-solving procedure',
          'Efficiency: How fast an algorithm runs',
          'Sorting: Arranging data in specific order',
          'Searching: Finding specific items in data'
        ]
      },
      {
        title: 'Data Structures',
        content: 'Data structures are ways of organizing and storing data in computers. Common structures include arrays (lists of items), stacks (last-in-first-out), queues (first-in-first-out), and trees (hierarchical structures).',
        keyPoints: [
          'Arrays: Ordered lists of elements',
          'Stacks: Last item added is first removed',
          'Queues: First item added is first removed',
          'Trees: Hierarchical data organization'
        ]
      }
    ],
    funFacts: [
      'The first computer bug was an actual bug - a moth found in a computer in 1947',
      'The term "debugging" comes from removing actual bugs from early computers',
      'The first programmer was Ada Lovelace in the 1840s, before computers even existed'
    ],
    quizzes: [
      {
        question: 'What is an algorithm?',
        options: ['A programming language', 'A step-by-step procedure for solving problems', 'A type of computer', 'A data storage method'],
        correct: 1,
        explanation: 'An algorithm is a clear, step-by-step procedure for solving a problem or completing a task.'
      },
      {
        question: 'In a stack data structure, which item is removed first?',
        options: ['The first item added', 'The last item added', 'The middle item', 'A random item'],
        correct: 1,
        explanation: 'Stacks follow LIFO (Last In, First Out) - the last item added is the first one removed.'
      }
    ]
  },
  environmental: {
    name: 'Environmental Studies',
    modules: [
      {
        title: 'Ecosystems and Biodiversity',
        content: 'An ecosystem is a community of living organisms interacting with their physical environment. Biodiversity refers to the variety of life forms in an ecosystem. Healthy ecosystems with high biodiversity are more stable and resilient.',
        keyPoints: [
          'Ecosystem: Living organisms + physical environment',
          'Biodiversity: Variety of species in an area',
          'Food chains: Energy flow through organisms',
          'Balance: All parts work together for stability'
        ]
      },
      {
        title: 'Climate Change',
        content: 'Climate change refers to long-term changes in global temperatures and weather patterns. While climate variations are natural, human activities since the Industrial Revolution have accelerated these changes, primarily through greenhouse gas emissions.',
        keyPoints: [
          'Greenhouse gases trap heat in atmosphere',
          'Main causes: Burning fossil fuels, deforestation',
          'Effects: Rising temperatures, sea level rise, extreme weather',
          'Solutions: Renewable energy, conservation, sustainable practices'
        ]
      },
      {
        title: 'Conservation and Sustainability',
        content: 'Conservation involves protecting natural resources and environments for future generations. Sustainability means meeting present needs without compromising future generations\' ability to meet their needs.',
        keyPoints: [
          'Conservation: Protecting natural resources',
          'Sustainability: Meeting needs without harming future',
          'Renewable energy: Solar, wind, hydro power',
          'Individual actions: Reduce, reuse, recycle'
        ]
      }
    ],
    funFacts: [
      'One tree can absorb 48 pounds of CO₂ per year',
      'Recycling one aluminum can saves enough energy to power a TV for 3 hours',
      'The Amazon rainforest produces 20% of the world\'s oxygen'
    ],
    quizzes: [
      {
        question: 'What is biodiversity?',
        options: ['The study of biology', 'Variety of life forms in an ecosystem', 'A type of ecosystem', 'The process of evolution'],
        correct: 1,
        explanation: 'Biodiversity refers to the variety and variability of life forms within an ecosystem or on Earth.'
      },
      {
        question: 'Which is a renewable energy source?',
        options: ['Coal', 'Oil', 'Solar power', 'Natural gas'],
        correct: 2,
        explanation: 'Solar power is renewable because the sun provides a continuous source of energy.'
      }
    ]
  },
  art: {
    name: 'Art & Design',
    modules: [
      {
        title: 'Elements of Art',
        content: 'The elements of art are the basic components used by artists to create visual works. These include line, shape, form, color, value, texture, and space. Understanding these elements helps in both creating and analyzing artwork.',
        keyPoints: [
          'Line: Marks that connect points, create outlines',
          'Shape: 2D areas defined by boundaries',
          'Form: 3D objects with height, width, depth',
          'Color: Hue, saturation, and brightness'
        ]
      },
      {
        title: 'Art History and Movements',
        content: 'Art history shows how artistic styles and movements have evolved over time. Major movements include Renaissance (realistic representation), Impressionism (light and color), and Modern art (abstract and experimental approaches).',
        keyPoints: [
          'Renaissance: Realistic representation, perspective',
          'Impressionism: Light, color, everyday subjects',
          'Cubism: Geometric shapes, multiple perspectives',
          'Abstract: Non-representational, emotional expression'
        ]
      },
      {
        title: 'Design Principles',
        content: 'Design principles guide how elements of art are organized in a composition. These include balance, contrast, emphasis, movement, pattern, rhythm, and unity. Good design creates visual harmony and effectively communicates ideas.',
        keyPoints: [
          'Balance: Equal visual weight in composition',
          'Contrast: Differences that create visual interest',
          'Emphasis: Focal point that draws attention',
          'Unity: All elements work together harmoniously'
        ]
      }
    ],
    funFacts: [
      'The Mona Lisa has no eyebrows - it was fashionable to remove them in Renaissance times',
      'Van Gogh only sold one painting during his lifetime',
      'The most expensive painting ever sold was "Salvator Mundi" by Leonardo da Vinci for $450 million'
    ],
    quizzes: [
      {
        question: 'Which element of art refers to the lightness or darkness of colors?',
        options: ['Hue', 'Value', 'Texture', 'Form'],
        correct: 1,
        explanation: 'Value refers to the lightness or darkness of colors and is crucial for creating depth and contrast.'
      },
      {
        question: 'Which art movement focused on capturing light and everyday subjects?',
        options: ['Renaissance', 'Cubism', 'Impressionism', 'Abstract'],
        correct: 2,
        explanation: 'Impressionism focused on capturing the effects of light and often depicted everyday scenes and subjects.'
      }
    ]
  },
  'physical-ed': {
    name: 'Physical Education',
    modules: [
      {
        title: 'Fitness and Health',
        content: 'Physical fitness includes cardiovascular endurance, muscular strength, flexibility, and body composition. Regular exercise improves physical health, mental well-being, and quality of life. A balanced fitness program includes aerobic exercise, strength training, and flexibility work.',
        keyPoints: [
          'Cardiovascular: Heart and lung endurance',
          'Strength: Muscle power and endurance',
          'Flexibility: Range of motion in joints',
          'Balance: Stability and coordination'
        ]
      },
      {
        title: 'Sports and Teamwork',
        content: 'Sports teach valuable life skills including teamwork, leadership, communication, and perseverance. Team sports require cooperation and strategy, while individual sports develop self-discipline and personal goal-setting.',
        keyPoints: [
          'Teamwork: Working together toward common goals',
          'Leadership: Guiding and motivating others',
          'Communication: Clear, effective interaction',
          'Sportsmanship: Fair play and respect for others'
        ]
      },
      {
        title: 'Nutrition and Wellness',
        content: 'Proper nutrition fuels physical activity and supports overall health. A balanced diet includes carbohydrates for energy, proteins for muscle repair, fats for essential functions, and vitamins and minerals for various body processes.',
        keyPoints: [
          'Carbohydrates: Primary energy source',
          'Proteins: Muscle building and repair',
          'Fats: Essential functions and energy storage',
          'Hydration: Crucial for performance and health'
        ]
      }
    ],
    funFacts: [
      'Your heart is a muscle that gets stronger with exercise',
      'Regular exercise can improve memory and brain function',
      'Just 30 minutes of daily activity can significantly improve health'
    ],
    quizzes: [
      {
        question: 'Which component of fitness relates to heart and lung health?',
        options: ['Flexibility', 'Strength', 'Cardiovascular endurance', 'Balance'],
        correct: 2,
        explanation: 'Cardiovascular endurance refers to the ability of the heart and lungs to supply oxygen during sustained physical activity.'
      },
      {
        question: 'What is the primary energy source for physical activity?',
        options: ['Proteins', 'Fats', 'Carbohydrates', 'Vitamins'],
        correct: 2,
        explanation: 'Carbohydrates are the body\'s preferred and most efficient source of energy for physical activity.'
      }
    ]
  },
  'social-studies': {
    name: 'Social Studies',
    modules: [
      {
        title: 'Government and Citizenship',
        content: 'Government is the system by which a community or nation is organized and ruled. Different types include democracy (rule by the people), monarchy (rule by a king or queen), and republic (elected representatives). Citizens have both rights and responsibilities.',
        keyPoints: [
          'Democracy: Government by the people',
          'Republic: Elected representatives govern',
          'Rights: Freedoms guaranteed to citizens',
          'Responsibilities: Duties citizens owe to society'
        ]
      },
      {
        title: 'Economics and Trade',
        content: 'Economics studies how societies use limited resources to satisfy unlimited wants. Basic concepts include supply and demand, markets, and trade. Countries trade with each other to get goods and services they cannot produce efficiently themselves.',
        keyPoints: [
          'Supply: Amount of goods available',
          'Demand: How much people want goods',
          'Markets: Places where buying and selling occur',
          'Trade: Exchange of goods between countries'
        ]
      },
      {
        title: 'Culture and Society',
        content: 'Culture includes the beliefs, customs, arts, and way of life of a group of people. Society is organized through institutions like family, education, religion, and government. Cultural diversity enriches communities and promotes understanding.',
        keyPoints: [
          'Culture: Shared beliefs, customs, and practices',
          'Traditions: Customs passed down through generations',
          'Diversity: Variety of cultures in a community',
          'Tolerance: Accepting and respecting differences'
        ]
      }
    ],
    funFacts: [
      'There are over 7,000 languages spoken in the world today',
      'The United Nations has 193 member countries',
      'Democracy originated in ancient Athens around 508 BCE'
    ],
    quizzes: [
      {
        question: 'In a democracy, who holds the ultimate power?',
        options: ['The king', 'The president', 'The people', 'The military'],
        correct: 2,
        explanation: 'In a democracy, ultimate power rests with the people, who exercise it through voting and participation.'
      },
      {
        question: 'What happens when demand for a product increases but supply stays the same?',
        options: ['Price decreases', 'Price increases', 'Price stays the same', 'Product disappears'],
        correct: 1,
        explanation: 'When demand increases and supply remains constant, prices typically increase due to competition for the limited goods.'
      }
    ]
  }
};

module.exports = { learningContent };
