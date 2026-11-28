-- Retire the Django-only tables and the Dramatiq task id. No CASCADE: a missed dependency must fail loudly.
DROP TABLE IF EXISTS django_dramatiq_task;--> statement-breakpoint
DROP TABLE IF EXISTS django_admin_log;--> statement-breakpoint
DROP TABLE IF EXISTS django_session;--> statement-breakpoint
DROP TABLE IF EXISTS authtoken_token;--> statement-breakpoint
DROP TABLE IF EXISTS account_emailconfirmation;--> statement-breakpoint
DROP TABLE IF EXISTS account_emailaddress;--> statement-breakpoint
DROP TABLE IF EXISTS socialaccount_socialtoken;--> statement-breakpoint
DROP TABLE IF EXISTS socialaccount_socialaccount;--> statement-breakpoint
DROP TABLE IF EXISTS socialaccount_socialapp_sites;--> statement-breakpoint
DROP TABLE IF EXISTS socialaccount_socialapp;--> statement-breakpoint
DROP TABLE IF EXISTS django_site;--> statement-breakpoint
DROP TABLE IF EXISTS user_extendeduser_groups;--> statement-breakpoint
DROP TABLE IF EXISTS user_extendeduser_user_permissions;--> statement-breakpoint
DROP TABLE IF EXISTS auth_group_permissions;--> statement-breakpoint
DROP TABLE IF EXISTS auth_group;--> statement-breakpoint
DROP TABLE IF EXISTS auth_permission;--> statement-breakpoint
DROP TABLE IF EXISTS django_content_type;--> statement-breakpoint
DROP TABLE IF EXISTS django_migrations;--> statement-breakpoint
ALTER TABLE appointment_appointment DROP COLUMN IF EXISTS task_id;
