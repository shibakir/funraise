const participationService = require('../services/participationService');

exports.getAllParticipations = async (req, res) => {
    try {
        const participations = await participationService.getAllParticipations();
        res.status(200).json(participations);
    } catch (error) {
        res.status(500).json({ error: 'Error getting participations' });
    }
};

exports.getParticipationById = async (req, res) => {
    const { id } = req.params;
    try {
        const participation = await participationService.getParticipationById(id);
        res.status(200).json(participation);
    } catch (error) {
        if (error.message === 'Participation not found') {
            return res.status(404).json({ error: 'Participation not found' });
        }
        res.status(500).json({ error: 'Error getting participation' });
    }
};

exports.createParticipation = async (req, res) => {
    const participationData = req.body;

    try {
        const newParticipation = await participationService.createParticipation(participationData);
        res.status(201).json(newParticipation);
    } catch (error) {
        console.error('Error creating participation:', error);
        
        if (error.message === 'User not found') {
            return res.status(404).json({ error: 'User not found' });
        } else if (error.message === 'Event not found') {
            return res.status(404).json({ error: 'Event not found' });
        } else if (error.message === 'User already participates in this event') {
            return res.status(400).json({ error: 'User already participates in this event' });
        }
        
        res.status(500).json({ error: 'Error creating participation' });
    }
};

exports.updateParticipation = async (req, res) => {
    const { id } = req.params;
    const participationData = req.body;

    try {
        const updatedParticipation = await participationService.updateParticipation(id, participationData);
        res.status(200).json(updatedParticipation);
    } catch (error) {
        console.error('Error updating participation:', error);
        
        if (error.message === 'Participation not found') {
            return res.status(404).json({ error: 'Participation not found' });
        }
        
        res.status(500).json({ error: 'Error updating participation' });
    }
};

exports.deleteParticipation = async (req, res) => {
    const { id } = req.params;

    try {
        await participationService.deleteParticipation(id);
        res.status(204).send();
    } catch (error) {
        console.error('Error deleting participation:', error);
        
        if (error.message === 'Participation not found') {
            return res.status(404).json({ error: 'Participation not found' });
        }
        
        res.status(500).json({ error: 'Error deleting participation' });
    }
}; 