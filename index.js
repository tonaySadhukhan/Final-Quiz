const express = require('express');
const app = express();
const db = require('./db');
const admin = require('./components/admin');
const { Questions, Quizes } = require('./components/quizes');
require('./passport');
const passport = require('passport');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const cors = require('cors');
const path = require('path');
const jwt=require('jsonwebtoken');
require('dotenv').config();
const sendMail=require('./mail');
const authToken=require('./auth');
const SECRET_KEY=process.env.SECRET_KEY;
// ✅ CORS
app.use(cors({
  origin: 'http://127.0.0.1:5500',
  credentials: true
}));

function generateToken(user){
    console.log(user.id,user.email);
     return jwt.sign({ id: user.id, email: user.email }, SECRET_KEY, { expiresIn: '2h' });
}
function validate(token){
    try {
    return jwt.verify(token, SECRET_KEY);
  } catch (err) {
    return null;
  }
}

// ✅ Session
// app.use(session({
//   secret: process.env.SESSION_SECRET || 'your-secret-key',
//   resave: false,
//   saveUninitialized: false,
//   cookie: {
//     httpOnly: true,
//     secure: false,
//     sameSite: 'Lax',
//     maxAge: 60 * 60 * 1000 // 1 hour
//   }
// }));

// ✅ JSON parser
app.use(express.json());

// ✅ Passport Setup
app.use(passport.initialize());
//app.use(passport.session());

// ✅ Views (optional)
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ✅ Routes
app.get('/', (req, res) => {
  res.send("Hello Welcome to Quiz");
});

app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

app.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/failure', session: false }),
  (req, res) => {
    // User authenticated successfully, generate token and send to frontend via window.postMessage
    const token = generateToken(req.user);

    res.send(`
      <script>
        window.opener.postMessage({
          user: ${JSON.stringify(req.user)},
          token: "${token}"
        }, "*");
        window.close();
      </script>
    `);
  }
);

// ✅ Success route (called by frontend)
// app.get('/success', (req, res) => {
//   if (!req.user) return res.redirect('/failure');

//   const token = generateToken(req.user);

//   res.send(`
//     <script>
//       window.opener.postMessage({
//         user: ${JSON.stringify(req.user)},
//         token: "${token}"
//       }, "*");
//       window.close();
//     </script>
//   `);
// });


// ✅ Check Session route


app.post('/verify-token', express.json(), (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.json({ success: false });
  }

  const token = authHeader.split(' ')[1];
  const decoded = validate(token);

  if (!decoded) return res.json({ success: false });

  res.json({ success: true, user: decoded });
});

app.get('/failure', (req, res) => {
  res.send("Google Login Failed");
});

// ✅ CRUD APIs
app.post('/setquiz',authToken, async (req, res) => {
  const data = req.body;
  const par = req.query.id;
  try {
    const newData = new Quizes(data);
    const response = await newData.save();
    const response2 = await admin.findByIdAndUpdate(
      { _id: par },
      { $push: { quizes: response._id } },
      { new: true }
    );

    if (response && response2) {
      res.status(200).json({ quizId: response._id });
    } else {
      res.status(400).send("Failed to link quiz with admin");
    }
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error");
  }
});

app.get('/getquiz',authToken, async (req, res) => {
  const par = req.query.id;
  try {
    const response = await Quizes.findById(par);
    if (response) {
      res.status(200).send(response);
    } else {
      res.status(404).send("Quiz not found");
    }
  } catch (err) {
    console.log(err);
    res.status(500).send("Internal Server Error");
  }
});

app.post('/setAdmin', authToken,async (req, res) => {
  try {
    const data = req.body;
    // You can add admin creation logic here
    res.status(201).send("Admin route hit");
  } catch (err) {
    console.log(err);
    res.status(500).send("Internal Server Error");
  }
});

app.get('/getAdmin', authToken,async (req, res) => {
  const par = req.query.email;
  try {
    const response = await admin.findOne({ "email": par });
    if (response) {
      res.status(200).send(response);
    } else {
      res.status(404).send("No data found");
    }
  } catch (err) {
    console.log(err);
    res.status(500).send("Internal Server Error");
  }
});

app.delete('/deletquiz', authToken,async (req, res) => {
  const par = req.query.id;
  const adminid = req.query.admin;
  try {
    const response = await Quizes.deleteOne({ "_id": par });
    const response2 = await admin.findByIdAndUpdate(
      { _id: adminid },
      { $pull: { quizes: par } },
      { new: true }
    );
    if (response && response2) {
      res.status(200).send("Data deleted successfully");
    } else {
      res.status(404).send("Data not Found");
    }
  } catch (err) {
    console.log(err);
    res.status(500).send("Internal Server error");
  }
});

app.put('/updateImpression', authToken,async (req, res) => {
  const id = req.query.id;
  try {
    const { impressions, rating } = req.body;

    const updatedQuiz = await Quizes.findOneAndUpdate(
      { _id: id },
      { $set: { impressions, rating } },
      { new: true }
    );

    if (!updatedQuiz) {
      return res.status(404).send("Quiz not found");
    }

    res.status(200).json(updatedQuiz);
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error");
  }
});

app.put('/update-question', authToken,async (req, res) => {
  const { quizId, questionId } = req.query;
  const { impressions, right } = req.body;

  try {
    const quiz = await Quizes.findById(quizId);
    if (!quiz) return res.status(404).send("Quiz not found");

    const question = quiz.questions.id(questionId);
    if (!question) return res.status(404).send("Question not found");

    if (impressions !== undefined) question.impressions = impressions;
    if (right !== undefined) question.right = right;

    await quiz.save();

    res.status(200).json({ message: "Question updated successfully", question });
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error");
  }
});

app.put('/add-quiz-admin', authToken,async (req, res) => {
  const par = req.query.id;
  try {
    const { quizid } = req.body;
    const response = await admin.findByIdAndUpdate(
      { _id: par },
      { $push: { quizes: quizid } },
      { new: true }
    );
    if (response) {
      res.status(200).send(response);
    } else {
      res.status(404).send("Admin not found");
    }
  } catch (err) {
    console.log(err);
    res.status(500).send("Internal Server error");
  }
});
app.post('/sign-up', async (req,res)=>{
    const password=req.body.password;
    const newPassword= await bcrypt.hash(password,10);
    const newData={
        name:req.body.name,
        email:req.body.email,
        password:newPassword
    }
    try{
        const test=await admin.findOne({email:newData.email});
        if(test){
            res.send("User already exists");
        }
        const data=new admin(newData);
        const response=await data.save();
        if(response){
            console.log(response.email);
            sendMail(response.email,'Congratulations for joining Mind Spark');
            res.status(200).send('Signup successfull');

        }else{
            res.status(400);
        }
    }catch(err){
        console.log(err);
        res.status(500).send('Internal Server error');
    }

});

app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await admin.findOne({ email });
    if (!user) {
      return res.status(401).send('Invalid email or password');
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).send('Invalid email or password');
    }

    // Password matches, generate JWT token
    const token = jwt.sign(
      { id: user._id, email: user.email },
      SECRET_KEY,       // Replace with your secret key
      { expiresIn: '1h' }
    );

    // Send token and user info as JSON response
    res.status(200).json({
      message: 'Login successful',
      token,
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
});



// app.get('/cookie', (req, res) => {
//   res.cookie('token', 'demo-cookie', {
//     httpOnly: true,
//     secure: false,
//     maxAge: 60 * 60 * 1000,
//     sameSite: 'Lax',
//     path: '/'
//   });

//   res.send("Cookie has been set");
// });

app.listen(3000, () => {
  console.log("Server started on http://localhost:3000");
});
