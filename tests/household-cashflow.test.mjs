import test from 'node:test';
import assert from 'node:assert/strict';
import {REGION_HOUSEHOLD_PROFILE,estimateMonthlyNeeds,scaleRegionalSalary,forecastMonthlyCashflow,paycheckForecast,comparePaycheckAndForecast} from '../src/household-cashflow.mjs';
const zero={rent:0,food:0,transit:0,utilities:0,communications:0,healthcare:0};
const scenario={region:'tokyo',grossSalary:108500,withholdingRate:17500/108500,baseNeeds:{...zero,food:26083}};
test('D1 and D31 use identical forecast rules for identical inputs',()=>{
 const d1=forecastMonthlyCashflow(scenario),d31=forecastMonthlyCashflow(scenario);
 assert.deepEqual(d1,d31);assert.equal(d1.netPaycheck,91000);assert.equal(d1.spendableAfterNeeds,64917);
 assert.equal(d1.netPaycheck-d1.essentialTotal,d1.spendableAfterNeeds);
});
test('household payday object is forecast-only and cannot emit ledger transfers',()=>{
 const f=forecastMonthlyCashflow(scenario);
 const p=paycheckForecast({employmentId:'job001',periodId:1,grossSalary:108500,withholdingRate:17500/108500});
 assert.equal(p.netPaycheck,91000);assert.equal(p.withheldTax,17500);
 assert.equal(p.executionAuthority,'server_payroll');assert.equal(p.ledgerTransfers,false);
 assert.equal('transfers' in p,false);assert.equal('from' in p,false);assert.equal('to' in p,false);
 assert.deepEqual(comparePaycheckAndForecast(f,p),{paycheckMatchesForecast:true,delta:0});
});
test('first-cycle starter grant is separate from recurring payroll',()=>{
 const starter=forecastMonthlyCashflow({...scenario,oneTimeStarter:12000}),next=forecastMonthlyCashflow(scenario);
 assert.equal(starter.netPaycheck,next.netPaycheck);
 assert.equal(starter.initialMonthCashflow-next.initialMonthCashflow,12000);
});
test('forecast identity is deterministic per employment and period without becoming an idempotency key',()=>{
 const o={employmentId:'job001',grossSalary:10000,withholdingRate:.2};
 assert.deepEqual(paycheckForecast({...o,periodId:1}),paycheckForecast({...o,periodId:1}));
 assert.notEqual(paycheckForecast({...o,periodId:1}).forecastId,paycheckForecast({...o,periodId:2}).forecastId);
});
test('six region profiles and independently varied housing cost',()=>{
 assert.equal(Object.keys(REGION_HOUSEHOLD_PROFILE).length,6);
 for(const region of Object.keys(REGION_HOUSEHOLD_PROFILE)){assert.ok(scaleRegionalSalary(1000,region)>0);assert.ok(estimateMonthlyNeeds({region}).total>0);}
 assert.ok(estimateMonthlyNeeds({region:'new_york'}).byCategory.rent>estimateMonthlyNeeds({region:'tokyo'}).byCategory.rent);
});
test('same gross and tax gives same net paycheck, regardless of city expenses',()=>{
 const a=forecastMonthlyCashflow({region:'tokyo',grossSalary:10000,withholdingRate:.2});
 const b=forecastMonthlyCashflow({region:'new_york',grossSalary:10000,withholdingRate:.2});
 assert.equal(a.netPaycheck,b.netPaycheck);assert.notEqual(a.spendableAfterNeeds,b.spendableAfterNeeds);
});
test('zero and maximum withholding conserve gross arithmetic in the forecast',()=>{
 for(const rate of [0,.6]){
  const p=paycheckForecast({employmentId:'job001',periodId:2,grossSalary:1299.99,withholdingRate:rate});
  assert.equal(Math.round((p.netPaycheck+p.withheldTax)*100),129999);
 }
});
test('rejects unsafe input instead of silently inventing taxes',()=>{
 assert.throws(()=>forecastMonthlyCashflow({region:'unknown',grossSalary:10,withholdingRate:0}),/REGION_UNKNOWN/);
 assert.throws(()=>forecastMonthlyCashflow({region:'tokyo',grossSalary:NaN,withholdingRate:0}),/INVALID_MONEY/);
 assert.throws(()=>forecastMonthlyCashflow({region:'tokyo',grossSalary:10}),/INVALID_WITHHOLDING_RATE/);
 assert.throws(()=>forecastMonthlyCashflow({region:'tokyo',grossSalary:10,withholdingRate:-.2}),/INVALID_WITHHOLDING_RATE/);
 assert.throws(()=>forecastMonthlyCashflow({region:'tokyo',grossSalary:10,withholdingRate:1}),/INVALID_WITHHOLDING_RATE/);
 assert.throws(()=>paycheckForecast({employmentId:'job001',periodId:0,grossSalary:1,withholdingRate:0}),/INVALID_PAYROLL_ID/);
});
test('shortfall raises an explicit warning instead of reducing a paycheck',()=>{
 const f=forecastMonthlyCashflow({region:'new_york',grossSalary:100,withholdingRate:0});
 assert.equal(f.warning,'MONTHLY_DEFICIT');assert.ok(f.spendableAfterNeeds<0);assert.equal(f.netPaycheck,100);
});
