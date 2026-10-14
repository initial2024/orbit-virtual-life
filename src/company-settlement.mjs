import {INDUSTRIES,REGION_WAGE_INDEX,payroll,validateCompany} from "./company-engine.mjs";
const round=n=>Math.round(n*100)/100,clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export function settleCompanyWeek(company,{playerSales=0,npcDemandIndex=1,economyIndex=1,marketing=0,utilitiesIndex=1,taxRate=.06}={}){
 if(!validateCompany(company))throw Error("COMPANY_INVALID");if(company.status==="dissolved")throw Error("COMPANY_DISSOLVED");
 const d=INDUSTRIES[company.industry],staff=payroll(company),rep=clamp(company.reputation/60,.55,1.45),demand=clamp(Number(npcDemandIndex)||1,.4,1.8),econ=clamp(Number(economyIndex)||1,.5,1.6);
 const npcRevenue=round(d.baseWeeklyRevenue*demand*econ*rep),realPlayerRevenue=round(Math.max(0,Number(playerSales)||0)),gross=round(npcRevenue+realPlayerRevenue);
 const rent=round(d.baseRent*REGION_WAGE_INDEX[company.region]),utilities=round((120+25*company.npcStaff.reduce((a,x)=>a+x.count,0))*clamp(utilitiesIndex,.5,2)),marketingSpend=round(clamp(Number(marketing)||0,0,Math.max(0,company.cash*.25))),tax=round(Math.max(0,gross-staff.total-rent-utilities-marketingSpend)*clamp(taxRate,0,.5));
 const cost=round(staff.total+rent+utilities+marketingSpend+tax),net=round(gross-cost);company.cash=round(company.cash+net);company.weeksActive++;company.lossStreak=net<0?company.lossStreak+1:0;
 company.reputation=clamp(round(company.reputation+(net>=0?.3:-.6)+(staff.total>gross*.8?-.4:0)),0,100);
 if(company.cash<0||company.lossStreak>=4)company.status="insolvent";else if(company.status==="insolvent"&&company.cash>staff.total*4)company.status="active";
 for(const j of company.openJobs)if(j.status==="open"&&j.expiresWeek<=company.weeksActive)j.status="expired";
 company.revision++;return {company,statement:{week:company.weeksActive,playerRevenue:realPlayerRevenue,npcRevenue,gross,playerPayroll:staff.player,npcPayroll:staff.npc,rent,utilities,marketing:marketingSpend,tax,cost,net,endingCash:company.cash,status:company.status}};
}
export function compactNpcTurnover(company,{wageMarketRatio=1,economyStress=0}={}){
 if(!validateCompany(company))throw Error("COMPANY_INVALID");const stress=clamp(Number(economyStress)||0,0,100),ratio=clamp(Number(wageMarketRatio)||1,.5,1.5);let left=0;
 for(const b of company.npcStaff){const risk=clamp((1-ratio)*.24+(60-b.morale)/200+stress/500,0,.30),drop=Math.min(b.count,Math.floor(b.count*risk));b.count-=drop;left+=drop;b.morale=clamp(round(b.morale+(ratio-1)*8-stress*.015),20,95);}
 company.npcStaff=company.npcStaff.filter(x=>x.count>0);company.revision++;return {company,left};
}
