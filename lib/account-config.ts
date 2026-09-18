import {betterAuth} from 'better-auth/minimal';
import {username} from 'better-auth/plugins/username';
import type {BetterAuthOptions} from 'better-auth';

export function createAccountAuth(options: {database: BetterAuthOptions['database']; secret: string; baseURL: string; google?: {clientId:string;clientSecret:string}; sendMail: (to:string,subject:string,text:string)=>Promise<void>}) {
 return betterAuth({
  appName:'My Day Harbor', baseURL:options.baseURL, basePath:'/api/account', secret:options.secret,
  database:options.database, trustedOrigins:[options.baseURL],
  emailAndPassword:{enabled:true,minPasswordLength:15,maxPasswordLength:128,requireEmailVerification:true,autoSignIn:false,revokeSessionsOnPasswordReset:true,resetPasswordTokenExpiresIn:1800,
   sendResetPassword:async({user,url})=>{await options.sendMail(user.email,'Reset your My Day Harbor password',`You requested a password reset. This link expires in 30 minutes:\n\n${url}\n\nIf you did not request this, ignore this email.`);}},
  emailVerification:{sendOnSignUp:true,sendOnSignIn:false,autoSignInAfterVerification:false,expiresIn:3600,
   sendVerificationEmail:async({user,url})=>{await options.sendMail(user.email,'Verify your My Day Harbor email',`Verify your email to finish creating your account. This link expires in one hour:\n\n${url}\n\nIf you did not request this, ignore this email.`);}},
  session:{expiresIn:604800,updateAge:86400,cookieCache:{enabled:false}},
  socialProviders:options.google?{google:{...options.google,prompt:'select_account',accessType:'online',includeGrantedScopes:false}}:{},
  user:{validateUserInfo:({user,source})=>{if(source.oauth?.providerId==='google'&&user.emailVerified!==true)return {error:'email_not_verified',errorDescription:'Use a Google account with a verified email address.'};}},
  account:{encryptOAuthTokens:true,accountLinking:{enabled:!!options.google,disableImplicitLinking:true,allowDifferentEmails:false}},
  rateLimit:{enabled:true,storage:'database',window:60,max:30,customRules:{'/sign-up/email':{window:3600,max:5},'/request-password-reset':{window:3600,max:5},'/send-verification-email':{window:3600,max:5},'/sign-in/email':{window:60,max:5},'/sign-in/username':{window:60,max:5}}},
  advanced:{cookiePrefix:'mdh',useSecureCookies:options.baseURL.startsWith('https://'),ipAddress:{ipAddressHeaders:['cf-connecting-ip']}},
  plugins:[username({minUsernameLength:3,maxUsernameLength:30})],
 });
}
