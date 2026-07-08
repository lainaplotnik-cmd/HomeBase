const SHEETS = { KIDS:'Kids', RULES:'Rules', TRANSACTIONS:'Transactions' };

function doPost(e) {
  const body = JSON.parse(e.postData.contents || '{}');
  if (body.action === 'getData') return json(getData());
  if (body.action === 'addTransaction') return json(addTransaction(body.transaction));
  return json({ ok:false, error:'Unknown action' });
}

function doGet() { return json(getData()); }

function json(obj){
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function setupHomeBase(){
  const ss = SpreadsheetApp.getActive();
  Object.values(SHEETS).forEach(name => { if (!ss.getSheetByName(name)) ss.insertSheet(name); });
  const kids = ss.getSheetByName(SHEETS.KIDS);
  kids.clear(); kids.appendRow(['id','name','emoji','age','baseAllowance']);
  kids.getRange(2,1,4,5).setValues([
    ['dean','Dean','🧢','10 in Sept',40], ['demi','Demi','🌸','8',40], ['elise','Elise','🦋','7 in Nov',40], ['kristos','Kristos','🚀','4 on Christmas',40]
  ]);
  const rules = ss.getSheetByName(SHEETS.RULES);
  rules.clear(); rules.appendRow(['id','active','type','label','amount','category','icon']);
  rules.getRange(2,1,9,7).setValues([
    ['walk-charlie',true,'Earn','Walk Charlie',1,'Pet Care','🐶'], ['pokemon-raid',true,'Earn','Help with Pokémon raid',1,'Events','⚡'], ['good-grade',true,'Earn','Good grade / strong improvement',5,'School','📚'], ['kindness',true,'Earn','Kindness bonus',2,'Kindness','💛'], ['trash',true,'Deduct','Left trash, plates, or wrappers',-0.5,'Cleanliness','🧹'], ['eating-room',true,'Deduct','Ate in bedroom',-1,'Food Rules','🍽️'], ['fighting',true,'Deduct','Fighting / purposely annoying',-2,'Behavior','🌧️'], ['lying',true,'Deduct','Lying',-3,'Trust','🛑'], ['messy-room',true,'Deduct','Room messy after deadline',-2,'Cleanliness','🧺']
  ]);
  const tx = ss.getSheetByName(SHEETS.TRANSACTIONS);
  tx.clear(); tx.appendRow(['id','kidId','kidName','label','amount','type','category','note','month','createdAt','parent']);
  [kids,rules,tx].forEach(s=>s.getRange(1,1,1,s.getLastColumn()).setFontWeight('bold').setBackground('#e9f3ff'));
}

function getData(){
  return { kids: readObjects(SHEETS.KIDS), rules: readObjects(SHEETS.RULES), transactions: readObjects(SHEETS.TRANSACTIONS).reverse() };
}

function addTransaction(t){
  const sh = SpreadsheetApp.getActive().getSheetByName(SHEETS.TRANSACTIONS);
  sh.appendRow([t.id,t.kidId,t.kidName,t.label,t.amount,t.type,t.category,t.note,t.month,t.createdAt,t.parent]);
  return { ok:true, transaction:t };
}

function readObjects(sheetName){
  const sh = SpreadsheetApp.getActive().getSheetByName(sheetName);
  const values = sh.getDataRange().getValues();
  if(values.length < 2) return [];
  const headers = values.shift();
  return values.filter(r => r.some(c => c !== '')).map(row => Object.fromEntries(headers.map((h,i)=>[h,row[i]])));
}
