// This is a callable D1-adapter, NOT a public HTTP endpoint. Caller must authenticate first.
// Employment and wage terms originate from authoritative server records, never request JSON.
// Uses one INSERT with UNIQUE(event,period) and an AFTER INSERT SQLite trigger.
const safeId=x=>typeof x==='string'&&/^[A-Za-z0-9:_-]{4,128}$/.test(x);
const INSERT=`INSERT INTO sim_payroll_events(employment_id,period_id,gross_minor,withheld_minor,net_minor)
 SELECT e.employment_id,?,e.gross_minor,
 (e.gross_minor*e.withholding_ppm+500000)/1000000,
 e.gross_minor-(e.gross_minor*e.withholding_ppm+500000)/1000000
 FROM sim_employments e WHERE e.employment_id=? AND e.worker_account=?
 AND e.status='active' AND e.first_period<=? AND ?=?
 ON CONFLICT(employment_id,period_id) DO NOTHING`;
const RECEIPT=`SELECT p.event_id,p.employment_id,p.period_id,p.gross_minor,p.withheld_minor,p.net_minor
 FROM sim_payroll_events p JOIN sim_employments e USING(employment_id)
 WHERE p.employment_id=? AND p.period_id=? AND e.worker_account=?`;
export async function settlePayrollOnce(db,{verifiedWorkerAccount,employmentId,periodId,serverPeriod}={}){
 if(!db?.prepare||!db?.batch||!safeId(verifiedWorkerAccount)||!safeId(employmentId)||
 !Number.isSafeInteger(periodId)||periodId<1||periodId>100000||
 !Number.isSafeInteger(serverPeriod)||periodId!==serverPeriod)throw Error('PAYROLL_REQUEST_INVALID');
 // D1 batch runs in a SQL transaction. Trigger transfers are atomic and INSERT replay is ignored.
 const [written,receipt]=await db.batch([
  db.prepare(INSERT).bind(periodId,employmentId,verifiedWorkerAccount,periodId,periodId,serverPeriod),
  db.prepare(RECEIPT).bind(employmentId,periodId,verifiedWorkerAccount)
 ]);
 const row=receipt?.results?.[0];
 if(!row)throw Error('PAYROLL_NOT_DUE_OR_NOT_AUTHORIZED');
 return {eventId:row.event_id,employmentId:row.employment_id,periodId:row.period_id,
 grossMinor:row.gross_minor,withheldMinor:row.withheld_minor,netMinor:row.net_minor,
 appliedThisRequest:(written?.meta?.changes||0)>0,idempotencyKey:row.employment_id+':'+row.period_id};
}
// Server integration contract:
// 1. Middleware verifies temp-mail-issued Orbit identity; never trust a client 'verifiedWorkerAccount'.
// 2. Derive serverPeriod from trusted simulation schedule, never from request body.
// 3. Company wallet must be authoritative and pre-provisioned; freeze wage terms for due period.
// 4. SQLite compatibility tests do not prove deployed D1/Worker multi-region behavior.
