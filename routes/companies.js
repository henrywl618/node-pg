const express = require('express');
const ExpressError = require('../expressError');
const router = express.Router();
const db = require('../db');
const slugify = require('slugify');


router.get('/', async (req, res, next)=>{
    try{
        const companies = await db.query("SELECT * FROM companies");
        return res.status(200).json({ companies: companies.rows });
    }catch(e){
        next(e);
    };
});

router.get('/:code',async (req, res, next)=>{
    try{
        const {code} = req.params;
        const company = await db.query("SELECT * FROM companies WHERE code=$1",[code]);
        if(!company.rowCount) throw new ExpressError("Company not found", 404);

        const invoices = await db.query("SELECT id FROM invoices WHERE comp_code=$1",[code])
        const invoiceIDs = invoices.rows.map(i=>i.id);

        const industryQuery = await db.query(`SELECT industry 
                                                FROM companies as c
                                                LEFT JOIN companies_industries as ci
                                                    ON c.code=ci.comp_code
                                                LEFT JOIN industries as i
                                                    ON ci.ind_code=i.code
                                                WHERE c.code=$1`, [code] );
        const industries = industryQuery.rows.map(i=>i.industry)
        return res.status(200).json({ company: {...company.rows[0], invoices: invoiceIDs, industries: industries} })
    }catch(e){
        next(e);
    };
});

router.post('/', async (req, res, next)=>{
    try{
        const {name, description} = req.body;
        const code = slugify(req.body.name, {lower: true});
        const company = await db.query("INSERT INTO companies (code, name, description) VALUES ($1, $2, $3) RETURNING code, name, description",[code, name, description]);
        return res.status(201).json({ company: company.rows[0] })
    }catch(e){
        next(e);
    };
});

router.put('/:code', async (req, res, next)=>{
    try{
        const { code } = req.params;
        const { name, description } = req.body;
        const company = await db.query("UPDATE companies SET name=$1, description=$2 WHERE code=$3 RETURNING code, name, description", [name, description, code]);
        if(!company.rowCount) throw new ExpressError("Company not found", 404);
        return res.json({ company: company.rows[0] })
    }catch(e){
        next(e);
    };
});

router.delete('/:code', async (req, res, next)=>{
    try{
        const { code } = req.params;
        const company = await db.query("DELETE FROM companies WHERE code=$1 RETURNING code, name, description", [code]);
        console.log(company);
        if(!company.rowCount) throw new ExpressError("Company not found", 404);
        return res.json({ status: "deleted" });
    }catch(e){
        next(e);
    };
});

module.exports = router;