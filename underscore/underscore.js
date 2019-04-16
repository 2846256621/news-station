let _ = require('underscore');
let html = '<h2><%=name%></h2>';

let fn = _.template(html); //template()返回值是一个函数
//传入name属性，因为模板中需要的name数据
html = fn({ name:'nana'});

console.log(html);
console.log(fn.toString());