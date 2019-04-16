const button = document.getElementById('delete');

function success() {
    alert("删除成功");
    window.location.href = 'http://localhost:8080/one';
}
button.onclick = function (){
    if(confirm("确认删除此新闻吗")){
        ajax();
    }
};
function ajax() {
    let xhr = null;
    let url = '/delete' + window.location.search;
    xhr = new XMLHttpRequest();
    xhr.open('get',url,true);
    xhr.send();
    xhr.onreadystatechange = function () {
        if(xhr.readyState === 4){
            if(xhr.status === 200){
                success();
            }
        }
    }
}