// auth.routes.test.ts

import { jest, describe, beforeEach, expect, it } from '@jest/globals';

const mockPost = jest.fn<any>();

const mockRouter = {
    post: mockPost,
};

const mockExpress = {
    Router: jest.fn(() => mockRouter),
};

const mockRegisterUser = jest.fn();
const mockLoginUser = jest.fn();
const mockForgotPassword = jest.fn();
const mockResetPassword = jest.fn();
const mockUploadFile = jest.fn();

jest.unstable_mockModule('express', () => ({
    default: mockExpress,
}));

jest.unstable_mockModule('../../src/controllers/authController.js', () => ({
    registerUser: mockRegisterUser,
    loginUser: mockLoginUser,
    forgotPassword: mockForgotPassword,
    resetPassword: mockResetPassword,
}));

jest.unstable_mockModule('../../src/middleware/multer.js', () => ({
    default: mockUploadFile,
}));

describe('auth routes', () => {

    beforeEach(() => {
        jest.clearAllMocks();
        jest.resetModules();
    });

    it('should create express router', async () => {
        await import('../../src/routes/authRoutes.js');

        expect(mockExpress.Router).toHaveBeenCalled();
    });

    it('should register /register route', async () => {
        await import('../../src/routes/authRoutes.js');

        expect(mockPost as any).toHaveBeenCalledWith(
            '/register',
            mockUploadFile,
            mockRegisterUser
        );
    });

    it('should register /login route', async () => {
        await import('../../src/routes/authRoutes.js');

        expect(mockPost as any).toHaveBeenCalledWith(
            '/login',
            mockLoginUser
        );
    });

    it('should register /forgot-password route', async () => {
        await import('../../src/routes/authRoutes.js');

        expect(mockPost as any).toHaveBeenCalledWith(
            '/forgot-password',
            mockForgotPassword
        );
    });

    it('should register /reset-password/:token route', async () => {
        await import('../../src/routes/authRoutes.js');

        expect(mockPost as any).toHaveBeenCalledWith(
            '/reset-password/:token',
            mockResetPassword
        );
    });

    it('should export router instance', async () => {
        const module =
            await import('../../src/routes/authRoutes.js');

        expect(module.default).toBe(mockRouter);
    });
});