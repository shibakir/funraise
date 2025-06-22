const { makeExecutableSchema } = require('@graphql-tools/schema');
const { gql } = require('graphql-tag');
/*
const eventResolvers = require('./resolver/eventResolvers');
const userResolvers = require('./resolver/userResolvers');
const participationResolvers = require('./resolver/participationResolvers');
const subscriptionResolvers = require('./resolver/subscriptionResolvers');
const achievementResolvers = require('./resolver/achievementResolvers');
const authResolvers = require('./resolver/authResolvers');

 */

const eventResolvers = require('./resolvers/eventResolvers');
const userResolvers = require('./resolvers/userResolvers');
const participationResolvers = require('./resolvers/participationResolvers');
const subscriptionResolvers = require('./resolvers/subscriptionResolvers');
const achievementResolvers = require('./resolvers/achievementResolvers');
const authResolvers = require('./resolvers/authResolvers');

const { merge } = require('lodash');

const typeDefs = gql`
    """
    Root Query type containing all available queries
    """
    type Query {
        """
        Retrieve a specific event by its unique identifier
        """
        event(id: Int!): Event
        
        """
        Retrieve all events in the system
        """
        events: [Event]
        
        """
        Retrieve a specific user by their unique identifier
        """
        user(id: Int!): User
        
        """
        Retrieve all users in the system
        """
        users: [User]
        
        """
        Search for users by username using partial matching
        """
        searchUsers(username: String!): [User]
        
        """
        Get user's participation details for a specific event
        """
        userParticipation(userId: Int!, eventId: Int!): Participation
        
        """
        Get current balance for a specific user
        """
        userBalance(userId: Int!): Float
        
        """
        Get all achievements for a specific user with progress details
        """
        userAchievements(userId: Int!): [UserAchievement]
    }

    """
    Root Mutation type containing all available mutations
    """
    type Mutation {
        # Auth mutations
        """
        Authenticate user with email and password, returns access tokens and user data
        """
        login(email: String!, password: String!): AuthResponse!
        
        """
        Register a new user account with username, email and password
        """
        register(username: String!, email: String!, password: String!): AuthResponse!
        
        """
        Authenticate user with Discord OAuth, returns access tokens and user data
        """
        discordAuth(accessToken: String!): AuthResponse!
        
        """
        Authenticate user with Discord OAuth code, returns access tokens and user data
        """
        discordAuthCode(code: String!, redirectUri: String!, codeVerifier: String): AuthResponse!
        
        """
        Link existing account with Discord
        """
        linkDiscordAccount(code: String!, redirectUri: String!, codeVerifier: String): LinkDiscordResult!
        
        """
        Refresh access token using refresh token
        """
        refreshToken(refreshToken: String!): AuthResponse!
        
        """
        Logout user and invalidate refresh token
        """
        logout(refreshToken: String!): Boolean!
        
        """
        Activate user account using activation link
        """
        activateUser(activationLink: String!): User!
        
        """
        Resend activation email to user
        """
        resendActivationEmail(email: String!): Boolean!
        
        # Event mutations
        """
        Create a new event with specified parameters and end conditions
        """
        createEvent(input: CreateEventInput!): Event
        
        # User mutations
        """
        Update existing user information including password change
        """
        updateUser(id: Int!, input: UpdateUserInput!): User
        
        # Participation mutations
        """
        Create or update user participation in an event
        """
        upsertParticipation(input: UpsertParticipationInput!): ParticipationResult
        
        # Transaction mutations
        """
        Create a new financial transaction for a user
        """
        createTransaction(input: CreateTransactionInput!): Transaction
    }

    """
    Root Subscription type for real-time updates
    """
    type Subscription {
        """
        Subscribe to updates for a specific event
        """
        eventUpdated(eventId: Int!): Event
        
        """
        Subscribe to new participations created for a specific event
        """
        participationCreated(eventId: Int!): Participation
        
        """
        Subscribe to participation updates for a specific event
        """
        participationUpdated(eventId: Int!): Participation
        
        """
        Subscribe to balance updates for a specific user
        """
        balanceUpdated(userId: Int!): User
        
        """
        Subscribe to event end condition updates
        """
        eventConditionsUpdated(eventId: Int!): [EventEndCondition]
    }

    # Auth types
    """
    Authentication response containing tokens and user information
    """
    type AuthResponse {
        """
        JWT access token for authenticated requests
        """
        accessToken: String!
        
        """
        JWT refresh token for obtaining new access tokens
        """
        refreshToken: String!
        
        """
        Authenticated user information
        """
        user: User!
    }

    """
    Input for creating a new event
    """
    input CreateEventInput {
        """
        Event name/title
        """
        name: String!
        
        """
        Detailed description of the event
        """
        description: String
        
        """
        Type/category of the event
        """
        type: String!
        
        """
        Base64 encoded image file for the event
        """
        imageFile: String
        
        """
        ID of the user creating the event
        """
        userId: Int!
        
        """
        ID of the user who will receive rewards (optional)
        """
        recipientId: Int
        
        """
        Groups of end conditions that determine when the event completes
        """
        eventEndConditionGroups: [EventEndConditionGroupInput!]!
    }

    """
    Group of related end conditions
    """
    input EventEndConditionGroupInput {
        """
        List of conditions in this group
        """
        conditions: [EndConditionInput!]!
    }

    """
    Individual end condition definition
    """
    input EndConditionInput {
        """
        Type of condition (TIME, BANK, PARTICIPATION)
        """
        name: ConditionType!
        
        """
        Comparison operator for the condition
        """
        operator: Operator!
        
        """
        Target value for the condition
        """
        value: String!
    }

    """
    Input for updating user information
    """
    input UpdateUserInput {
        """
        New username (optional)
        """
        username: String
        
        """
        New email address (optional)
        """
        email: String
        
        """
        Current password (required for password change)
        """
        currentPassword: String
        
        """
        New password (optional)
        """
        newPassword: String
    }

    """
    Result of linking Discord account operation
    """
    type LinkDiscordResult {
        """
        Whether the linking was successful
        """
        success: Boolean!
        
        """
        Message describing the result
        """
        message: String!
        
        """
        Updated user data (only present if success is true)
        """
        user: User
    }
    
    """
    Input for creating or updating participation
    """
    input UpsertParticipationInput {
        """
        ID of the participating user
        """
        userId: Int!
        
        """
        ID of the event to participate in
        """
        eventId: Int!
        
        """
        Amount of money deposited for participation
        """
        deposit: Float!
    }

    """
    Result of an upsert participation operation
    """
    type ParticipationResult {
        """
        The participation record
        """
        participation: Participation!
        
        """
        Whether this was a newly created participation
        """
        isNewParticipation: Boolean!
        
        """
        Associated transaction record
        """
        transaction: Transaction!
    }

    """
    Input for creating a financial transaction
    """
    input CreateTransactionInput {
        """
        Transaction amount (positive or negative)
        """
        amount: Float!
        
        """
        Type of transaction
        """
        type: TransactionType!
        
        """
        ID of the user associated with this transaction
        """
        userId: Int!
    }

    """
    Financial transaction record
    """
    type Transaction {
        """
        Unique transaction identifier
        """
        id: Int!
        
        """
        Transaction amount
        """
        amount: Float!
        
        """
        Type of transaction
        """
        type: TransactionType!
        
        """
        ID of the associated user
        """
        userId: Int!
        
        """
        When the transaction was created
        """
        createdAt: String
        
        """
        When the transaction was last updated
        """
        updatedAt: String
    }

    """
    Types of financial transactions
    """
    enum TransactionType {
        """
        Money added to user balance
        """
        BALANCE_INCOME
        
        """
        Money deducted from user balance
        """
        BALANCE_OUTCOME
        
        """
        Money received from event completion
        """
        EVENT_INCOME
        
        """
        Money spent on event participation
        """
        EVENT_OUTCOME
        
        """
        Money received as a gift
        """
        GIFT
    }

    """
    Current status of an event
    """
    enum EventStatus {
        """
        Event is currently active and accepting participations
        """
        IN_PROGRESS
        
        """
        Event has completed successfully
        """
        FINISHED
        
        """
        Event has failed to meet its conditions
        """
        FAILED
    }

    """
    User account information
    """
    type User {
        """
        Unique user identifier
        """
        id: Int!
        
        """
        User's display name
        """
        username: String!
        
        """
        User's email address
        """
        email: String!
        
        """
        Current account balance
        """
        balance: Float!
        
        """
        URL to user's profile image
        """
        image: String
        
        """
        Whether the user account is activated
        """
        isActivated: Boolean!
        
        """
        When the user account was created
        """
        createdAt: String!
        
        """
        All events the user is involved in (created or received)
        """
        events: [Event!]
        
        """
        Events created by this user
        """
        createdEvents: [Event!]
        
        """
        Events where this user is the recipient
        """
        receivedEvents: [Event!]
        
        """
        User's participations in events
        """
        participations: [Participation]
        
        """
        Associated accounts
        """
        accounts: [Account!]
        
        """
        User's transactions
        """
        transactions: [Transaction!]
        
        """
        User's achievements
        """
        achievements: [UserAchievement!]
    }

    """
    Event or challenge that users can participate in
    """
    type Event {
        """
        Unique event identifier
        """
        id: Int!
        
        """
        Event name/title
        """
        name: String!
        
        """
        Detailed description of the event
        """
        description: String
        
        """
        Total amount of money in the event bank
        """
        bankAmount: Float
        
        """
        Current status of the event
        """
        status: EventStatus
        
        """
        Type/category of the event
        """
        type: String
        
        """
        URL to the event's image
        """
        imageUrl: String
        
        """
        ID of the user who created the event
        """
        userId: Int
        
        """
        ID of the user who will receive rewards
        """
        recipientId: Int
        
        """
        User who created this event
        """
        creator: User
        
        """
        User who will receive rewards from this event
        """
        recipient: User
        
        """
        Conditions that determine when the event ends
        """
        endConditions: [EventEndCondition]
        
        """
        All user participations in this event
        """
        participations: [Participation]
    }

    """
    User participation in an event
    """
    type Participation {
        """
        Unique participation identifier
        """
        id: Int!
        
        """
        Amount of money deposited by the user
        """
        deposit: Float!
        
        """
        ID of the participating user
        """
        userId: Int!
        
        """
        ID of the event being participated in
        """
        eventId: Int!
        
        """
        The participating user
        """
        user: User
        
        """
        The event being participated in
        """
        event: Event
        
        """
        When the participation was created
        """
        createdAt: String
        
        """
        When the participation was last updated
        """
        updatedAt: String
    }

    """
    Group of end conditions for an event
    """
    type EventEndCondition {
        """
        Unique identifier for the condition group
        """
        id: Int!
        
        """
        Whether all conditions in this group are completed
        """
        isCompleted: Boolean!
        
        """
        Whether this condition group has failed
        """
        isFailed: Boolean!
        
        """
        Individual conditions in this group
        """
        conditions: [EndCondition]
    }

    """
    Individual condition that must be met
    """
    type EndCondition {
        """
        Unique condition identifier
        """
        id: Int!
        
        """
        Type of condition (TIME, BANK, PARTICIPATION)
        """
        name: ConditionType!
        
        """
        Comparison operator used for evaluation
        """
        operator: Operator!
        
        """
        Target value that must be reached
        """
        value: String!
        
        """
        Whether this specific condition is completed
        """
        isCompleted: Boolean!
    }

    """
    Types of end conditions
    """
    enum ConditionType {
        """
        Time-based condition (deadline)
        """
        TIME
        
        """
        Bank amount condition (money target)
        """
        BANK
        
        """
        Participation count condition (user target)
        """
        PARTICIPATION
    }

    """
    Comparison operators for conditions
    """
    enum Operator {
        """
        Exact equality
        """
        EQUALS
        
        """
        Greater than
        """
        GREATER
        
        """
        Less than
        """
        LESS
        
        """
        Greater than or equal to
        """
        GREATER_EQUALS
        
        """
        Less than or equal to
        """
        LESS_EQUALS
    }

    """
    User's progress on a specific achievement
    """
    type UserAchievement {
        """
        Unique user achievement identifier
        """
        id: Int!
        
        """
        ID of the user
        """
        userId: Int!
        
        """
        ID of the achievement
        """
        achievementId: Int!
        
        """
        Current status of the achievement (LOCKED, IN_PROGRESS, UNLOCKED)
        """
        status: String!
        
        """
        When the achievement was unlocked (if applicable)
        """
        unlockedAt: String
        
        """
        The achievement details
        """
        achievement: Achievement!
        
        """
        Progress on individual criteria for this achievement
        """
        progress: [UserCriterionProgress!]!
    }

    """
    Achievement that users can unlock
    """
    type Achievement {
        """
        Unique achievement identifier
        """
        id: Int!
        
        """
        Achievement name/title
        """
        name: String!
        
        """
        URL to the achievement icon
        """
        iconUrl: String
    }

    """
    User's progress on a specific achievement criterion
    """
    type UserCriterionProgress {
        """
        Unique progress identifier
        """
        id: Int!
        
        """
        Current progress value
        """
        currentValue: Int!
        
        """
        Whether this criterion is completed
        """
        isCompleted: Boolean!
        
        """
        The criterion details
        """
        criterion: AchievementCriterion!
    }

    """
    Criterion that must be met to unlock an achievement
    """
    type AchievementCriterion {
        """
        Unique criterion identifier
        """
        id: Int!
        
        """
        Type of criterion (EVENT_CREATE, EVENT_PARTICIPATE, etc.)
        """
        criteriaType: String!
        
        """
        Target value that must be reached
        """
        criteriaValue: Int!
        
        """
        Human-readable description of the criterion
        """
        description: String!
    }

    """
    Associated account information
    """
    type Account {
        """
        Unique account identifier
        """
        id: String!
        
        """
        ID of the associated user
        """
        userId: Int!
        
        """
        Type of account (e.g., email, social media)
        """
        type: String!
        
        """
        Provider of the account
        """
        provider: String!
        
        """
        ID of the account on the provider platform
        """
        providerAccountId: String!
        
        """
        Username on the provider platform
        """
        providerUsername: String
        
        """
        Avatar URL from the provider platform
        """
        providerAvatar: String
        
        """
        Email address associated with the account
        """
        providerEmail: String
        
        """
        Discriminator or identifier on the provider platform
        """
        providerDiscriminator: String
        
        """
        When the account was created
        """
        createdAt: String!
    }
`;

const schema = makeExecutableSchema({
    typeDefs,
    resolvers: merge(eventResolvers, userResolvers, participationResolvers, subscriptionResolvers, achievementResolvers, authResolvers)
});

module.exports = schema; 