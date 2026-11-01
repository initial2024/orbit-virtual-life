import assert from "node:assert/strict";
import http from "node:http";
import {readFileSync} from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {chromium} from "playwright";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const clientPath=path.join(root,"client","Orbit_Virtual_Life_V35_2_portable.html");
const clientBytes=readFileSync(clientPath);

const server=http.createServer((request,response)=>{
  if(new URL(request.url,"http://127.0.0.1").pathname!=="/Orbit_Virtual_Life_V35_2_portable.html"){
    response.writeHead(404,{"content-type":"text/plain; charset=utf-8"});
    response.end("Not Found");
    return;
  }
  response.writeHead(200,{
    "content-type":"text/html; charset=utf-8",
    "content-length":String(clientBytes.length),
    "cache-control":"no-store",
    "x-content-type-options":"nosniff"
  });
  response.end(clientBytes);
});
await new Promise((resolve,reject)=>{
  server.once("error",reject);
  server.listen(0,"127.0.0.1",resolve);
});
const {port}=server.address();
const url=`http://127.0.0.1:${port}/Orbit_Virtual_Life_V35_2_portable.html`;

const browser=await chromium.launch({headless:true});
const report=[];
try{
  for(const viewport of [{width:1440,height:900},{width:390,height:844},{width:320,height:700}]){
    const context=await browser.newContext({
      viewport,
      isMobile:viewport.width<600,
      hasTouch:viewport.width<600
    });
    const page=await context.newPage();
    const pageErrors=[];
    const consoleErrors=[];
    page.on("pageerror",error=>pageErrors.push(String(error?.stack||error)));
    page.on("console",message=>{
      if(message.type()==="error")consoleErrors.push(message.text());
    });

    await page.goto(url,{waitUntil:"domcontentloaded",timeout:60000});
    await page.waitForSelector('[data-view="life"]',{state:"visible",timeout:30000});

    const initial=await page.evaluate(()=>({
      title:document.title,
      innerWidth:window.innerWidth,
      scrollWidth:document.documentElement.scrollWidth
    }));
    assert.ok(initial.title.includes("Orbit"),"Orbit title missing");
    assert.ok(initial.scrollWidth<=initial.innerWidth+1,`initial horizontal overflow ${initial.scrollWidth} > ${initial.innerWidth}`);

    await page.locator('[data-view="life"]').click();
    const trigger=page.locator('#v4-life [data-v31-day]').first();
    await trigger.waitFor({state:"visible",timeout:30000});
    await trigger.scrollIntoViewIfNeeded();
    await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
    const before=await trigger.boundingBox();
    assert.ok(before,"day trigger missing before click");

    await trigger.click();
    await page.waitForFunction(()=>document.querySelector("#v35-day-dialog")?.open===true,null,{timeout:10000});
    await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
    const opened=await trigger.boundingBox();
    assert.ok(opened,"day trigger missing with dialog open");
    const openDelta=opened.y-before.y;
    assert.ok(Math.abs(openDelta)<=1,`first-open anchor moved by ${openDelta}px`);

    await page.keyboard.press("Escape");
    await page.waitForFunction(()=>document.querySelector("#v35-day-dialog")?.open===false,null,{timeout:10000});
    await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
    const after=await trigger.boundingBox();
    assert.ok(after,"day trigger missing after dialog close");
    const closeDelta=after.y-before.y;
    assert.ok(Math.abs(closeDelta)<=1,`close anchor moved by ${closeDelta}px`);

    const finalGeometry=await page.evaluate(()=>({
      innerWidth:window.innerWidth,
      scrollWidth:document.documentElement.scrollWidth
    }));
    assert.ok(finalGeometry.scrollWidth<=finalGeometry.innerWidth+1,`final horizontal overflow ${finalGeometry.scrollWidth} > ${finalGeometry.innerWidth}`);
    assert.deepEqual(pageErrors,[],"page errors observed");
    assert.deepEqual(consoleErrors,[],"console errors observed");

    report.push({
      viewport,
      beforeTop:before.y,
      openDelta,
      closeDelta,
      initialScrollWidth:initial.scrollWidth,
      finalScrollWidth:finalGeometry.scrollWidth,
      pageErrors,
      consoleErrors
    });
    await context.close();
  }
  console.log(JSON.stringify({status:"PASS",clientBytes:clientBytes.length,viewports:report},null,2));
}finally{
  await browser.close();
  await new Promise(resolve=>server.close(resolve));
}
