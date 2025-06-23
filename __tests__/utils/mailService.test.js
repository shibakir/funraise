const nodemailer = require('nodemailer');

// Mock nodemailer
jest.mock('nodemailer');

describe('MailService', () => {
    let mailService;
    let mockTransporter;
    let mockSendMail;
    let mockVerify;

    beforeAll(() => {
        // Set up environment variables for testing
        process.env.SMTP_HOST = 'smtp.test.com';
        process.env.SMTP_PORT = '587';
        process.env.SMTP_USER = 'test@example.com';
        process.env.SMTP_PASSWORD = 'testpassword';
    });

    beforeEach(() => {
        // Reset mocks before each test
        jest.clearAllMocks();

        // Create mock functions
        mockSendMail = jest.fn();
        mockVerify = jest.fn();

        // Create mock transporter
        mockTransporter = {
            sendMail: mockSendMail,
            verify: mockVerify
        };

        // Mock nodemailer.createTransport to return our mock
        nodemailer.createTransport.mockReturnValue(mockTransporter);

        // Mock verify to resolve successfully by default
        mockVerify.mockResolvedValue(true);

        // Clear the module cache to force re-instantiation
        delete require.cache[require.resolve('../../utils/mail/mailService')];
        
        // Require the module fresh (this will create a new singleton)
        mailService = require('../../utils/mail/mailService');
    });

    afterAll(() => {
        // Clean up environment variables
        delete process.env.SMTP_HOST;
        delete process.env.SMTP_PORT;
        delete process.env.SMTP_USER;
        delete process.env.SMTP_PASSWORD;
    });

    describe('constructor', () => {
        it('should create transporter with correct configuration', () => {
            expect(nodemailer.createTransport).toHaveBeenCalledWith({
                host: 'smtp.test.com',
                port: '587',
                secure: false,
                auth: {
                    user: 'test@example.com',
                    pass: 'testpassword'
                }
            });
        });
    });
}); 
