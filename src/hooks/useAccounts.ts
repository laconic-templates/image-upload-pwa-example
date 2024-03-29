import { useEffect, useState } from "react";
import { BaseProvider, LitAuthClient } from "@lit-protocol/lit-auth-client";
import { ProviderType, AuthMethodType } from "@lit-protocol/constants";
import {
	IRelayPKP,
	IRelayPollStatusResponse,
	AuthMethod,
} from "@lit-protocol/types";
import { useStytchUser, useStytch } from "@stytch/react";

const litAuthClient: LitAuthClient = new LitAuthClient({
	litRelayConfig: {
		relayApiKey: "15DDD969-E75F-404D-AAD9-58A37C4FD354_snowball",
	},
});

export const useAccounts = () => {
	const { user } = useStytchUser();
	const stytch = useStytch();
	const [authMethod, setAuthMethod] = useState<AuthMethod>();
	const [pkps, setPkps] = useState<IRelayPKP[] | IRelayPollStatusResponse[]>(
		[],
	);
	const [pkp, setPKP] = useState<string>();
	const [provider, setProvider] = useState<BaseProvider>();

	useEffect(() => {
		async function handle() {
			if (user && !authMethod && !pkps.length) {
				const a = stytch.session.getTokens();
				const s = stytch.session.getSync();
				const userId = s?.user_id;
				const accessToken = a?.session_jwt;

				const provider = litAuthClient.initProvider(ProviderType.StytchOtp, {
					userId,
					appId: "project-test-52527567-9a15-4966-8cb4-d29d51e9dccc",
				});

				const authMethod = await provider.authenticate({
					accessToken,
				});

				setAuthMethod(authMethod);

				const allPKPs = await provider.fetchPKPsThroughRelayer(authMethod);

				// check if we have pkps, if we dont then create one
				let pkps = [];
				if (allPKPs.length === 0) {
					const pkp = await provider.relay.pollRequestUntilTerminalState(
						await provider.mintPKPThroughRelayer(authMethod),
					);
					pkps = [pkp];
				} else {
					pkps = allPKPs;
				}

				setPkps(pkps);
				setPKP(
					(pkps[0] as IRelayPKP).publicKey
						? (pkps[0] as IRelayPKP).publicKey
						: (pkps[0] as IRelayPollStatusResponse).pkpPublicKey,
				);

				setProvider(provider);
			}
		}
		handle();
	}, [stytch, user, authMethod, pkps]);

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	function getProviderByAuthMethod(
		authMethod: AuthMethod,
	): BaseProvider | undefined {
		switch (authMethod.authMethodType) {
			case AuthMethodType.GoogleJwt:
				return litAuthClient.getProvider(ProviderType.Google);
			case AuthMethodType.Discord:
				return litAuthClient.getProvider(ProviderType.Discord);
			case AuthMethodType.EthWallet:
				return litAuthClient.getProvider(ProviderType.EthWallet);
			case AuthMethodType.WebAuthn:
				return litAuthClient.getProvider(ProviderType.WebAuthn);
			case AuthMethodType.StytchEmailFactorOtp:
				return litAuthClient.getProvider(ProviderType.StytchEmailFactorOtp);
			case AuthMethodType.StytchSmsFactorOtp:
				return litAuthClient.getProvider(ProviderType.StytchSmsFactorOtp);
			case AuthMethodType.StytchOtp:
				return litAuthClient.getProvider(ProviderType.StytchOtp);
			default:
				return undefined;
		}
	}

	function logout() {
		stytch.session.revoke();
	}

	return {
		authMethod,
		pkps,
		provider,
		pkp,
		isLoggedIn: user === null ? false : true,
		logout,
	};
};
