const express = require('express');
const ExpressError = require('../expressError');
const router = express.Router();
const db = require('../db');

router.get('/', async (req, res, next)=>{
    try{
        const ind = await db.query("SELECT industry FROM industries");
        const industryQuery = await db.query(`SELECT industry, comp_code 
                                                FROM companies_industries as ci
                                                LEFT JOIN industries as i
                                                    ON i.code = ci.ind_code `);
        const industry = {};
        ind.rows.forEach(row=>industry[row.industry]=[]);
        industryQuery.rows.forEach(row=>industry[row.industry].push(row.comp_code));
        return res.status(200).json(industry);
    }catch(e){
        return next(e);
    };
});

router.post('/', async (req, res, next)=>{
    try{
        const {code, industry} = req.body;
        const ind = await db.query("INSERT INTO industries (code, industry) VALUES ($1,$2) RETURNING *", [code, industry]);
        console.log(ind)
        return res.status(201).json(ind.rows[0]);
    }catch(e){
        return next(e);
    }
});

router.post('/:code', async (req, res, next)=>{
    try{
        const {code} = req.params;
        const {company} = req.body;
        const association = await db.query("INSERT INTO companies_industries (comp_code, ind_code) VALUES ($1, $2) RETURNING *", [company, code]);
        if(!association.rowCount) throw new ExpressError("Unable to find company or industry",404);
        return res.status(201).json(association.rows[0]);
    } catch(e){
        next(e);
    };

});

module.exports = router;