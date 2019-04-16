const http = require('http');
const fs = require('fs');
const path = require('path');
const mime = require('mime');
const url = require('url');
const querystring = require('querystring');
const _ = require( 'underscore'); //官方建议定义
http.createServer(function (request,response) {
    //封装函数 读取文件 并作为response的一个方法
    //渲染html中需要用到模板数据，所以需要传入参数html的模板数据htmlData
    response.rander = function(filename,htmlData) {
        fs.readFile(filename, function (err, data) {
            if (err) {
                response.writeHead(404, 'Not Found', {'Content-Type': 'text/html;charset=utf-8'});
                response.end('404,Page Not Found');
                return;
            }
            if(htmlData){
                //判断是否传输模板数据，判断是否需要进行替换
                let fn =  _.template(data.toString('utf8'));
                data = fn(htmlData);
            }
            response.setHeader('Content-Type', mime.getType(request.url)); //请求的资源类型不同
            response.end(data.toString());
        });
    };
    request.url = request.url.toLowerCase();
    request.method = request.method.toLowerCase();
    //url.parse()返回的是一个对象，解析url中的数据,true可以将解析的数据转换成键值对形式
    let urlObj = url.parse(request.url,true);

    if(request.url === '/' || request.url === '/one' && request.method === 'get'){
        //更新模板数据
        fs.readFile(path.join(__dirname,'data','data.json'),'utf8',function (err,data) {
            if (err && err.code !== 'ENOENT') {
                throw err;
            }
            let list_news = JSON.parse(data || '[]');
            response.rander(path.join(__dirname, 'news-index', 'one.html'), {list: list_news});
        });

    }
    else if(request.url === '/two' && request.method === 'get'){
        response.rander(path.join(__dirname,'news-index','two.html'));
    }
    else if(urlObj.pathname === '/three' && request.method === 'get'){
        fs.readFile(path.join(__dirname,'data','data.json'),'utf8',function (err,data) {
            if(err && err.code !== 'ENOENT'){
                throw err;
            }
            let list_news = JSON.parse(data || '[]');
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
    /**添加新闻*/
    //list数组里面存储新闻数据，且每次得到的数据追加到list数组中，不能覆盖之前的数据
    //所以每次先读取json文件的数据，再再后面追加新数据，而不是每次都初始化新数据
    /**重点做好第一次文件不存在，或者文件中没有数据的处理
     * 其次不同的请求方法 对应的表单 method 要进行改变*/
    else if(request.url.startsWith('/add') && request.method === 'get') {
        //引入url模块，将get请求的路径（路径后面连接着数据）进行JSON解析数据，就不需要用户去截取字符串得到数据
        // 读取编码形式是utf8，则回调函数中得到的数据就是字符串，否则是Buffer对象
        fs.readFile(path.join(__dirname,'data','data.json'),'utf8',function (err,data) {
           //文件不存在的错误'ENOENT
            if(err && err.code !== 'ENOENT'){
               throw err;
           }
           //若读取到数据，则将得到的数据，转换成数组
            //否则将'[]'转换成数组，不然第一次肯定会出错
            let list = JSON.parse(data || '[]'); //转换成JSON对象
            urlObj.query.id = list.length; //每条新闻设置id 识别
            list.push(urlObj.query);

            // 将得到的数据写入data.json文件
            fs.writeFile(path.join(__dirname,'data','data.json'),JSON.stringify(list),function (err) {
               if (err){
                   throw err;
               }
               //设置响应报文头，执行添加后页面跳转到首页
                /**重定向 实现跳转*/
                response.statusCode = 302; //Found
                response.statusMessage = 'Found';
                response.setHeader('Location','/'); //跳转到根目录('/')
                response.end();
            });
        });
    }
    //post方法的数据量比较大，分次提交
    else if(request.url==='/add'&& request.method === 'post'){
        fs.readFile(path.join(__dirname,'data','data.json'),'utf8',function (err,data) {
            if(err && err.code !== 'ENOENT'){
                throw err;
            }
            let list = JSON.parse(data || '[]'); //转换成JSON对象
            /**监听request的data事件和end事件（end事件表示数据提交完毕）*/
            let array = []; //保存每次提交的一部分数据
            request.on('data',function (chunk) {
                //chunk是浏览器本次提交的一部分数据  数据类型是Buffer
                array.push(chunk); //chunk就是一个Buffer对象
            });
            /**监听结束  Buffer->String->JSON -> push到list数组*/
            request.on('end',function () {
                let postBody = Buffer.concat(array);//把小Buffer合成大的buffer
                //把获取到的buffer对象转换成字符串
                postBody = postBody.toString('utf8');
                postBody = querystring.parse(postBody); //将字符串解析成json
                postBody.id = list.length;
                list.push(postBody); //将得到的json数据提交到新闻中
                //再将新的list数组，写入data文件  跟get方式相同
                fs.writeFile(path.join(__dirname,'data','data.json'),JSON.stringify(list),function (err) {
                    if (err){
                        throw err;
                    }
                    /**重定向 实现跳转*/
                    response.statusCode = 302; //Found
                    response.statusMessage = 'Found';
                    response.setHeader('Location','/'); //跳转到根目录('/')
                    response.end();
                });
             })
        });
    }
    //请求静态资源
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
// //读取data
// function readNewsData(callback) {
//     fs.readFile(path.join(__dirname,'data','data.json'),'utf8',function (err,data) {
//         if (err && err.code !== 'ENOENT') {
//             throw err;
//         }
//         let list = JSON.parse(data || '[]');
//         callback(list);
//     });
// }
