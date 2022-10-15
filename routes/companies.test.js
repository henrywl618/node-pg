process.env.NODE_ENV = "test";
const request = require('supertest');
const db = require('../db');
const app = require('../app');

beforeEach(async ()=>{
    await db.query("INSERT INTO companies VALUES ('apple', 'Apple Computer', 'Maker of OSX.')");
    await db.query("INSERT INTO invoices (comp_Code, amt, paid, paid_date) VALUES ('apple', 100, false, null)");
});

afterEach(async ()=>{
    await db.query("DELETE FROM companies");
    await db.query("DELETE FROM invoices");
});

afterAll(async ()=>{
    await db.end();
});

describe("GET /companies", ()=>{
    test("Should get a list of all companies",async ()=>{
        const response = await request(app).get('/companies');
        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual({"companies": [
            {
                "code": "apple",
                "name": "Apple Computer",
                "description": "Maker of OSX.",
            }]})
    })
});

describe("GET /companies/:code", ()=>{
    test("Should get one company", async ()=>{
        const response = await request(app).get('/companies/apple');
        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual({"company": {
                "code": "apple",
                "name": "Apple Computer",
                "description": "Maker of OSX.",
                "invoices": expect.any(Array)
            }});
    });
    test("Should return a 404 error", async ()=>{
        const response = await request(app).get('/companies/tesla');
        expect(response.statusCode).toBe(404);
    });
});

describe("POST /companies", ()=>{
    test("Should create a new company", async ()=>{
        const response = await await request(app)
                                        .post('/companies')
                                        .send({code:'test1',
                                                name: "Test Company",
                                                description: "Test Company Please Ignore"});
        expect(response.statusCode).toBe(201);
        expect(response.body).toEqual({company: {code:'test1',
                                                name: "Test Company",
                                                description: "Test Company Please Ignore"}});
        const queryAll = await db.query("SELECT * FROM companies");
        expect(queryAll.rowCount).toBe(2);
    });
});

describe("PUT /companies", ()=>{
    test("Should edit a company", async ()=>{
        const response = await request(app)
                                .put('/companies/apple')
                                .send({ name: "Apple2",
                                        description: "Company has been edited"});
        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual({company: {code:'apple',
                                                name: "Apple2",
                                                description: "Company has been edited"}});
    });
    test("Should return a 404 error", async ()=>{
        const response = await request(app).put('/companies/tesla');
        expect(response.statusCode).toBe(404);
    })
});

describe("DELETE /companies/:code", ()=>{
    test("Should delete a company", async()=>{
        const response = await request(app).delete('/companies/apple');
        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual({ status: "deleted" });
        const queryAll = await db.query("SELECT * FROM companies");
        expect(queryAll.rowCount).toBe(0);
    });
    test("Should return a 404 error", async ()=>{
        const response = await request(app).delete('/companies/tesla');
        expect(response.statusCode).toBe(404);
    })
});