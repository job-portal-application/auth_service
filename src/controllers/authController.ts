import { registerUser as registeredUser, loginUser as loggedInUser, forgotPassword as forgot, resetPassword as reset } from '../services/authServices.js';

export const registerUser = async(req: any, res: any, next: any) => {
    await registeredUser(req, res, next);
};

export const loginUser = async(req: any, res: any, next: any) => {
    await loggedInUser(req, res, next);
}

export const forgotPassword = async(req: any, res: any, next: any) => {
    await forgot(req, res, next);
}

export const resetPassword = async(req: any, res: any, next: any) => {
    await reset(req, res, next);
}