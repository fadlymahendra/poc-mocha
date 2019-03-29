const assert = require('chai').expect;

const page = require('../page/login-page.js');
const data = require('../data/login-data.json');

const scenario = {
 "success" : "As a Seller, I want to be able to login to Phoenix Web",
 "failed" : "As an Unregistered User, I should not be able to login to Phoenix Web"
}

describe(`POC Login Phoenix Web`, () => {
 it(`@skip @first ${scenario.success}`, async() => {
  const response = await page.postLogin(data.ildav);
  assert(response.status).to.equal(200);
 }),

 it(`@second ${scenario.failed}`, async() => {
  const response = await page.postLogin(data.failed);
  assert(response.status).to.equal(400, response.body.message);
 })
}) 