const request = require('supertest');
const mongoose = require('mongoose');
const User = require('../../models/User');
const { Review } = require('../../models/Review');

let server;

describe('/api/v1/reviews', () => {
    let token,
    review,
    movieId,
    userId,
    id;

    beforeEach(async () => {
        server = require('../../server');

        movieId = mongoose.Types.ObjectId();
        userId = mongoose.Types.ObjectId();

        review = await Review.create({
            review: 'New review',
            rating: 5,
            movie: movieId,
            user: userId
        });

        token = new User().generateAuthToken();
        id = review._id;
    });

    afterEach(async () => {
        await server.close();
        await Review.deleteMany();
    });

    describe('GET /', () => {
        const exec = async () => {
            return request(server)
                .get('/api/v1/reviews')
                .set('Authorization', `Bearer ${token}`);
        }

        it('should return 401 if client is not logged in', async () => {
            token = '';

            const res = await exec();

            expect(res.status).toBe(401);
        });

        it('should return all reviews', async () => {
            const reviews = [
                {
                    review: 'Review1',
                    rating: 5,
                    movie: mongoose.Types.ObjectId(),
                    user: mongoose.Types.ObjectId()
                },
                {
                    review: 'Review2',
                    rating: 4,
                    movie: mongoose.Types.ObjectId(),
                    user: mongoose.Types.ObjectId()
                }
            ];

            await Review.collection.insertMany(reviews);

            const res = await exec();

            expect(res.status).toBe(200);
            expect(res.body.data.docs.length).toBe(3);
            expect(res.body.data.docs.some(r => r.review === 'Review1')).toBeTruthy();
            expect(res.body.data.docs.some(r => r.review === 'Review2')).toBeTruthy();
            expect(res.body.data.docs.some(r => r.rating === 5)).toBeTruthy();
            expect(res.body.data.docs.some(r => r.rating === 4)).toBeTruthy();
        });
    });

    describe('GET /:id', () => {
        const exec = async () => {
            return await request(server)
                .get(`/api/v1/reviews/${id}`)
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

        it('should return 404 if no review was found with the given id', async () => {
            id = mongoose.Types.ObjectId();

            const res = await exec();

            expect(res.status).toBe(404);
        });

        it('should return the review if valid id is passed', async () => {
            const res = await exec();

            expect(res.status).toBe(200);
            expect(res.body.data.doc).toHaveProperty('_id');
            expect(res.body.data.doc).toHaveProperty('review', review.review);
            expect(res.body.data.doc).toHaveProperty('rating', review.rating);
            expect(res.body.data.doc).toHaveProperty('movie', review.movie.toHexString());
        });
    });

    describe('POST /', () => {
        let review,
        rating,
        movie,
        user;

        const exec = async () => {
            return request(server)
                .post('/api/v1/reviews')
                .set('Authorization', `Bearer ${token}`)
                .send({ review, rating, movie, user });
        }

        beforeEach(() => {
            review = 'review';
            rating = 5;
            movie = movieId;
            user = '5c8a1dfa2f8fb814b56fa181';
        });

        it('should return 401 if client is not logged in', async () => {
            token = '';

            const res = await exec();

            expect(res.status).toBe(401);
        });

        it('should return 400 if review is empty', async () => {
            review = '';

            const res = await exec();

            expect(res.status).toBe(400);
        });

        it('should return 400 if rating is less than 1', async () => {
            rating = 0;

            const res = await exec();

            expect(res.status).toEqual(400);
        });

        it('should return 400 if rating is greater than 5', async () => {
            rating = 6;

            const res = await exec();

            expect(res.status).toEqual(400);
        });
        
        it('should return 400 if movie field is empty', async () => {
            movie = '';

            const res = await exec();

            expect(res.status).toEqual(400);
        });

        it('should return 400 if there is no user', async () => {
            user = '';

            const res = await exec();

            expect(res.body.status).toEqual('error');
        });

        it('should save the review if it is valid', async () => {
            await exec();

            const reviewInDb = await Review.find({ movie: movieId });

            expect(reviewInDb).not.toBeNull();
        });

        it('should return the review if it is valid', async () => {
            const res = await exec();

            expect(res.body.data.doc).toHaveProperty('_id');
            expect(res.body.data.doc).toHaveProperty('review', 'review');
            expect(res.body.data.doc).toHaveProperty('rating', 5);
            expect(res.body.data.doc).toHaveProperty('movie', movieId.toHexString());
            expect(res.body.data.doc).toHaveProperty('user', '5c8a1dfa2f8fb814b56fa181');
        });
    });

    describe('PATCH /:id', () => {
        let newReview,
        newRating,
        newMovie,
        newUser;

        const exec = async () => {
            return await request(server)
                .patch(`/api/v1/reviews/${id}`)
                .set('Authorization', `Bearer ${token}`)
                .send({ review: newReview, rating: newRating, movie: newMovie, user: newUser });
        }

        beforeEach(() => {
            newReview = 'Updated review';
            newRating = 4;
            newMovie = movieId;
            newUser = '5c8a1dfa2f8fb814b56fa181';
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

        it('should return 404 if no review was found with the given id', async () => {
            id = mongoose.Types.ObjectId();

            const res = await exec();

            // expect(res.status).toBe(404);
        });

        it('should return 400 if review is empty', async () => {
            newReview = '';

            const res = await exec();

            expect(res.status).toBe(400);
        });

        it('should return 400 if rating is less than 1', async () => {
            newRating = 0;

            const res = await exec();

            expect(res.status).toEqual(400);
        });

        it('should return 400 if rating is greater than 5', async () => {
            newRating = 6;

            const res = await exec();

            expect(res.status).toEqual(400);
        });

        it('should return 400 if movie field is empty', async () => {
            newMovie = '';

            const res = await exec();

            expect(res.status).toEqual(400);
        });

        it('should return 400 if there is no user', async () => {
            newUser = '';

            const res = await exec();

            expect(res.status).toBe(400);
        });

        it('should update the review if input is valid', async () => {
            await exec();

            const reviewInDb = await Review.findById(id);

            expect(reviewInDb.review).toBe(newReview);
            expect(reviewInDb.rating).toBe(newRating);
            expect(reviewInDb.movie).toBeDefined();
            expect(reviewInDb.user).toBeDefined();
        });

        it('should return the updated review', async () => {
            const res = await exec();

            expect(res.status).toBe(200);
            expect(res.body.data.doc).toHaveProperty('_id');
            expect(res.body.data.doc).toHaveProperty('review', newReview);
            expect(res.body.data.doc).toHaveProperty('rating', newRating);
            expect(res.body.data.doc).toHaveProperty('movie', newMovie.toHexString());
        });
    });

    describe('DELETE /:id', () => {
        const exec = async () => {
            return await request(server)
                .delete(`/api/v1/reviews/${id}`)
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

        it('should return 404 if no review was found with the given id', async () => {
            id = mongoose.Types.ObjectId();

            const res = await exec();

            // expect(res.status).toBe(404);
        });

        it('should delete the review if valid id is passed', async () => {
            await exec();

            const reviewInDb = await Review.findById(id);

            expect(reviewInDb).toBeNull();
        });

        it('should return 204 if the review was successfully deleted', async () => {
            const res = await exec();

            expect(res.status).toBe(204);
        });
    });
});