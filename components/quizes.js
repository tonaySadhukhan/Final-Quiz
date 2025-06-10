const mongoose=require('mongoose');
const questions=new mongoose.Schema({
    question:{
        type:String,
        require:true
    },
    image:{
        type:String
    },
    options:{
        type:[String],
        require:true
    },
    ans:{
        type:String,
        require:true
    },
    impressions:{
        type:Number,
        require:true
    },
    right:{
        type:Number,
        require:true
    }
});

const schema=new mongoose.Schema({
    name:{
        type:String,
        require:true
    },
    author:{
        type:String,
        require:true
    },
    date:{
        type:Date,
        default:Date.now()
    },
    impressions:{
        type:Number,
        require:true
    },
    rating:{
        type:Number,
        require:true
    },
    questions:[questions],
    players:{
        type:Map,
        of:Number
    }
})


const Questions = mongoose.model('Questions', questions);
const Quizes = mongoose.model('Quizes', schema);

module.exports = { Questions, Quizes };