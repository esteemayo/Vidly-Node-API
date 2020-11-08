const config = require('config');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../../../models/User');

dotenv.config({ path: './config.env' });

describe('The User Model', () => {
    beforeEach(async () => {
        await mongoose.connect(config.get('db'), { 
            useNewUrlParser: true,
            useCreateIndex: true,
            useUnifiedTopology: true
        });
    });

    afterEach(async () => {
        await User.deleteMany();
        await mongoose.connection.close();
    });

    describe('user.generateAuthToken', () => {
        it('should return a valid JWT', () => {
            const payload = {
                _id: new mongoose.Types.ObjectId().toHexString(),
                role: 'admin'
            }
    
            const user = new User(payload);
            const token = user.generateAuthToken();
    
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
            expect(decoded).toMatchObject(payload);
        });
    
        it('should hash the user password before saving to the database', async () => {
            const user = {
                name: 'Test User',
                email: 'test@example.com',
                username: 'test_user',
                phone: 12345,
                password: 'pass1234',
                passwordConfirm: 'pass1234'
            }
    
            const createdUser = await User.create(user);
    
            expect(await bcrypt.compare(user.password, createdUser.password)).toBe(true);
        });
    });
});