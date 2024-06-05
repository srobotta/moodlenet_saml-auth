import { Route } from 'react-router-dom'
import { SAML_LOGIN_PATH } from '../common/webapp-routes.mjs'
import { SamlLogin } from './ui/SamlLogin.js'
export const routes = (
  <>
    <Route path={SAML_LOGIN_PATH} element={<SamlLogin />} />
  </>
)
