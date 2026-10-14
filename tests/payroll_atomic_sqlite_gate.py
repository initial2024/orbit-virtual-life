# Run explicitly: python3 tests/payroll_atomic_sqlite_gate.py
# SQLite compatibility/concurrency gate only: NOT a deployed Cloudflare D1 acceptance.
import sqlite3, tempfile, concurrent.futures
from pathlib import Path
sql=Path(__file__).resolve().parents[1].joinpath('migrations/0002_payroll_atomic_candidate.sql').read_text()
insert="""INSERT INTO sim_payroll_events(employment_id,period_id,gross_minor,withheld_minor,net_minor)
SELECT e.employment_id,?,e.gross_minor,
(e.gross_minor*e.withholding_ppm+500000)/1000000,
e.gross_minor-(e.gross_minor*e.withholding_ppm+500000)/1000000
FROM sim_employments e WHERE e.employment_id=? AND e.worker_account=?
AND e.status='active' AND e.first_period<=? AND ?=?
ON CONFLICT(employment_id,period_id) DO NOTHING"""
with tempfile.TemporaryDirectory() as d:
 path=str(Path(d)/'test.sqlite')
 def connect():
  db=sqlite3.connect(path,timeout=60,isolation_level=None)
  db.execute('PRAGMA busy_timeout=60000')
  db.execute('PRAGMA foreign_keys=ON')
  return db
 db=connect(); db.executescript(sql)
 db.executemany('INSERT INTO sim_wallets(account_id,available_minor) VALUES (?,?)',[('company:one',3000000),('player:one',0),('player:two',0),('system:government',0)])
 db.execute("INSERT INTO sim_employments VALUES('job:one','player:one','company:one',100005,175000,1,'active')")
 total=db.execute('SELECT SUM(available_minor) FROM sim_wallets').fetchone()[0]
 def issue(employment='job:one',worker='player:one',period=1,now=1):
  conn=connect()
  try:
   conn.execute(insert,(period,employment,worker,period,period,now))
  finally:conn.close()
 with concurrent.futures.ThreadPoolExecutor(max_workers=24) as pool:
  list(pool.map(lambda _:issue(),range(96)))
 assert db.execute('SELECT COUNT(*) FROM sim_payroll_events').fetchone()[0]==1
 assert db.execute('SELECT COUNT(*) FROM sim_payroll_ledger').fetchone()[0]==2
 assert db.execute('SELECT SUM(available_minor) FROM sim_wallets').fetchone()[0]==total
 assert db.execute('SELECT gross_minor=net_minor+withheld_minor FROM sim_payroll_events').fetchone()[0]==1
 issue();assert db.execute('SELECT COUNT(*) FROM sim_payroll_events').fetchone()[0]==1
 issue(worker='player:two',period=2,now=2);assert db.execute('SELECT COUNT(*) FROM sim_payroll_events').fetchone()[0]==1
 issue(period=99,now=2);assert db.execute('SELECT COUNT(*) FROM sim_payroll_events').fetchone()[0]==1
 issue(period=2,now=2);assert db.execute('SELECT COUNT(*) FROM sim_payroll_events').fetchone()[0]==2
 db.execute("UPDATE sim_employments SET status='resigned' WHERE employment_id='job:one'")
 issue(period=3,now=3);assert db.execute('SELECT COUNT(*) FROM sim_payroll_events').fetchone()[0]==2
 db.execute("INSERT INTO sim_employments VALUES('job:large','player:two','company:one',1000000000,100000,1,'active')")
 previous=db.execute('SELECT SUM(available_minor) FROM sim_wallets').fetchone()[0]
 try:issue(employment='job:large',worker='player:two',period=3,now=3)
 except sqlite3.IntegrityError as e:assert 'PAYROLL_FUNDS_INSUFFICIENT' in str(e)
 else:raise AssertionError('insufficient funds should abort')
 assert db.execute("SELECT COUNT(*) FROM sim_payroll_events WHERE employment_id='job:large'").fetchone()[0]==0
 assert db.execute('SELECT SUM(available_minor) FROM sim_wallets').fetchone()[0]==previous
 print('PASS: 96 parallel same-period requests => 1 payroll; authorization, cash conservation, insufficient funds and unemployment verified')
