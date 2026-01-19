const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const supabase = require('./supabaseClient');

passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID || 'placeholder_client_id',
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'placeholder_client_secret',
            callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/auth/google/callback',
        },
        async (accessToken, refreshToken, profile, done) => {
            try {
                const email = profile.emails[0].value;
                const fullName = profile.displayName;
                const avatarUrl = profile.photos[0]?.value;

                // Check if user exists
                const { data: existingUser, error: fetchError } = await supabase
                    .from('users')
                    .select('*')
                    .eq('email', email)
                    .single();

                if (existingUser) {
                    // Check if user is banned
                    if (!existingUser.is_verified) {
                        return done(null, false, { message: 'Tài khoản đã bị khóa' });
                    }
                    // User exists and not banned, return user
                    return done(null, existingUser);
                }

                // User doesn't exist, create new customer account
                const { data: newUser, error: createError } = await supabase
                    .from('users')
                    .insert([
                        {
                            email,
                            full_name: fullName,
                            avatar_url: avatarUrl,
                            role: 'customer',
                            password_hash: null, // OAuth users don't have password
                        },
                    ])
                    .select()
                    .single();

                if (createError) throw createError;

                return done(null, newUser);
            } catch (err) {
                console.error('Google OAuth Error:', err);
                return done(err, null);
            }
        }
    )
);

// Serialize user for session (not used with JWT, but required by Passport)
passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const { data: user } = await supabase
            .from('users')
            .select('*')
            .eq('id', id)
            .single();
        done(null, user);
    } catch (err) {
        done(err, null);
    }
});

module.exports = passport;
