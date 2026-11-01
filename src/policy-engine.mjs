// Orbit Virtual Life policy simulation.
// These are game parameters, not legal descriptions of current real-world policy.
const pClamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const pRound=(n,d=4)=>Number(n.toFixed(d));
const pHash=(...parts)=>{let x=2166136261;for(const ch of parts.join("|")){x^=ch.charCodeAt(0);x=Math.imul(x,16777619)}return (x>>>0)/4294967296};
export const REGION_COUNTRY=Object.freeze({tokyo:"japan",seoul:"korea",singapore:"singapore",new_york:"usa",paris:"france",shanghai:"china"});
const NATIONAL=Object.freeze({
 japan:{consumptionTax:.10,corporateTax:.23,policyRate:.01,laborCostIndex:1.05,businessSupport:.34,consumerProtection:.76,energyCostIndex:1.04,visaFriction:.45},
 korea:{consumptionTax:.10,corporateTax:.22,policyRate:.025,laborCostIndex:.98,businessSupport:.39,consumerProtection:.72,energyCostIndex:1.02,visaFriction:.42},
 singapore:{consumptionTax:.09,corporateTax:.17,policyRate:.03,laborCostIndex:1,businessSupport:.46,consumerProtection:.72,energyCostIndex:1.08,visaFriction:.38},
 usa:{consumptionTax:.07,corporateTax:.21,policyRate:.04,laborCostIndex:1.12,businessSupport:.33,consumerProtection:.68,energyCostIndex:1,visaFriction:.52},
 france:{consumptionTax:.20,corporateTax:.25,policyRate:.03,laborCostIndex:1.18,businessSupport:.37,consumerProtection:.80,energyCostIndex:1.09,visaFriction:.44},
 china:{consumptionTax:.08,corporateTax:.25,policyRate:.025,laborCostIndex:.86,businessSupport:.43,consumerProtection:.67,energyCostIndex:.94,visaFriction:.47}
});
const REGIONAL=Object.freeze({
 tokyo:{transitSupport:.72,publicSafety:.78,housingSupply:.48,tourismSupport:.64,smallBusinessSupport:.46},
 seoul:{transitSupport:.70,publicSafety:.75,housingSupply:.50,tourismSupport:.61,smallBusinessSupport:.48},
 singapore:{transitSupport:.77,publicSafety:.82,housingSupply:.56,tourismSupport:.72,smallBusinessSupport:.50},
 new_york:{transitSupport:.58,publicSafety:.61,housingSupply:.42,tourismSupport:.68,smallBusinessSupport:.44},
 paris:{transitSupport:.71,publicSafety:.66,housingSupply:.45,tourismSupport:.76,smallBusinessSupport:.47},
 shanghai:{transitSupport:.73,publicSafety:.74,housingSupply:.55,tourismSupport:.60,smallBusinessSupport:.51}
});
export function createPolicyState(seed=3217){
 const countries={};for(const [k,v] of Object.entries(NATIONAL))countries[k]={...v,revision:0,lastPeriod:0,budgetStress:35};
 const regions={};for(const [k,v] of Object.entries(REGIONAL))regions[k]={...v,revision:0,lastPeriod:0};
 return {schema:1,seed:Number(seed)||3217,period:0,countries,regions,events:[]};
}
export function validatePolicyState(p){
 if(!p||p.schema!==1||!Number.isSafeInteger(p.period)||p.period<0||p.period>1000||!p.countries||!p.regions||!Array.isArray(p.events)||p.events.length>48)return false;
 for(const [country,base] of Object.entries(NATIONAL)){const x=p.countries[country];if(!x)return false;for(const k of Object.keys(base))if(!Number.isFinite(x[k]))return false;}
 for(const [region,base] of Object.entries(REGIONAL)){const x=p.regions[region];if(!x)return false;for(const k of Object.keys(base))if(!Number.isFinite(x[k]))return false;}
 return true;
}
export function effectivePolicy(p,region){
 if(!validatePolicyState(p)||!REGION_COUNTRY[region])throw Error("POLICY_STATE");
 const country=REGION_COUNTRY[region],n=p.countries[country],r=p.regions[region];
 return {country,region,
 consumptionTax:pClamp(n.consumptionTax,0,.30),corporateTax:pClamp(n.corporateTax,0,.45),policyRate:pClamp(n.policyRate,-.01,.15),laborCostIndex:pClamp(n.laborCostIndex,.65,1.55),businessSupport:pClamp(n.businessSupport,0,1),consumerProtection:pClamp(n.consumerProtection,0,1),energyCostIndex:pClamp(n.energyCostIndex,.65,1.6),visaFriction:pClamp(n.visaFriction,0,1),
 transitSupport:pClamp(r.transitSupport,0,1),publicSafety:pClamp(r.publicSafety,0,1),housingSupply:pClamp(r.housingSupply,0,1),tourismSupport:pClamp(r.tourismSupport,0,1),smallBusinessSupport:pClamp(r.smallBusinessSupport,0,1)};
}
function event(p,scope,id,code,delta,period){p.events=[{scope,id,code,delta:pRound(delta),period},...p.events].slice(0,48);}
export function advancePolicyQuarter(input,{period,macroByCountry={},regionSignals={}}={}){
 const p=structuredClone(input);if(!validatePolicyState(p)||!Number.isSafeInteger(period)||period<=p.period||period>1000)throw Error("POLICY_PERIOD");
 for(let next=p.period+1;next<=period;next++){
  for(const [country,n] of Object.entries(p.countries)){
   const m=macroByCountry[country]||{},infl=Number(m.inflation??3),unemp=Number(m.unemployment??5),stress=Number(m.budgetStress??n.budgetStress??35);n.budgetStress=pClamp(stress,0,100);
   let d=0;if(infl>5.5)d=.0025;else if(infl<1.5&&unemp>6)d=-.0025;if(d){n.policyRate=pRound(pClamp(n.policyRate+d,-.01,.15));event(p,"country",country,"policy_rate",d,next);}
   const supportDelta=unemp>7?.015:stress>75?-.012:0;if(supportDelta){n.businessSupport=pRound(pClamp(n.businessSupport+supportDelta,0,1));event(p,"country",country,"business_support",supportDelta,next);}
   n.revision++;n.lastPeriod=next;
  }
  for(const [region,r] of Object.entries(p.regions)){
   const s=regionSignals[region]||{},crime=Number(s.safetyStress??35),housing=Number(s.housingStress??45),crowd=Number(s.transitStress??40),tourism=Number(s.tourismDemand??50),options=[];
   if(crime>65)options.push(["publicSafety",.018,"safety"]);if(housing>70)options.push(["housingSupply",.015,"housing"]);if(crowd>70)options.push(["transitSupport",.012,"transit"]);if(tourism<35)options.push(["tourismSupport",.012,"tourism"]);
   if(!options.length&&pHash("policy",region,next,p.seed)<.35)options.push(["smallBusinessSupport",pHash("dir",region,next,p.seed)<.5?.008:-.006,"small_business"]);
   if(options.length){const [key,d,code]=options[Math.floor(pHash("pick",region,next,p.seed)*options.length)];r[key]=pRound(pClamp(r[key]+d,0,1));event(p,"region",region,code,d,next);}
   r.revision++;r.lastPeriod=next;
  }p.period=next;
 }return p;
}
export function policyCompanyInputs(p,region,{reputation=60,industry="retail"}={}){
 const e=effectivePolicy(p,region),service=["software","services"].includes(industry),tourism=["hospitality","restaurant"].includes(industry);
 return {taxRate:pRound(pClamp(e.corporateTax*(.72+.12*(1-e.businessSupport)),.05,.36)),payrollMultiplier:pRound(pClamp(e.laborCostIndex*(1+.04*e.consumerProtection),.7,1.65)),rentMultiplier:pRound(pClamp(1.14-.28*e.housingSupply+.6*e.policyRate,.72,1.48)),utilitiesMultiplier:pRound(pClamp(e.energyCostIndex*(1-.08*e.businessSupport),.7,1.55)),npcDemandIndex:pRound(pClamp(1+.10*e.smallBusinessSupport+(tourism?.10*e.tourismSupport:0)+(reputation-60)/500,.65,1.45)),insolvencyBufferWeeks:Math.round(pClamp(6+e.businessSupport*4+(service?1:0),6,11))};
}
export function policyPlayerInputs(p,region){const e=effectivePolicy(p,region);return {transitCostMultiplier:pRound(pClamp(1-.22*e.transitSupport,.72,1)),incidentRiskMultiplier:pRound(pClamp(1-.34*e.publicSafety,.6,1)),housingCarryMultiplier:pRound(pClamp(1.12-.22*e.housingSupply+.45*e.policyRate,.75,1.35)),utilityMultiplier:pRound(pClamp(e.energyCostIndex,.7,1.55)),visaFriction:e.visaFriction,consumptionTax:e.consumptionTax};}
export function policyMarketInputs(p,region){const e=effectivePolicy(p,region);return {retailDemandMultiplier:pRound(pClamp(1+.08*e.businessSupport+.08*e.smallBusinessSupport-.3*e.policyRate,.72,1.30)),tourismDemandMultiplier:pRound(pClamp(.88+.24*e.tourismSupport,.75,1.25)),supplyMultiplier:pRound(pClamp(.9+.16*e.housingSupply+.08*e.businessSupport,.75,1.25)),pricePressure:pRound(pClamp(.04*e.energyCostIndex+.08*e.consumptionTax+.10*e.policyRate,-.02,.12))};}
export function policySummary(p,region){const e=effectivePolicy(p,region);return {period:p.period,country:e.country,region,events:p.events.filter(x=>x.id===region||x.id===e.country).slice(0,8),effective:e,notice:"Fictional policy model only; not a description of current law or political positions."};}
