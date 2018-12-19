import assert from 'assert';
import * as parser from '../src/js/code-analyzer';


describe('The javascript parser', () => {
    const result = parser.runParser('function name(x,y,z){}','1,2,3');
    it('is returning params correctly', () => {
        console.log("---------------------------------------------------------"+result);
        const firstParamName = result[0];
        assert.equal(firstParamName, 'function name(x,y,z){');
    });
});

describe('The javascript parser no params', () => {
    const result = parser.runParser('function name(){}','');
    it('is returning params correctly', () => {
        console.log("---------------------------------------------------------"+result);
        const firstParamName = result[0];
        assert.equal(firstParamName, 'function name(){');
    });
});

describe('The lines parser', () => {
    const result = parser.runParser('function foo(x, y, z){\n' +
        '    let a = x + 1;\n' +
        '    let b = a + y;\n' +
        '    let c = 0;\n' +
        '    \n' +
        '    if (b < z) {\n' +
        '        c = c + 5;\n' +
        '        return x + y + z + c;\n' +
        '    } else if (b < z * 2) {\n' +
        '        c = c + x + 5;\n' +
        '        return x + y + z + c;\n' +
        '    } else {\n' +
        '        c = c + z + 5;\n' +
        '        return x + y + z + c;\n' +
        '    }\n' +
        '}\n','1,2,3');
    it('is returning params correctly', () => {
        console.log("---------------------------------------------------------"+result[0]);
        const firstParamName = result[0];
        assert.equal(firstParamName, 'function foo(x,y,z){');
    });
});

describe('The while parser', () => {
    const result = parser.runParser('function foo(x, y, z){\n' +
        '    let a = x[0] + 1;\n' +
        '    let b = a + y+x.length;\n' +
        '    let c = 0;\n' +
        '    \n' +
        '    while (a < z) {\n' +
        '        c = a + b;\n' +
        '        z = c * 2;\n' +
        '    }\n' +
        '    \n' +
        '    return z;\n' +
        '}\n','[1,2,3],2,3');
    it('is returning params correctly', () => {
        console.log("---------------------------------------------------------"+result[0]);
        const firstParamName = result[0];
        assert.equal(firstParamName, 'function foo(x,y,z){');
    });
});

describe('The while parser', () => {
    const result = parser.runParser('function foo(x, y, z){\n' +
        '    let a = x[0] + 1;\n' +
        '    let b = a + y+x.length;\n' +
        '    let c = 0;\n' +
        '    y++;\n' +
        '    y--;\n'+
        '    --y;\n'+
        '    y=y+1; \n' +
        '    ++y;  \n' +
        '    if(a == z) {\n' +
        '        c++;\n' +
        '        ++c;\n' +
        '        c = a + b;\n' +
        '        z = c * 2;\n' +
        '        x[1]=3;\n'+
        '    }\n' +
        '    \n' +
        '    return z;\n' +
        '}','[\'str\',2,3],2,\'str1\'');
    it('is returning params correctly', () => {
        console.log("---------------------------------------------------------"+result);
        const firstParamName = result[144];
        assert.equal(firstParamName, '\n\tif(x[ 0 ] + 1 == z){\t');
    });
});
describe('The unary parser', () => {
    const result = parser.runParser('function jj(x){\n' +
        'if(!x){\n' +
        'x=false;\n' +
        'var z;\n'+
        '}else if(x){\n' +
        ' x=true;\n' +
        '}else{\n' +
        'return x;\n' +
        '}\n' +
        '}','true');
    it('is returning params correctly', () => {
        console.log("---------------------------------------------------------"+result[10]);
        const firstParamName = result[10];
        assert.equal(firstParamName, '\n\tif( ! x){\t');
    });
});
describe('The red,green lines', () => {
    const result1 = parser.getRedLines();
    const result2 = parser.getGreenLines();
    it('is returning red', () => {
        console.log("---------------------------------------------------------"+result1[1]);
        assert.equal(result1[0], 11);
        assert.equal(result1[1],46)
    });
    it('is returning green', () => {
        console.log("---------------------------------------------------------"+result2[0]);
        const second = result2;
        assert.equal(second, '');
    });
});

describe('get Exceptions', () => {
    const result1 = parser.runParser('function jj(x){\n' +
        'for(var i=0;test;i++){\n' +
        '}\n' +
        '}','');
    it('is getting default', () => {
        console.log("---------------------------------------------------------"+result1);
        assert.equal(result1[10], '\n\ttest){\t');
    });

});
describe('check globals ', () => {
    const result1 = parser.runParser('let a=4;\n' +
        'function foo(x){\n' +
        'if(b<3){\n' +
        'return "yey"\n' +
        '}\n' +
        '}\n' +
        'let b=2;','');
    it('is  using globals', () => {
        console.log("---------------------------------------------------------"+result1);
        assert.equal(result1[36], '\n\tif(2 < 3){\t');
    });
    it('function does not exist', () => {
        const ex=parser.runParser('let a=4;\n' + 'let b=2;','');
        console.log("---------------------------------------------------------"+ex);
        assert.equal(ex[0], '');
    });
    it('clone null obj', () => {
        var obj = null;
        const ex=parser.clone(obj);
        const obj2={x:'x', childBlock:[]};
        const ex2=parser.clone(obj2);
        console.log("---------------------------------------------------------"+ex2.x +"k");
        assert.equal(ex, null);
        assert.equal(ex2.x,undefined);
    });
    it('not type needed', () => {
        var obj = null;
        const ex=parser.lineexp('gg',obj);
        console.log("---------------------------------------------------------"+ex);
        assert.equal(ex, '');
    });
    it('current value of compound value', () => {
        var obj = null;
        const ex=parser.valueName('x','');
        console.log("---------------------------------------------------------"+ex);
        assert.equal(ex, 'x');
    });
    it('ifstatcheck value doesnt exist', () => {
        var obj = null;
        const ex=parser.ifStatCheck('','x');
        console.log("---------------------------------------------------------"+ex);
        assert.equal(ex, undefined);
    });
    it('ifstatcheck value doesnt exist', () => {
        var value = {type: 'BlockStatement'};
        const ex=parser.checkBlockEnd(value);
        console.log("---------------------------------------------------------"+ex);
        assert.equal(ex, undefined);
    });


});