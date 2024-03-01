const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const express = require("express");
const router = new express.Router();
const ExpressError = require("../expressError")
const db = require("../db")
const {BCRYPT_WORK_FACTOR, SECRET_KEY} = require("../config")
const User = require("../models/user")

/** POST /login - login: {username, password} => {token}
 *
 * Make sure to update their last-login!
 *
 **/

router.post('/login', async (req, res, next)=>{
    try{
        const {username, password} = req.body;
        if (!username || !password){
            throw new ExpressError("Username and password required", 400);
        }
        const result = await db.query(`
        SELECT username, password
        FROM users WHERE username=$1`,
        [username]);
        
        const user = result.rows[0];
        if (user){
            if (await bcrypt.compare(password, user.password)){
                const token = jwt.sign({username}, SECRET_KEY);
                await User.updateLoginTimestamp(username);
                return res.json({token});
            }
            
        }
        throw new ExpressError("Invalid username/password", 400);
    }
    catch(e){
        return next(e);
    }
})


/** POST /register - register user: registers, logs in, and returns token.
 *
 * {username, password, first_name, last_name, phone} => {token}.
 *
 *  Make sure to update their last-login!
 */
router.post("/register", async (req, res, next)=>{
    try{
        let {username} = await User.register(req.body);
        let token = jwt.sign({username}, SECRET_KEY);
        await User.updateLoginTimestamp(username)
        return res.json({token});

    }
    catch(e){
        if (e.code === '23505'){
            return next(new ExpressError("Username taken please pick another!", 400));
        }
        return next(e);
    }
})

module.exports = router;