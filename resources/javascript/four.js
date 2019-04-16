const btn = document.getElementsByClassName('btn')[0];
const title= document.getElementsByClassName("title")[0];
const text = document.getElementsByClassName("text")[0];
let data = {};

function success() {
    alert("修改成功");
    window.location.href = 'http://localhost:8080/one';
}
btn.onclick = function (){
    if(confirm("确认修改此新闻吗")){
        ajax();
    }
};
function ajax() {
    let xhr = null;
    let url = '/modify' + window.location.search;
    xhr = new XMLHttpRequest();
    let queryStr = window.location.search;
    data ={
        'title' : title.value,
        'text' : text.value,
        'id':queryStr.slice(queryStr.indexOf('=')+1)
    };
    xhr.open('post',url,true);
    xhr.setRequestHeader("Content-Type","application/json;charset=utf-8");
    xhr.send(JSON.stringify(data));
    xhr.onreadystatechange = function () {
        if(xhr.readyState === 4){
            if(xhr.status === 200){
                success();
            }
        }
    }
}