const Router = require("express").Router
const Message = require("../models/message");
const {ensureLoggedIn, ensureCorrectUser} = require("../middleware/auth");
const ExpressError = require("../expressError");
const router = new Router();


/** GET /:id - get detail of message.
 *
 * => {message: {id,
 *               body,
 *               sent_at,
 *               read_at,
 *               from_user: {username, first_name, last_name, phone},
 *               to_user: {username, first_name, last_name, phone}}
 *
 * Make sure that the currently-logged-in users is either the to or from user.
 *
 **/

router.get('/:id', ensureCorrectUser, async (req, res, next)=>{
    try{
        const result = await Message.get(req.params.id);
        return res.json({message: result})
    }
    catch(e){
        return next(e);
    }
})


/** POST / - post message.
 *
 * {to_username, body} =>
 *   {message: {id, from_username, to_username, body, sent_at}}
 *
 **/

router.post('/', ensureLoggedIn,  async (req, res, next)=>{
    try{
        
        const {to_username, body} = req.body;
        const {username} = req.user;
        const result = await Message.create({from_username: username, to_username, body, sent_at: new Date()});
        console.log(result);
        return res.json({message: result})
    }
    catch(e){
        return next(e);
    }
})


/** POST/:id/read - mark message as read:
 *
 *  => {message: {id, read_at}}
 *
 * Make sure that the only the intended recipient can mark as read.
 *
 **/

router.post('/:id/read', ensureLoggedIn, async (req, res, next)=>{
    try{
        const {id} = req.params;
        const result = await Message.markRead(id);
        return res.json({message:result})
    }
    catch(e){
        return next(e);
    }
})

module.exports = router;