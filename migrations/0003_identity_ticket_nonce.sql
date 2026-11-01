-- Candidate only: apply exclusively to the separately authorized Virtual Life D1.
-- Never apply to City or Orbit Hub. No existing player saves are changed.
CREATE TABLE IF NOT EXISTS life_identity_tickets (
 jti TEXT PRIMARY KEY,
 app_id TEXT NOT NULL CHECK(app_id='virtual-life'),
 subject_id TEXT NOT NULL CHECK(subject_id NOT LIKE 'admin:%'),
 purpose TEXT NOT NULL CHECK(purpose IN ('game_login','account_deprovision')),
 expires_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS life_identity_ticket_expiry ON life_identity_tickets(expires_at);
