import { form, getRequestEvent } from '$app/server';
import * as v from 'valibot';
import { getVerificationJWT, sendOTPCode, verifyOTP } from './auth';
import { redirect } from '@sveltejs/kit';
import { resolve } from '$app/paths';
import { createJWTSignatureMessage, encodeJWT, joseAlgorithmHS256 } from '@oslojs/jwt';

export const loginWithEmail = form(
	v.object({ email: v.pipe(v.string(), v.email()) }),
	async ({ email }) => {
		sendOTPCode(email);
		const { cookies } = getRequestEvent();

		cookies.set('verification', await getVerificationJWT(email), {
			path: '/',
			expires: new Date(Date.now() + 60 * 60)
		});
		redirect(302, resolve('/opt'));
	}
);
export const verifyOTPForm = form(v.object({ otp: v.number() }), ({ otp }) => {
	if (verifyOTP(otp)) {
		const { cookies } = getRequestEvent();
		const verificationJWT = cookies.get('verification');
		cookies.set();
	}
});
