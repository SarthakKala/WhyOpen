const express = require("express");
const router = express.Router();

router.post("/infer-intent",(req,res)=>{
    const url = req.body.url;
    const title = req.body.title;
    const searchQuery = req.body.searchQuery;
    if(!url || !title){
        return res.status(400).json({
            error: "Invalid input",
            message: "url and title are required"
        });
    }else{
        return res.json({
            "intent": "Research",
            "confidence": 0.75,
            "cached": false
        });
    }
})

module.exports = router;

