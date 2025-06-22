const { Event, EventEndCondition, EndCondition } = require('../model');
const ApiError = require('../exception/ApiError');

const createEventSchema = require('../validation/schema/EventSchema');
const EventEndConditionService = require('./EventEndConditionService');
const { onEventCreated } = require('../utils/achievement');
const eventConditions = require('../utils/eventCondition');
const { firebaseStorageService } = require('../utils/media/FirebaseStorageService');
const { FILE_LIMITS, EVENT_TYPES } = require('../constants');

class EventService {

    async create(data) {
        const { error } = createEventSchema.validate(data);
        if (error) {
            throw ApiError.badRequest(error.details[0].message);
        }

        try {
            const { name, description, type, imageFile, userId, recipientId: inputRecipientId, eventEndConditionGroups } = data;

            if (eventEndConditionGroups.length === 0) {
                throw ApiError.badRequest('Event end condition groups are required');
            }

            let imageUrl = null;
            if (imageFile) {
                try {
                    // Decode base64 image
                    const base64Data = imageFile.replace(/^data:image\/\w+;base64,/, '');
                    const buffer = Buffer.from(base64Data, 'base64');
                    
                    // Check file size
                    if (buffer.length > FILE_LIMITS.MAX_IMAGE_SIZE) {
                        throw ApiError.badRequest(`Image size must not exceed ${FILE_LIMITS.MAX_IMAGE_SIZE / 1024 / 1024}MB`);
                    }
                    
                    // Create file object for Firebase
                    const file = {
                        buffer: buffer,
                        originalname: `event-${Date.now()}.jpg`,
                        mimetype: 'image/jpeg'
                    };

                    // Upload to Firebase
                    const firebasePath = `events/${userId}/${Date.now()}.jpg`;
                    imageUrl = await firebaseStorageService.uploadImage(file, firebasePath);
                    
                    //console.log('Image uploaded to Firebase:', imageUrl);
                } catch (uploadError) {
                    console.error('Error uploading image to Firebase:', uploadError);
                    if (uploadError instanceof ApiError) {
                        throw uploadError;
                    }
                    throw ApiError.badRequest('Failed to upload image: ' + uploadError.message);
                }
            }

            let recipientId = null;

            // Use passed recipientId or set userId for DONATION/FUNDRAISING
            if (inputRecipientId) {
                recipientId = inputRecipientId;
            } else if (type === EVENT_TYPES.DONATION || type === EVENT_TYPES.FUNDRAISING) {
                recipientId = userId;
            }

            const event = await Event.create({
                name: name,
                description: description,
                type: type,
                imageUrl: imageUrl,
                userId: userId,
                recipientId: recipientId,
            });

            for (const group of eventEndConditionGroups) {
                await EventEndConditionService.create({
                    eventId: event.id,
                    conditions: group.conditions
                });
            }

            // Track event creation for achievements
            await onEventCreated(userId, event.id);

            // Initialize event condition tracking
            await eventConditions.onEventCreated(event.id);

            return event;
        } catch (e) {
            throw ApiError.badRequest(e.message);
        }
    }

    async findByIdWithParticipants(eventId) {
        try {
            return await Event.findByPk(eventId, {
                include: [
                    {
                        model: require('../model').Participation,
                        as: 'participations',
                        include: [{ 
                            model: require('../model').User, 
                            as: 'user',
                            attributes: ['id', 'balance'] 
                        }]
                    }
                ]
            });
        } catch (e) {
            throw ApiError.badRequest('Error finding event with participants', e.message);
        }
    }

    async findByUser(userId, limit = 30) {
        try {
            return await Event.findAll({
                where: { userId: userId },
                order: [['createdAt', 'DESC']],
                limit: limit
            });
        } catch (e) {
            throw ApiError.badRequest('Error finding events by user', e.message);
        }
    }

    async updateStatus(eventId, status) {
        try {
            return await Event.update(
                { status: status },
                { where: { id: eventId } }
            );
        } catch (e) {
            throw ApiError.badRequest('Error updating event status', e.message);
        }
    }

    async findByIdWithEndConditions(eventId) {
        try {
            return await Event.findByPk(eventId, {
                include: [{
                    model: require('../model').EventEndCondition,
                    as: 'endConditions',
                    include: [{
                        model: require('../model').EndCondition,
                        as: 'conditions'
                    }]
                }]
            });
        } catch (e) {
            throw ApiError.badRequest('Error finding event with end conditions', e.message);
        }
    }

    async checkTimeConditions() {
        try {
            
            // Получаем все активные события
            const activeEvents = await Event.findAll({
                where: { 
                    status: 'IN_PROGRESS' 
                },
                include: [{
                    model: EventEndCondition,
                    as: 'endConditions',
                    include: [{
                        model: EndCondition,
                        as: 'conditions',
                        where: {
                            name: 'TIME' // Только временные условия
                        },
                        required: false // LEFT JOIN чтобы получить события и без временных условий
                    }]
                }]
            });

            // Проверяем каждое событие
            for (const event of activeEvents) {
                if (event.endConditions && event.endConditions.length > 0) {
                    // Проверяем есть ли временные условия
                    const hasTimeConditions = event.endConditions.some(group => 
                        group.conditions && group.conditions.some(condition => condition.name === 'TIME')
                    );
                    
                    if (hasTimeConditions) {
                        
                        // Import eventConditions here to avoid circular dependencies
                        const eventConditions = require('../utils/eventCondition');
                        await eventConditions.onTimeCheck(event.id);
                    }
                }
            }

            //console.log('Time conditions check completed');
        } catch (e) {
            console.error('Error checking time conditions:', e.message);
            throw ApiError.badRequest('Error checking time conditions', e.message);
        }
    }

    async findById(eventId, includeEndConditions = true) {
        try {
            const includeOptions = [];
            
            if (includeEndConditions) {
                includeOptions.push({
                    model: require('../model').EventEndCondition,
                    as: 'endConditions',
                    include: [{
                        model: require('../model').EndCondition,
                        as: 'conditions'
                    }]
                });
            }

            const event = await Event.findByPk(eventId, {
                include: includeOptions
            });

            if (!event) {
                throw ApiError.notFound('Event not found');
            }

            return event;
        } catch (e) {
            if (e instanceof ApiError) {
                throw e;
            }
            throw ApiError.database('Error finding event by ID', e);
        }
    }

    async findAll(includeEndConditions = true) {
        try {
            const includeOptions = [];
            
            if (includeEndConditions) {
                includeOptions.push({
                    model: require('../model').EventEndCondition,
                    as: 'endConditions',
                    include: [{
                        model: require('../model').EndCondition,
                        as: 'conditions'
                    }]
                });
            }

            return await Event.findAll({
                include: includeOptions
            });
        } catch (e) {
            throw ApiError.database('Error finding all events', e);
        }
    }

    async findCreator(eventId) {
        try {
            const event = await Event.findByPk(eventId, {
                include: [{ 
                    model: require('../model').User, 
                    as: 'creator' 
                }]
            });
            return event ? event.creator : null;
        } catch (e) {
            throw ApiError.database('Error finding event creator', e);
        }
    }

    async findRecipient(eventId) {
        try {
            const event = await Event.findByPk(eventId, {
                include: [{ 
                    model: require('../model').User, 
                    as: 'recipient' 
                }]
            });
            return event ? event.recipient : null;
        } catch (e) {
            throw ApiError.database('Error finding event recipient', e);
        }
    }

    async findParticipations(eventId) {
        try {
            const { Participation, User } = require('../model');
            return await Participation.findAll({
                where: { eventId: eventId },
                include: [
                    { model: User, as: 'user' }
                ]
            });
        } catch (e) {
            throw ApiError.database('Error finding event participations', e);
        }
    }

    async calculateBankAmount(eventId) {
        try {
            const { Participation } = require('../model');
            const participations = await Participation.findAll({
                where: { eventId: eventId },
                attributes: ['deposit']
            });

            return participations.reduce((total, participation) => {
                return total + (participation.deposit || 0);
            }, 0);
        } catch (e) {
            throw ApiError.database('Error calculating bank amount', e);
        }
    }

}

module.exports = new EventService();