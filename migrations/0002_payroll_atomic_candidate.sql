-- Candidate local-first payroll database, NOT applied to Cloudflare.
-- Monetary values use integer SIM minor units. Ownership is explicit to prevent a second payroll path.
PRAGMA foreign_keys=ON;
CREATE TABLE IF NOT EXISTS sim_wallets(
 account_id TEXT PRIMARY KEY,
 currency TEXT NOT NULL DEFAULT 'SIM' CHECK(currency='SIM'),
 available_minor INTEGER NOT NULL CHECK(available_minor>=0 AND available_minor<=9000000000000000)
);
CREATE TABLE IF NOT EXISTS sim_employments(
 employment_id TEXT PRIMARY KEY,
 worker_account TEXT NOT NULL REFERENCES sim_wallets(account_id),
 employer_account TEXT NOT NULL REFERENCES sim_wallets(account_id),
 settlement_owner TEXT NOT NULL CHECK(settlement_owner IN ('household_monthly','company_weekly')),
 payroll_cadence TEXT NOT NULL CHECK(payroll_cadence IN ('monthly','weekly')),
 first_period INTEGER NOT NULL CHECK(first_period>0),
 status TEXT NOT NULL CHECK(status IN ('active','resigned','terminated')),
 CHECK(worker_account<>employer_account),
 CHECK((settlement_owner='household_monthly' AND payroll_cadence='monthly') OR (settlement_owner='company_weekly' AND payroll_cadence='weekly'))
);
CREATE TABLE IF NOT EXISTS sim_payroll_terms(
 employment_id TEXT NOT NULL REFERENCES sim_employments(employment_id) ON DELETE CASCADE,
 terms_version INTEGER NOT NULL CHECK(terms_version>0),
 effective_from_period INTEGER NOT NULL CHECK(effective_from_period>0),
 gross_minor INTEGER NOT NULL CHECK(gross_minor>0 AND gross_minor<=100000000000),
 withholding_ppm INTEGER NOT NULL CHECK(withholding_ppm BETWEEN 0 AND 600000),
 created_at INTEGER NOT NULL DEFAULT 0,
 PRIMARY KEY(employment_id,terms_version),
 UNIQUE(employment_id,effective_from_period)
);
CREATE TABLE IF NOT EXISTS sim_payroll_events(
 event_id INTEGER PRIMARY KEY,
 employment_id TEXT NOT NULL REFERENCES sim_employments(employment_id),
 period_id INTEGER NOT NULL CHECK(period_id>0),
 terms_version INTEGER NOT NULL CHECK(terms_version>0),
 gross_minor INTEGER NOT NULL CHECK(gross_minor>=0),
 withheld_minor INTEGER NOT NULL CHECK(withheld_minor>=0),
 net_minor INTEGER NOT NULL CHECK(net_minor>=0),
 CHECK(gross_minor=withheld_minor+net_minor),
 UNIQUE(employment_id,period_id),
 FOREIGN KEY(employment_id,terms_version) REFERENCES sim_payroll_terms(employment_id,terms_version)
);
CREATE TABLE IF NOT EXISTS sim_payroll_ledger(
 event_id INTEGER NOT NULL REFERENCES sim_payroll_events(event_id),
 part TEXT NOT NULL CHECK(part IN ('salary_net','salary_withholding')),
 from_account TEXT NOT NULL REFERENCES sim_wallets(account_id),
 to_account TEXT NOT NULL REFERENCES sim_wallets(account_id),
 amount_minor INTEGER NOT NULL CHECK(amount_minor>0),
 PRIMARY KEY(event_id,part)
);
CREATE TRIGGER IF NOT EXISTS sim_payroll_authority_guard BEFORE INSERT ON sim_payroll_events
WHEN NOT EXISTS(
 SELECT 1 FROM sim_employments e
 WHERE e.employment_id=NEW.employment_id
 AND e.settlement_owner='household_monthly'
 AND e.payroll_cadence='monthly'
)
BEGIN
 SELECT RAISE(ABORT,'PAYROLL_AUTHORITY_MISMATCH');
END;
CREATE TRIGGER IF NOT EXISTS sim_payroll_commit AFTER INSERT ON sim_payroll_events BEGIN
 UPDATE sim_wallets SET available_minor=available_minor-NEW.gross_minor
 WHERE account_id=(SELECT employer_account FROM sim_employments WHERE employment_id=NEW.employment_id)
 AND available_minor>=NEW.gross_minor;
 SELECT CASE WHEN changes()!=1 THEN RAISE(ABORT,'PAYROLL_FUNDS_INSUFFICIENT') END;
 UPDATE sim_wallets SET available_minor=available_minor+NEW.net_minor
 WHERE account_id=(SELECT worker_account FROM sim_employments WHERE employment_id=NEW.employment_id);
 SELECT CASE WHEN changes()!=1 THEN RAISE(ABORT,'PAYROLL_WORKER_WALLET_MISSING') END;
 UPDATE sim_wallets SET available_minor=available_minor+NEW.withheld_minor WHERE account_id='system:government';
 SELECT CASE WHEN changes()!=1 THEN RAISE(ABORT,'PAYROLL_TAX_WALLET_MISSING') END;
 INSERT INTO sim_payroll_ledger(event_id,part,from_account,to_account,amount_minor)
 SELECT NEW.event_id,'salary_net',e.employer_account,e.worker_account,NEW.net_minor
 FROM sim_employments e WHERE e.employment_id=NEW.employment_id AND NEW.net_minor>0;
 INSERT INTO sim_payroll_ledger(event_id,part,from_account,to_account,amount_minor)
 SELECT NEW.event_id,'salary_withholding',e.employer_account,'system:government',NEW.withheld_minor
 FROM sim_employments e WHERE e.employment_id=NEW.employment_id AND NEW.withheld_minor>0;
END;
