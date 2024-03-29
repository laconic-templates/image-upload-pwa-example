import React from "react";
import { StytchLogin } from "@stytch/react";
import {
	Callbacks,
	OAuthProviders,
	OTPMethods,
	Products,
	StytchEvent,
	StytchEventType,
	StytchLoginConfig,
	StytchSDKUIError,
} from "@stytch/vanilla-js";

import { getDomainFromWindow } from "../utils/templateHelper";

const Login: React.FC = () => {
	const style = {
		container: {
			width: "100%",
		},
		buttons: {
			primary: {
				backgroundColor: "#4A37BE",
				borderColor: "#4A37BE",
			},
		},
	};

	const callbacks: Callbacks = {
		onEvent(event: StytchEvent) {
			const { type, data } = event;
			if (type === StytchEventType.MagicLinkLoginOrCreateEvent) {
				console.log("Email magic Link sent", data);
			}
		},
		onError(error: StytchSDKUIError) {
			console.log(error.message);
		},
	};

	const config: StytchLoginConfig = {
		products: [Products.emailMagicLinks, Products.oauth, Products.otp],
		emailMagicLinksOptions: {
			loginRedirectURL: getDomainFromWindow() + "/authenticate",
			loginExpirationMinutes: 60,
			signupRedirectURL: getDomainFromWindow() + "/authenticate",
			signupExpirationMinutes: 60,
		},
		oauthOptions: {
			providers: [{ type: OAuthProviders.Google }],
			loginRedirectURL: getDomainFromWindow() + "/authenticate",
			signupRedirectURL: getDomainFromWindow() + "/authenticate",
		},
		otpOptions: {
			methods: [OTPMethods.SMS],
			expirationMinutes: 10,
		},
	};

	return <StytchLogin config={config} styles={style} callbacks={callbacks} />;
};

export default Login;
