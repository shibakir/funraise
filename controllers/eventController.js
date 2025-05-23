const eventService = require('../services/eventService');
const dotenv = require('dotenv');

dotenv.config();

exports.getAllEvents = async (req, res) => {
    try {
        const events = await eventService.getAllEvents();
        res.status(200).json(events);
    } catch (error) {
        res.status(500).json({ error: 'Error getting events' });
    }
};

exports.getEventById = async (req, res) => {
    const { id } = req.params;
    try {
        const event = await eventService.getEventById(id);
        res.status(200).json(event);
    } catch (error) {
        if (error.message === 'Event not found') {
            return res.status(404).json({ error: 'Event not found' });
        }
        res.status(500).json({ error: 'Error getting event' });
    }
};

exports.createEvent = async (req, res) => {
    console.log('Request body:', req.body);
    console.log('Request file:', req.file);

    const eventData = req.body;
    const image = req.file;
    const userId = 1; // В реальном приложении должно быть req.user.id

    try {
        const result = await eventService.createEvent(eventData, image, userId);
        res.status(201).json(result);
    } catch (error) {
        console.error('Error creating event:', error);
        
        if (error.message.includes('For types DONATION and FUNDRAISING')) {
            return res.status(400).json({ error: error.message });
        } else if (error.message.includes('You must specify at least one event end condition')) {
            return res.status(400).json({ error: error.message });
        } else if (error.message.includes('Invalid endConditions format')) {
            return res.status(400).json({ error: error.message });
        } else if (error.message.includes('Failed to upload image')) {
            return res.status(500).json({ 
                error: 'Failed to upload image',
                details: error.message 
            });
        }
        
        res.status(500).json({ error: 'Error creating event' });
    }
};

exports.updateEvent = async (req, res) => {
    const { id } = req.params;
    const eventData = req.body;
    const userId = req.user.id; // Получаем ID пользователя из токена JWT

    try {
        const updatedEvent = await eventService.updateEvent(id, eventData, userId);
        res.status(200).json(updatedEvent);
    } catch (error) {
        console.error('Error updating event:', error);
        
        if (error.message === 'Event not found') {
            return res.status(404).json({ error: 'Event not found' });
        } else if (error.message === 'You do not have permission to update this event') {
            return res.status(403).json({ error: error.message });
        } else if (error.message.includes('For types DONATION and FUNDRAISING')) {
            return res.status(400).json({ error: error.message });
        }
        
        res.status(500).json({ error: 'Error updating event' });
    }
};

exports.deleteEvent = async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id; // Получаем ID пользователя из токена JWT

    try {
        await eventService.deleteEvent(id, userId);
        res.status(204).send();
    } catch (error) {
        console.error('Error deleting event:', error);
        
        if (error.message === 'Event not found') {
            return res.status(404).json({ error: 'Event not found' });
        } else if (error.message === 'You do not have permission to delete this event') {
            return res.status(403).json({ error: error.message });
        }
        
        res.status(500).json({ error: 'Error deleting event' });
    }
};

exports.getUserEvents = async (req, res) => {
    const userId = req.params.userId;
    const { limit } = req.query;
    
    if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
    }

    try {
        const events = await eventService.getUserEvents(userId, { limit });
        res.status(200).json(events);
    } catch (error) {
        console.error('Error getting user events:', error);
        res.status(500).json({ error: 'Error getting user events' });
    }
};

/**
 * Получение условий окончания события по ID события
 */
exports.getEventEndConditions = async (req, res) => {
    const { id } = req.params;
    try {
        const endConditions = await eventService.getEventEndConditions(id);
        res.status(200).json(endConditions);
    } catch (error) {
        console.error('Error getting event end conditions:', error);
        
        if (error.message === 'Event end conditions not found') {
            return res.status(404).json({ error: 'Event end conditions not found' });
        }
        
        res.status(500).json({ error: 'Error getting event end conditions' });
    }
};

/**
 * Получение текущего банка события по ID события
 */
exports.getEventBankAmount = async (req, res) => {
    const { id } = req.params;
    try {
        const bankInfo = await eventService.getEventBankAmount(id);
        res.status(200).json(bankInfo);
    } catch (error) {
        console.error('Error getting event bank amount:', error);
        res.status(500).json({ error: 'Error getting event bank amount' });
    }
};
