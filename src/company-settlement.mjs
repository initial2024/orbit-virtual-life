import {INDUSTRIES,REGION_WAGE_INDEX,payroll,playerPayrollTransfers,validateCompany} from './company-engine.mjs';
const round=n=>Math.round(n*100)/100,clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export function settleCompanyWeek(company,{playerSalesObserved=0,npcDemandIndex=1,economyIndex=1,marketing=0,utilitiesIndex=1,taxRate=.06}={}){
 if(!validateCompany(company))throw Error('COMPANY_INVALID');if(company.status==='dissolved')throw Error('COMPANY_DISSOLVED');
 const d=INDUSTRIES[company.industry],staff=payroll(company),rep=clamp(company.reputation/60,.55,1.45),demand=clamp(Number(npcDemandIndex)||1,.4,1.8),econ=clamp(Number(economyIndex)||1,.5,1.6);
 const npcRevenue=round(d.baseWeeklyRevenue*demand*econ*rep),playerRevenue=round(Math.max(0,Number(playerSalesObserved)||0)),gross=round(npcRevenue+playerRevenue);
 const rent=round(d.baseRent*REGION_WAGE_INDEX[company.region]),utilities=round((120+25*company.npcStaff.reduce((a,x)=>a+x.count,0))*clamp(utilitiesIndex,.5,2)),marketingSpend=round(clamp(Number(marketing)||0,0,Math.max(0,company.cash*.25))),tax=round(Math.max(0,gross-staff.total-rent-utilities-marketingSpend)*clamp(taxRate,0,.5));
 const cost=round(staff.total+rent+utilities+marketingSpend+tax);
 // Real-player order revenue is already credited by the order transaction. Do not add it twice here.
 const settlementCashDelta=round(npcRevenue-cost),netAccounting=round(gross-cost);
 company.cash=round(company.cash+settlementCashDelta);company.weeksActive++;company.lossStreak=netAccounting<0?company.lossStreak+1:0;
 company.reputation=clamp(round(company.reputation+(netAccounting>=0?.3:-.6)+(staff.total>gross*.8?-.4:0)),0,100);
 if(company.cash<0||company.lossStreak>=4)company.status='insolvent';else if(company.status==='insolvent'&&company.cash>staff.total*4)company.status='active';
 for(const j of company.openJobs)if(j.status==='open'&&j.expiresWeek<=company.weeksActive)j.status='expired';
 company.revision++;
 return {company,statement:{week:company.weeksActive,playerRevenue,npcRevenue,gross,playerPayroll:staff.player,npcPayroll:staff.npc,rent,utilities,marketing:marketingSpend,tax,cost,netAccounting,settlementCashDelta,endingCash:company.cash,status:company.status}};
}
export function settlementTransfers(company,statement,{currency='SIM'}={}){
 if(!validateCompany(company)||!statement||typeof currency!=='string'||currency.length<3||currency.length>8)throw Error('SETTLEMENT_INVALID');
 const out=[];const add=(from,to,amount,kind)=>{amount=round(amount);if(amount>0)out.push({from,to,currency,amount,kind,refId:company.companyId});};
 add('system:npc-economy',`company:${company.companyId}`,statement.npcRevenue,'npc_customer_revenue');
 for(const t of playerPayrollTransfers(company,{currency}))add(t.from,t.to,t.amount,'company_wage');
 add(`company:${company.companyId}`,'system:npc-households',statement.npcPayroll,'npc_payroll');
 add(`company:${company.companyId}`,'system:property',statement.rent,'commercial_rent');
 add(`company:${company.companyId}`,'system:utilities',statement.utilities,'utilities');
 add(`company:${company.companyId}`,'system:advertising',statement.marketing,'marketing');
 add(`company:${company.companyId}`,'system:government',statement.tax,'company_tax');
 return out;
}
export function companyTransferDelta(companyId,transfers){
 const key=`company:${companyId}`;return round(transfers.reduce((sum,t)=>sum+(t.to===key?t.amount:0)-(t.from===key?t.amount:0),0));
}
export function compactNpcTurnover(company,{wageMarketRatio=1,economyStress=0}={}){
 if(!validateCompany(company))throw Error('COMPANY_INVALID');const stress=clamp(Number(economyStress)||0,0,100),ratio=clamp(Number(wageMarketRatio)||1,.5,1.5);let left=0;
 for(const b of company.npcStaff){const risk=clamp((1-ratio)*.24+(60-b.morale)/200+stress/500,0,.30),drop=Math.min(b.count,Math.floor(b.count*risk));b.count-=drop;left+=drop;b.morale=clamp(round(b.morale+(ratio-1)*8-stress*.015),20,95);}company.npcStaff=company.npcStaff.filter(x=>x.count>0);company.revision++;return {company,left};
}
