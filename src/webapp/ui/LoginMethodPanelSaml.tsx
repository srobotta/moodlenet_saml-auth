import { PrimaryButton } from '@moodlenet/component-library'
export const LoginButton = () => {
  return <PrimaryButton color="blue">Using Saml</PrimaryButton>
}

export const LoginMethodPanelSaml = () => {
  return <div>
    <a href='/.pkg/@citricity/saml-auth/login'>Click to login via SAML!</a>
  </div>
};
