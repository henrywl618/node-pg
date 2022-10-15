process.env.NODE_ENV = "test";
const request = require('supertest');
const db = require('../db');
const app = require('../app');

let invoice;

beforeEach(async ()=>{
    await db.query("INSERT INTO companies VALUES ('apple', 'Apple Computer', 'Maker of OSX.')");
    await db.query("INSERT INTO invoices (comp_Code, amt, paid, paid_date) VALUES ('apple', 100, false, null)");
    let query = await db.query("SELECT * FROM invoices");
    invoice = query.rows[0];
});

afterEach(async ()=>{
    await db.query("DELETE FROM companies");
    await db.query("DELETE FROM invoices");
});

afterAll(async ()=>{
    await db.end();
});

describe("GET /invoices", ()=>{
    test("Should get a list of all invoices",async ()=>{
        const response = await request(app).get('/invoices');
        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual({"invoices": [
            {
                "id": invoice.id,
                "comp_code": "apple"
            }]})
    })
});

describe("GET /invoices/:id", ()=>{
    test("Should get one invoice", async ()=>{
        const response = await request(app).get(`/invoices/${invoice.id}`);
        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual({"invoice": {
                "id": `${invoice.id}`,
                "amt": 100,
                "paid": false,
                "paid_date": null,
                "add_date": expect.any(String),
                "company": {
                    "code": "apple",
                    "name": "Apple Computer",
                    "description": "Maker of OSX."
                }
            }});
    });
    test("Should return a 404 error", async ()=>{
        const response = await request(app).get('/companies/tesla');
        expect(response.statusCode).toBe(404);
    });
});

describe("POST /invoices", ()=>{
    test("Should create a new invoice", async ()=>{
        const response = await await request(app)
                                        .post('/invoices')
                                        .send({comp_code:'apple',
                                                amt: 9999});
        expect(response.statusCode).toBe(201);
        expect(response.body).toEqual({invoice:{comp_code:'apple',
                                                id: expect.any(Number),
                                                amt: 9999,
                                                paid: false,
                                                add_date: expect.any(String),
                                                paid_date: null}});
        const queryAll = await db.query("SELECT * FROM invoices");
        expect(queryAll.rowCount).toBe(2);
    });
});

describe("PUT /invoices", ()=>{
    test("Should edit am invoice", async ()=>{
        const response = await request(app)
                                .put(`/invoices/${invoice.id}`)
                                .send({ amt: 100000, paid:false });
        expect(response.statusCode).toBe(201);
        expect(response.body).toEqual({invoice:{comp_code:'apple',
                                                id: expect.any(Number),
                                                amt: 100000,
                                                paid: false,
                                                add_date: expect.any(String),
                                                paid_date: null}});
    });
    test("Should return a 404 error", async ()=>{
        const response = await request(app).put('/companies/tesla');
        expect(response.statusCode).toBe(404);
    })
});

describe("DELETE /invoices/:id", ()=>{
    test("Should delete an invoice", async()=>{
        const response = await request(app).delete(`/invoices/${invoice.id}`);
        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual({ status: "deleted" });
        const queryAll = await db.query("SELECT * FROM invoices");
        expect(queryAll.rowCount).toBe(0);
    });
    test("Should return a 404 error", async ()=>{
        const response = await request(app).delete('/invoices/0');
        expect(response.statusCode).toBe(404);
    })
});