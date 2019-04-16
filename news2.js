const http = require('http');
const fs = require('fs');
const path = require('path');
const mime = require('mime');
const url = require('url');
const querystring = require('querystring');
const _ = require( 'underscore');
http.createServer(function (request,response) {
    response.rander = function(filename,htmlData) {
        fs.readFile(filename, function (err, data) {
            if (err) {
                response.writeHead(404, 'Not Found', {'Content-Type': 'text/html;charset=utf-8'});
                response.end('404,Page Not Found');
                return;
            }
            if(htmlData){
                let fn =  _.template(data.toString('utf8'));
                data = fn(htmlData);
            }
            response.setHeader('Content-Type', mime.getType(request.url));
            response.end(data.toString());
        });
    };
    request.url = request.url.toLowerCase();
    request.method = request.method.toLowerCase();
    let urlObj = url.parse(request.url,true);

    if(request.url === '/' || request.url === '/one' && request.method === 'get'){
        readNewsData(function (list_news) {
            response.rander(path.join(__dirname, 'news-index', 'one.html'), {list: list_news});
        });
    }
    else if(request.url === '/two' && request.method === 'get'){

        response.rander(path.join(__dirname,'news-index','two.html'));
    }
    else if(urlObj.pathname === '/three' && request.method === 'get'){
        readNewsData(function (list_news) {
            let model = null;
            //循环list找到和id值相等的数据
            for(let i =0;i<list_news.length;i++){
                if( list_news[i].id.toString() === urlObj.query.id){
                    model = list_news[i]; //存储找到的新闻
                    response.rander(path.join(__dirname,'news-index','three.html'),{item:model});
                    break;
                }
            }
            if(!model){
                response.end('No Such Item');
            }
        });
     console.log(urlObj);
    }
    else if(urlObj.pathname === '/four' && request.method === 'get'){
        readNewsData(function (list_news) {
            let model = null;
            //循环list找到和id值相等的数据
            for(let i =0;i<list_news.length;i++){
                if( list_news[i].id.toString() === urlObj.query.id){
                    model = list_news[i]; //存储找到的新闻
                    response.rander(path.join(__dirname,'news-index','four.html'),{list:model});
                    break;
                }
            }
        });


    }
    else if(request.url.startsWith('/add') && request.method === 'get') {

        fs.readFile(path.join(__dirname,'data','data.json'),'utf8',function (err,data) {
            if(err && err.code !== 'ENOENT') {
                throw err;
            }
            let list = JSON.parse(data || '[]');
            urlObj.query.id = list.length;
            list.push(urlObj.query);
            writeNewsData(JSON.stringify(list),function () {
                response.statusCode = 302;
                response.statusMessage = 'Found';
                response.setHeader('Location','/');
                response.end();
            })
        });
    }

    else if(request.url==='/add'&& request.method === 'post'){
        readNewsData(function (list) {
            let array = [];
            request.on('data',function (chunk) {
                array.push(chunk);
            });

            request.on('end',function () {
                let postBody = Buffer.concat(array);
                postBody = postBody.toString('utf8');
                postBody = querystring.parse(postBody);
                postBody.id = list.length;
                list.push(postBody);
                writeNewsData(JSON.stringify(list),function () {
                    response.statusCode = 302;
                    response.statusMessage = 'Found';
                    response.setHeader('Location','/');
                    response.end();
                });

            })
        });

    }
    //删除新闻
    else if(request.url.startsWith('/delete') && request.method === 'get'){
        readNewsData(function (list){
            list = list.filter( item =>item.id !== parseInt(urlObj.query.id) );
            writeNewsData(JSON.stringify(list),function () {
                response.statusCode = 302;
                response.statusMessage = 'Found';
                response.setHeader('Location','/');
                response.end();
            });
        })
    }
    // TODO 修改  找到对应的id进行读取数据(数据较大，post方式)
    else if(request.url.startsWith('/modify') && request.method === 'post'){
        //TODO 得到请求的数据  然后写入文件
        readNewsData(function (list) {
            let array = [];
            request.on('data',function (chunk) {
                array.push(chunk);
            });
            request.on('end',function () {
                let postSum = Buffer.concat(array);
                postSum = postSum.toString('utf8');
                postSum = JSON.parse(postSum);
                /*判断更新数据*/
                for(let i=0;i<list.length;i++){
                    if(list[i].id.toString() === postSum.id){
                        list[i].title = postSum.title;
                        list[i].text = postSum.text;
                    }
                }
                writeNewsData(JSON.stringify(list),function () {
                    response.statusCode = 302;
                    response.statusMessage = 'Found';
                    response.setHeader('Location','/');
                    response.end();
                })
            })
        })
    }
    else if(request.url.startsWith('/resource') && request.method === 'get'){
        response.rander(path.join(__dirname,request.url));
    }
    else{
        response.writeHead(404,'Not Found',{
            'Content-Type':'text/html;charset=utf-8'
        });
        response.end('404,Page Not Found');
    }
}).listen(8080,function () {
   console.log('http://localhost:8080');
});
//读取data.json 文件
function readNewsData(callback) {
    fs.readFile(path.join(__dirname,'data','data.json'),'utf8',function (err,data) {
        if (err && err.code !== 'ENOENT') {
            throw err;
        }
        let list = JSON.parse(data || '[]');
        callback(list);
    });
}
function writeNewsData(data,callback) {
    fs.writeFile(path.join(__dirname,'data','data.json'),data,function (err) {
        if (err) {
            throw err;
        }
        callback();
    });
}