const express = require('express');
const ExpressError = require('../expressError');
const router = express.Router();
const db = require('../db');

router.get('/', async (req, res, next)=>{
    try{
        const invoices = await db.query("SELECT * FROM invoices");
        return res.status(200).json({ invoices: invoices.rows });
    }catch(e){
        next(e);
    };
});

router.get('/:id', async (req, res, next)=>{
    try{
        const {id} = req.params;
        const invoice = await db.query("SELECT * FROM invoices WHERE id=$1",[id]);
        if(!invoice.rowCount) throw new ExpressError("Invoice not found", 404);
        const { comp_code, amt, paid, paid_date, add_date } = invoice.rows[0]
        const company = await db.query("SELECT * FROM companies WHERE code=$1",[comp_code]);
        return res.status(200).json({ invoice: {amt, paid, paid_date, add_date, company: company.rows[0]} })
    }catch(e){
        next(e);
    };
});

router.post('/', async (req, res, next)=>{
    try{
        const {comp_code, amt} = req.body;
        const invoice = await db.query("INSERT INTO invoices (comp_code, amt) VALUES ($1, $2) RETURNING *",[comp_code, amt]);
        return res.status(201).json({ invoice: invoice.rows[0] })
    }catch(e){
        next(e);        
    };
});

router.put('/:id', async (req, res, next)=>{
    try{
        const {amt} = req.body;
        const invoice = await db.query("UPDATE invoices SET amt=$1 WHERE id=$2 RETURNING *",[amt, req.params.id]);
        if(!invoice.rowCount) throw new ExpressError("Invoice not found", 404);
        return res.status(201).json({ invoice: invoice.rows[0] })
    }catch(e){
        next(e);       
    };
});

router.delete('/:id', async (req, res, next)=>{
    try{
        const { id } = req.params;
        const invoice = await db.query("DELETE FROM invoice WHERE id=$1 RETURNING id", [id]);
        if(!invoice.rowCount) throw new ExpressError("Invoice not found", 404);
        return res.json({ status: "deleted" });
    }catch(e){
        next(e);        
    };
});

module.exports = router;