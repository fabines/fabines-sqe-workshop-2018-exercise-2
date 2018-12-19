import * as esprima from 'esprima';

const parseCode = (codeToParse) => {
    return esprima.parseScript(codeToParse);
};
let lines = [];
let variables = {};
let variablesMap = [];
const validTypes = ['FunctionDeclaration', 'AssignmentExpression', 'WhileStatement', 'ReturnStatement',
    'UpdateExpression','ForStatement','IfStatement','VariableDeclarator','params'];
//const invalidKeys = ['init','update'];
const invalidKeys = [];
const resultArray = [];
let argsStr = '';
let func_params = [];
let line = '';
let end = '';
let start = '';
let tabs = 0;
let alternates = [];
let redLines = [];
let greenLines = [];

function assignParams(functionDeclaration) {
    let {params} = functionDeclaration;
    params = params.map((param) => param.name);
    for(let i=0;i<params.length;i++){
        getLocalParams(func_params)[i]={name: params[i], val: ''};
    }
    parseArgs(argsStr);

}

function valueName(name='',stringValue,currentValue='',rawVal){
    return currentValue + (name || rawVal);
}
function getMemberExpression(memberExpression){
    const {computed,property,object} = memberExpression;
    const value = property.name|| getCompoundValue(property, '');
    const key = getCompoundValue(object, '');
    if(computed) {
        return `${key}[ ${value} ]`;
    }
    return `${key}.${value}`;
}
function prefix(object,name){
    let update = '';
    if (!object.prefix) {
        line += `${name}${object.operator};`;
        lines.push(line);
        object.operator=='++' ? update = eval(parseFloat(paramValueByName(name))+1):update = eval(parseFloat(paramValueByName(name))-1);
    } else {
        line += `${object.operator}${name};`;
        lines.push(line);
        object.operator=='++' ?  update = eval(parseFloat(paramValueByName(name))+1): update = eval(parseFloat(paramValueByName(name))-1);
    }
    return update;
}
function getUpdateValue(object,name){
    if(searchParams(name)) {
        let update = prefix(object,name);
        updateValue(name,update);
    }else{
        object.prefix ? updateValue(name,`${object.operator}${name}`) :updateValue(name,`${name}${object.operator}`);
    }

}
function isNameOrStrValue(name,stringValue){
    return name || stringValue;
}
function getCompoundValue(object, currentValue) {
    if(!object){
        return '';}
    const {name, value='', type} = object;
    if (type === 'MemberExpression'){
        return getMemberExpression(object);}
    const stringValue = value.toString();
    if(isNameOrStrValue(name,stringValue)){
        var tmp=name;
        tmp=checkArgs(name);
        return valueName(tmp,stringValue,currentValue,object.raw);}
    const isUnary = checkUnaryValue(object);
    const {left, right, operator} = object;
    let start1=checkOperators0(operator);
    let end1=checkOperators1(operator);
    if(isUnary) {
        return `${start1}${getCompoundValue(left, currentValue)}${end1} ${operator} ${isUnary}${end1}`;
    }
    return `${start1}${getCompoundValue(left,currentValue)}${end1} ${operator} ${start1}${getCompoundValue(right,currentValue)}${end1}`;
}
function checkUnaryValue(rightOperand){
    const {type:argumentType, argument} = rightOperand;
    if(argumentType === 'UnaryExpression'){
        return `${argument.value || argument.name}`;
    }
    return '';
}
function checkOperators0(operator){
    if(operator==='*'||operator==='/'){
        return '( ';
    }
    return '';

}
function checkOperators1(operator){
    if(operator==='*'||operator==='/'){
        return ' )';
    }
    return '';

}
function checkArgs(name){
    if(!searchParams(name) && variables.hasOwnProperty(name))
        return variables[name];
    return name;
}
function getValueOfVariableDec(object){
    if(object.init){
        return getCompoundValue(object.init, '');
        //return object.init.argument ? `${object.init.operator}${object.init.argument.value}` :getCompoundValue(object.init, '');
    }
    return '';
}
function updateValue(name,value){
    if(searchParams(name)){
        const element = getLocalParams(func_params).find(param=>param.name===name);
        element.val = evaluate(value);
    } else {
        variables[name] = value;
    }
}

function parseFunction(name,object){
    assignParams(object);
    line = 'function ';
    line+=name+'(';
    line+=getLocalParams(func_params).map(obj=>obj.name).join(',');
    line+='){';
    lines.push(line);
}

function parseType(object){
    let line = '';
    switch(object.type) {
    case 'WhileStatement':
        line+=('while(');
        break;
    case 'IfStatement':
        line+='if(';
        break;
    default:
        break;
    }
    return line;
}
function checkValidArgs(){
    return getLocalParams(func_params).find(obj=>obj.val==='');
}
function parseConditional(object){
    let type = parseType(object);
    line += type;
    let val = getCompoundValue(object.test,'');
    line+=val+'){'+'\t';
    lines.push(line);
    if(argsStr && !checkValidArgs() && type==='if('){
        if(evaluate(val)) greenLines.push(lines.length);
        else redLines.push(lines.length);
    }

}

function evaluate(test){
    let newTest='';
    if(!test.toString().includes(' ')){
        if(searchParams(test)) {
            return eval(paramValueByName(test));
        }
        return eval(test);
    }
    test.split(' ').map(obj=>{
        if(evalBrackets(obj)){
            newTest+=paramValueByName(obj.substring(0,obj.length-1))+'[';
        }else if(obj.includes('.')&& searchParams(obj.split('.')[0])){
            newTest+=paramValueByName(obj.split('.')[0])+'.'+obj.split('.')[1];
        }else if(searchParams(obj)){
            newTest+=paramValueByName(obj);
        }else{
            newTest+=obj;
        }});
    return eval(newTest);
}
function evalBrackets(obj){
    return obj.includes('[')&& searchParams(obj.substring(0,obj.length-1));
}
function parseReturn(object){
    line += 'return ';
    line+=getCompoundValue(object,'')+';';
    lines.push(line);
}

function parseAssignment(name,object){
    if(searchParams(object.left.name)){
        line += getCompoundValue(object,'')+';';
        lines.push(line);
    }
    const {name: objName, object:memberExpression = {}} = object.left;
    updateValue(objName || memberExpression.name, getCompoundValue(object.right,''));

}

function searchParams(name){
    let parot = getLocalParams(func_params).map(para=>para.name);
    return parot.includes(name);
}

function paramValueByName(name){
    let val= getLocalParams(func_params).find(param=>param.name===name).val;
    if(Array.isArray(val)) val='['+val+']';
    return val;
}

function map(object){
    const conditionalStatements = ['ForStatement','IfStatement','WhileStatement'];
    let ans = '';
    const {type, id = {}} = object;
    if(type==='FunctionDeclaration') parseFunction(id.name,object);
    else if(type==='AssignmentExpression') parseAssignment(id.name,object);
    else if(type==='VariableDeclarator') updateValue(id.name,getValueOfVariableDec(object));
    else if(conditionalStatements.includes(type)) parseConditional(object);
    else lineexp(type,object);
    assExpOrVarExp(type);
    return ans;
}

function lineexp(type,object){
    if(type==='ReturnStatement') parseReturn(object.argument);
    if(type === 'UpdateExpression'){
        const {name} = object.argument;
        return getUpdateValue(object,name);
    }
    let arr=['FunctionDeclaration','AssignmentExpression','VariableDeclarator','ReturnStatement','UpdateExpression'];
    if(!arr.includes(type)) {
        line = '';
        return line;
    }
}
function assExpOrVarExp(type){
    if(type==='AssignmentExpression' || type==='VariableDeclarator'){
        if(start==='else' || start==='else{') lines.push(start);
    }
}
function parseKaki(object){
    resultArray.push(map(object));
}
function checkKeys(key,value){
    return value  && !invalidKeys.includes(key) && validTypes.includes(value.type);
}

function checkIfStatement(value){
    if(value){
        if(alternates.length>0){
            let x = alternates.pop();
            ifStatCheck(value,x);
        }
        if(value.type==='IfStatement' && value.alternate){
            alternates.push(value.alternate);
        }
    }
}
function ifStatCheck(value,x) {
    if (value) {
        if (x == value) {
            if (value.type === 'IfStatement') start += 'else';
            else start += 'else{';
        } else {
            alternates.push(x);
        }
    }
    return;
}
function checkBlockEnd(value){
    end='';
    if(value && value.type==='BlockStatement'){
        end+='\n';
        for(let i=0;i<tabs-1;i++) end+='\t';
        end+='}';
        tabs--;
        variables=variablesMap.pop();
        if(func_params.childBlock) {
            let funcParamsChild = getLocalParams(func_params);
            funcParamsChild; // not necessary!!!!!!!! lint use only
            funcParamsChild = null;
        }
    }
    lines.push(end);
}
function isObject(obj){
    return null == obj || 'object' != typeof obj;
}
function clone(obj) {
    if (isObject(obj)) return obj;
    var copy = obj.constructor();
    for (var attr in obj) {
        if (obj.hasOwnProperty(attr) && !obj.childBlock) copy[attr] = obj[attr];
    }
    return copy;
}


function getLocalParams() {
    let current = func_params;
    while(current.childBlock){
        current = current.childBlock;
    }
    return current;
}

function handleBlock(value,tabs){
    if(value && value.type==='BlockStatement'){
        variablesMap.push(clone(variables));
        tabs++;
        if(getLocalParams(func_params).length > 0){
            const localPrams = getLocalParams(func_params);
            localPrams.childBlock = getLocalParams(func_params).map((object) => {
                return Object.assign({},object);
            });
        }
    }
    return tabs;
}

function traverse(jsonObj) {
    if (!jsonObj || typeof jsonObj != 'object') return;
    Object.entries(jsonObj).forEach(([key, value]) => {
        tabs=handleBlock(value,tabs);
        checkIfStatement(value);
        if (checkKeys(key,value)) {
            line=start+'\n';
            if(start==='else') line=start;
            for(let i=0;i<tabs;i++) line+='\t';
            parseKaki(value);
            if(line.substr(0,1)==='e') start='';
        }
        traverse(value);
        checkBlockEnd(value);
    });
}

function convertValue(val){
    const stringIndicators = ['\'','"'];
    if(stringIndicators.includes(val.charAt(0))){
        val = '\''+val.substr(1,val.length-2)+'\'';
    }else if(parseFloat(val)){
        val=parseFloat(val);
    }
    return val;
}
//let inArray = false;

function parseArgs(args) {
    if (args) {
        args = args.split(',');
        loopArgs(args);
    }
}
function loopArgs(args){
    let counter = 0;
    let inArray = false;
    for (let i = 0; loop_test(i,counter,args); i++) {
        //counter=checkParsArg(i,args,counter);
        if(args[i].charAt(0)==='['){
            inArray=true;
            getLocalParams(func_params)[counter].val= [convertValue(args[i].substring(1))];
        } else if(args[i].charAt(args[i].length-1)===']'){
            getLocalParams(func_params)[counter].val.push(convertValue(args[i].substring(0,args[i].length-1)));
            inArray=false;
            counter++;
        }else if(inArray){getLocalParams(func_params)[counter].val.push(convertValue(args[i]));
        }else{
            getLocalParams(func_params)[counter++].val= convertValue(args[i]);}
        //return counter;
    }
}
function loop_test(i,counter,args){
    return i < args.length && counter < getLocalParams(func_params).length;
}
function hoist(parsedCode){
    const newBody=[];
    let func = null;
    parsedCode.body.forEach(obj=>{
        if(obj.type==='FunctionDeclaration'){
            func = obj;
        }else{
            newBody.push(obj);
        }
    });
    if(func){
        newBody.push(func);
        return {body: newBody};
    }
    return parsedCode;

}
function runParser(code,args) {
    lines = [];
    variables = [];
    func_params = [];
    greenLines = [];
    redLines = [];
    let parsedCode = parseCode(code);
    argsStr=args;
    tabs=0;
    alternates = [];
    traverse(hoist(parsedCode));
    return lines;
}

function getRedLines(){
    return redLines;
}

function getGreenLines(){
    return greenLines;
}

export {
    parseCode,
    runParser,
    getRedLines,
    getGreenLines,
    clone,
    lineexp,
    valueName,
    ifStatCheck,
    checkBlockEnd
};
