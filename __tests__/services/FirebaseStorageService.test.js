const { FirebaseStorageService, firebaseStorageService } = require('../../utils/media/FirebaseStorageService');

// Mock Firebase modules
jest.mock('firebase/app', () => ({
    initializeApp: jest.fn()
}));

jest.mock('firebase/storage', () => ({
    getStorage: jest.fn(),
    ref: jest.fn(),
    uploadBytes: jest.fn(),
    getDownloadURL: jest.fn()
}));

const { initializeApp } = require('firebase/app');
const { getStorage, ref, uploadBytes, getDownloadURL } = require('firebase/storage');

describe('FirebaseStorageService', () => {
    let mockApp;
    let mockStorage;

    beforeEach(() => {
        jest.clearAllMocks();
        
        // Reset environment variables
        process.env.FIREBASE_API_KEY = 'test-api-key';
        process.env.FIREBASE_AUTH_DOMAIN = 'test-auth-domain';
        process.env.FIREBASE_PROJECT_ID = 'test-project-id';
        process.env.FIREBASE_STORAGE_BUCKET = 'test-storage-bucket';
        process.env.FIREBASE_MESSAGING_SENDER_ID = 'test-messaging-sender-id';
        process.env.FIREBASE_APP_ID = 'test-app-id';
        process.env.FIREBASE_MEASUREMENT_ID = 'test-measurement-id';

        mockApp = { name: 'test-app' };
        mockStorage = { bucket: 'test-bucket' };

        initializeApp.mockReturnValue(mockApp);
        getStorage.mockReturnValue(mockStorage);
    });

    describe('constructor and initialization', () => {
        it('should initialize Firebase with correct config', () => {
            const service = new FirebaseStorageService();

            expect(initializeApp).toHaveBeenCalledWith({
                apiKey: 'test-api-key',
                authDomain: 'test-auth-domain',
                projectId: 'test-project-id',
                storageBucket: 'test-storage-bucket',
                messagingSenderId: 'test-messaging-sender-id',
                appId: 'test-app-id',
                measurementId: 'test-measurement-id'
            });

            expect(getStorage).toHaveBeenCalledWith(mockApp);
            expect(service.app).toBe(mockApp);
            expect(service.storage).toBe(mockStorage);
        });

        it('should throw error if Firebase initialization fails', () => {
            const initError = new Error('Firebase initialization failed');
            initializeApp.mockImplementation(() => {
                throw initError;
            });

            expect(() => new FirebaseStorageService()).toThrow('Firebase initialization failed');
        });

        it('should log successful initialization', () => {
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
            
            new FirebaseStorageService();

            expect(consoleSpy).toHaveBeenCalledWith('Firebase initialized successfully');
            
            consoleSpy.mockRestore();
        });

        it('should log error and throw on initialization failure', () => {
            const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
            const initError = new Error('Firebase init error');
            initializeApp.mockImplementation(() => {
                throw initError;
            });

            expect(() => new FirebaseStorageService()).toThrow('Firebase init error');
            expect(consoleErrorSpy).toHaveBeenCalledWith('Firebase initialization error:', initError);
            
            consoleErrorSpy.mockRestore();
        });
    });

    describe('isInitialized', () => {
        it('should return true when properly initialized', () => {
            const service = new FirebaseStorageService();
            expect(service.isInitialized()).toBe(true);
        });

        it('should return false when not initialized', () => {
            const service = new FirebaseStorageService();
            service.app = null;
            service.storage = null;
            expect(service.isInitialized()).toBe(false);
        });

        it('should return false when partially initialized', () => {
            const service = new FirebaseStorageService();
            service.app = null;
            expect(service.isInitialized()).toBe(false);
        });
    });

    describe('getStorageRef', () => {
        it('should return storage reference for given path', () => {
            const service = new FirebaseStorageService();
            const mockRef = { path: 'test/path' };
            ref.mockReturnValue(mockRef);

            const result = service.getStorageRef('test/path');

            expect(ref).toHaveBeenCalledWith(mockStorage, 'test/path');
            expect(result).toBe(mockRef);
        });

        it('should throw error if storage is not initialized', () => {
            const service = new FirebaseStorageService();
            service.storage = null;

            expect(() => service.getStorageRef('test/path')).toThrow('Firebase storage is not initialized');
        });
    });

    describe('uploadImage', () => {
        let service;
        let mockFile;
        let mockRef;
        let mockSnapshot;

        beforeEach(() => {
            service = new FirebaseStorageService();
            mockFile = {
                buffer: Buffer.from('test image data'),
                originalname: 'test.jpg',
                mimetype: 'image/jpeg'
            };
            mockRef = { path: 'images/test.jpg' };
            mockSnapshot = { ref: mockRef };

            ref.mockReturnValue(mockRef);
            uploadBytes.mockResolvedValue(mockSnapshot);
            getDownloadURL.mockResolvedValue('https://firebase.com/test-url');
        });

        it('should successfully upload image and return download URL', async () => {
            const result = await service.uploadImage(mockFile, 'images/test.jpg');

            expect(ref).toHaveBeenCalledWith(mockStorage, 'images/test.jpg');
            expect(uploadBytes).toHaveBeenCalledWith(mockRef, mockFile.buffer);
            expect(getDownloadURL).toHaveBeenCalledWith(mockRef);
            expect(result).toBe('https://firebase.com/test-url');
        });

        it('should throw error if storage is not initialized', async () => {
            service.storage = null;

            await expect(service.uploadImage(mockFile, 'images/test.jpg'))
                .rejects
                .toThrow('Firebase storage is not initialized');
        });

        it('should throw error if file buffer is missing', async () => {
            const fileWithoutBuffer = { originalname: 'test.jpg' };

            await expect(service.uploadImage(fileWithoutBuffer, 'images/test.jpg'))
                .rejects
                .toThrow('File buffer is missing');
        });

        it('should handle and log detailed upload errors', async () => {
            const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
            const uploadError = new Error('Upload failed');
            uploadError.code = 'storage/unknown';
            uploadError.stack = 'test stack';
            uploadError.name = 'FirebaseError';
            
            uploadBytes.mockRejectedValue(uploadError);

            await expect(service.uploadImage(mockFile, 'images/test.jpg'))
                .rejects
                .toThrow('Upload failed');

            expect(consoleErrorSpy).toHaveBeenCalledWith('Detailed Firebase upload error:', {
                message: 'Upload failed',
                code: 'storage/unknown',
                stack: 'test stack',
                name: 'FirebaseError'
            });

            consoleErrorSpy.mockRestore();
        });

        describe('specific Firebase error handling', () => {
            const testErrorCases = [
                {
                    code: 'storage/unauthorized',
                    expectedMessage: 'Firebase Storage: User is not authorized to perform the desired action'
                },
                {
                    code: 'storage/retry-limit-exceeded',
                    expectedMessage: 'Firebase Storage: Maximum retry time for operation exceeded'
                },
                {
                    code: 'storage/invalid-checksum',
                    expectedMessage: 'Firebase Storage: File on the client does not match the checksum of the file received by the server'
                },
                {
                    code: 'storage/canceled',
                    expectedMessage: 'Firebase Storage: User canceled the upload'
                },
                {
                    code: 'storage/invalid-argument',
                    expectedMessage: 'Firebase Storage: Invalid argument provided'
                },
                {
                    code: 'storage/no-default-bucket',
                    expectedMessage: 'Firebase Storage: No bucket has been set in your config'
                },
                {
                    code: 'storage/quota-exceeded',
                    expectedMessage: 'Firebase Storage: Quota on your Firebase Storage bucket has been exceeded'
                }
            ];

            testErrorCases.forEach(({ code, expectedMessage }) => {
                it(`should handle ${code} error`, async () => {
                    const error = new Error('Firebase error');
                    error.code = code;
                    uploadBytes.mockRejectedValue(error);

                    await expect(service.uploadImage(mockFile, 'images/test.jpg'))
                        .rejects
                        .toThrow(expectedMessage);
                });
            });

            it('should re-throw unknown errors', async () => {
                const unknownError = new Error('Unknown Firebase error');
                unknownError.code = 'storage/unknown-error';
                uploadBytes.mockRejectedValue(unknownError);

                await expect(service.uploadImage(mockFile, 'images/test.jpg'))
                    .rejects
                    .toThrow('Unknown Firebase error');
            });
        });

        it('should handle errors in getDownloadURL', async () => {
            uploadBytes.mockResolvedValue(mockSnapshot);
            getDownloadURL.mockRejectedValue(new Error('Failed to get download URL'));

            await expect(service.uploadImage(mockFile, 'images/test.jpg'))
                .rejects
                .toThrow('Failed to get download URL');
        });
    });

    describe('singleton instance', () => {
        it('should export singleton instance', () => {
            expect(firebaseStorageService).toBeInstanceOf(FirebaseStorageService);
            expect(firebaseStorageService.isInitialized()).toBe(true);
        });

        it('should maintain singleton pattern', () => {
            const instance1 = firebaseStorageService;
            const instance2 = firebaseStorageService;
            expect(instance1).toBe(instance2);
        });
    });

    describe('error scenarios', () => {
        it('should handle missing environment variables gracefully', () => {
            delete process.env.FIREBASE_API_KEY;
            delete process.env.FIREBASE_AUTH_DOMAIN;

            const service = new FirebaseStorageService();

            expect(service.firebaseConfig.apiKey).toBeUndefined();
            expect(service.firebaseConfig.authDomain).toBeUndefined();
        });

        it('should handle initialization with partial config', () => {
            // Clear some environment variables
            delete process.env.FIREBASE_MEASUREMENT_ID;

            const service = new FirebaseStorageService();

            expect(service.firebaseConfig.measurementId).toBeUndefined();
            expect(service.firebaseConfig.apiKey).toBe('test-api-key');
        });
    });

    describe('integration scenarios', () => {
        it('should handle multiple uploads sequentially', async () => {
            const service = new FirebaseStorageService();
            const file1 = { buffer: Buffer.from('image1') };
            const file2 = { buffer: Buffer.from('image2') };

            const mockRef1 = { path: 'images/1.jpg' };
            const mockRef2 = { path: 'images/2.jpg' };
            
            ref.mockReturnValueOnce(mockRef1).mockReturnValueOnce(mockRef2);
            uploadBytes.mockResolvedValueOnce({ ref: mockRef1 }).mockResolvedValueOnce({ ref: mockRef2 });
            getDownloadURL.mockResolvedValueOnce('url1').mockResolvedValueOnce('url2');

            const result1 = await service.uploadImage(file1, 'images/1.jpg');
            const result2 = await service.uploadImage(file2, 'images/2.jpg');

            expect(result1).toBe('url1');
            expect(result2).toBe('url2');
            expect(uploadBytes).toHaveBeenCalledTimes(2);
        });

        it('should handle large file buffers', async () => {
            const service = new FirebaseStorageService();
            const largeBuffer = Buffer.alloc(128 * 128, 'a'); // 16KB buffer
            const largeFile = { buffer: largeBuffer };

            const mockRef = { path: 'images/large.jpg' };
            ref.mockReturnValue(mockRef);
            uploadBytes.mockResolvedValue({ ref: mockRef });
            getDownloadURL.mockResolvedValue('https://firebase.com/large-file-url');

            const result = await service.uploadImage(largeFile, 'images/large.jpg');

            expect(uploadBytes).toHaveBeenCalledWith(mockRef, largeBuffer);
            expect(result).toBe('https://firebase.com/large-file-url');
        });
    });
}); 