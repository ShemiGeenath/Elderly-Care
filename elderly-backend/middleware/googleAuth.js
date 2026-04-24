const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const ElderlyUser = require('../models/ElderlyUser');
const jwt = require('jsonwebtoken');

// Serialize user for session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await ElderlyUser.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

// Generate JWT token for Google-authenticated user
const generateUserToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || "your_secret_key", {
    expiresIn: "7d",
  });
};

// Google Strategy configuration
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
      passReqToCallback: true,
    },
    async (req, accessToken, refreshToken, profile, done) => {
      try {
        console.log("🔍 Google profile received:", {
          id: profile.id,
          email: profile.emails?.[0]?.value,
          name: profile.displayName,
          photo: profile.photos?.[0]?.value
        });
        
        // Check if user exists with this Google ID
        let user = await ElderlyUser.findOne({ googleId: profile.id });
        
        if (user) {
          console.log("✅ User found by Google ID:", user._id);
          // Update profile photo if changed
          if (profile.photos?.[0]?.value && user.profilePhoto !== profile.photos[0].value) {
            user.profilePhoto = profile.photos[0].value;
            await user.save();
          }
          return done(null, user);
        }
        
        // Check if user exists with this email
        const email = profile.emails?.[0]?.value?.toLowerCase();
        if (email) {
          user = await ElderlyUser.findOne({ email });
          
          if (user) {
            console.log("✅ Found existing user by email, linking Google account:", user._id);
            // Link Google account to existing user
            user.googleId = profile.id;
            if (!user.profilePhoto && profile.photos?.[0]?.value) {
              user.profilePhoto = profile.photos[0].value;
            }
            await user.save();
            return done(null, user);
          }
        }
        
        // Create new user
        const nameParts = profile.displayName?.split(' ') || ['Google', 'User'];
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';
        
        console.log("📝 Creating new Google user:", { firstName, lastName, email });
        
        const newUser = await ElderlyUser.create({
          firstName: firstName,
          lastName: lastName || 'User',
          email: email,
          googleId: profile.id,
          profilePhoto: profile.photos?.[0]?.value || 'https://res.cloudinary.com/your-cloud-name/image/upload/v1/eldercare/defaults/default-avatar.png',
          coverPhoto: 'https://res.cloudinary.com/your-cloud-name/image/upload/v1/eldercare/defaults/default-cover.jpg',
          acceptTerms: true,
          acceptPrivacy: true,
          isVerified: true,
          isActive: true,
          bio: `Hi! I'm ${firstName}. I joined via Google.`,
          hobbies: [],
          helpNeeded: [],
          mobility: "independent"
        });
        
        console.log("✅ New Google user created:", newUser._id);
        return done(null, newUser);
      } catch (err) {
        console.error('❌ Google Strategy Error:', err);
        return done(err, null);
      }
    }
  )
);

module.exports = { passport, generateUserToken };