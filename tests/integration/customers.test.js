const request = require('supertest');
const mongoose = require('mongoose');

const User = require('../../models/User');
const { Customer } = require('../../models/Customer');

let server;

describe('/api/v1/customers', () => {
  beforeEach(async () => {
    server = require('../../server');
  });

  afterEach(async () => {
    await server.close();
    await Customer.deleteMany();
  });

  describe('GET /', () => {
    let token;

    const exec = async () => {
      return await request(server)
        .get('/api/v1/customers')
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

    it('should return all customers', async () => {
      const customers = [
        { name: 'Customer1', phone: '12345', isGold: false },
        { name: 'Customer2', phone: '12345', isGold: true },
      ];

      await Customer.collection.insertMany(customers);

      const res = await exec();

      expect(res.status).toBe(200);
      expect(res.body.data.docs.length).toBe(2);
      expect(
        res.body.data.docs.some((c) => c.name === 'Customer1')
      ).toBeTruthy();
      expect(
        res.body.data.docs.some((c) => c.name === 'Customer2')
      ).toBeTruthy();
      expect(res.body.data.docs.some((c) => c.phone === '12345')).toBeTruthy();
      expect(res.body.data.docs.some((c) => c.phone === '12345')).toBeTruthy();
      expect(res.body.data.docs.some((c) => c.isGold === false)).toBeTruthy();
      expect(res.body.data.docs.some((c) => c.isGold === true)).toBeTruthy();
    });
  });

  describe('GET /:id', () => {
    let token, customer, id;

    const exec = async () => {
      return await request(server)
        .get(`/api/v1/customers/${id}`)
        .set('Authorization', `Bearer ${token}`);
    };

    beforeEach(async () => {
      customer = await Customer.create({
        name: 'Customer1',
        phone: '12345',
      });

      token = new User().generateAuthToken();
      id = customer._id;
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

    it('should return 404 if no customer was found with the given ID', async () => {
      id = mongoose.Types.ObjectId();

      const res = await exec();

      expect(res.status).toBe(404);
    });

    it('should return the customer if input is valid', async () => {
      const res = await exec();

      expect(res.status).toBe(200);
      expect(res.body.data.doc).toHaveProperty('_id');
      expect(res.body.data.doc).toHaveProperty('name', customer.name);
      expect(res.body.data.doc).toHaveProperty('isGold', customer.isGold);
    });
  });

  describe('POST /', () => {
    let token, name, phone;

    const exec = async () => {
      return await request(server)
        .post('/api/v1/customers')
        .set('Authorization', `Bearer ${token}`)
        .send({ name, phone });
    };

    beforeEach(() => {
      token = new User().generateAuthToken();

      name = 'Customer1';
      phone = '12345';
    });

    it('should return 401 if client is not logged in', async () => {
      token = '';

      const res = await exec();

      expect(res.status).toBe(401);
    });

    it('should return 400 if customer name is less than 3 characters', async () => {
      name = '12';

      const res = await exec();

      expect(res.status).toBe(400);
    });

    it('should return 400 if customer name is more than 255 characters', async () => {
      name = new Array(259).join('a');

      const res = await exec();

      expect(res.status).toBe(400);
    });

    it('should return 400 if customer phone is less than 5 characters', async () => {
      phone = '1234';

      const res = await exec();

      expect(res.status).toBe(400);
    });

    it('should return 400 if customer phone is more than 255 characters', async () => {
      phone = new Array(259).join('a');

      const res = await exec();

      expect(res.status).toBe(400);
    });

    it('should save the customer if input is valid', async () => {
      await exec();

      const customerInDb = await Customer.find({ name: 'Customer1' });

      expect(customerInDb).not.toBeNull();
    });

    it('should return the customer if it is valid', async () => {
      const res = await exec();

      expect(res.status).toBe(201);
      expect(res.body.data.doc).toHaveProperty('_id');
      expect(res.body.data.doc).toHaveProperty('name', 'Customer1');
      expect(res.body.data.doc).toHaveProperty('phone', '12345');
    });
  });

  describe('PATCH /:id', () => {
    let token, customer, newName, newPhone, newIsGold, id;

    const exec = async () => {
      return await request(server)
        .patch(`/api/v1/customers/${id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: newName, phone: newPhone, isGold: newIsGold });
    };

    beforeEach(async () => {
      customer = await Customer.create({
        name: 'Customer1',
        phone: '12345',
        isGold: false,
      });

      token = new User().generateAuthToken();
      newName = 'New Customer';
      newPhone = '1234567';
      newIsGold = true;
      id = customer._id;
    });

    it('should return 400 if client is not logged in', async () => {
      token = '';

      const res = await exec();

      expect(res.status).toBe(401);
    });

    it('should return 404 if invalid id is passed', async () => {
      id = 1;

      const res = await exec();

      expect(res.status).toBe(404);
    });

    it('should return 404 if no customer with the given ID was found', async () => {
      id = mongoose.Types.ObjectId();

      const res = await exec();

      expect(res.status).toBe(404);
    });

    it('should return 400 if customer name is less than 3 characters', async () => {
      newName = '12';

      const res = await exec();

      expect(res.status).toBe(400);
    });

    it('should return 400 if customer name is more than 255 characters', async () => {
      newName = new Array(259).join('a');

      const res = await exec();

      expect(res.status).toBe(400);
    });

    it('should return 400 if customer phone is less than 5 characters', async () => {
      newPhone = '1234';

      const res = await exec();

      expect(res.status).toBe(400);
    });

    it('should return 400 if customer phone is more than 255 characters', async () => {
      newPhone = new Array(259).join('a');

      const res = await exec();

      expect(res.status).toBe(400);
    });

    it('should update the customer if input is valid', async () => {
      await exec();

      const customerInDb = await Customer.findById(id);

      expect(customerInDb).toBeDefined();
      expect(customerInDb.name).toBe(newName);
      expect(customerInDb.phone).toBe(newPhone);
      expect(customerInDb.isGold).toBe(newIsGold);
    });

    it('should return the updated customer', async () => {
      const res = await exec();

      expect(res.status).toBe(200);
      expect(res.body.data.doc).toHaveProperty('_id');
      expect(res.body.data.doc).toHaveProperty('name', newName);
      expect(res.body.data.doc).toHaveProperty('phone', newPhone);
      expect(res.body.data.doc).toHaveProperty('isGold', newIsGold);
    });
  });

  describe('DELETE /:id', () => {
    let token, customer, id;

    const exec = async () => {
      return await request(server)
        .delete(`/api/v1/customers/${id}`)
        .set('Authorization', `Bearer ${token}`)
        .send();
    };

    beforeEach(async () => {
      customer = await Customer.create({
        name: 'Customer1',
        phone: '12345',
      });

      token = new User().generateAuthToken();
      id = customer._id;
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

    it('should return 404 if no customer with the given ID was found', async () => {
      id = mongoose.Types.ObjectId();

      const res = await exec();

      expect(res.status).toBe(404);
    });

    it('should delete customer if input is valid', async () => {
      await exec();

      const customerInDb = await Customer.findById(id);

      expect(customerInDb).toBeNull();
    });

    it('should return 204 if customer was successfully deleted', async () => {
      const res = await exec();

      expect(res.status).toBe(204);
    });
  });
});
