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
     * Получение всех событий
     * @returns {Promise<Array>} - Массив событий с базовой информацией и прогрессом условий
     */
    async getAllEvents() {
        const events = await prismaClient.event.findMany({
            select: {
                id: true,
                name: true,
                description: true,
                imageUrl: true
            }
        });

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
     * @param {number} userId - ID пользователя-создателя
     * @returns {Promise<Object>} - Созданное событие
     */
    async createEvent(eventData, imageFile, userId) {
        const { name, description, type, recipientId, endConditions } = eventData;
        
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
            userId,
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
     * Обновление события
     * @param {number} id - ID события
     * @param {Object} eventData - Обновляемые данные
     * @param {number} userId - ID пользователя, выполняющего обновление
     * @returns {Promise<Object>} - Обновленное событие
     */
    async updateEvent(id, eventData, userId) {
        const { name, description, status, type, bankAmount, recipientId } = eventData;
        
        // Проверка на существование и права доступа
        const event = await prismaClient.event.findUnique({
            where: { id: parseInt(id) },
            include: {
                endConditions: true
            }
        });
        
        if (!event) {
            throw new Error('Event not found');
        }
        
        if (event.userId !== userId) {
            throw new Error('You do not have permission to update this event');
        }
        
        // Проверка типа и получателя
        if ((type === 'DONATION' || type === 'FUNDRAISING') && !recipientId) {
            throw new Error('For types DONATION and FUNDRAISING, you must specify the recipient of the funds (recipientId)');
        }
        
        const updateData = {
            name,
            description,
            status,
            type,
            bankAmount
        };
        
        // Обработка recipientId в зависимости от типа
        if (type === 'DONATION' || type === 'FUNDRAISING') {
            updateData.recipientId = parseInt(recipientId);
        } else if (type === 'JACKPOT') {
            updateData.recipientId = null;
        }
        
        return await prismaClient.event.update({
            where: { id: parseInt(id) },
            data: updateData,
        });
    },
    
    /**
     * Удаление события
     * @param {number} id - ID события
     * @param {number} userId - ID пользователя, выполняющего удаление
     * @returns {Promise<void>}
     */
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
    
    /**
     * Получение событий пользователя
     * @param {number} userId - ID пользователя
     * @param {Object} options - Опции запроса
     * @param {number} options.limit - Лимит количества возвращаемых событий
     * @returns {Promise<Array>} - Массив событий пользователя с базовой информацией и прогрессом условий
     */
    async getUserEvents(userId, options = {}) {
        const { limit = 10 } = options;
        
        const events = await prismaClient.event.findMany({
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
                status: true
            }
        });

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
    async getEventBankAmount(eventId) {
        // Используем агрегацию для подсчета суммы депозитов
        const result = await prismaClient.participation.aggregate({
            where: { eventId: parseInt(eventId) },
            _sum: {
                deposit: true
            },
            _count: {
                id: true
            }
        });
        
        // Обновляем сумму в банке события, если она отличается от расчетной
        /*
        const event = await prismaClient.event.findUnique({
            where: { id: parseInt(eventId) }
        });
        
        if (event && result._sum.deposit && event.bankAmount !== result._sum.deposit) {
            await prismaClient.event.update({
                where: { id: parseInt(eventId) },
                data: { bankAmount: result._sum.deposit }
            });
        }
        */
        
        return {
            bankAmount: result._sum.deposit || 0,
            participantsCount: result._count.id || 0
        };
    }
};

module.exports = eventService; 