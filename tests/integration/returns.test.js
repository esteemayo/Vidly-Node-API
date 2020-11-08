const moment = require('moment');
const request = require('supertest');
const mongoose = require('mongoose');
const User = require('../../models/User');
const Movie = require('../../models/Movie');
const Rental = require('../../models/Rental');
const { Customer } = require('../../models/Customer');

describe('/api/v1/returns', () => {
    let server,
    token,
    movie,
    rental,
    customer,
    customerId,
    movieId;

    const exec = async () => {
        return await request(server)
            .post('/api/v1/returns')
            .set('Authorization', `Bearer ${token}`)
            .send({ customer: customer._id, movie: movie._id });
    }

    beforeEach(async () => {
        server = require('../../server');

        customerId = mongoose.Types.ObjectId();
        movieId = mongoose.Types.ObjectId();

        movie = new Movie({
            _id: movieId,
            title: 'movie1',
            genre: mongoose.Types.ObjectId(),
            numberInStock: 10,
            dailyRentalRate: 2
        });
        await movie.save();

        customer = await Customer.create({
            _id: customerId,
            name: 'customer1',
            phone: '12345'
        });

        rental = new Rental({
            customer: customer._id,
            movie: movie._id
        });
        await rental.save();

        token = new User().generateAuthToken();
    });

    afterEach(async () => {
        await server.close();
        await Movie.deleteMany();
        await Rental.deleteMany();
        await Customer.deleteMany();
    });

    it('should return 401 if client is not logged in', async () => {
        token = '';

        const res = await exec();

        expect(res.status).toBe(401);
    });

    it('should return 400 if customerId is not provided', async () => {
        customer = '';

        const res = await exec();

        expect(res.status).toBe(400);
    });

    it('should return 400 if movieId is not provided', async () => {
        movie = '';

        const res = await exec();

        expect(res.status).toBe(400);
    });

    it('should return 404 if no rental is found for customer/movie', async () => {
        await Rental.deleteMany();

        const res = await exec();

        expect(res.status).toBe(404);
    });

    it('should return 400 if rental already processed', async () => {
        rental.dateReturned = new Date();
        await rental.save();
        
        const res = await exec();

        expect(res.status).toBe(400);
    });

    it('should return 200 if we have a valid request', async () => {
        const res = await exec();

        expect(res.status).toBe(200);
    });

    it('it should set the returnDate if input is valid', async () => {
        await exec();

        const rentalInDb = await Rental.findById(rental._id);
        const diff = new Date() - rentalInDb.dateReturned;

        expect(diff).toBeLessThan(10 * 1000);
        expect(rentalInDb.dateReturned).toBeDefined();
    });

    it('should return rentalFee if input is valid', async () => {
        rental.dateOut = moment().add(-7, 'days').toDate();
        await rental.save();

        await exec();

        const rentalInDb = await Rental.findById(rental._id);

        expect(rentalInDb.rentalFee).toBe(14);
    });

    it('should increase the movie stock if output is valid', async () => {
        await exec();

        const movieInDb = await Movie.findById(movieId);

        expect(movieInDb.numberInStock).toBe(movie.numberInStock + 1);
    });

    it('should return the rental if input is valid', async () => {
        const res = await exec();

        const rentalInDb = await Rental.findById(rental._id);

        expect(res.status).toBe(200);
        expect(rentalInDb).toBeDefined();
        expect(res.body.data.rental).toHaveProperty('customer');
        expect(res.body.data.rental).toHaveProperty('movie');
        expect(res.body.data.rental).toHaveProperty('dateOut');
        expect(res.body.data.rental).toHaveProperty('dateReturned');
        expect(res.body.data.rental).toHaveProperty('rentalFee');
    });
});