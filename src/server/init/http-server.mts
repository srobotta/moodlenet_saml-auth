import passport from 'passport';
import session from 'express-session';
import { Strategy as SamlStrategy } from 'passport-saml';
import { mountApp } from '@moodlenet/http-server/server'
import { shell } from '../shell.mjs'
import fs from 'node:fs';

shell.call(mountApp)({
  getApp: function getHttpApp(express) {
    const app = express();

    const configPath = `${process.cwd()}/default.config.json`;
    const configStr = fs.readFileSync(configPath, 'utf8');
    const configFull = JSON.parse(configStr);
    const { entryPoint, issuer, sessionSecret } = configFull.pkgs['@citricity/saml-auth'];
    const certPath = `${process.cwd()}/saml.cert`;
    const certStr = fs.readFileSync(certPath, 'utf8');
    const cert = certStr.replace('-----BEGIN CERTIFICATE-----', '')
      .replace('-----END CERTIFICATE-----', '')
      .replace(/\n/g, '')
      .trim();

    const samlStrategy = new SamlStrategy({
      entryPoint,
      issuer,
      callbackUrl: 'http://localhost:8080/.pkg/@citricity/saml-auth/callback',
      cert,
      // TODO - type done and maybe profile
    }, (profile: any, done: any) => {
        // Process user profile and extract necessary information
        console.log('!!!profile', profile);
        return done(null, profile);
    });
  
    passport.use(samlStrategy);

    // Setup middleware
    app.use(session({ secret: sessionSecret, resave: false, saveUninitialized: true }));
    app.use(express.urlencoded({ extended: true }));

    app.use(passport.initialize());
    app.use(passport.session());


    passport.serializeUser((user: any, done: any) => {
      console.log('SERIALIZE USER', user);
      done(null, user);
    });

    passport.deserializeUser((obj: any, done: any) => {
      console.log('DESERIALIZE USER', obj);
      done(null, obj);
    });


    app.get('/login-failed', ({}, res) => {
      res.send('Saml login failed');
    });

    app.get('/login', passport.authenticate('saml', {
      successRedirect: '/',
      failureRedirect: '/login'
    }));
    
    app.post('/callback', passport.authenticate('saml', {
        failureRedirect: '/login',
        failureFlash: true
    }), ({}, res) => {
        res.redirect('/');
    });
    
    app.get('/logout', (req, res) => {
        req.logout({}, () => res.redirect('/'));
    });
    
    app.post('/success', (req, res) => {
        console.log('!!!req.user', req.user);
        res.send('SUCCESS!');
    });
    return app;
  },
})
