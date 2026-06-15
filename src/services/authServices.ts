import axios from 'axios';
import getBuffer from '../utils/buffer.js';
import { sql } from '../utils/db.js';
import ErrorHandler from '../utils/errorHandler.js';
import { tryCatch } from '../utils/tryCatch.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { forgotPasswordTemplate } from '../templates/forgotPasswordTemplate.js';
import { publishToTopic } from '../producer.js';
import { redisClient } from '../redis/redis.js';

/**
 * Function to register a new user. It checks if the required fields are provided, if the email is already registered, hashes the password, and saves the user to the database. If the role is 'jobseeker', it also uploads the resume file to an external service and saves the URL and public ID in the database. Finally, it generates a JWT token for the registered user and returns it in the response.
 */
export const registerUser = tryCatch(async(req, res, next) => {
    const { name, email, password, phoneNumber, role, bio } = req.body;
    if(!name || !email || !password || !phoneNumber || !role) {
        throw new ErrorHandler(400, 'Please fill out the details');
    }
    const existingUser = await sql `
        SELECT user_id FROM users WHERE email = ${email}
    `;
    if(existingUser.length > 0) {
        throw new ErrorHandler(400, 'User with this email already exists');
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    let registerUser;
    if(role === 'recruiter'){
        const [user] = await sql `INSERT INTO users 
        (name, email, password, phone_number, role) VALUES (${name}, ${email}, ${hashedPassword}, ${phoneNumber}, ${role}) 
        RETURNING user_id, name, email, phone_number, role`;
        registerUser = user;
    } else if (role === 'jobseeker') {
        const file = req.file;
        if(!file){
            throw new ErrorHandler(400, 'Please upload your resume');
        }
        const fileBuffer = getBuffer(file);
        if(!fileBuffer || !fileBuffer.content) {
            throw new ErrorHandler(500, 'Internal server error');
        }
        let data;
        try {
            const response = await axios.post(`${process.env.UPLOAD_SERVICE_URL}/api/v1/misc/upload`, {
                buffer: fileBuffer.content,
            }, {
                maxBodyLength: Infinity,
                maxContentLength: Infinity,
            });
            data = response.data;
            console.log('UPLOAD RESPONSE =>', data.response);
        } catch (error: any) {
            console.log('UPLOAD ERROR =>');
            console.log(error.response?.data);
            console.log(error.message);
            throw error;
        }
        const [user] = await sql `INSERT INTO users 
                (name, email, password, phone_number, role, bio, resume, resume_public_id) 
                VALUES (${name}, ${email}, ${hashedPassword}, ${phoneNumber}, ${role}, ${bio}, ${data.url}, ${data.public_id}) 
            RETURNING user_id, name, email, phone_number, role, bio, resume, created_at`;
        registerUser = user;
        console.log(registerUser);
    }
    const token = jwt.sign({id: registerUser?.user_id}, process.env.JWT_SECRET_KEY as string, {expiresIn: '7d'});
    res.json({
        registerUser, 
        message: 'User registered successfully', 
        token
    });
});


/**
 * Function to login
 */
export const loginUser = tryCatch(async(req, res, next) => {
    const { email, password } = req.body;
    if(!email || !password) {
        throw new ErrorHandler(400, 'Please fill out the details');
    }
    const user = await sql `
        SELECT u.user_id, u.name, u.email, u.password, u.phone_number, u.role, 
        u.bio, u.resume, u.profile_pic, u.subscription, ARRAY_AGG(s.name) FILTER
        (WHERE s.name IS NOT NULL) as skills FROM users u LEFT JOIN user_skills us 
        ON u.user_id = us.user_id LEFT JOIN skills s ON us.skill_id = s.skill_id
        WHERE u.email = ${email} GROUP BY u.user_id;
    `;
    if(user.length === 0) {
        throw new ErrorHandler(400, 'Invalid credentials');
    }
    const userObject = user[0];
    const matchPassword = await bcrypt.compare(password, userObject?.password);
    if(!matchPassword) {
        throw new ErrorHandler(400, 'Invalid credentials');
    }
    (userObject as any).skills = userObject?.skills || [];
    delete userObject?.password;
    const token = jwt.sign({id: userObject?.user_id}, process.env.JWT_SECRET_KEY as string, {expiresIn: '7d'});
    res.json({
        user: userObject,
        message: 'User logged in successfully',
        token
    });
});


/**
 * Function to forgot password
 */
export const forgotPassword = tryCatch(async(req, res, next) => {
    const { email } = req.body;
    if(!email) {
        throw new ErrorHandler(400, 'Please provide email');
    }
    const users = await sql `SELECT user_id, email FROM users WHERE email = ${email}`;
    if(users.length === 0) {
        return res.json({
            message: 'User not found. Password reset link could not be sent'
        });
    }
    const user = users[0]!;
    const resetToken = jwt.sign({
        email: user.email,
        type: 'reset'
    }, process.env.JWT_SECRET_KEY as string, {expiresIn: '15m'});
    const resetLink = `${process.env.FRONTEND_URL}/reset/${resetToken}`;
    await redisClient.set(`reset_${user.email}`, resetToken, {EX: 15 * 60});
    const message = {
        to: email,
        subject: 'Reset your password: Hireheaven',
        html: forgotPasswordTemplate(resetLink),
    };
    publishToTopic('send-mail', message).catch((error) => {
        console.log('Failed to publish message to topic:', error);
    });
    res.json({
        message: 'Password reset link has been sent to your email'
    });
});

/**
 * Function to reset password
 */
export const resetPassword = tryCatch(async(req, res, next) => {
    const token = req.params.token;
    const { password } = req.body;
    if (typeof token !== 'string') {
        throw new ErrorHandler(400, 'Invalid or missing token');
    }
    let decodedToken: any;
    const resetSecret = process.env.JWT_SECRET_KEY;
    if (typeof resetSecret !== 'string') {
        throw new ErrorHandler(500, 'Reset token secret is not configured');
    }
    try {
        decodedToken = jwt.verify(token, resetSecret);
    } catch (error) {
        throw new ErrorHandler(400, 'Invalid or expired token');
    }
    if (decodedToken.type !== 'reset') {
        throw new ErrorHandler(400, 'Invalid token type');
    }
    const email = decodedToken.email;
    const storedToken = await redisClient.get(`forgot: ${email}`);
    if(!storedToken || storedToken !== token) {
        throw new ErrorHandler(400, 'Invalid or expired token');
    }
    const users = await sql `SELECT user_id FROM users WHERE email = ${email}`;
    if(users.length === 0) {
        throw new ErrorHandler(400, 'User not found');
    }
    const user = users[0]!;
    const hashedPassword = await bcrypt.hash(password, 10);
    await sql `UPDATE users SET password = ${hashedPassword} WHERE user_id = ${user.user_id}`;
    await redisClient.del(`forgot: ${email}`);
    res.json({ message: 'Password has been reset successfully' });
});