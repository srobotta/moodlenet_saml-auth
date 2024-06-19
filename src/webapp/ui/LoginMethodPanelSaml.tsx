import { PrimaryButton } from '@moodlenet/component-library'
import { shell } from '../shell.mjs'
import { useRef, useState } from 'react'
import { LocalSamlConfig } from '../../server/types.mjs'
export const LoginButton = () => {
  return <PrimaryButton color="blue">Using Saml</PrimaryButton>
}

export const LoginMethodPanelSaml = () => {
  const configSet = useRef(false);
  const [config, setConfig] = useState<LocalSamlConfig>();

  const requestAndApplyConfig = async () => {
    if (configSet.current) {
      return;
    }
    const res = await shell.rpc.me('config')();
    setConfig(res);
    configSet.current = true;
  }

  requestAndApplyConfig();

  return <div>
    {!config ?
      <div>Loading</div> :
      <div>
        <a href='/.pkg/@citricity/saml-auth/login'>{config.linkText}</a>
      </div>
    }
  </div>;
};
