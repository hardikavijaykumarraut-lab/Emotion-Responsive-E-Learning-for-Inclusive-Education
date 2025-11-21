const express = require('express');
const router = express.Router();
const Content = require('../models/Content');
const mongoose = require('mongoose');

// Get all subjects
router.get('/subjects', async (req, res) => {
  try {
    const subjects = await Content.getAllSubjects();
    
    const subjectsWithCounts = subjects.map(subject => ({
      id: subject.subject,
      name: subject.title,
      description: subject.description,
      icon: subject.icon,
      color: subject.color,
      moduleCount: subject.modules?.length || 0
    }));
    
    res.json({
      success: true,
      data: subjectsWithCounts
    });
  } catch (error) {
    console.error('Error fetching subjects:', error);
    res.status(500).json({ error: 'Failed to fetch subjects' });
  }
});

// Get subject content
router.get('/subjects/:subjectId', async (req, res) => {
  try {
    const { subjectId } = req.params;
    const subject = await Content.getSubjectContent(subjectId);
    
    if (!subject) {
      return res.status(404).json({ error: 'Subject not found' });
    }
    
    res.json({
      success: true,
      data: subject
    });
  } catch (error) {
    console.error('Error fetching subject content:', error);
    res.status(500).json({ error: 'Failed to fetch subject content' });
  }
});

// Get specific module
router.get('/subjects/:subjectId/modules/:moduleIndex', async (req, res) => {
  try {
    const { subjectId, moduleIndex } = req.params;
    const subject = await Content.getSubjectContent(subjectId);
    
    if (!subject) {
      return res.status(404).json({ error: 'Subject not found' });
    }
    
    const module = subject.modules[parseInt(moduleIndex)];
    if (!module) {
      return res.status(404).json({ error: 'Module not found' });
    }
    
    res.json({
      success: true,
      data: {
        ...module,
        moduleIndex: parseInt(moduleIndex),
        totalModules: subject.modules.length,
        subjectName: subject.title
      }
    });
  } catch (error) {
    console.error('Error fetching module:', error);
    res.status(500).json({ error: 'Failed to fetch module' });
  }
});

// Get random fun fact for subject
router.get('/subjects/:subjectId/fun-facts/random', async (req, res) => {
  try {
    const { subjectId } = req.params;
    const subject = await Content.getSubjectContent(subjectId);
    
    if (!subject || !subject.modules || subject.modules.length === 0) {
      return res.status(404).json({ error: 'No content found for this subject' });
    }
    
    // Collect all fun facts from all modules
    const allFunFacts = [];
    subject.modules.forEach(module => {
      if (module.funFacts && module.funFacts.length > 0) {
        allFunFacts.push(...module.funFacts);
      }
    });
    
    if (allFunFacts.length === 0) {
      return res.status(404).json({ error: 'No fun facts found for this subject' });
    }
    
    const randomIndex = Math.floor(Math.random() * allFunFacts.length);
    const funFact = allFunFacts[randomIndex];
    
    res.json({
      success: true,
      data: {
        fact: funFact,
        subject: subject.title,
        subjectId
      }
    });
  } catch (error) {
    console.error('Error fetching fun fact:', error);
    res.status(500).json({ error: 'Failed to fetch fun fact' });
  }
});

// Get all fun facts for subject
router.get('/subjects/:subjectId/fun-facts', async (req, res) => {
  try {
    const { subjectId } = req.params;
    const subject = await Content.getSubjectContent(subjectId);
    
    if (!subject) {
      return res.status(404).json({ error: 'Subject not found' });
    }
    
    // Collect all fun facts from all modules
    const allFunFacts = [];
    subject.modules.forEach(module => {
      if (module.funFacts && module.funFacts.length > 0) {
        allFunFacts.push(...module.funFacts);
      }
    });
    
    res.json({
      success: true,
      data: {
        facts: allFunFacts,
        subject: subject.title,
        subjectId
      }
    });
  } catch (error) {
    console.error('Error fetching fun facts:', error);
    res.status(500).json({ error: 'Failed to fetch fun facts' });
  }
});

// Search content across subjects
router.get('/search', async (req, res) => {
  try {
    const { q, subject } = req.query;
    
    if (!q || q.trim().length < 2) {
      return res.status(400).json({ error: 'Search query must be at least 2 characters' });
    }
    
    const searchTerm = q.toLowerCase();
    const results = [];
    
    // Build search criteria
    const searchCriteria = { isActive: true };
    if (subject) {
      searchCriteria.subject = subject;
    }
    
    const subjects = await Content.find(searchCriteria);
    
    subjects.forEach(subjectData => {
      // Search in modules
      subjectData.modules.forEach((module, index) => {
        if (module.title.toLowerCase().includes(searchTerm) || 
            module.content.toLowerCase().includes(searchTerm)) {
          results.push({
            type: 'module',
            subject: subjectData.subject,
            subjectName: subjectData.title,
            moduleIndex: index,
            title: module.title,
            content: module.content.substring(0, 200) + '...',
            relevance: calculateRelevance(searchTerm, module.title, module.content)
          });
        }
        
        // Search in fun facts within modules
        if (module.funFacts) {
          module.funFacts.forEach((fact, factIndex) => {
            if (fact.toLowerCase().includes(searchTerm)) {
              results.push({
                type: 'fun_fact',
                subject: subjectData.subject,
                subjectName: subjectData.title,
                moduleIndex: index,
                factIndex: factIndex,
                content: fact,
                relevance: calculateRelevance(searchTerm, '', fact)
              });
            }
          });
        }
      });
    });
    
    // Sort by relevance
    results.sort((a, b) => b.relevance - a.relevance);
    
    res.json({
      success: true,
      data: {
        query: q,
        results: results.slice(0, 20), // Limit to top 20 results
        total: results.length
      }
    });
  } catch (error) {
    console.error('Error searching content:', error);
    res.status(500).json({ error: 'Failed to search content' });
  }
});

// Helper function to calculate search relevance
function calculateRelevance(searchTerm, title, content) {
  let score = 0;
  const titleLower = title.toLowerCase();
  const contentLower = content.toLowerCase();
  const searchLower = searchTerm.toLowerCase();
  
  // Title matches are more relevant
  if (titleLower.includes(searchLower)) {
    score += 10;
  }
  
  // Content matches
  const contentMatches = (contentLower.match(new RegExp(searchLower, 'g')) || []).length;
  score += contentMatches * 2;
  
  // Exact word matches are more relevant than partial matches
  const words = searchLower.split(' ');
  words.forEach(word => {
    if (titleLower.includes(word)) score += 5;
    if (contentLower.includes(word)) score += 1;
  });
  
  return score;
}

module.exports = router;
