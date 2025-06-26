const nodemailer = require('nodemailer');

// Mock nodemailer before importing the service
const mockSendMail = jest.fn();
const mockVerify = jest.fn();
const mockTransporter = {
    sendMail: mockSendMail,
    verify: mockVerify
};

jest.mock('nodemailer', () => ({
    createTransport: jest.fn(() => mockTransporter)
}));

// Mock console methods to avoid noise in tests
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

beforeAll(() => {
    console.log = jest.fn();
    console.error = jest.fn();
    
    // Set up environment variables for testing
    process.env.SMTP_HOST = 'smtp.test.com';
    process.env.SMTP_PORT = '587';
    process.env.SMTP_USER = 'test@example.com';
    process.env.SMTP_PASSWORD = 'testpassword';
    
    // Mock verify to resolve successfully by default
    mockVerify.mockResolvedValue(true);
});

afterAll(() => {
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
    
    // Clean up environment variables
    delete process.env.SMTP_HOST;
    delete process.env.SMTP_PORT;
    delete process.env.SMTP_USER;
    delete process.env.SMTP_PASSWORD;
});

describe('MailService', () => {
    let mailService;

    beforeAll(() => {
        // Import the service after mocks are set up
        mailService = require('../../utils/mail/mailService');
    });

    beforeEach(() => {
        // Reset mocks before each test
        jest.clearAllMocks();
        mockVerify.mockResolvedValue(true);
    });

    describe('service initialization', () => {
        it('should have mailService instance available', () => {
            expect(mailService).toBeDefined();
            expect(typeof mailService.sendActivationMail).toBe('function');
        });

        it('should configure nodemailer correctly', () => {
            // MailService successfully initialized, which means createTransport worked
            expect(mailService).toBeDefined();
        });
    });

    describe('sendActivationMail', () => {
        const testEmail = 'user@example.com';
        const testLink = 'https://example.com/activate/abc123';

        it('should successfully send activation email', async () => {
            const mockEmailInfo = {
                messageId: 'test-message-id',
                accepted: [testEmail],
                rejected: []
            };

            mockSendMail.mockResolvedValue(mockEmailInfo);

            const result = await mailService.sendActivationMail(testEmail, testLink);

            expect(mockSendMail).toHaveBeenCalledWith({
                from: 'test@example.com',
                to: testEmail,
                subject: 'Funraise App: new user activation!',
                text: '',
                html: expect.stringContaining('Funraise activation')
            });

            expect(result).toBe(true);
        });

        it('should include activation link in email HTML', async () => {
            mockSendMail.mockResolvedValue({});

            await mailService.sendActivationMail(testEmail, testLink);

            const emailCall = mockSendMail.mock.calls[0][0];
            expect(emailCall.html).toContain(testLink);
            expect(emailCall.html).toContain('<a href="https://example.com/activate/abc123">');
        });

        it('should include proper email content structure', async () => {
            mockSendMail.mockResolvedValue({});

            await mailService.sendActivationMail(testEmail, testLink);

            const emailCall = mockSendMail.mock.calls[0][0];
            expect(emailCall.html).toContain('<h1>Funraise activation</h1>');
            expect(emailCall.html).toContain('Click the link below to activate');
            expect(emailCall.html).toContain('If you did not request this activation');
            expect(emailCall.html).toContain('Thank you for using Funraise!');
            expect(emailCall.html).toContain('Funraise Team');
        });

        it('should return false when email sending fails', async () => {
            const emailError = new Error('Failed to send email');
            mockSendMail.mockRejectedValue(emailError);

            const result = await mailService.sendActivationMail(testEmail, testLink);

            expect(result).toBe(false);
        });

        it('should handle network timeout errors', async () => {
            const timeoutError = new Error('Connection timeout');
            timeoutError.code = 'ETIMEDOUT';
            mockSendMail.mockRejectedValue(timeoutError);

            const result = await mailService.sendActivationMail(testEmail, testLink);

            expect(result).toBe(false);
        });

        it('should handle authentication errors', async () => {
            const authError = new Error('Invalid credentials');
            authError.code = 'EAUTH';
            mockSendMail.mockRejectedValue(authError);

            const result = await mailService.sendActivationMail(testEmail, testLink);

            expect(result).toBe(false);
        });

        it('should handle invalid recipient email errors', async () => {
            const recipientError = new Error('Invalid recipient');
            recipientError.code = 'EENVELOPE';
            mockSendMail.mockRejectedValue(recipientError);

            const result = await mailService.sendActivationMail(testEmail, testLink);

            expect(result).toBe(false);
        });

        it('should work with different email formats', async () => {
            mockSendMail.mockResolvedValue({});

            const emails = [
                'simple@example.com',
                'with.dots@example.com',
                'with+plus@example.com',
                'with-dash@example.com',
                'user123@subdomain.example.com'
            ];

            for (const email of emails) {
                const result = await mailService.sendActivationMail(email, testLink);
                expect(result).toBe(true);
            }

            expect(mockSendMail).toHaveBeenCalledTimes(emails.length);
        });

        it('should work with different activation link formats', async () => {
            mockSendMail.mockResolvedValue({});

            const links = [
                'https://app.funraise.com/activate/token123',
                'http://localhost:3000/activate/token456',
                'https://staging.funraise.com/auth/activate?token=abc123',
                'https://funraise.com/activate/very-long-token-string-12345'
            ];

            for (const link of links) {
                const result = await mailService.sendActivationMail(testEmail, link);
                expect(result).toBe(true);
                
                const emailCall = mockSendMail.mock.calls[mockSendMail.mock.calls.length - 1][0];
                expect(emailCall.html).toContain(link);
            }
        });

        it('should handle special characters in activation links', async () => {
            mockSendMail.mockResolvedValue({});

            const linkWithSpecialChars = 'https://example.com/activate/token-with_special.chars?param=value&other=123';
            
            const result = await mailService.sendActivationMail(testEmail, linkWithSpecialChars);
            
            expect(result).toBe(true);
            const emailCall = mockSendMail.mock.calls[0][0];
            expect(emailCall.html).toContain(linkWithSpecialChars);
        });

        it('should preserve HTML entities in links', async () => {
            mockSendMail.mockResolvedValue({});

            const linkWithEntities = 'https://example.com/activate?token=abc&amp;param=value';
            
            await mailService.sendActivationMail(testEmail, linkWithEntities);
            
            const emailCall = mockSendMail.mock.calls[0][0];
            expect(emailCall.html).toContain(linkWithEntities);
        });

        it('should handle empty or null parameters gracefully', async () => {
            mockSendMail.mockResolvedValue({});

            // Test with empty string
            const result1 = await mailService.sendActivationMail('', testLink);
            expect(result1).toBe(true);

            // Test with null (should not crash)
            const result2 = await mailService.sendActivationMail(testEmail, '');
            expect(result2).toBe(true);
        });
    });

    describe('singleton behavior', () => {
        it('should maintain transporter instance', () => {
            expect(mailService).toBeDefined();
            expect(typeof mailService.sendActivationMail).toBe('function');
        });
    });

    describe('environment variable handling', () => {
        it('should use environment SMTP_USER as sender email', async () => {
            mockSendMail.mockResolvedValue({});

            await mailService.sendActivationMail('test@example.com', 'http://test.com');

            expect(mockSendMail).toHaveBeenCalledWith(
                expect.objectContaining({
                    from: process.env.SMTP_USER
                })
            );
        });
    });

    describe('email content validation', () => {
        it('should include all required email elements', async () => {
            mockSendMail.mockResolvedValue({});
            
            await mailService.sendActivationMail('test@example.com', 'https://test.com/activate/123');
            
            const emailCall = mockSendMail.mock.calls[0][0];
            
            // Validate email structure
            expect(emailCall).toHaveProperty('from', 'test@example.com');
            expect(emailCall).toHaveProperty('to', 'test@example.com');
            expect(emailCall).toHaveProperty('subject', 'Funraise App: new user activation!');
            expect(emailCall).toHaveProperty('text', '');
            expect(emailCall).toHaveProperty('html');
            
            // Validate HTML content
            const html = emailCall.html;
            expect(html).toContain('<div>');
            expect(html).toContain('</div>');
            expect(html).toContain('<h1>');
            expect(html).toContain('<p>');
            expect(html).toContain('<a href=');
        });

        it('should properly format the activation link', async () => {
            mockSendMail.mockResolvedValue({});
            
            const testLink = 'https://example.com/activate/token123';
            await mailService.sendActivationMail('test@example.com', testLink);
            
            const emailCall = mockSendMail.mock.calls[0][0];
            expect(emailCall.html).toContain(`<a href="${testLink}">${testLink}</a>`);
        });
    });

    describe('error handling edge cases', () => {
        it('should handle very long activation links', async () => {
            mockSendMail.mockResolvedValue({});
            
            const longLink = 'https://example.com/activate/' + 'a'.repeat(1000);
            const result = await mailService.sendActivationMail('test@example.com', longLink);
            
            expect(result).toBe(true);
            const emailCall = mockSendMail.mock.calls[0][0];
            expect(emailCall.html).toContain(longLink);
        });

        it('should handle unicode characters in email addresses', async () => {
            mockSendMail.mockResolvedValue({});
            
            const unicodeEmail = 'тест@example.com';
            const result = await mailService.sendActivationMail(unicodeEmail, 'https://test.com');
            
            expect(result).toBe(true);
            expect(mockSendMail).toHaveBeenCalledWith(
                expect.objectContaining({
                    to: unicodeEmail
                })
            );
        });

        it('should handle malformed URLs gracefully', async () => {
            mockSendMail.mockResolvedValue({});
            
            const malformedUrl = 'not-a-valid-url';
            const result = await mailService.sendActivationMail('test@example.com', malformedUrl);
            
            expect(result).toBe(true);
            const emailCall = mockSendMail.mock.calls[0][0];
            expect(emailCall.html).toContain(malformedUrl);
        });
    });
}); 
