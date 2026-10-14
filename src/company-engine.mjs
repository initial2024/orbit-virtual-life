const round=n=>Math.round(n*100)/100;
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const goodId=v=>typeof v==="string"&&/^[A-Za-z0-9:_-]{5,128}$/.test(v);
export const COMPANY_RULES=Object.freeze({
 maxActiveCompaniesPerFounder:3,maxPlayerMembers:24,maxOpenJobs:12,minPayrollReserveWeeks:8,maxApplicationsPerJob:100,founderMinCapital:1000,
 npcGrades:["junior","mid","senior"],statuses:["forming","active","restricted","insolvent","dissolved"]
});
export const REGION_WAGE_INDEX=Object.freeze({tokyo:1.10,seoul:.92,singapore:1.18,new_york:1.25,paris:1.05,shanghai:.88});
export const INDUSTRIES=Object.freeze({restaurant:{baseWeeklyRevenue:2400,baseRent:520},retail:{baseWeeklyRevenue:2100,baseRent:470},delivery:{baseWeeklyRevenue:1800,baseRent:390},software:{baseWeeklyRevenue:3200,baseRent:620},services:{baseWeeklyRevenue:1900,baseRent:430},hospitality:{baseWeeklyRevenue:2700,baseRent:680}});
const baseCompany=({companyId,founderId,name,region,industry,capital})=>({companyId,founderId,name:String(name).slice(0,60),region,industry,status:"active",cash:round(capital),reputation:60,playerMembers:[{accountId:founderId,role:"founder",weeklyWage:0,status:"active"}],npcStaff:[],openJobs:[],applications:[],weeksActive:0,lossStreak:0,revision:0});
export function createCompany({companyId,founderId,name,region,industry,capital,founderActiveCompanies=0}={}){
 if(!goodId(companyId)||!goodId(founderId)||typeof name!=="string"||name.trim().length<2||!REGION_WAGE_INDEX[region]||!INDUSTRIES[industry])throw Error("COMPANY_INVALID");
 if(founderActiveCompanies>=COMPANY_RULES.maxActiveCompaniesPerFounder)throw Error("COMPANY_LIMIT");
 if(!Number.isFinite(capital)||capital<COMPANY_RULES.founderMinCapital)throw Error("CAPITAL_TOO_LOW");
 return baseCompany({companyId,founderId,name:name.trim(),region,industry,capital});
}
function member(company,accountId){return company.playerMembers.find(x=>x.accountId===accountId&&x.status==="active");}
function manager(company,accountId){return company.founderId===accountId||["founder","manager"].includes(member(company,accountId)?.role);}
export function postPlayerJob(company,{actorId,jobId,role,weeklyWage,slots=1,expiresWeek}={}){
 if(!manager(company,actorId)||company.status!=="active")throw Error("JOB_FORBIDDEN");
 if(!goodId(jobId)||typeof role!=="string"||role.length<2||role.length>40||!Number.isFinite(weeklyWage)||weeklyWage<=0||!Number.isInteger(slots)||slots<1||slots>8||!Number.isInteger(expiresWeek)||expiresWeek<=company.weeksActive)throw Error("JOB_INVALID");
 if(company.openJobs.filter(x=>x.status==="open").length>=COMPANY_RULES.maxOpenJobs)throw Error("JOB_LIMIT");
 const reserve=weeklyWage*slots*COMPANY_RULES.minPayrollReserveWeeks;if(company.cash<reserve)throw Error("PAYROLL_RESERVE");
 company.openJobs.push({jobId,role,weeklyWage:round(weeklyWage),slots,filled:0,expiresWeek,status:"open"});company.revision++;return company;
}
export function applyForJob(company,{jobId,accountId,skill=50,message=""}={}){
 const job=company.openJobs.find(x=>x.jobId===jobId&&x.status==="open");
 if(!job||!goodId(accountId)||member(company,accountId)||company.applications.some(x=>x.jobId===jobId&&x.accountId===accountId&&x.status==="pending"))throw Error("APPLICATION_INVALID");
 if(company.applications.filter(x=>x.jobId===jobId&&x.status==="pending").length>=COMPANY_RULES.maxApplicationsPerJob)throw Error("APPLICATION_LIMIT");
 company.applications.push({jobId,accountId,skill:clamp(Number(skill)||0,0,100),message:String(message).slice(0,240),status:"pending"});company.revision++;return company;
}
export function hirePlayer(company,{actorId,jobId,accountId}={}){
 if(!manager(company,actorId)||company.status!=="active")throw Error("HIRE_FORBIDDEN");
 if(company.playerMembers.filter(x=>x.status==="active").length>=COMPANY_RULES.maxPlayerMembers)throw Error("MEMBER_LIMIT");
 const job=company.openJobs.find(x=>x.jobId===jobId&&x.status==="open"),app=company.applications.find(x=>x.jobId===jobId&&x.accountId===accountId&&x.status==="pending");
 if(!job||!app||job.filled>=job.slots)throw Error("HIRE_INVALID");if(company.cash<job.weeklyWage*COMPANY_RULES.minPayrollReserveWeeks)throw Error("PAYROLL_RESERVE");
 company.playerMembers.push({accountId,role:job.role,weeklyWage:job.weeklyWage,status:"active",skill:app.skill});app.status="hired";job.filled++;if(job.filled>=job.slots)job.status="filled";company.revision++;return company;
}
export function rejectApplication(company,{actorId,jobId,accountId}={}){
 if(!manager(company,actorId))throw Error("REJECT_FORBIDDEN");const app=company.applications.find(x=>x.jobId===jobId&&x.accountId===accountId&&x.status==="pending");if(!app)throw Error("APPLICATION_NOT_FOUND");app.status="rejected";company.revision++;return company;
}
export function resignPlayer(company,{accountId}={}){
 if(!goodId(accountId)||accountId===company.founderId)throw Error("RESIGN_INVALID");
 const m=member(company,accountId);if(!m)throw Error("MEMBER_NOT_FOUND");m.status="resigned";company.revision++;return company;
}
export function terminatePlayer(company,{actorId,accountId}={}){
 if(!manager(company,actorId)||!goodId(accountId)||accountId===company.founderId)throw Error("TERMINATE_FORBIDDEN");
 const m=member(company,accountId);if(!m)throw Error("MEMBER_NOT_FOUND");m.status="terminated";company.revision++;return company;
}
export function playerPayrollTransfers(company,{currency="SIM"}={}){
 if(typeof currency!=="string"||currency.length<3||currency.length>8)throw Error("CURRENCY_INVALID");
 return company.playerMembers.filter(x=>x.status==="active"&&x.weeklyWage>0).map(x=>({from:`company:${company.companyId}`,to:x.accountId,currency,amount:round(x.weeklyWage),kind:"company_wage",refId:company.companyId}));
}
export function hireNpc(company,{actorId,role,grade="junior",count=1}={}){
 if(!manager(company,actorId)||company.status!=="active"||typeof role!=="string"||role.length<2||!COMPANY_RULES.npcGrades.includes(grade)||!Number.isInteger(count)||count<1||count>20)throw Error("NPC_HIRE_INVALID");
 const mult={junior:.75,mid:1,senior:1.45}[grade],weeklyWage=round(180*REGION_WAGE_INDEX[company.region]*mult);
 if(company.cash<weeklyWage*count*COMPANY_RULES.minPayrollReserveWeeks)throw Error("PAYROLL_RESERVE");
 let bucket=company.npcStaff.find(x=>x.role===role&&x.grade===grade);
 if(!bucket){bucket={role,grade,count:0,weeklyWage,morale:70,avgSkill:grade==="junior"?45:grade==="mid"?65:82};company.npcStaff.push(bucket);}
 bucket.count+=count;company.revision++;return company;
}
export function fireNpc(company,{actorId,role,grade,count=1}={}){
 if(!manager(company,actorId)||!Number.isInteger(count)||count<1)throw Error("NPC_FIRE_INVALID");const b=company.npcStaff.find(x=>x.role===role&&x.grade===grade);if(!b||b.count<count)throw Error("NPC_FIRE_INVALID");b.count-=count;if(b.count===0)company.npcStaff=company.npcStaff.filter(x=>x!==b);company.revision++;return company;
}
export function payroll(company){
 const player=company.playerMembers.filter(x=>x.status==="active").reduce((a,x)=>a+(x.weeklyWage||0),0),npc=company.npcStaff.reduce((a,x)=>a+x.count*x.weeklyWage,0);return {player:round(player),npc:round(npc),total:round(player+npc)};
}
export function validateCompany(company){
 if(!company||!goodId(company.companyId)||!goodId(company.founderId)||!COMPANY_RULES.statuses.includes(company.status)||!REGION_WAGE_INDEX[company.region]||!INDUSTRIES[company.industry]||!Number.isFinite(company.cash)||!Number.isFinite(company.reputation))return false;
 if(!Array.isArray(company.playerMembers)||!Array.isArray(company.npcStaff)||!Array.isArray(company.openJobs)||!Array.isArray(company.applications))return false;
 if(company.playerMembers.filter(x=>x.status==="active").length>COMPANY_RULES.maxPlayerMembers||company.openJobs.filter(x=>x.status==="open").length>COMPANY_RULES.maxOpenJobs)return false;
 return true;
}
