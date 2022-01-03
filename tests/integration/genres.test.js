const request = require('supertest');
const mongoose = require('mongoose');

const User = require('../../models/User');
const { Genre } = require('../../models/Genre');

let server;

describe('/api/v1/genres', () => {
  let token;

  beforeEach(() => {
    server = require('../../server');

    token = new User().generateAuthToken();
  });

  afterEach(async () => {
    await server.close();
    await Genre.deleteMany();
  });

  describe('GET /', () => {
    const exec = async () => {
      return await request(server)
        .get('/api/v1/genres')
        .set('Authorization', `Bearer ${token}`);
    };

    it('should return 401 if client is not logged in', async () => {
      token = '';

      const res = await exec();

      expect(res.status).toBe(401);
    });

    it('should return all genres', async () => {
      const genres = [
        { name: 'genre1', slug: 'genre1' },
        { name: 'genre2', slug: 'genre2' },
      ];

      await Genre.collection.insertMany(genres);

      const res = await exec();

      expect(res.status).toBe(200);
      expect(res.body.data.docs.length).toBe(2);
      expect(res.body.data.docs.some((g) => g.name === 'genre1')).toBeTruthy();
      expect(res.body.data.docs.some((g) => g.name === 'genre2')).toBeTruthy();
      expect(res.body.data.docs.some((g) => g.slug === 'genre1')).toBeTruthy();
      expect(res.body.data.docs.some((g) => g.slug === 'genre2')).toBeTruthy();
    });
  });

  describe('GET /:id', () => {
    let genre;
    let id;

    const exec = async () => {
      return await request(server)
        .get(`/api/v1/genres/${id}`)
        .set('Authorization', `Bearer ${token}`);
    };

    beforeEach(async () => {
      genre = await Genre.create({ name: 'Genre' });
      id = genre._id;
    });

    it('should return 401 if client is not logged in', async () => {
      token = '';

      const res = await exec();

      expect(res.status).toBe(401);
    });

    it('should return 404 if id is invalid', async () => {
      id = 1;

      const res = await exec();

      expect(res.status).toBe(404);
    });

    it('should return 404 if genre with the given id was not found', async () => {
      id = mongoose.Types.ObjectId();

      const res = await exec();

      expect(res.status).toBe(404);
    });

    it('should return the genre if it is valid', async () => {
      const res = await exec();

      expect(res.status).toBe(200);
      expect(res.body.data.doc).toHaveProperty('_id');
      expect(res.body.data.doc).toHaveProperty('name', genre.name);
    });
  });

  describe('POST /', () => {
    let name;

    const exec = async () => {
      return await request(server)
        .post('/api/v1/genres')
        .set('Authorization', `Bearer ${token}`)
        .send({ name });
    };

    beforeEach(() => {
      name = 'Genre';
    });

    it('should return 401 if client is not logged in', async () => {
      token = '';

      const res = await exec();

      expect(res.status).toBe(401);
    });

    it('should return 400 if genre name is not provided', async () => {
      name = '';

      const res = await exec();

      expect(res.status).toBe(400);
    });

    it('should return 400 if genre name is less than 5 characters', async () => {
      name = '1234';

      const res = await exec();

      expect(res.status).toBe(400);
    });

    it('should return 400 if genre name is more than 50 characters', async () => {
      name = new Array(52).join('a');

      const res = await exec();

      expect(res.status).toBe(400);
    });

    it('should save the genre if it is valid', async () => {
      await exec();

      const genre = await Genre.find({ name: 'Genre' });

      expect(genre).not.toBeNull();
    });

    it('should return the genre if it is valid', async () => {
      const res = await exec();

      expect(res.status).toBe(201);
      expect(res.body.data.doc).toHaveProperty('_id');
      expect(res.body.data.doc).toHaveProperty('name', 'Genre');
    });
  });

  describe('PATCH /:id', () => {
    let genre;
    let newName;
    let id;

    const exec = async () => {
      return await request(server)
        .patch(`/api/v1/genres/${id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: newName });
    };

    beforeEach(async () => {
      genre = await Genre.create({ name: 'Genre' });
      id = genre._id;
      newName = 'updatedGenre';
    });

    it('should return 401 if client is not logged in', async () => {
      token = '';

      const res = await exec();

      expect(res.status).toBe(401);
    });

    it('should return 404 if id is invalid', async () => {
      id = 1;

      const res = await exec();

      expect(res.status).toBe(404);
    });

    it('should return 404 if genre found with the given id was not found', async () => {
      id = mongoose.Types.ObjectId();

      const res = await exec();

      expect(res.status).toBe(404);
    });

    it('should return 400 if genre name is not provided', async () => {
      newName = '';

      const res = await exec();

      expect(res.status).toBe(400);
    });

    it('should return 400 if genre name is less than 5 characters', async () => {
      newName = '1234';

      const res = await exec();

      expect(res.status).toBe(400);
    });

    it('should return 400 if genre name is more than 50 characters', async () => {
      newName = new Array(52).join('a');

      const res = await exec();

      expect(res.status).toBe(400);
    });

    it('should update the genre if input is valid', async () => {
      const res = await exec();

      const updatedGenre = await Genre.findById(id);

      expect(res.status).toBe(200);
      expect(updatedGenre).toBeTruthy();
    });

    it('should return the genre if input is valid', async () => {
      const res = await exec();

      expect(res.status).toBe(200);
      expect(res.body.data.doc).toHaveProperty('_id');
      expect(res.body.data.doc).toHaveProperty('name', newName);
    });
  });

  describe('DELETE /:id', () => {
    let genre;
    let id;

    const exec = async () => {
      return await request(server)
        .delete(`/api/v1/genres/${id}`)
        .set('Authorization', `Bearer ${token}`)
        .send();
    };

    beforeEach(async () => {
      genre = await Genre.create({ name: 'Genre' });
      id = genre.id;
    });

    it('should return 401 if client is not logged in', async () => {
      token = '';

      const res = await exec();

      expect(res.status).toBe(401);
    });

    it('should return 404 if id is not valid', async () => {
      id = 1;

      const res = await exec();

      expect(res.status).toBe(404);
    });

    it('should return 404 if no genre was found with the given ID', async () => {
      id = mongoose.Types.ObjectId();

      const res = await exec();

      expect(res.status).toBe(404);
    });

    it('should delete the genre if input is valid', async () => {
      await exec();

      const genreInDb = await Genre.findById(id);

      expect(genreInDb).toBeNull();
    });

    it('should return 204 if genre was successfully deleted', async () => {
      const res = await exec();

      expect(res.status).toBe(204);
    });
  });
});
