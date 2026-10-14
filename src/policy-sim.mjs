// Orbit Virtual Life Stage16 policy layer.
// All values are fictional simulation indices. They are NOT legal/tax/immigration advice.
const policyClamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const h=(...parts)=>{const text=parts.join('|');let x=2166136261;for(let i=0;i<text.length;i++){x^=text.charCodeAt(i);x=Math.imul(x,16777619)}return (x>>>0)/4294967296};
export const POLICY_META=Object.freeze({
 tokyo:{country:'JP',countryZh:'日本',countryEn:'Japan',regionZh:'东京都模拟区',regionEn:'Tokyo simulation region',national:{labor:.78,welfare:.68,credit:.73,trade:.76,taxBurden:.68},regional:{sme:.62,transit:.86,housing:.50,safety:.72,tourism:.70}},
 seoul:{country:'KR',countryZh:'韩国',countryEn:'South Korea',regionZh:'首尔模拟区',regionEn:'Seoul simulation region',national:{labor:.73,welfare:.63,credit:.76,trade:.79,taxBurden:.63},regional:{sme:.66,transit:.82,housing:.53,safety:.70,tourism:.67}},
 singapore:{country:'SG',countryZh:'新加坡',countryEn:'Singapore',regionZh:'新加坡模拟区',regionEn:'Singapore simulation region',national:{labor:.58,welfare:.55,credit:.88,trade:.94,taxBurden:.44},regional:{sme:.76,transit:.90,housing:.64,safety:.82,tourism:.85}},
 newyork:{country:'US',countryZh:'美国',countryEn:'United States',regionZh:'纽约模拟区',regionEn:'New York simulation region',national:{labor:.55,welfare:.50,credit:.82,trade:.72,taxBurden:.58},regional:{sme:.58,transit:.67,housing:.40,safety:.57,tourism:.78}},
 paris:{country:'FR',countryZh:'法国',countryEn:'France',regionZh:'巴黎模拟区',regionEn:'Paris simulation region',national:{labor:.86,welfare:.84,credit:.70,trade:.77,taxBurden:.79},regional:{sme:.60,transit:.83,housing:.48,safety:.66,tourism:.92}},
 shanghai:{country:'CN',countryZh:'中国',countryEn:'China',regionZh:'上海模拟区',regionEn:'Shanghai simulation region',national:{labor:.67,welfare:.58,credit:.75,trade:.80,taxBurden:.57},regional:{sme:.72,transit:.88,housing:.55,safety:.74,tourism:.63}}
});
const PROGRAMS=Object.freeze([
 {id:'sme_credit',zh:'小微企业融资支持',en:'SME credit support',sme:.10,credit:.08,cost:-.025},
 {id:'transit_relief',zh:'公共交通与通勤支持',en:'Transit relief',transit:.10,demand:.025,cost:-.01},
 {id:'housing_supply',zh:'住房供给与租住支持',en:'Housing supply support',housing:.12,demand:.012},
 {id:'tourism_campaign',zh:'旅游与本地消费促进',en:'Tourism campaign',tourism:.12,demand:.045,cost:.008},
 {id:'labor_protection',zh:'劳动保障强化',en:'Stronger labor protections',labor:.10,wage:.055,cost:.035},
 {id:'energy_relief',zh:'能源与经营成本缓冲',en:'Energy-cost relief',cost:-.035,demand:.01},
 {id:'fiscal_tightening',zh:'财政审慎期',en:'Fiscal tightening',tax:.05,demand:-.018,cost:.008},
 {id:'safety_investment',zh:'公共安全与社区服务投入',en:'Public safety investment',safety:.10,demand:.012,cost:.01}
]);
export function policySnapshot(region,day=0,seed=3217){
 const base=POLICY_META[region];if(!base)throw Error('UNKNOWN_POLICY_REGION');
 const quarter=Math.floor(Math.max(0,day)/90),picked=[];const count=1+(h('policy-count',region,quarter,seed)>.58?1:0);
 for(let i=0;i<count;i++)picked.push(PROGRAMS[Math.floor(h('policy-program',region,quarter,seed,i)*PROGRAMS.length)]);
 const national={...base.national},regional={...base.regional};let demand=1,cost=1,wage=1,credit=1,tax=1,housing=1,safety=1,tourism=1;
 for(const p of picked){demand+=p.demand||0;cost+=p.cost||0;wage+=p.wage||0;credit+=p.credit||0;tax+=p.tax||0;housing+=p.housing||0;safety+=p.safety||0;tourism+=p.tourism||0;}
 demand+=(regional.sme-.5)*.035+(regional.tourism-.5)*.025;cost+=(national.labor-.5)*.03-(regional.sme-.5)*.025;wage+=(national.labor-.5)*.045;credit+=(national.credit-.5)*.07+(regional.sme-.5)*.035;tax+=(national.taxBurden-.5)*.035;housing+=(regional.housing-.5)*.08;safety+=(regional.safety-.5)*.08;tourism+=(regional.tourism-.5)*.08;
 return Object.freeze({source:'FICTIONAL_POLICY_CALIBRATION',region,country:base.country,countryZh:base.countryZh,countryEn:base.countryEn,regionZh:base.regionZh,regionEn:base.regionEn,day,quarter,national,regional,programs:picked.map(p=>({id:p.id,zh:p.zh,en:p.en})),modifiers:{demand:policyClamp(demand,.90,1.12),companyCost:policyClamp(cost,.90,1.14),wage:policyClamp(wage,.92,1.12),credit:policyClamp(credit,.90,1.13),tax:policyClamp(tax,.94,1.10),housing:policyClamp(housing,.92,1.12),safety:policyClamp(safety,.92,1.12),tourism:policyClamp(tourism,.90,1.16)}});
}
export function policyDisclosure(){return 'National and regional policy values are simplified fictional calibration indices. They do not reproduce current law, tax rates, benefits, visas, labor rules or official policy.';}
