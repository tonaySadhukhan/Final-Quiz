const jwt=require('jsonwebtoken');
require('dotenv').config();
const key=process.env.SECRET_KEY;

function authToken( req, res, next){
    const at=req.headers['authorization'];
    if(!at|| !at.startsWith('Bearer ')){
        res.status(404).json();
    }else{
        try{
    const token=at.split('Bearer ')[1];
    const response=jwt.verify(token,key);
    req.user=response;
   next();
        }
        catch(err){
            console.log(err);
            return res.status(403).json({ error: 'Invalid or expired token' });
        }
    }
    

}

module.exports=authToken;