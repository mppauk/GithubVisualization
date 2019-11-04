//--allow-file-access-from-files
function loadJson(pathExtension){
    return new Promise(function(resolve, reject){
        var path = "https://mppauk.github.io/GithubVisualization/"+ pathExtension;
        var xhRequest = new XMLHttpRequest();
        xhRequest.overrideMimeType('application/json');
        xhRequest.onload = function (){
            if(xhRequest.readyState == 4){
                resolve(JSON.parse(xhRequest.responseText))
            }
            else{
                resolve(-1);
            }
        }
        xhRequest.onloadend = function(){
            reject(Error("do nothing"));
        }
        xhRequest.open('GET', path, true);
        xhRequest.send(null);
    });
}
