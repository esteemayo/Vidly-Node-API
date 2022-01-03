const request = require('supertest');
const mongoose = require('mongoose');

const User = require('../../models/User');
const Movie = require('../../models/Movie');
const Booking = require('../../models/Booking');
const { Customer } = require('../../models/Customer');

let server;

describe('/api/v1/bookings', () => {
  let token;

  beforeEach(() => {
    server = require('../../server');

    token = new User().generateAuthToken();
  });

  afterEach(async () => {
    await server.close();
    await Movie.deleteMany();
    await Booking.deleteMany();
    await Customer.deleteMany();
  });

  describe('GET /', () => {
    const exec = async () => {
      return await request(server)
        .get('/api/v1/bookings')
        .set('Authorization', `Bearer ${token}`);
    };

    it('should return 401 if client is not logged in', async () => {
      token = '';

      const res = await exec();

      expect(res.status).toBe(401);
    });

    it('should return all bookings', async () => {
      const bookings = [
        {
          movie: mongoose.Types.ObjectId(),
          customer: mongoose.Types.ObjectId(),
        },
        {
          movie: mongoose.Types.ObjectId(),
          customer: mongoose.Types.ObjectId(),
        },
      ];

      await Booking.collection.insertMany(bookings);

      const res = await exec();

      expect(res.status).toBe(200);
      expect(res.body.data.docs.length).toBe(2);
    });
  });

  describe('GET /:id', () => {
    let booking, movieId, customerId, id;

    const exec = async () => {
      return await request(server)
        .get(`/api/v1/bookings/${id}`)
        .set('Authorization', `Bearer ${token}`);
    };

    beforeEach(async () => {
      movieId = mongoose.Types.ObjectId();
      customerId = mongoose.Types.ObjectId();

      booking = await Booking.create({
        movie: movieId,
        customer: customerId,
      });

      id = booking._id;
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

    it('should return 404 if no booking was found with the given id', async () => {
      id = mongoose.Types.ObjectId();

      const res = await exec();

      expect(res.status).toBe(404);
    });

    it('should return the booking if valid id is passed', async () => {
      const res = await exec();

      expect(res.status).toBe(200);
      expect(res.body.data.doc).toHaveProperty('_id');
      expect(res.body.data.doc).toHaveProperty('paid', true);
    });
  });

  describe('POST /', () => {
    let movieId, customerId, movie, customer;

    const exec = async () => {
      return request(server)
        .post('/api/v1/bookings')
        .set('Authorization', `Bearer ${token}`)
        .send({ movie: movie._id, customer: customer._id });
    };

    beforeEach(async () => {
      movieId = mongoose.Types.ObjectId();
      customerId = mongoose.Types.ObjectId();

      movie = await Movie.create({
        _id: movieId,
        title: 'movie1',
        genre: mongoose.Types.ObjectId(),
        numberInStock: 10,
        dailyRentalRate: 2,
      });

      customer = await Customer.create({
        _id: customerId,
        name: 'customer1',
        phone: '12345',
      });
    });

    it('should return 401 if client is not logged in', async () => {
      token = '';

      const res = await exec();

      expect(res.status).toBe(401);
    });

    it('should return 500 if movie is not provided', async () => {
      movie = '';

      const res = await exec();

      expect(res.status).toBe(500);
    });

    it('should return 500 if customer is not provided', async () => {
      customer = '';

      const res = await exec();

      expect(res.status).toBe(500);
    });

    it('should save the booking if input is valid', async () => {
      await exec();

      const bookingInDB = await Booking.find({ movie: movieId });

      expect(bookingInDB).not.toBeNull();
    });

    it('should return the booking if input is valid', async () => {
      const res = await exec();

      expect(res.status).toBe(201);
      expect(res.body.data.doc).toHaveProperty('_id');
      expect(res.body.data.doc).toHaveProperty(
        'movie',
        movie._id.toHexString()
      );
      expect(res.body.data.doc).toHaveProperty(
        'customer',
        customer._id.toHexString()
      );
    });
  });

  describe('PATCH /:id', () => {
    let booking, newMovieId, newCustomerId, id;

    const exec = async () => {
      return await request(server)
        .patch(`/api/v1/bookings/${id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ movie: newMovieId, customer: newCustomerId });
    };

    beforeEach(async () => {
      booking = await Booking.create({
        movie: mongoose.Types.ObjectId(),
        customer: mongoose.Types.ObjectId(),
      });

      newMovieId = mongoose.Types.ObjectId();
      newCustomerId = mongoose.Types.ObjectId();

      id = booking._id;
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

    it('should return 404 if no booking was found with the given id', async () => {
      id = mongoose.Types.ObjectId();

      const res = await exec();

      expect(res.status).toBe(404);
    });

    it('should return 500 if movie is not provided', async () => {
      newMovieId = '';

      const res = await exec();

      expect(res.status).toBe(500);
    });

    it('should return 500 if customer is not provided', async () => {
      newCustomerId = '';

      const res = await exec();

      expect(res.status).toBe(500);
    });

    it('should update the booking if input is valid', async () => {
      await exec();

      const updatedBooking = await Booking.findById(id);

      expect(updatedBooking).toBeDefined();
    });

    it('should return the updated booking if input is valid', async () => {
      const res = await exec();

      expect(res.status).toBe(200);
      expect(res.body.data.doc).toHaveProperty('_id');
      expect(res.body.data.doc).toHaveProperty('paid', true);
    });
  });

  describe('DELETE /:id', () => {
    let booking, movieId, customerId, id;

    const exec = async () => {
      return await request(server)
        .delete(`/api/v1/bookings/${id}`)
        .set('Authorization', `Bearer ${token}`)
        .send();
    };

    beforeEach(async () => {
      movieId = mongoose.Types.ObjectId();
      customerId = mongoose.Types.ObjectId();

      booking = await Booking.create({
        movie: movieId,
        customer: customerId,
      });

      id = booking._id;
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

    it('should return 404 if no booking was found with the given id', async () => {
      id = mongoose.Types.ObjectId();

      const res = await exec();

      expect(res.status).toBe(404);
    });

    it('should delete the booking if valid id is passed', async () => {
      await exec();

      const bookingInDB = await Booking.findById(id);

      expect(bookingInDB).toBeNull();
    });

    it('should return 204 if the booking was successfully deleted', async () => {
      const res = await exec();

      expect(res.status).toBe(204);
    });
  });
});
