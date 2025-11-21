import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Card,
  CardContent,
  IconButton,
  Chip
} from '@mui/material';
import {
  Close as CloseIcon,
  Lightbulb as LightbulbIcon,
  Refresh as RefreshIcon,
  Science as ScienceIcon,
  Calculate as MathIcon,
  Public as GeographyIcon,
  MenuBook as HistoryIcon
} from '@mui/icons-material';
import { useAccessibility } from '../../contexts/AccessibilityContext';

const funFacts = {
  mathematics: [
    {
      title: "Zero was invented in India",
      fact: "The concept of zero as a number was first developed in India around the 5th century. Before this, zero was just used as a placeholder!",
      icon: "🔢",
      category: "History of Math"
    },
    {
      title: "Pi is infinite",
      fact: "Pi (π) has been calculated to over 31 trillion digits, but it never repeats or ends. The symbol π was first used by Welsh mathematician William Jones in 1706.",
      icon: "🥧",
      category: "Numbers"
    },
    {
      title: "Fibonacci in nature",
      fact: "The Fibonacci sequence appears everywhere in nature: flower petals, pinecones, shells, and even galaxies follow this mathematical pattern!",
      icon: "🌻",
      category: "Patterns"
    },
    {
      title: "Ancient calculators",
      fact: "The abacus, invented over 4,000 years ago, is still used today and can perform calculations faster than some people using calculators!",
      icon: "🧮",
      category: "Tools"
    }
  ],
  science: [
    {
      title: "Octopus hearts",
      fact: "Octopuses have three hearts! Two pump blood to their gills, while the third pumps blood to the rest of their body.",
      icon: "🐙",
      category: "Biology"
    },
    {
      title: "Lightning temperature",
      fact: "Lightning is five times hotter than the surface of the Sun, reaching temperatures of about 30,000°C (54,000°F)!",
      icon: "⚡",
      category: "Physics"
    },
    {
      title: "Honey never spoils",
      fact: "Archaeologists have found edible honey in ancient Egyptian tombs that's over 3,000 years old. Honey's low moisture and acidic pH prevent bacteria growth.",
      icon: "🍯",
      category: "Chemistry"
    },
    {
      title: "Bananas are radioactive",
      fact: "Bananas contain potassium-40, making them naturally radioactive. Scientists even use 'banana equivalent dose' as an informal unit of radiation exposure!",
      icon: "🍌",
      category: "Physics"
    }
  ],
  history: [
    {
      title: "Cleopatra and the pyramids",
      fact: "Cleopatra lived closer in time to the Moon landing (1969) than to the construction of the Great Pyramid of Giza (2580 BC)!",
      icon: "🏺",
      category: "Ancient Egypt"
    },
    {
      title: "Oxford University's age",
      fact: "Oxford University is older than the Aztec Empire. Oxford was founded around 1096, while the Aztec Empire began in 1345.",
      icon: "🏛️",
      category: "Education"
    },
    {
      title: "Napoleon's height",
      fact: "Napoleon wasn't actually short! He was 5'7\" (170cm), which was average height for men in 18th century France. The confusion came from different measurement systems.",
      icon: "👑",
      category: "Misconceptions"
    }
  ],
  geography: [
    {
      title: "Australia's moving continent",
      fact: "Australia moves about 7 centimeters north every year due to tectonic plate movement. GPS coordinates need regular updates!",
      icon: "🦘",
      category: "Geology"
    },
    {
      title: "Russia spans 11 time zones",
      fact: "Russia is so vast that it spans 11 time zones. When it's midnight in Moscow, it's already 9 AM in Vladivostok!",
      icon: "🇷🇺",
      category: "Countries"
    },
    {
      title: "Antarctica's desert",
      fact: "Antarctica is technically a desert because it receives very little precipitation. It's the world's largest desert, even though it's covered in ice!",
      icon: "🧊",
      category: "Climate"
    }
  ],
  english: [
    {
      title: "Shakespeare's vocabulary",
      fact: "Shakespeare invented over 1,700 words that we still use today, including 'eyeball', 'fashionable', 'lonely', and 'uncomfortable'.",
      icon: "📚",
      category: "Literature"
    },
    {
      title: "Longest English word",
      fact: "The longest word in English has 189,819 letters! It's the chemical name for the protein titin, but 'pneumonoultramicroscopicsilicovolcanoconosis' is more commonly cited.",
      icon: "📖",
      category: "Vocabulary"
    }
  ],
  'computer-science': [
    {
      title: "First computer bug",
      fact: "The first computer 'bug' was an actual bug! In 1947, Grace Hopper found a moth stuck in a computer relay, coining the term 'computer bug'.",
      icon: "🐛",
      category: "History"
    },
    {
      title: "Internet's weight",
      fact: "The entire internet weighs about the same as a strawberry (50 grams) when you calculate the mass of all the electrons that make up the data!",
      icon: "🍓",
      category: "Fun Facts"
    }
  ]
};

// Add fear-specific facts
const fearFacts = [
  {
    title: "Fear is normal",
    fact: "Feeling fearful when learning something new is completely normal! Your brain is just trying to protect you from the unknown. Even experts felt this way when they first started.",
    icon: "🧠",
    category: "Learning Psychology"
  },
  {
    title: "Fear helps learning",
    fact: "A little bit of fear can actually help you learn better by keeping you alert and focused. The key is managing it so it doesn't become overwhelming.",
    icon: "💡",
    category: "Cognitive Science"
  },
  {
    title: "Everyone makes mistakes",
    fact: "The most successful people in history made countless mistakes before achieving their goals. Mistakes are not failures - they're stepping stones to success!",
    icon: "🌟",
    category: "Growth Mindset"
  },
  {
    title: "Your brain is growing",
    fact: "Every time you feel challenged or fearful while learning, your brain is actually forming new neural connections. That discomfort means you're growing!",
    icon: "⚡",
    category: "Neuroscience"
  }
];

const getSubjectIcon = (subject) => {
  const icons = {
    mathematics: <MathIcon />,
    science: <ScienceIcon />,
    geography: <GeographyIcon />,
    history: <HistoryIcon />,
    default: <LightbulbIcon />
  };
  return icons[subject] || icons.default;
};

const FunFactModal = ({ open, onClose, subject = 'mathematics' }) => {
  const { announceToScreenReader } = useAccessibility();
  const [currentFactIndex, setCurrentFactIndex] = useState(0);
  
  const facts = (subject === 'fear') ? fearFacts : (funFacts[subject] || funFacts.mathematics);
  const currentFact = facts[currentFactIndex];

  useEffect(() => {
    if (open) {
      setCurrentFactIndex(Math.floor(Math.random() * facts.length));
      announceToScreenReader('Fun fact modal opened');
    }
  }, [open, facts.length, announceToScreenReader]);

  const handleNextFact = () => {
    const nextIndex = (currentFactIndex + 1) % facts.length;
    setCurrentFactIndex(nextIndex);
    announceToScreenReader('Showing next fun fact');
  };

  const handleClose = () => {
    onClose();
    announceToScreenReader('Fun fact modal closed');
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      aria-labelledby="funfact-dialog-title"
    >
      <DialogTitle id="funfact-dialog-title">
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <LightbulbIcon sx={{ mr: 1, color: 'warning.main' }} />
            <Typography variant="h6">
              Fun Fact!
            </Typography>
          </Box>
          <IconButton onClick={handleClose} aria-label="Close fun fact">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Card elevation={0} sx={{ bgcolor: 'background.default', border: '2px solid', borderColor: 'warning.main' }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Typography variant="h3" sx={{ mr: 2 }}>
                {currentFact.icon}
              </Typography>
              <Box>
                <Typography variant="h6" color="primary" gutterBottom>
                  {currentFact.title}
                </Typography>
                <Chip 
                  label={currentFact.category}
                  size="small"
                  color="primary"
                  variant="outlined"
                />
              </Box>
            </Box>
            
            <Typography variant="body1" sx={{ lineHeight: 1.6 }}>
              {currentFact.fact}
            </Typography>
          </CardContent>
        </Card>

        <Box sx={{ mt: 3, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {subject === 'fear' 
              ? "Remember, feeling fearful is normal and you're doing great! Here's something to help you feel more confident." 
              : "This fun fact might help clarify the concept you're learning!"}
          </Typography>
          <Button
            startIcon={<RefreshIcon />}
            onClick={handleNextFact}
            variant="outlined"
            size="small"
          >
            Show Another Fact
          </Button>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose}>
          Close
        </Button>
        <Button variant="contained" onClick={handleClose}>
          Continue Learning
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default FunFactModal;
