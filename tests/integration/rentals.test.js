const request = require('supertest');
const mongoose = require('mongoose');
const User = require('../../models/User');
const Movie = require('../../models/Movie');
const Rental = require('../../models/Rental');
const { Customer } = require('../../models/Customer');

describe('/api/v1/rentals', () => {
    let server,
    token,
    rental,
    movie,
    customer,
    customerId,
    movieId,
    id;

    beforeEach(async () => {
        server = require('../../server');

        customerId = mongoose.Types.ObjectId();
        movieId = mongoose.Types.ObjectId();

        movie = new Movie({
            _id: movieId,
            title: 'Movies',
            genre: mongoose.Types.ObjectId(),
            numberInStock: 10,
            dailyRentalRate: 2
        });
        await movie.save();

        customer = await Customer.create({
            _id: customerId,
            name: 'Customer1',
            phone: '12345'
        });

        rental = await Rental.create({
            customer: customerId,
            movie: movieId
        });

        token = new User().generateAuthToken();
        id = rental._id;
    });

    afterEach(async () => {
        await server.close();
        await Rental.deleteMany();
        await Movie.deleteMany();
        await Customer.deleteMany();
    });

    describe('GET /', () => {
        const exec = async () => {
            return await request(server)
                .get('/api/v1/rentals')
                .set('Authorization', `Bearer ${token}`);
        }

        it('should return 401 if client is not logged in', async () => {
            token = '';

            const res = await exec();

            expect(res.status).toBe(401);
        });

        it('should return all rentals', async () => {
            const rentals = [
                {
                    customer: mongoose.Types.ObjectId(),
                    movie: mongoose.Types.ObjectId()
                },
                {
                    customer: mongoose.Types.ObjectId(),
                    movie: mongoose.Types.ObjectId()
                }
            ];

            await Rental.collection.insertMany(rentals);

            const res = await exec();

            expect(res.status).toBe(200);
            expect(res.body.data.docs.length).toBe(3);
        });
    });

    describe('GET /:id', () => {
        const exec = async () => {
            return await request(server)
                .get(`/api/v1/rentals/${id}`)
                .set('Authorization', `Bearer ${token}`);
        }

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

        it('should return 404 if no rental was found with the given id', async () => {
            id = mongoose.Types.ObjectId();

            const res = await exec();

            expect(res.status).toBe(404);
        });

        it('should return the rental if input is valid', async () => {
            const res = await exec();

            expect(res.status).toBe(200);
            expect(res.body.data.doc).toHaveProperty('_id');
            expect(res.body.data.doc).toHaveProperty('customer');
            expect(res.body.data.doc).toHaveProperty('movie');
        });
    });

    describe('POST /', () => {
        const exec = async () => {
            return request(server)
                .post('/api/v1/rentals')
                .set('Authorization', `Bearer ${token}`)
                .send({ customerId, movieId });
        }

        it('should return 401 if client is not logged in', async () => {
            token = '';

            const res = await exec();

            expect(res.status).toBe(401);
        });

        it('should return 400 if customerId is not provided', async () => {
            customerId = '';

            const res = await exec();

            expect(res.status).toBe(400);
        });

        it('should return 400 if movieId is not provided', async () => {
            movieId = '';

            const res = await exec();

            expect(res.status).toBe(400);
        });

        it('should return 400 if numberInStock is less than 1 or equal to 0', async () => {
            movie.numberInStock = 0;
            await movie.save();

            const res = await exec();

            expect(res.status).toBe(400);
        });

        it('should save rental if input is valid', async () => {
            await exec();

            const rentalInDb = await Rental.find({ customerId });

            expect(rentalInDb).not.toBeNull();
        });

        it('should reduce the movie numberInStock on successful rental', async () => {
            movie.numberInStock--;
            await movie.save();
            
            await exec();

            const movieInDb = await Movie.findById(movieId);

            expect(movieInDb.numberInStock).toBe(9);
        });
    });

    describe('DELETE /:id', () => {
        const exec = async () => {
            return request(server)
                .delete(`/api/v1/rentals/${id}`)
                .set('Authorization', `Bearer ${token}`)
                .send();
        }

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

        it('should delete the rental is valid id is passed', async () => {
            await exec();

            const rentalInDb = await Rental.findById(id);

            expect(rentalInDb).toBeNull();
        });

        it('should return 204 if the rental was successfully deleted', async () => {
            const res = await exec();

            expect(res.status).toBe(204);
        });
    });
});