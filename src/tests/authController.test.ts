// auth.controller.test.ts

import { jest, describe, beforeEach, expect, it } from '@jest/globals';

const mockRegisterUser = jest.fn<any>();
const mockLoginUser = jest.fn<any>();
const mockForgotPassword = jest.fn<any>();
const mockResetPassword = jest.fn<any>();

jest.unstable_mockModule('../../src/services/authServices.js', () => ({
    registerUser: mockRegisterUser,
    loginUser: mockLoginUser,
    forgotPassword: mockForgotPassword,
    resetPassword: mockResetPassword,
}));

describe('auth controller', () => {

    beforeEach(() => {
        jest.clearAllMocks();
        jest.resetModules();
    });

    it('should call registerUser service', async () => {
        mockRegisterUser.mockResolvedValue(undefined);

        const { registerUser } =
            await import('../../src/controllers/authController.js');

        const req = {};
        const res = {};
        const next = jest.fn();

        await registerUser(req, res, next);

        expect(mockRegisterUser).toHaveBeenCalledWith(
            req,
            res,
            next
        );
    });

    it('should call loginUser service', async () => {
        mockLoginUser.mockResolvedValue(undefined);

        const { loginUser } =
            await import('../../src/controllers/authController.js');

        const req = {};
        const res = {};
        const next = jest.fn();

        await loginUser(req, res, next);

        expect(mockLoginUser).toHaveBeenCalledWith(
            req,
            res,
            next
        );
    });

    it('should call forgotPassword service', async () => {
        mockForgotPassword.mockResolvedValue(undefined);

        const { forgotPassword } =
            await import('../../src/controllers/authController.js');

        const req = {};
        const res = {};
        const next = jest.fn();

        await forgotPassword(req, res, next);

        expect(mockForgotPassword).toHaveBeenCalledWith(
            req,
            res,
            next
        );
    });

    it('should call resetPassword service', async () => {
        mockResetPassword.mockResolvedValue(undefined);

        const { resetPassword } =
            await import('../../src/controllers/authController.js');

        const req = {};
        const res = {};
        const next = jest.fn();

        await resetPassword(req, res, next);

        expect(mockResetPassword).toHaveBeenCalledWith(
            req,
            res,
            next
        );
    });

    it('should await registerUser service', async () => {
        mockRegisterUser.mockResolvedValue('done');

        const { registerUser } =
            await import('../../src/controllers/authController.js');

        await expect(
            registerUser({}, {}, jest.fn())
        ).resolves.toBeUndefined();
    });

    it('should await loginUser service', async () => {
        mockLoginUser.mockResolvedValue('done');

        const { loginUser } =
            await import('../../src/controllers/authController.js');

        await expect(
            loginUser({}, {}, jest.fn())
        ).resolves.toBeUndefined();
    });

    it('should await forgotPassword service', async () => {
        mockForgotPassword.mockResolvedValue('done');

        const { forgotPassword } =
            await import('../../src/controllers/authController.js');

        await expect(
            forgotPassword({}, {}, jest.fn())
        ).resolves.toBeUndefined();
    });

    it('should await resetPassword service', async () => {
        mockResetPassword.mockResolvedValue('done');

        const { resetPassword } =
            await import('../../src/controllers/authController.js');

        await expect(
            resetPassword({}, {}, jest.fn())
        ).resolves.toBeUndefined();
    });
});