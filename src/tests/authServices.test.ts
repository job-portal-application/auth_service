// auth.controller.test.ts
import { jest, describe, beforeEach, expect, it } from '@jest/globals';

const mockSql = jest.fn<any>();
const mockHash = jest.fn<any>();
const mockCompare = jest.fn<any>();
const mockSign = jest.fn<any>();
const mockVerify = jest.fn<any>();
const mockAxiosPost = jest.fn<any>();
const mockGetBuffer = jest.fn<any>();
const mockPublishToTopic = jest.fn<any>();
const mockRedisSet = jest.fn<any>();
const mockRedisGet = jest.fn<any>();
const mockRedisDel = jest.fn<any>();
const mockForgotPasswordTemplate = jest.fn<any>();

jest.unstable_mockModule('../utils/db.js', () => ({
    sql: mockSql,
}));

jest.unstable_mockModule('bcrypt', () => ({
    default: {
        hash: mockHash,
        compare: mockCompare,
    },
}));

jest.unstable_mockModule('jsonwebtoken', () => ({
    default: {
        sign: mockSign,
        verify: mockVerify,
    },
}));

jest.unstable_mockModule('axios', () => ({
    default: {
        post: mockAxiosPost,
    },
}));

jest.unstable_mockModule('../utils/buffer.js', () => ({
    default: mockGetBuffer,
}));

jest.unstable_mockModule('../producer.js', () => ({
    publishToTopic: mockPublishToTopic,
}));

jest.unstable_mockModule('../redis/redis.js', () => ({
    redisClient: {
        set: mockRedisSet,
        get: mockRedisGet,
        del: mockRedisDel,
    },
}));

jest.unstable_mockModule('../templates/forgotPasswordTemplate.js', () => ({
    forgotPasswordTemplate: mockForgotPasswordTemplate,
}));

describe('auth controller', () => {

    beforeEach(() => {
        jest.clearAllMocks();
        jest.resetModules();

        process.env.JWT_SECRET_KEY = 'secret';
        process.env.UPLOAD_SERVICE_URL = 'http://localhost:5000';
        process.env.FRONTEND_URL = 'http://localhost:3000';

        mockPublishToTopic.mockResolvedValue(undefined);
        mockRedisSet.mockResolvedValue(undefined);
        mockRedisGet.mockResolvedValue('token');
        mockRedisDel.mockResolvedValue(undefined);
    });

    it('should register recruiter successfully', async () => {
        mockSql
            .mockResolvedValueOnce([])
            .mockResolvedValueOnce([
                {
                    user_id: 1,
                    name: 'John',
                },
            ]);

        mockHash.mockResolvedValue('hashed-password');

        mockSign.mockReturnValue('jwt-token');

        const { registerUser } =
            await import('../services/authServices.js');

        const req: any = {
            body: {
                name: 'John',
                email: 'john@test.com',
                password: '123456',
                phoneNumber: '9999999999',
                role: 'recruiter',
            },
        };

        const json = jest.fn();

        const res: any = { json };

        await registerUser(req, res, jest.fn());

        expect(json).toHaveBeenCalledWith({
            registerUser: expect.any(Object),
            message: 'User registered successfully',
            token: 'jwt-token',
        });
    });

    it('should register jobseeker successfully', async () => {
        mockSql
            .mockResolvedValueOnce([])
            .mockResolvedValueOnce([
                {
                    user_id: 2,
                    name: 'Alex',
                },
            ]);

        mockHash.mockResolvedValue('hashed');

        mockGetBuffer.mockReturnValue({
            content: 'buffer',
        });

        mockAxiosPost.mockResolvedValue({
            data: {
                url: 'resume-url',
                public_id: 'public-id',
                response: 'success',
            },
        });

        mockSign.mockReturnValue('jwt-token');

        const { registerUser } =
            await import('../services/authServices.js');

        const req: any = {
            body: {
                name: 'Alex',
                email: 'alex@test.com',
                password: '123456',
                phoneNumber: '9999999999',
                role: 'jobseeker',
                bio: 'Developer',
            },
            file: {
                originalname: 'resume.pdf',
                buffer: Buffer.from('test'),
            },
        };

        const json = jest.fn();

        const res: any = { json };

        await registerUser(req, res, jest.fn());

        expect(mockAxiosPost).toHaveBeenCalled();

        expect(json).toHaveBeenCalled();
    });

    it('should login successfully', async () => {
        mockSql.mockResolvedValue([
            {
                user_id: 1,
                name: 'John',
                password: 'hashed',
                skills: ['Node'],
            },
        ]);

        mockCompare.mockResolvedValue(true);

        mockSign.mockReturnValue('jwt-token');

        const { loginUser } =
            await import('../services/authServices.js');

        const req: any = {
            body: {
                email: 'john@test.com',
                password: '123456',
            },
        };

        const json = jest.fn();

        const res: any = { json };

        await loginUser(req, res, jest.fn());

        expect(json).toHaveBeenCalledWith({
            user: expect.any(Object),
            message: 'User logged in successfully',
            token: 'jwt-token',
        });
    });

    it('should fail login with invalid credentials', async () => {
        mockSql.mockResolvedValue([]);

        const { loginUser } =
            await import('../services/authServices.js');

        const req: any = {
            body: {
                email: 'john@test.com',
                password: '123456',
            },
        };

        const json = jest.fn();

        const status = jest.fn(() => ({ json }));

        const res: any = { status };

        await loginUser(req, res, jest.fn());

        expect(status as any).toHaveBeenCalledWith(400);
    });

    it('should send forgot password email', async () => {
        mockSql.mockResolvedValue([
            {
                user_id: 1,
                email: 'john@test.com',
            },
        ]);

        mockSign.mockReturnValue('reset-token');

        mockForgotPasswordTemplate.mockReturnValue('<h1>Reset</h1>');

        const { forgotPassword } =
            await import('../services/authServices.js');

        const req: any = {
            body: {
                email: 'john@test.com',
            },
        };

        const json = jest.fn();

        const res: any = { json };

        await forgotPassword(req, res, jest.fn());

        expect(mockRedisSet).toHaveBeenCalled();

        expect(mockPublishToTopic).toHaveBeenCalled();

        expect(json).toHaveBeenCalledWith({
            message:
                'Password reset link has been sent to your email',
        });
    });

    it('should handle user not found in forgot password', async () => {
        mockSql.mockResolvedValue([]);

        const { forgotPassword } =
            await import('../services/authServices.js');

        const req: any = {
            body: {
                email: 'john@test.com',
            },
        };

        const json = jest.fn();

        const res: any = { json };

        await forgotPassword(req, res, jest.fn());

        expect(json).toHaveBeenCalledWith({
            message:
                'User not found. Password reset link could not be sent',
        });
    });

    it('should reset password successfully', async () => {
        mockVerify.mockReturnValue({
            email: 'john@test.com',
            type: 'reset',
        });

        mockRedisGet.mockResolvedValue('valid-token');

        mockSql.mockResolvedValue([
            {
                user_id: 1,
            },
        ]);

        mockHash.mockResolvedValue('hashed-password');

        const { resetPassword } =
            await import('../services/authServices.js');

        const req: any = {
            params: {
                token: 'valid-token',
            },
            body: {
                password: 'new-password',
            },
        };

        const json = jest.fn();

        const res: any = { json };

        await resetPassword(req, res, jest.fn());

        expect(mockRedisDel).toHaveBeenCalled();

        expect(json).toHaveBeenCalledWith({
            message: 'Password has been reset successfully',
        });
    });

    it('should fail reset password for invalid token', async () => {
        mockVerify.mockImplementation(() => {
            throw new Error('Invalid token');
        });

        const { resetPassword } =
            await import('../services/authServices.js');

        const req: any = {
            params: {
                token: 'invalid-token',
            },
            body: {
                password: 'new-password',
            },
        };

        const json = jest.fn();

        const status = jest.fn(() => ({ json }));

        const res: any = { status };

        await resetPassword(req, res, jest.fn());

        expect(status as any).toHaveBeenCalledWith(400);
    });
});