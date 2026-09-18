import { sqliteTable, text, integer, index, primaryKey } from 'drizzle-orm/sqlite-core';
export const wellnessEntries=sqliteTable('wellness_entries',{id:text('id').primaryKey(),userId:text('user_id').notNull(),day:text('day').notNull(),kind:text('kind').notNull(),dataJson:text('data_json').notNull(),createdAt:text('created_at').notNull(),updatedAt:text('updated_at').notNull()},table=>[index('idx_wellness_entries_user_day').on(table.userId,table.day)]);
export const wellnessSettings=sqliteTable('wellness_settings',{userId:text('user_id').primaryKey(),dataJson:text('data_json').notNull(),updatedAt:text('updated_at').notNull()});
export const wellnessDays=sqliteTable('wellness_days',{userId:text('user_id').notNull(),day:text('day').notNull(),complete:integer('complete').notNull().default(0)},table=>[primaryKey({columns:[table.userId,table.day]})]);

export const user=sqliteTable('account_users',{
 id:text('id').primaryKey(),name:text('name').notNull(),email:text('email').notNull().unique(),emailVerified:integer('email_verified',{mode:'boolean'}).notNull().default(false),image:text('image'),
 createdAt:integer('created_at',{mode:'timestamp_ms'}).notNull(),updatedAt:integer('updated_at',{mode:'timestamp_ms'}).notNull(),username:text('username').unique(),displayUsername:text('display_username'),
});
export const session=sqliteTable('account_sessions',{
 id:text('id').primaryKey(),expiresAt:integer('expires_at',{mode:'timestamp_ms'}).notNull(),token:text('token').notNull().unique(),createdAt:integer('created_at',{mode:'timestamp_ms'}).notNull(),updatedAt:integer('updated_at',{mode:'timestamp_ms'}).notNull(),ipAddress:text('ip_address'),userAgent:text('user_agent'),userId:text('user_id').notNull().references(()=>user.id,{onDelete:'cascade'}),
},t=>[index('idx_account_sessions_user').on(t.userId)]);
export const account=sqliteTable('account_credentials',{
 id:text('id').primaryKey(),accountId:text('account_id').notNull(),providerId:text('provider_id').notNull(),userId:text('user_id').notNull().references(()=>user.id,{onDelete:'cascade'}),accessToken:text('access_token'),refreshToken:text('refresh_token'),idToken:text('id_token'),accessTokenExpiresAt:integer('access_token_expires_at',{mode:'timestamp_ms'}),refreshTokenExpiresAt:integer('refresh_token_expires_at',{mode:'timestamp_ms'}),scope:text('scope'),password:text('password'),createdAt:integer('created_at',{mode:'timestamp_ms'}).notNull(),updatedAt:integer('updated_at',{mode:'timestamp_ms'}).notNull(),
},t=>[index('idx_account_credentials_user').on(t.userId)]);
export const verification=sqliteTable('account_verifications',{
 id:text('id').primaryKey(),identifier:text('identifier').notNull(),value:text('value').notNull(),expiresAt:integer('expires_at',{mode:'timestamp_ms'}).notNull(),createdAt:integer('created_at',{mode:'timestamp_ms'}).notNull(),updatedAt:integer('updated_at',{mode:'timestamp_ms'}).notNull(),
},t=>[index('idx_account_verifications_identifier').on(t.identifier)]);
export const rateLimit=sqliteTable('account_rate_limits',{id:text('id').primaryKey(),key:text('key').notNull().unique(),count:integer('count').notNull(),lastRequest:integer('last_request').notNull()});
