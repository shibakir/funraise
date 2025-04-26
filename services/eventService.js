const prisma = require('@prisma/client');
const { PrismaClient } = prisma;
const prismaClient = new PrismaClient();
const { uploadImage } = require('../utils/firebase');
const { calculateEndConditionsProgress } = require('../utils/helpers/eventHelpers');
const { checkTimeConditions } = require('../utils/timeConditionChecker');

const participationConditionChecker = require('../utils/participationConditionChecker');
const bankConditionChecker = require('../utils/bankConditionChecker');
const {checkAndUpdateEventStatus} = require("../utils/helpers/conditionHelpers");

/**
 * Сервис для работы с событиями
 */
const eventService = {
    /**
     * Получение всех событий с поддержкой поиска, фильтрации и сортировки
     * @param {Object} options - Опции запроса
     * @param {number} options.page - Номер страницы
     * @param {number} options.limit - Количество элементов на странице
     * @param {string|null} options.userId - ID пользователя, если указан, исключаем его события из выборки
     * @param {string} options.query - Поисковый запрос (по названию)
     * @param {Array} options.types - Типы событий для фильтрации
     * @param {number} options.minProgress - Минимальный прогресс
     * @param {number} options.maxProgress - Максимальный прогресс
     * @param {string} options.sortBy - Поле для сортировки (name, createdAt, progress)
     * @param {string} options.sortOrder - Порядок сортировки (asc, desc)
     * @returns {Promise<Array>} - Массив событий с базовой информацией и прогрессом условий
     */
    async getAllEvents(options = {}) {
        const { 
            page = 1, 
            limit = 10, 
            userId = null,
            query = '', 
            types = [],
            minProgress = 0,
            maxProgress = 100,
            sortBy = 'createdAt', 
            sortOrder = 'desc' 
        } = options;

        const skip = (page - 1) * limit;
        
        // Создаем условия поиска
        const whereCondition = {};
        
        // Если указан userId, то исключаем события этого пользователя
        if (userId) {
            whereCondition.userId = {
                not: parseInt(userId)
            };
        }
        
        // Добавляем поиск по названию
        if (query) {
            whereCondition.name = {
                contains: query
            };
        }
        
        // Фильтр по типам событий, если указаны
        if (types.length > 0) {
            whereCondition.type = {
                in: types
            };
        }
        
        // Определяем поле сортировки для Prisma (для "progress" будем сортировать на стороне приложения)
        const orderByField = sortBy === 'progress' ? 'createdAt' : sortBy;
        
        const events = await prismaClient.event.findMany({
            where: whereCondition,
            select: {
                id: true,
                name: true,
                description: true,
                imageUrl: true,
                status: true,
                type: true,
                createdAt: true
            },
            skip,
            take: limit,
            orderBy: {
                [orderByField]: sortOrder
            }
        });

        // Для каждого события получаем прогресс выполнения условий
        const eventsWithProgress = await Promise.all(
            events.map(async (event) => {
                const progress = await calculateEndConditionsProgress(event.id);
                const avgProgress = progress.length > 0 
                    ? Math.round(progress.reduce((a, b) => a + b, 0) / progress.length) 
                    : 0;
                
                return {
                    ...event,
                    conditionsProgress: progress,
                    avgProgress
                };
            })
        );
        
        // Фильтруем события по прогрессу
        const filteredEvents = eventsWithProgress.filter(event => {
            const avgProgress = event.avgProgress;
            return avgProgress >= minProgress && avgProgress <= maxProgress;
        });
        
        // Сортировка по прогрессу, если требуется
        if (sortBy === 'progress') {
            filteredEvents.sort((a, b) => {
                const progressA = a.avgProgress || 0;
                const progressB = b.avgProgress || 0;
                
                return sortOrder === 'asc' 
                    ? progressA - progressB 
                    : progressB - progressA;
            });
        }

        return filteredEvents;
    },
    
    /**
     * Получение события по ID
     * @param {number} id - ID события
     * @returns {Promise<Object>} - Данные события
     */
    async getEventById(id) {
        const event = await prismaClient.event.findUnique({
            where: { id: parseInt(id) },
            include: {
                endConditions: {
                    include: {
                        conditions: true
                    }
                }
            }
        });
        
        if (!event) {
            throw new Error('Event not found');
        }
        
        // Добавляем массив прогрессов для каждой группы условий
        const conditionsProgress = await calculateEndConditionsProgress(event.id);

        return {
            ...event,
            conditionsProgress
        };
    },
    
    /**
     * Создание нового события
     * @param {Object} eventData - Данные события
     * @param {Object} imageFile - Файл изображения
     * @returns {Promise<Object>} - Созданное событие
     */
    async createEvent(eventData, imageFile) {
        const { name, description, type, creatorId, recipientId, endConditions } = eventData;
        
        // Проверка валидации данных
        if ((type === 'DONATION' || type === 'FUNDRAISING') && !recipientId) {
            throw new Error('For types DONATION and FUNDRAISING, you must specify the recipient of the funds (recipientId)');
        }
        
        let parsedEndConditions;
        try {
            parsedEndConditions = JSON.parse(endConditions);
        } catch (error) {
            throw new Error('Invalid endConditions format');
        }
        
        if (!parsedEndConditions || !Array.isArray(parsedEndConditions) || parsedEndConditions.length === 0) {
            throw new Error('You must specify at least one event end condition');
        }
        
        // Загрузка изображения, если предоставлено
        let imageUrl = null;
        if (imageFile) {
            const path = `events/${Date.now()}-${imageFile.originalname}`;
            try {
                imageUrl = await uploadImage(imageFile, path);
            } catch (error) {
                throw new Error(`Failed to upload image: ${error.message}`);
            }
        }
        
        const eventDataToCreate = {
            name,
            description,
            status: 'active',
            type,
            userId: parseInt(creatorId),
            imageUrl
        };
        
        if (type === 'DONATION' || type === 'FUNDRAISING') {
            eventDataToCreate.recipientId = parseInt(recipientId);
        }
        
        // Запуск транзакции для создания события и связанных сущностей
        let eventId = await prismaClient.$transaction(async (prisma) => {
            const createdEvent = await prisma.event.create({
                data: eventDataToCreate,
            });

            const createdEndConditions = await prisma.eventEndCondition.createMany({
                data: parsedEndConditions.map(() => ({
                    eventId: createdEvent.id
                })),
            });

            // Получение ID созданных условий окончания
            const endConditionsFromDb = await prisma.eventEndCondition.findMany({
                where: {eventId: createdEvent.id},
                orderBy: {id: 'asc'}
            });

            // Подготовка данных для создания условий
            const allFlatConditions = [];
            parsedEndConditions.forEach((ec, index) => {
                ec.conditions.forEach(cond => {
                    allFlatConditions.push({
                        endConditionId: endConditionsFromDb[index].id,
                        parameterName: cond.parameterName,
                        operator: cond.operator,
                        // remove all symbols except digits, remove leading zeros
                        value: cond.value.toString().replace(/\D/g, '').replace(/^0+/, '') || '0'
                    });
                });
            });

            // Создание условий
            await prisma.endCondition.createMany({
                data: allFlatConditions
            });

            return createdEvent.id;
        });

        // Проверяем временные условия
        await checkTimeConditions();

        // Проверяем, нужно ли обновить статус события
        await participationConditionChecker.checkPeopleConditions(eventId);
        await bankConditionChecker.checkBankConditions(eventId);
        await checkAndUpdateEventStatus(eventId);

        // Возврат созданного события с полной структурой
        return prismaClient.event.findUnique({
            where: {id: eventId},
            include: {
                endConditions: {
                    include: {
                        conditions: true
                    }
                }
            }
        });
    },

    /**
     * Удаление события
     * @param {number} id - ID события
     * @param {number} userId - ID пользователя, выполняющего удаление
     * @returns {Promise<void>}
     */
    /*
    async deleteEvent(id, userId) {
        // Проверка на существование и права доступа
        const event = await prismaClient.event.findUnique({
            where: { id: parseInt(id) }
        });
        
        if (!event) {
            throw new Error('Event not found');
        }
        
        if (event.userId !== userId) {
            throw new Error('You do not have permission to delete this event');
        }
        
        await prismaClient.event.delete({
            where: { id: parseInt(id) }
        });
    },
    */
    
    /**
     * Получение событий пользователя
     * @param {number} userId - ID пользователя
     * @param {Object} options - Опции запроса
     * @param {number} options.limit - Лимит количества возвращаемых событий
     * @param {string} options.type - Тип событий ('created' или 'participating')
     * @returns {Promise<Array>} - Массив событий пользователя с базовой информацией и прогрессом условий
     */
    async getUserEvents(userId, options = {}) {
        const { limit = 10, type } = options;
        let events = [];
        
        if (!type || type === 'created') {
            // Получаем события, созданные пользователем
            events = await prismaClient.event.findMany({
                where: {
                    userId: parseInt(userId)
                },
                orderBy: {
                    createdAt: 'desc'
                },
                take: parseInt(limit),
                select: {
                    id: true,
                    name: true,
                    description: true,
                    imageUrl: true,
                    status: true,
                    type: true,
                    createdAt: true,
                }
            });
        } else if (type === 'participating') {
            // Получаем события, в которых пользователь участвует
            const participations = await prismaClient.participation.findMany({
                where: {
                    userId: parseInt(userId)
                },
                orderBy: {
                    createdAt: 'desc'
                },
                take: parseInt(limit),
                include: {
                    event: {
                        select: {
                            id: true,
                            name: true,
                            description: true,
                            imageUrl: true,
                            status: true,
                            type: true,
                            createdAt: true,
                        }
                    }
                }
            });
            
            // Преобразуем результат, чтобы получить массив событий
            events = participations.map(p => p.event);
        }

        // Для каждого события получаем прогресс выполнения условий
        const eventsWithProgress = await Promise.all(
            events.map(async (event) => {
                const progress = await calculateEndConditionsProgress(event.id);
                return {
                    ...event,
                    conditionsProgress: progress
                };
            })
        );

        return eventsWithProgress;
    },
    
    /**
     * Получение условий окончания события по ID события
     * @param {number} eventId - ID события
     * @returns {Promise<Array>} - Массив условий окончания события с вложенными условиями
     */
    async getEventEndConditions(eventId) {
        const endConditions = await prismaClient.eventEndCondition.findMany({
            where: { eventId: parseInt(eventId) },
            include: {
                conditions: true
            }
        });
        
        if (!endConditions || endConditions.length === 0) {
            throw new Error('Event end conditions not found');
        }
        
        // Добавляем прогресс для каждой группы условий // TODO: do not use
        const conditionsProgress = await calculateEndConditionsProgress(parseInt(eventId));
        
        return endConditions.map((group, index) => ({
            ...group,
            progress: conditionsProgress[index] || 0
        }));
    },
    
    /**
     * Получение текущего банка события (суммы всех участий)
     * @param {number} eventId - ID события
     * @returns {Promise<number>} - Текущая сумма в банке
     */
    async getEventStatus(eventId) {
        // count all participations debt sum for the event
        const result = await prismaClient.participation.aggregate({
            where: { eventId: parseInt(eventId) },
            _sum: {
                deposit: true
            },
            _count: {
                id: true
            }
        });

        const eventStatus = await prismaClient.event.findUnique({
            where: { id: parseInt(eventId) },
            select: { 
                status: true, 
                type: true,
                recipientId: true,
            }
        });

        return {
            bankAmount: result._sum.deposit || 0,
            status: eventStatus.status || 'completed',
            recipientId: eventStatus.recipientId || null,
            type: eventStatus.type || null,
        };
    },
};

module.exports = eventService; 