ALTER TABLE appointment_appointment ADD COLUMN IF NOT EXISTS reminder_sent_at timestamptz NULL;--> statement-breakpoint
ALTER TABLE appointment_appointment ADD COLUMN IF NOT EXISTS confirmation_sent_at timestamptz NULL;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS appointment_appointment_salon_id_appointment_time_idx ON appointment_appointment (salon_id, appointment_time);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS customer_customer_phone_number_idx ON customer_customer (phone_number);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS appointment_appointment_reminder_pending_idx ON appointment_appointment (appointment_time) WHERE reminder_sent_at IS NULL;--> statement-breakpoint
-- One-off backfill: appointments whose reminder moment has already passed must not be reminded by the first sweep.
UPDATE appointment_appointment a
SET reminder_sent_at = now()
FROM salon_salon s
WHERE s.id = a.salon_id
  AND a.reminder_sent_at IS NULL
  AND a.appointment_time - make_interval(mins => s.reminder_time_minutes) <= now();
