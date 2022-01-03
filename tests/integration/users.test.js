const request = require('supertest');
const mongoose = require('mongoose');

const User = require('../../models/User');

let server;

describe('/api/v1/users', () => {
  beforeEach(() => {
    server = require('../../server');
  });

  afterEach(async () => {
    await server.close();
    await User.deleteMany();
  });

  describe('Login a user', () => {
    let user, email, password;

    const exec = async () => {
      return await request(server)
        .post('/api/v1/users/login')
        .send({ email, password });
    };

    beforeEach(async () => {
      user = await User.create({
        name: 'John Doe',
        email: 'jdoe@example.com',
        username: 'jdoe',
        password: 'pass1234',
        passwordConfirm: 'pass1234',
        phone: 3456789,
      });

      email = 'jdoe@example.com';
      password = 'pass1234';
    });

    it('should return 400 if email is not provided', async () => {
      email = '';

      const res = await exec();

      expect(res.status).toBe(400);
    });

    it('should return 400 if password is not provided', async () => {
      password = '';

      const res = await exec();

      expect(res.status).toBe(400);
    });

    it('should return 400 if user does not exist', async () => {
      email = 'test@example.com';

      const res = await exec();

      const userInDb = await User.findOne({ email: 'test@example.com' });

      expect(res.status).toBe(400);
      expect(userInDb).toBeNull();
    });

    it('should return 400 if invalid password is passed', async () => {
      password = 'test1234';

      const res = await exec();

      expect(res.status).toBe(400);
    });

    it('should log in the user if request is valid', async () => {
      await exec();

      const userInDb = await User.findById(user._id);

      expect(userInDb).toBeDefined();
    });

    it('should return token if request is valid', async () => {
      const res = await exec();

      expect(res.body.token).toBeDefined();
    });

    it('should return the logged in user if request is valid', async () => {
      const res = await exec();

      expect(res.status).toBe(200);
      expect(res.body.data.user).toHaveProperty('_id', user._id.toHexString());
      expect(res.body.data.user).toHaveProperty('name', user.name);
      expect(res.body.data.user).toHaveProperty('email', user.email);
      expect(res.body.data.user).toHaveProperty('username', user.username);
      expect(res.body.data.user).toHaveProperty('phone', user.phone);
    });
  });

  describe('GET /', () => {
    let token;

    const exec = async () => {
      return await request(server)
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${token}`);
    };

    beforeEach(() => {
      token = new User().generateAuthToken();
    });

    it('should return 401 if client is not logged in', async () => {
      token = '';

      const res = await exec();

      expect(res.status).toBe(401);
    });

    it('should return all users in the collection', async () => {
      const users = [
        {
          name: 'John Doe',
          email: 'jdoe@example.com',
          username: 'jdoe',
          password: 'pass1234',
          passwordConfirm: 'pass1234',
          phone: 3456789,
        },
        {
          name: 'Mary Doe',
          email: 'mdoe@example.com',
          username: 'mdoe',
          password: 'pass1234',
          passwordConfirm: 'pass1234',
          phone: 456789256,
        },
      ];

      await User.collection.insertMany(users);

      const res = await exec();

      expect(res.status).toBe(200);
      expect(res.body.data.docs.length).toBe(2);
      expect(
        res.body.data.docs.some((user) => user.name === 'John Doe')
      ).toBeTruthy();
      expect(
        res.body.data.docs.some((user) => user.name === 'Mary Doe')
      ).toBeTruthy();
      expect(
        res.body.data.docs.some((user) => user.email === 'jdoe@example.com')
      ).toBeTruthy();
      expect(
        res.body.data.docs.some((user) => user.email === 'mdoe@example.com')
      ).toBeTruthy();
      expect(
        res.body.data.docs.some((user) => user.username === 'jdoe')
      ).toBeTruthy();
      expect(
        res.body.data.docs.some((user) => user.username === 'mdoe')
      ).toBeTruthy();
      expect(
        res.body.data.docs.some((user) => user.phone === 3456789)
      ).toBeTruthy();
      expect(
        res.body.data.docs.some((user) => user.phone === 456789256)
      ).toBeTruthy();
    });
  });

  describe('GET /:id', () => {
    let token, user, id;

    const exec = async () => {
      return await request(server)
        .get(`/api/v1/users/${id}`)
        .set('Authorization', `Bearer ${token}`);
    };

    beforeEach(async () => {
      user = await User.create({
        name: 'John Doe',
        email: 'jdoe@example.com',
        username: 'jdoe',
        password: 'pass1234',
        passwordConfirm: 'pass1234',
        phone: 3456789,
      });

      token = user.generateAuthToken();
      id = user._id;
    });

    it('should return 401 if client is not logged in', async () => {
      token = '';

      const res = await exec();

      expect(res.status).toBe(401);
    });

    it('should return 404 if invalid id is passed', async () => {
      id = 1;

      const res = await exec();

      expect(res.status).toBe(404);
    });

    it('should return 404 if no user was found with the given id', async () => {
      id = mongoose.Types.ObjectId();

      const res = await exec();

      expect(res.status).toBe(404);
    });

    it('should return the user if valid id is passed', async () => {
      const res = await exec();

      expect(res.status).toBe(200);
      expect(res.body.data.doc).toHaveProperty('_id');
      expect(res.body.data.doc).toHaveProperty('name', user.name);
      expect(res.body.data.doc).toHaveProperty('email', user.email);
      expect(res.body.data.doc).toHaveProperty('username', user.username);
      expect(res.body.data.doc).toHaveProperty('phone', user.phone);
    });
  });

  describe('POST /', () => {
    let token;

    const exec = async () => {
      return await request(server)
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${token}`)
        .send();
    };

    beforeEach(() => {
      token = new User().generateAuthToken();
    });

    it('should return 401 if client is not logged in', async () => {
      token = '';

      const res = await exec();

      expect(res.status).toBe(401);
    });

    it('should return 500 if user tries to signup with this route', async () => {
      const res = await exec();

      expect(res.status).toBe(500);
    });
  });

  describe('PATCH /:id', () => {
    let token,
      user,
      newName,
      newEmail,
      newPassword,
      newPasswordConfirm,
      newPhone,
      id;

    const exec = async () => {
      return await request(server)
        .patch(`/api/v1/users/${id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ newName, newEmail, newPassword, newPasswordConfirm, newPhone });
    };

    beforeEach(async () => {
      user = await User.create({
        _id: mongoose.Types.ObjectId(),
        name: 'John Doe',
        email: 'jdoe@example.com',
        username: 'jdoe',
        password: 'pass1234',
        passwordConfirm: 'pass1234',
        phone: 3456789,
      });

      token = user.generateAuthToken();
      newName = 'New User';
      newEmail = 'newuser@example.com';
      newPassword = 'pass1234';
      newPasswordConfirm = 'pass1234';
      newPhone = 456789009;
      id = user._id;
    });

    it('should return 401 if client is not logged in', async () => {
      token = '';

      const res = await exec();

      expect(res.status).toBe(401);
    });

    it('should return 404 if invalid id is passed', async () => {
      id = 1;

      const res = await exec();

      expect(res.status).toBe(404);
    });

    it('should return 404 if no user was found with the given id', async () => {
      id = mongoose.Types.ObjectId();

      const res = await exec();

      expect(res.status).toBe(404);
    });

    it('should return 200 if user was updated successfully', async () => {
      const res = await exec();

      expect(res.status).toBe(200);
    });
  });

  describe('DELETE /:id', () => {
    let token, user, id;

    const exec = async () => {
      return await request(server)
        .delete(`/api/v1/users/${id}`)
        .set('Authorization', `Bearer ${token}`)
        .send();
    };

    beforeEach(async () => {
      user = await User.create({
        name: 'John Doe',
        email: 'jdoe@example.com',
        username: 'jdoe',
        password: 'pass1234',
        passwordConfirm: 'pass1234',
        phone: 3456789,
      });

      token = user.generateAuthToken();
      id = user._id;
    });

    it('should return 401 if client is not logged in', async () => {
      token = '';

      const res = await exec();

      expect(res.status).toBe(401);
    });

    it('should return 404 if invalid id is passed', async () => {
      id = 1;

      const res = await exec();

      expect(res.status).toBe(404);
    });

    it('should return 404 if no user was found with the given id', async () => {
      id = mongoose.Types.ObjectId();

      const res = await exec();

      expect(res.status).toBe(404);
    });

    it('should delete the user if valid id is passed', async () => {
      await exec();

      const userInDb = await User.findById(id);

      expect(userInDb).toBeNull();
    });

    it('should return 204 if user was deleted successfully', async () => {
      const res = await exec();

      expect(res.status).toBe(204);
    });
  });
});
