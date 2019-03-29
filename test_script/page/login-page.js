const supertest = require('supertest');
const env = require('dotenv').config();

const api = supertest(process.env.API_BASE_URL);

const postLogin = (payload) => api.post('/oauth/token/multiple')
 .set('Content-Type', 'application/json')
 .set('Accept', 'application/json')
 .send(payload);

module.exports = {
 postLogin,
}