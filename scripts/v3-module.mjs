import {readFileSync,existsSync} from 'node:fs';
import {createRequire} from 'node:module';
import path from 'node:path';
import ts from 'typescript';
const cache=new Map();
export function moduleFromTs(file){
  if(cache.has(file))return cache.get(file);
  const exports={};cache.set(file,exports);
  const localRequire=createRequire(file);
  const require=name=>{
    if(name.startsWith('.')){
      const target=path.resolve(path.dirname(file),name);
      if(target.endsWith('.json'))return JSON.parse(readFileSync(target,'utf8'));
      for(const extension of ['.ts','.tsx'])if(existsSync(target+extension))return moduleFromTs(target+extension);
    }
    return localRequire(name);
  };
  const code=ts.transpileModule(readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.React,esModuleInterop:true,target:ts.ScriptTarget.ES2022}}).outputText;
  new Function('require','module','exports',code)(require,{exports},exports);
  return exports;
}
