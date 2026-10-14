// Virtual Life household cash-flow plan. SIM-denominated, not real-world legal tax advice.
// Plans are NOT ledger executions. Region coefficients are game tuning candidates.
export const REGION_HOUSEHOLD_PROFILE=Object.freeze({
 tokyo:Object.freeze({wage:1,rent:1,food:1,transit:1,utilities:1,communications:1,healthcare:1}),
 seoul:Object.freeze({wage:.92,rent:1.04,food:1.02,transit:.92,utilities:.94,communications:.96,healthcare:.95}),
 singapore:Object.freeze({wage:1.20,rent:1.55,food:1.10,transit:.87,utilities:1.10,communications:.97,healthcare:1.07}),
 new_york:Object.freeze({wage:1.42,rent:1.85,food:1.25,transit:1.12,utilities:1.22,communications:1.12,healthcare:1.48}),
 paris:Object.freeze({wage:1.05,rent:1.31,food:1.10,transit:.89,utilities:1.09,communications:.92,healthcare:1.04}),
 shanghai:Object.freeze({wage:.72,rent:.91,food:.75,transit:.69,utilities:.73,communications:.82,healthcare:.72})
});
export const NEED_CATEGORIES=Object.freeze(['rent','food','transit','utilities','communications','healthcare']);
export const BASE_MONTHLY_NEEDS_SIM=Object.freeze({rent:16000,food:5600,transit:1400,utilities:1800,communications:650,healthcare:900});
const cents=n=>Math.round((n+Number.EPSILON)*100),sim=n=>n/100;
function money(n,key) {
 if(typeof n!=='number'||!Number.isFinite(n)||n<0||n>1e9||Math.abs(n*100-Math.round(n*100))>1e-5)throw Error('INVALID_MONEY:'+key);
 return cents(n);
}
function profile(region){const p=REGION_HOUSEHOLD_PROFILE[region];if(!p)throw Error('REGION_UNKNOWN');return p;}
export function scaleRegionalSalary(baseGross,region){return sim(Math.round(money(baseGross,'baseGross')*profile(region).wage));}
export function estimateMonthlyNeeds({region,baseNeeds=BASE_MONTHLY_NEEDS_SIM,housingFactor=1,householdFactor=1}={}){
 const p=profile(region);
 if(!Number.isFinite(housingFactor)||housingFactor<.25||housingFactor>3||!Number.isFinite(householdFactor)||householdFactor<.5||householdFactor>5)throw Error('INVALID_HOUSEHOLD_FACTOR');
 if(!baseNeeds||typeof baseNeeds!=='object')throw Error('INVALID_NEEDS');
 const byCategory={};let total=0;
 for(const key of NEED_CATEGORIES){
  const amt=money(baseNeeds[key],key),n=Math.round(amt*p[key]*(key==='rent'?housingFactor:householdFactor));
  byCategory[key]=sim(n);total+=n;
 }
 return {region,byCategory,total:sim(total)};
}
export function forecastMonthlyCashflow({region,grossSalary,withholdingRate,baseNeeds=BASE_MONTHLY_NEEDS_SIM,housingFactor=1,householdFactor=1,oneTimeStarter=0}={}){
 profile(region);const gross=money(grossSalary,'grossSalary'),starter=money(oneTimeStarter,'oneTimeStarter');
 // Effective payroll withholding rate MUST be supplied by the authoritative policy/tax service.
 if(typeof withholdingRate!=='number'||!Number.isFinite(withholdingRate)||withholdingRate<0||withholdingRate>.6)throw Error('INVALID_WITHHOLDING_RATE');
 const tax=Math.round(gross*withholdingRate),needs=estimateMonthlyNeeds({region,baseNeeds,housingFactor,householdFactor});
 const net=gross-tax,free=net-cents(needs.total);
 return Object.freeze({region,currency:'SIM',grossSalary:sim(gross),payrollTax:sim(tax),netPaycheck:sim(net),essentialExpenses:needs.byCategory,essentialTotal:needs.total,spendableAfterNeeds:sim(free),oneTimeStarter:sim(starter),initialMonthCashflow:sim(free+starter),warning:free<0?'MONTHLY_DEFICIT':null});
}
const validId=x=>typeof x==='string'&&/^[A-Za-z0-9:_-]{4,80}$/.test(x);
export function planPaycheckTransfers({playerId,employmentId,periodId,employerAccount,grossSalary,withholdingRate,currency='SIM'}={}){
 if(!validId(playerId)||!validId(employmentId)||!validId(employerAccount)||!Number.isSafeInteger(periodId)||periodId<1||periodId>100000||currency!=='SIM')throw Error('INVALID_PAYROLL_ID');
 const gross=money(grossSalary,'grossSalary');
 if(typeof withholdingRate!=='number'||!Number.isFinite(withholdingRate)||withholdingRate<0||withholdingRate>.6)throw Error('INVALID_WITHHOLDING_RATE');
 const tax=Math.round(gross*withholdingRate),net=gross-tax;
 const refId='payroll:'+playerId+':'+employmentId+':'+periodId,transfers=[];
 if(net>0)transfers.push({from:employerAccount,to:'player:'+playerId,currency,amount:sim(net),kind:'salary_net',refId});
 if(tax>0)transfers.push({from:employerAccount,to:'system:government',currency,amount:sim(tax),kind:'salary_withholding',refId});
 return {refId,grossSalary:sim(gross),netPaycheck:sim(net),withheldTax:sim(tax),transfers};
}
// Rent, food and bills are ONLY estimates in this module. Actual purchases have separate
// authoritative ledger transactions. Do not deduct estimated needs again from payday.
export function comparePaycheckAndForecast(forecast,paycheck){
 if(!forecast||!paycheck)throw Error('FORECAST_MISSING');
 return {paycheckMatchesForecast:Math.round(forecast.netPaycheck*100)===Math.round(paycheck.netPaycheck*100),delta:sim(Math.round((paycheck.netPaycheck-forecast.netPaycheck)*100))};
}
