import { instanceDomain } from '@moodlenet/core'
import { getCoreConfigs } from '@moodlenet/core/ignite'
import { mountApp } from '@moodlenet/http-server/server'
import { getProfileHomePageRoutePath } from '@moodlenet/web-user/common'
import session from 'express-session'
import passport from 'passport'
import { Strategy as SamlStrategy, type SamlConfig } from 'passport-saml'
import { extractAttributesFromSamlProfile, upsertSamlUser } from '../lib.mjs'
import { shell } from '../shell.mjs'
import { validateConfigAndGetCert } from './configtools.mjs'

shell.call(mountApp)({
  getApp: function getHttpApp(express) {
    const app = express()

    const { config, cert, key } = validateConfigAndGetCert()
    const { entryPoint, issuer, sessionSecret } = config

    const coreConfigs = getCoreConfigs()
    const callbackUrl = `${coreConfigs.instanceDomain}/.pkg/@citricity/saml-auth/callback`

    // Setup mandatory saml config options.
    const samlConfig: SamlConfig = {
      entryPoint,
      issuer,
      callbackUrl,
      cert,
    }

    // Add optional saml config options if available.
    if (config.privateKey) {
      samlConfig.privateKey = key
    }
    if (config.decryptionPvk) {
      samlConfig.decryptionPvk = key
    }
    samlConfig.wantAssertionsSigned = false

    const samlStrategy = new SamlStrategy(samlConfig, (profile: any, done: any) => {
      return done(null, profile)
    })

    passport.use(samlStrategy)

    // Setup middleware
    app.use(session({ secret: sessionSecret, resave: false, saveUninitialized: true }))
    app.use(express.urlencoded({ extended: true }))

    app.use(passport.initialize())
    app.use(passport.session())

    passport.serializeUser((user: any, done: any) => {
      //shell.log('debug','SERIALIZE USER', user);
      done(null, user)
    })

    passport.deserializeUser((obj: any, done: any) => {
      //shell.log('debug','DESERIALIZE USER', obj);
      done(null, obj)
    })

    app.get('/login-failed', (req, res) => {
      console.log('Saml login failed for request: ', req)
      res.send('Saml login failed')
    })

    app.get(
      '/login',
      passport.authenticate('saml', {
        successRedirect: '/success',
        failureRedirect: '/login',
      }),
    )

    app.post(
      '/callback',
      passport.authenticate('saml', {
        failureRedirect: '/login',
        failureFlash: true,
      }),
      async (req, res) => {
        const profile = req.user
        // Process user profile and extract necessary information.
        const attributes = extractAttributesFromSamlProfile(config.attributeMap, profile)
        // TODO - at some point we will want to support a displayName attribute along side firstName, lastName
        // so that we don't end up concatenating firstName and lastName which could be totally wrong for some
        // locales.
        const { uuid, email, firstName, lastName } = attributes
        const displayName = `${firstName} ${lastName}`

        const { sendHttpJwtToken, webUser } = await upsertSamlUser({ uuid, email, displayName })

        sendHttpJwtToken()

        res.redirect(
          getProfileHomePageRoutePath({
            _key: webUser.profileKey,
            displayName,
          }),
        )
      },
    )

    app.get('/logout', (req, res) => {
      req.logout({}, () => {
        res.redirect(instanceDomain)
      })
    })

    app.post('/success', (req, res) => {
      shell.log('debug', '!!!req.user', req.user)
      if (req.user) {
        res.send(JSON.stringify(req.user))
      }

      res.send('Login failed!')
    })
    return app
  },
})
