const request = require('supertest');
const mongoose = require('mongoose');

const User = require('../../models/User');
const Movie = require('../../models/Movie');

describe('/api/v1/movies', () => {
  let server, token, movie, id;

  beforeEach(async () => {
    server = require('../../server');

    movie = await Movie.create({
      title: 'Movies',
      genre: mongoose.Types.ObjectId(),
      numberInStock: 10,
      dailyRentalRate: 2,
    });

    token = new User().generateAuthToken();
    id = movie._id;
  });

  afterEach(async () => {
    await server.close();
    await Movie.deleteMany();
  });

  describe('GET /', () => {
    const exec = async () => {
      return request(server)
        .get('/api/v1/movies')
        .set('Authorization', `Bearer ${token}`);
    };

    it('should return 401 if client is not logged', async () => {
      token = '';

      const res = await exec();

      expect(res.status).toBe(401);
    });

    it('should return all the movies', async () => {
      const movies = [
        {
          title: 'Movie1',
          genre: mongoose.Types.ObjectId(),
          numberInStock: 7,
          dailyRentalRate: 2,
        },
        {
          title: 'Movie2',
          genre: mongoose.Types.ObjectId(),
          numberInStock: 5,
          dailyRentalRate: 2,
        },
      ];

      await Movie.collection.insertMany(movies);

      const res = await exec();

      expect(res.status).toBe(200);
      expect(res.body.data.docs.length).toBe(3);
      expect(res.body.data.docs.some((m) => m.title === 'Movies')).toBeTruthy();
      expect(res.body.data.docs.some((m) => m.title === 'Movie1')).toBeTruthy();
      expect(res.body.data.docs.some((m) => m.title === 'Movie2')).toBeTruthy();
      expect(
        res.body.data.docs.some((m) => m.numberInStock === 10)
      ).toBeTruthy();
      expect(
        res.body.data.docs.some((m) => m.numberInStock === 7)
      ).toBeTruthy();
      expect(
        res.body.data.docs.some((m) => m.numberInStock === 5)
      ).toBeTruthy();
      expect(
        res.body.data.docs.some((m) => m.dailyRentalRate === 2)
      ).toBeTruthy();
      expect(
        res.body.data.docs.some((m) => m.ratingsAverage === 4.5)
      ).toBeTruthy();
      expect(
        res.body.data.docs.some((m) => m.ratingsQuantity === 0)
      ).toBeTruthy();
    });
  });

  describe('GET /:id', () => {
    const exec = async () => {
      return await request(server)
        .get(`/api/v1/movies/${id}`)
        .set('Authorization', `Bearer ${token}`);
    };

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

    it('should return 404 if no movie was found with the given id', async () => {
      id = mongoose.Types.ObjectId();

      const res = await exec();

      expect(res.status).toBe(404);
    });

    it('should return the movie if valid id is passed', async () => {
      const res = await exec();

      expect(res.status).toBe(200);
      expect(res.body.data.doc).toHaveProperty('_id');
      expect(res.body.data.doc).toHaveProperty('title', movie.title);
      expect(res.body.data.doc).toHaveProperty(
        'numberInStock',
        movie.numberInStock
      );
      expect(res.body.data.doc).toHaveProperty(
        'dailyRentalRate',
        movie.dailyRentalRate
      );
    });
  });

  describe('POST /', () => {
    let title, genre, numberInStock, dailyRentalRate;

    const exec = async () => {
      return await request(server)
        .post('/api/v1/movies')
        .set('Authorization', `Bearer ${token}`)
        .send({ title, genre, numberInStock, dailyRentalRate });
    };

    beforeEach(() => {
      title = 'Movies';
      genre = mongoose.Types.ObjectId();
      numberInStock = 10;
      dailyRentalRate = 2;
    });

    it('should return 401 if client is not logged in', async () => {
      token = '';

      const res = await exec();

      expect(res.status).toBe(401);
    });

    it('should return 500 if title is empty', async () => {
      title = '';

      const res = await exec();

      expect(res.status).toBe(500);
    });

    it('should return 500 if title is less than 5 characters', async () => {
      title = '1234';

      const res = await exec();

      expect(res.status).toBe(500);
    });

    it('should return 500 if title is more than 255 characters', async () => {
      title = new Array(259).join('a');

      const res = await exec();

      expect(res.status).toBe(500);
    });

    it('should return 500 if genre is not defined', async () => {
      genre = '';

      const res = await exec();

      expect(res.status).toBe(500);
    });

    it('should return 500 if numberInStock is empty', async () => {
      numberInStock = '';

      const res = await exec();

      expect(res.status).toBe(500);
    });

    it('should return 500 if numberInStock is less than 0', async () => {
      numberInStock = -1;

      const res = await exec();

      expect(res.status).toBe(500);
    });

    it('should return 500 if numberInStock is greater than 255', async () => {
      numberInStock = 257;

      const res = await exec();

      expect(res.status).toBe(500);
    });

    it('should return 500 if dailyRentalRate is empty', async () => {
      dailyRentalRate = '';

      const res = await exec();

      expect(res.status).toBe(500);
    });

    it('should return 500 if dailyRentalRate is less than 0', async () => {
      dailyRentalRate = -1;

      const res = await exec();

      expect(res.status).toBe(500);
    });

    it('should return 500 if dailyRentalRate is greater than 255', async () => {
      dailyRentalRate = 257;

      const res = await exec();

      expect(res.status).toBe(500);
    });

    it('should save the movie if input is valid', async () => {
      await exec();

      const movieInDb = await Movie.find({ title: 'Movies' });

      expect(movieInDb).not.toBeNull();
    });

    it('should return the movie if input is valid', async () => {
      const res = await exec();

      expect(res.status).toBe(201);
      expect(res.body.data.doc).toHaveProperty('_id');
      expect(res.body.data.doc).toHaveProperty('title', 'Movies');
      expect(res.body.data.doc).toHaveProperty('numberInStock', 10);
      expect(res.body.data.doc).toHaveProperty('dailyRentalRate', 2);
      expect(res.body.data.doc).toHaveProperty('ratingsAverage', 4.5);
      expect(res.body.data.doc).toHaveProperty('ratingsQuantity', 0);
      expect(res.body.data.doc).toHaveProperty('slug', 'movies');
    });
  });

  describe('PATCH /:id', () => {
    let newTitle,
      newGenre,
      newNumberInStock,
      newDailyRentalRate,
      newRatingsAverage,
      newRatingsQuantity;

    const exec = async () => {
      return await request(server)
        .patch(`/api/v1/movies/${id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: newTitle,
          genre: newGenre,
          numberInStock: newNumberInStock,
          dailyRentalRate: newDailyRentalRate,
          ratingsAverage: newRatingsAverage,
          ratingsQuantity: newRatingsQuantity,
        });
    };

    beforeEach(() => {
      newTitle = 'New Movie';
      newGenre = mongoose.Types.ObjectId();
      newNumberInStock = 11;
      newDailyRentalRate = 3;
      newRatingsAverage = 4.7;
      newRatingsQuantity = 5;
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

    it('should return 404 if no movie was found with the given id', async () => {
      id = mongoose.Types.ObjectId();

      const res = await exec();

      expect(res.status).toBe(404);
    });

    it('should return 500 if title is empty', async () => {
      newTitle = '';

      const res = await exec();

      expect(res.status).toBe(500);
    });

    it('should return 500 if title is less than 5 characters', async () => {
      newTitle = '1234';

      const res = await exec();

      expect(res.status).toBe(500);
    });

    it('should return 500 if title is more than 255 characters', async () => {
      newTitle = new Array(259).join('a');

      const res = await exec();

      expect(res.status).toBe(500);
    });

    it('should return 500 if genre is not defined', async () => {
      newGenre = '';

      const res = await exec();

      expect(res.status).toBe(500);
    });

    it('should return 500 if numberInStock is empty', async () => {
      newNumberInStock = '';

      const res = await exec();

      expect(res.status).toBe(500);
    });

    it('should return 500 if numberInStock is less than 0', async () => {
      newNumberInStock = -1;

      const res = await exec();

      expect(res.status).toBe(500);
    });

    it('should return 500 if numberInStock is greater than 255', async () => {
      newNumberInStock = 257;

      const res = await exec();

      expect(res.status).toBe(500);
    });

    it('should return 500 if dailyRentalRate is empty', async () => {
      newDailyRentalRate = '';

      const res = await exec();

      expect(res.status).toBe(500);
    });

    it('should return 500 if dailyRentalRate is less than 0', async () => {
      newDailyRentalRate = -1;

      const res = await exec();

      expect(res.status).toBe(500);
    });

    it('should return 500 if dailyRentalRate is greater than 255', async () => {
      newDailyRentalRate = 257;

      const res = await exec();

      expect(res.status).toBe(500);
    });

    it('should update the movie if the id and inputs are valid', async () => {
      await exec();

      const movieInDb = await Movie.findById(id);

      expect(movieInDb.title).toBe(newTitle);
      expect(movieInDb.numberInStock).toBe(newNumberInStock);
      expect(movieInDb.dailyRentalRate).toBe(newDailyRentalRate);
      expect(movieInDb.ratingsAverage).toBe(newRatingsAverage);
      expect(movieInDb.ratingsQuantity).toBe(newRatingsQuantity);
    });

    it('should return the updated movie', async () => {
      const res = await exec();

      expect(res.status).toBe(200);
      expect(res.body.data.doc).toHaveProperty('_id');
      expect(res.body.data.doc).toHaveProperty('title', newTitle);
      expect(res.body.data.doc).toHaveProperty(
        'numberInStock',
        newNumberInStock
      );
      expect(res.body.data.doc).toHaveProperty(
        'dailyRentalRate',
        newDailyRentalRate
      );
      expect(res.body.data.doc).toHaveProperty(
        'ratingsAverage',
        newRatingsAverage
      );
      expect(res.body.data.doc).toHaveProperty(
        'ratingsQuantity',
        newRatingsQuantity
      );
    });
  });

  describe('DELETE /:id', () => {
    const exec = async () => {
      return await request(server)
        .delete(`/api/v1/movies/${id}`)
        .set('Authorization', `Bearer ${token}`)
        .send();
    };

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

    it('should return 404 if no movie was found with the given id', async () => {
      id = mongoose.Types.ObjectId();

      const res = await exec();

      expect(res.status).toBe(404);
    });

    it('should delete the movie if valid id is passed', async () => {
      await exec();

      const movieInDb = await Movie.findById(id);

      expect(movieInDb).toBeNull();
    });

    it('should return 204 if the movie was successfully deleted', async () => {
      const res = await exec();

      expect(res.status).toBe(204);
    });
  });
});
