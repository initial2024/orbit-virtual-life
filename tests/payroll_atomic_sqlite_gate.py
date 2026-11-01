# Run explicitly: python3 tests/payroll_atomic_sqlite_gate.py
# SQLite compatibility/concurrency gate only: NOT a deployed Cloudflare D1 acceptance.
import sqlite3, tempfile, concurrent.futures
from pathlib import Path

sql=Path(__file__).resolve().parents[1].joinpath('migrations/0002_payroll_atomic_candidate.sql').read_text()
insert="""INSERT INTO sim_payroll_events(employment_id,period_id,terms_version,gross_minor,withheld_minor,net_minor)
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
ON CONFLICT(employment_id,period_id) DO NOTHING"""

with tempfile.TemporaryDirectory() as d:
 path=str(Path(d)/'test.sqlite')
 def connect():
  db=sqlite3.connect(path,timeout=60,isolation_level=None)
  db.execute('PRAGMA busy_timeout=60000')
  db.execute('PRAGMA foreign_keys=ON')
  return db
 db=connect();db.executescript(sql)
 db.executemany('INSERT INTO sim_wallets(account_id,available_minor) VALUES (?,?)',[
  ('company:one',3000000),('player:one',0),('player:two',0),('system:government',0)
 ])
 def add_employment(eid,worker,employer='company:one',owner='household_monthly',cadence='monthly',gross=100005,withholding=175000,effective=1):
  db.execute('INSERT INTO sim_employments(employment_id,worker_account,employer_account,settlement_owner,payroll_cadence,first_period,status) VALUES(?,?,?,?,?,?,?)',
   (eid,worker,employer,owner,cadence,1,'active'))
  db.execute('INSERT INTO sim_payroll_terms(employment_id,terms_version,effective_from_period,gross_minor,withholding_ppm) VALUES(?,?,?,?,?)',
   (eid,1,effective,gross,withholding))
 add_employment('job:one','player:one')
 total=db.execute('SELECT SUM(available_minor) FROM sim_wallets').fetchone()[0]
 def issue(employment='job:one',worker='player:one',period=1,server_period=1):
  conn=connect()
  try:
   conn.execute(insert,(period,employment,worker,period,period,server_period,period,period))
  finally:conn.close()
 with concurrent.futures.ThreadPoolExecutor(max_workers=24) as pool:
  list(pool.map(lambda _:issue(),range(96)))
 assert db.execute('SELECT COUNT(*) FROM sim_payroll_events').fetchone()[0]==1
 assert db.execute('SELECT COUNT(*) FROM sim_payroll_ledger').fetchone()[0]==2
 assert db.execute('SELECT SUM(available_minor) FROM sim_wallets').fetchone()[0]==total
 assert db.execute('SELECT gross_minor=net_minor+withheld_minor FROM sim_payroll_events').fetchone()[0]==1
 issue();assert db.execute('SELECT COUNT(*) FROM sim_payroll_events').fetchone()[0]==1
 issue(worker='player:two',period=2,server_period=2);assert db.execute('SELECT COUNT(*) FROM sim_payroll_events').fetchone()[0]==1
 issue(period=99,server_period=2);assert db.execute('SELECT COUNT(*) FROM sim_payroll_events').fetchone()[0]==1

 # Wage terms are frozen by effective period: later terms do not rewrite an earlier due period.
 db.execute("INSERT INTO sim_payroll_terms(employment_id,terms_version,effective_from_period,gross_minor,withholding_ppm) VALUES('job:one',2,3,200005,200000)")
 issue(period=2,server_period=2)
 issue(period=3,server_period=3)
 assert db.execute("SELECT terms_version,gross_minor FROM sim_payroll_events WHERE employment_id='job:one' AND period_id=2").fetchone()==(1,100005)
 assert db.execute("SELECT terms_version,gross_minor FROM sim_payroll_events WHERE employment_id='job:one' AND period_id=3").fetchone()==(2,200005)

 db.execute("UPDATE sim_employments SET status='resigned' WHERE employment_id='job:one'")
 issue(period=4,server_period=4);assert db.execute("SELECT COUNT(*) FROM sim_payroll_events WHERE employment_id='job:one' AND period_id=4").fetchone()[0]==0

 add_employment('job:large','player:two',gross=1000000000,withholding=100000)
 previous=db.execute('SELECT SUM(available_minor) FROM sim_wallets').fetchone()[0]
 try:issue(employment='job:large',worker='player:two',period=3,server_period=3)
 except sqlite3.IntegrityError as e:assert 'PAYROLL_FUNDS_INSUFFICIENT' in str(e)
 else:raise AssertionError('insufficient funds should abort')
 assert db.execute("SELECT COUNT(*) FROM sim_payroll_events WHERE employment_id='job:large'").fetchone()[0]==0
 assert db.execute('SELECT SUM(available_minor) FROM sim_wallets').fetchone()[0]==previous

 db.execute("UPDATE sim_employments SET status='active' WHERE employment_id='job:one'")
 add_employment('job:second','player:two',gross=100005,withholding=100000)
 def multi(t):
  employment,worker=t;issue(employment=employment,worker=worker,period=4,server_period=4)
 with concurrent.futures.ThreadPoolExecutor(max_workers=24) as pool:
  list(pool.map(multi,[('job:one','player:one'),('job:second','player:two')]*48))
 assert db.execute('SELECT COUNT(*) FROM sim_payroll_events WHERE period_id=4').fetchone()[0]==2
 assert db.execute('SELECT SUM(available_minor) FROM sim_wallets').fetchone()[0]==total

 db.execute("INSERT INTO sim_wallets(account_id,available_minor) VALUES('company:low',150000)")
 add_employment('job:third','player:one',employer='company:low',gross=100005,withholding=100000)
 add_employment('job:fourth','player:two',employer='company:low',gross=100005,withholding=100000)
 def try_pay(t):
  try:issue(employment=t[0],worker=t[1],period=5,server_period=5)
  except sqlite3.IntegrityError as e: assert 'PAYROLL_FUNDS_INSUFFICIENT' in str(e)
 with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
  list(pool.map(try_pay,[('job:third','player:one'),('job:fourth','player:two')]))
 assert db.execute('SELECT COUNT(*) FROM sim_payroll_events WHERE period_id=5').fetchone()[0]==1
 assert db.execute("SELECT available_minor FROM sim_wallets WHERE account_id='company:low'").fetchone()[0]==49995
 assert db.execute('SELECT SUM(available_minor) FROM sim_wallets').fetchone()[0]==total+150000

 # company_weekly belongs to company settlement. Monthly payroll must never pay it.
 add_employment('job:weekly','player:two',owner='company_weekly',cadence='weekly',gross=42000,withholding=0)
 before=db.execute('SELECT SUM(available_minor) FROM sim_wallets').fetchone()[0]
 issue(employment='job:weekly',worker='player:two',period=6,server_period=6)
 assert db.execute("SELECT COUNT(*) FROM sim_payroll_events WHERE employment_id='job:weekly'").fetchone()[0]==0
 try:
  db.execute("INSERT INTO sim_payroll_events(employment_id,period_id,terms_version,gross_minor,withheld_minor,net_minor) VALUES('job:weekly',6,1,42000,0,42000)")
 except sqlite3.IntegrityError as e:assert 'PAYROLL_AUTHORITY_MISMATCH' in str(e)
 else:raise AssertionError('company_weekly must not enter household payroll events')
 assert db.execute('SELECT SUM(available_minor) FROM sim_wallets').fetchone()[0]==before
 print('PASS: monthly payroll is idempotent, term-versioned, conserved, and rejects company_weekly double-debit')
