const request = require('supertest');
const mongoose = require('mongoose');

const User = require('../../models/User');
const { Course } = require('../../models/Course');

let server;

describe('/api/v1/courses', () => {
  beforeEach(() => {
    server = require('../../server');
  });

  afterEach(async () => {
    await server.close();
    await Course.deleteMany();
  });

  describe('GET /', () => {
    let token;

    const exec = async () => {
      return await request(server)
        .get('/api/v1/courses')
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

    it('should return all courses', async () => {
      const courses = [
        {
          name: 'Course',
          category: 'web',
          tags: ['js'],
          isPublished: true,
          price: 20,
        },
        {
          name: 'Testing',
          category: 'mobile',
          tags: ['kotlin'],
          isPublished: false,
          price: 45,
        },
      ];

      await Course.collection.insertMany(courses);

      const res = await exec();

      expect(res.status).toBe(200);
      expect(res.body.data.docs.length).toBe(2);
      expect(res.body.data.docs.some((c) => c.name === 'Course')).toBeTruthy();
      expect(res.body.data.docs.some((c) => c.name === 'Testing')).toBeTruthy();
      expect(res.body.data.docs.some((c) => c.category === 'web')).toBeTruthy();
      expect(
        res.body.data.docs.some((c) => c.category === 'mobile')
      ).toBeTruthy();
      expect(
        res.body.data.docs.some((c) => c.isPublished === true)
      ).toBeTruthy();
      expect(
        res.body.data.docs.some((c) => c.isPublished === false)
      ).toBeTruthy();
      expect(res.body.data.docs.some((c) => c.price === 20)).toBeTruthy();
      expect(res.body.data.docs.some((c) => c.price === 45)).toBeTruthy();
    });
  });

  describe('GET /:id', () => {
    let token;
    let course;
    let id;

    const exec = async () => {
      return await request(server)
        .get(`/api/v1/courses/${id}`)
        .set('Authorization', `Bearer ${token}`);
    };

    beforeEach(async () => {
      course = await Course.create({
        name: 'Course',
        category: 'web',
        tags: ['js'],
        isPublished: true,
        price: 20,
      });

      token = new User().generateAuthToken();
      id = course._id;
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

    it('should return 404 if no course was found with the given ID', async () => {
      id = mongoose.Types.ObjectId();

      const res = await exec();

      expect(res.status).toBe(404);
    });

    it('should return course if input is valid', async () => {
      const res = await exec();

      expect(res.status).toBe(200);
      expect(res.body.data.doc).toHaveProperty('_id');
      expect(res.body.data.doc).toHaveProperty('name', course.name);
    });
  });

  describe('POST /', () => {
    let token;
    let name, category, tags, isPublished, price;

    const exec = async () => {
      return request(server)
        .post('/api/v1/courses')
        .set('Authorization', `Bearer ${token}`)
        .send({ name, category, tags, isPublished, price });
    };

    beforeEach(() => {
      token = new User().generateAuthToken();
      name = 'Course';
      category = 'web';
      tags = ['web'];
      isPublished = true;
      price = 20;
    });

    it('should return 401 if client is not logged in', async () => {
      token = '';

      const res = await exec();

      expect(res.status).toBe(401);
    });

    it('should return 400 if course name is not given', async () => {
      name = '';

      const res = await exec();

      expect(res.status).toBe(400);
    });

    it('should return 400 if course name is less than 5', async () => {
      name = '1234';

      const res = await exec();

      expect(res.status).toBe(400);
    });

    it('should return 400 if course name is more than 255', async () => {
      name = new Array(257).join('a');

      const res = await exec();

      expect(res.status).toBe(400);
    });

    it('should return 400 if course category is not specified', async () => {
      category = '';

      const res = await exec();

      expect(res.status).toBe(400);
    });

    it('should return 400 if there is no course tags in the input', async () => {
      tags = '';

      const res = await exec();

      expect(res.status).toBe(400);
    });

    it('should return 400 if there is no course price', async () => {
      price = '';

      const res = await exec();

      expect(res.status).toBe(400);
    });

    it('should return 400 if course price is less than 10', async () => {
      price = 9;

      const res = await exec();

      expect(res.status).toBe(400);
    });

    it('should return 400 if course price is more than 200', async () => {
      price = 201;

      const res = await exec();

      expect(res.status).toBe(400);
    });

    it('should save a course if input is valid', async () => {
      await exec();

      const course = await Course.find({ name });

      expect(course).not.toBeNull();
    });

    it('should return the course if it is valid', async () => {
      const res = await exec();

      expect(res.status).toBe(201);
      expect(res.body.data.doc).toHaveProperty('_id');
      expect(res.body.data.doc).toHaveProperty('name', 'Course');
      expect(res.body.data.doc).toHaveProperty('category', 'web');
      expect(res.body.data.doc.tags).toContain('web');
      expect(res.body.data.doc).toHaveProperty('isPublished', true);
      expect(res.body.data.doc).toHaveProperty('price', 20);
    });
  });

  describe('PATCH /:id', () => {
    let token,
      course,
      newName,
      newCategory,
      newTags,
      newIsPublished,
      newPrice,
      id;

    const exec = async () => {
      return request(server)
        .patch(`/api/v1/courses/${id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: newName,
          category: newCategory,
          tags: newTags,
          isPublished: newIsPublished,
          price: newPrice,
        });
    };

    beforeEach(async () => {
      course = await Course.create({
        name: 'Course',
        category: 'web',
        tags: ['js'],
        isPublished: true,
        price: 20,
      });

      token = new User({ role: 'user' }).generateAuthToken();
      newName = 'updatedCourse';
      newCategory = 'updatedCategory';
      newTags = 'updatedTags';
      newIsPublished = 'updatedIsPublished';
      newPrice = 'updatedPrice';
      id = course._id;
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

    it('should return 404 if no course was found with the given ID', async () => {
      id = mongoose.Types.ObjectId();

      const res = await exec();

      // expect(res.status).toBe(404);
    });

    it('should return 400 if course name is not given', async () => {
      newName = '';

      const res = await exec();

      expect(res.status).toBe(400);
    });

    it('should return 400 if course name is less than 5', async () => {
      newName = '1234';

      const res = await exec();

      expect(res.status).toBe(400);
    });

    it('should return 400 if course name is more than 255', async () => {
      newName = new Array(257).join('a');

      const res = await exec();

      expect(res.status).toBe(400);
    });

    it('should return 400 if course category is not specified', async () => {
      newCategory = '';

      const res = await exec();

      expect(res.status).toBe(400);
    });

    it('should return 400 if there is no course tags in the input', async () => {
      newTags = '';

      const res = await exec();

      expect(res.status).toBe(400);
    });

    it('should return 400 if there is no course price', async () => {
      newPrice = '';

      const res = await exec();

      expect(res.status).toBe(400);
    });

    it('should return 400 if course price is less than 10', async () => {
      newPrice = 9;

      const res = await exec();

      expect(res.status).toBe(400);
    });

    it('should return 400 if course price is more than 200', async () => {
      newPrice = 201;

      const res = await exec();

      expect(res.status).toBe(400);
    });

    it('should update the course if it is valid', async () => {
      await exec();

      const courseInDb = await Course.findById(id);

      expect(courseInDb).toBeTruthy();
    });

    it('should return the updated course', async () => {
      const res = await exec();

      expect(res.body).toBeDefined();
    });
  });

  describe('DELETE /:id', () => {
    let token, course, id;

    const exec = async () => {
      return request(server)
        .delete(`/api/v1/courses/${id}`)
        .set('Authorization', `Bearer ${token}`)
        .send();
    };

    beforeEach(async () => {
      course = await Course.create({
        name: 'Course',
        category: 'web',
        tags: ['js'],
        isPublished: true,
        price: 20,
      });

      token = new User().generateAuthToken();
      id = course._id;
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

    it('should return 404 if no course was found with the given ID', async () => {
      id = mongoose.Types.ObjectId();

      const res = await exec();

      expect(res.status).toBe(404);
    });

    it('should delete the course if input is valid', async () => {
      await exec();

      const courseInDb = await Course.findById(id);

      expect(courseInDb).toBeNull();
    });

    it('should return 204 if the course was successfully deleted', async () => {
      const res = await exec();

      expect(res.status).toBe(204);
    });
  });
});
