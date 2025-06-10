const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('./components/admin'); 
require('dotenv').config();
const sendMail=require('./mail');
// ensure this is the correct path

passport.serializeUser((user, done) => {
    done(null, user.id); // Save Mongo _id to session
});

passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (err) {
        done(err, null);
    }
});

passport.use(new GoogleStrategy({
    clientID: process.env.client_ID,
    clientSecret: process.env.client_secret,
    callbackURL: 'http://localhost:3000/auth/google/callback'
}, async (accessToken, refreshToken, profile, done) => {
    try {
        let user = await User.findOne({ googleId: profile.id });

        if (!user) {
            // New Google user -> create account
            user = new User({
                googleId: profile.id,
                name: profile.displayName,
                email: profile.emails?.[0]?.value || '',
                profilePhoto: profile.photos?.[0]?.value || '',
                quizes: []
            });

            await user.save();
            sendMail(user.email,'Congratulations for joining Mind Spark');
        }

        // Existing user or newly created
        done(null, user);
    } catch (err) {
        done(err, null);
    }
}));
