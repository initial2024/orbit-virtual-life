// Callable D1 adapter, NOT a public HTTP endpoint. Caller must authenticate first.
// Only household_monthly/monthly employments are owned by this adapter.
// Player-company weekly wages remain exclusively owned by company settlement.
const safeId=x=>typeof x==='string'&&/^[A-Za-z0-9:_-]{4,128}$/.test(x);
const INSERT=`INSERT INTO sim_payroll_events(employment_id,period_id,terms_version,gross_minor,withheld_minor,net_minor)
 SELECT e.employment_id,?,t.terms_version,t.gross_minor,
 (t.gross_minor*t.withholding_ppm+500000)/1000000,
 t.gross_minor-(t.gross_minor*t.withholding_ppm+500000)/1000000
 FROM sim_employments e JOIN sim_payroll_terms t ON t.employment_id=e.employment_id
 WHERE e.employment_id=? AND e.worker_account=?
 AND e.status='active' AND e.settlement_owner='household_monthly' AND e.payroll_cadence='monthly'
 AND e.first_period<=? AND ?=?
 AND t.effective_from_period<=?
 AND NOT EXISTS(
   SELECT 1 FROM sim_payroll_terms newer
   WHERE newer.employment_id=t.employment_id
   AND newer.effective_from_period<=?
   AND newer.effective_from_period>t.effective_from_period
 )
 ON CONFLICT(employment_id,period_id) DO NOTHING`;
const RECEIPT=`SELECT p.event_id,p.employment_id,p.period_id,p.terms_version,p.gross_minor,p.withheld_minor,p.net_minor
 FROM sim_payroll_events p JOIN sim_employments e USING(employment_id)
 WHERE p.employment_id=? AND p.period_id=? AND e.worker_account=?
 AND e.settlement_owner='household_monthly' AND e.payroll_cadence='monthly'`;
export async function settlePayrollOnce(db,{verifiedWorkerAccount,employmentId,periodId,serverPeriod}={}){
 if(!db?.prepare||!db?.batch||!safeId(verifiedWorkerAccount)||!safeId(employmentId)||
 !Number.isSafeInteger(periodId)||periodId<1||periodId>100000||
 !Number.isSafeInteger(serverPeriod)||periodId!==serverPeriod)throw Error('PAYROLL_REQUEST_INVALID');
 // D1 batch runs in a SQL transaction. The DB trigger rejects the company_weekly authority even on direct inserts.
 const [written,receipt]=await db.batch([
  db.prepare(INSERT).bind(periodId,employmentId,verifiedWorkerAccount,periodId,periodId,serverPeriod,periodId,periodId),
  db.prepare(RECEIPT).bind(employmentId,periodId,verifiedWorkerAccount)
 ]);
 const row=receipt?.results?.[0];
 if(!row)throw Error('PAYROLL_NOT_DUE_OR_NOT_AUTHORIZED');
 return {eventId:row.event_id,employmentId:row.employment_id,periodId:row.period_id,termsVersion:row.terms_version,
 grossMinor:row.gross_minor,withheldMinor:row.withheld_minor,netMinor:row.net_minor,
 settlementOwner:'household_monthly',payrollCadence:'monthly',
 appliedThisRequest:(written?.meta?.changes||0)>0,idempotencyKey:'household-monthly:'+row.employment_id+':'+row.period_id};
}
// Server integration contract:
// 1. Middleware verifies temp-mail-issued Orbit identity; never trust a client verifiedWorkerAccount.
// 2. Derive serverPeriod from the trusted simulation schedule, never from request JSON.
// 3. Wage/withholding terms are versioned by effective_from_period; late settlement uses the terms effective for that due period.
// 4. company_weekly employment is rejected here at both SELECT and DB-trigger layers; its only execution owner is company settlement.
// 5. SQLite compatibility tests do not prove deployed D1/Worker multi-region behavior.
