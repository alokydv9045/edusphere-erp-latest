const TermService = require('../services/TermService');
const asyncHandler = require('../utils/asyncHandler');

// Get all terms
const getTerms = asyncHandler(async (req, res) => {
    const terms = await TermService.getTerms(req.query);
    res.json({ terms });
});

// Create term
const createTerm = asyncHandler(async (req, res) => {
    const term = await TermService.createTerm(req.body);
    res.status(201).json({ message: 'Term created successfully', term });
});

// Update term
const updateTerm = asyncHandler(async (req, res) => {
    const term = await TermService.updateTerm(req.params.id, req.body);
    res.json({ message: 'Term updated successfully', term });
});

// Delete term
const deleteTerm = asyncHandler(async (req, res) => {
    await TermService.deleteTerm(req.params.id);
    res.json({ message: 'Term deleted successfully' });
});

module.exports = {
    getTerms,
    createTerm,
    updateTerm,
    deleteTerm,
};
