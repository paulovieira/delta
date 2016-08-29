'use strict';
const Fs = require('fs');

const x = 1;

Fs.writeFile(x, 'xx.txt');

const a = [1,2,3]
a.forEach(function (i){
    console.log(i);
});

