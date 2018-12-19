import $ from 'jquery';
import {parseCode,runParser,getRedLines,getGreenLines} from './code-analyzer';

function colorLine(lines){
    let greenLines = getGreenLines();
    let redLines = getRedLines();
    $('#sub').html('<p></p>');
    let color='white';
    for(let i=0;i<lines.length;i++){
        color='white';
        if(greenLines.includes(i+1))
            color='green';
        if(redLines.includes(i+1))
            color='red';
        $('#sub').append('<span style=\'background-color: '+color+'\'>'+lines[i]+'</span>');
    }

}
$(document).ready(function () {
    $('#codeSubmissionButton').click(() => {
        let codeToParse = $('#codePlaceholder').val();
        let args = $('#args').val();
        let parsedCode = parseCode(codeToParse);
        $('#parsedCode').val(JSON.stringify(parsedCode, null, 2));
        let lines = runParser(codeToParse,args);
        colorLine(lines);

    });
});

