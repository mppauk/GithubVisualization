var currentTimePicker;
var rangePicker;
var currentDateTime;

function initializeTimeRange(){
    BeginRange.setMinutes(0);
    EndRange.setMinutes(0);
    currentDateTime = new Date(BeginRange.getTime());
    currentDateTime.setMinutes(0);
    currentTimePicker = flatpickr('#current_time_picker',{
        altInput: true,
        enableTime: true,
        altFormat: "F j, Y h:i K",
        maxDate: EndRange,
        minDate: BeginRange,
        defaultDate: BeginRange,
        onClose: currentTimeChange,
        plugins:[
            new confirmDatePlugin()
        ]
    });
    rangePicker = flatpickr('.range_picker',{
        altInput: true,
        enableTime: false,
        altFormat: "F j, Y h:i K",
        defaultDate: [BeginRange, EndRange],
        onClose: rangeChange,  
        //mode: 'range',
        plugins:[
            new rangePlugin({ input: "#range_picker_end"}),
            new confirmDatePlugin()
        ]
    });

   document.addEventListener('change',function(){
        if(this.value == "1hour"){
            stepSize = 1;
        }
        else if(this.value == "2hour"){
            stepSize = 2;
        }
        else if(this.value == "6hour"){
            stepSize = 6;
        }
        else if(this.value == "12hour"){
            stepSize = 12;
        }
        else if(this.value=="24hour"){
            stepSize = 24;
        }
    });
}
function getUTCDate(date){
    return  date.getUTCFullYear() + '-'+ ('0' + (date.getUTCMonth()+1)).slice(-2) + '-' + ('0' + date.getUTCDate()).slice(-2) + 'T'
            + ('0' + date.getUTCHours()).slice(-2) + ':' + ('0' + date.getUTCMinutes()).slice(-2) +':' +('0' + date.getUTCSeconds()).slice(-2);

}
function rangeChange(selectedDates, dateStr, instance){
    if(selectedDates[0].getTime() == BeginRange.getTime() && selectedDates[1].getTime() == EndRange.getTime()){
        return;
    }
    BeginRange.setTime(selectedDates[0].getTime());
    EndRange.setTime(selectedDates[1].getTime());
    if(isPlaying){
        document.getElementById('play').click();
    }
    var tempDate = new Date(BeginRange.getTime())
    while(tempDate.getTime() < EndRange.getTime()){
        promiseArray.push(loadJson(OrgName+'/'+RepoName +'/'+tempDate.toISOString().substring(0, 10)+ ".json"));
        tempDate = new Date(tempDate.getDate() + 1);
    }
    Promise.allSettled(promiseArray).then(function(results){
            var responseData = [];
            results.forEach(function(result){
                if(result.status == "fulfilled"){
                    responseData = responseData.concat(result.value);
                }
            });
            initializeCommitNetwork(responseData, dateQueryBeginRange, dateQueryEndRange)
        })
        .then(initializeAnimationControls)
        .then(initializeTimeRange)
        .then(initializeStatistics)
        .then(resetNetwork)
        .catch(function(error){console.log(error)});
}
function pickerIncrementNetwork(incrDir){
    if(incrDir >= 0){
        var i;
        animationList = [];
        for(i=SnapshotIndex;i<Snapshots.length;i++){
            dateStr = RepositoryData[i].EndDate.replace("T"," ");
            NextSnapshotBeginDate = new Date(dateStr + " UTC");
            if(NextSnapshotBeginDate > currentDateTime)
                break;
            for(var j = 0; j < Snapshots[i].nodes.length; j++){
                network.body.data.nodes.add(Snapshots[i].nodes[j]);
                network.body.data.edges.add(Snapshots[i].edges[j]);
                var authorNode =  authorMap[Snapshots[i].nodes[j].id.toString()]
                if(authorNode && !addedAuthors[authorNode.label]){
                    addedAuthors[authorNode.label] = true;
                    network.body.data.nodes.add(authorNode);
                }
            }
        }
        network.fit();
        SnapshotIndex = i;

    }
    else{
        var i;
        for(i=SnapshotIndex;i>0;i--){
            dateStr = RepositoryData[i-1].BeginDate.replace("T", " ");
            NextSnapshotBeginDate = new Date(dateStr.replace("Z"," UTC"));
            if(NextSnapshotBeginDate < currentDateTime)
                break;
            network.body.data.nodes.remove(Snapshots[i-1].nodes);
            network.body.data.edges.remove(Snapshots[i-1].edges);
        }
        network.fit();          
        SnapshotIndex=i;
    }

}
function currentTimeChange(selectedDates, dateStr, instance){
    isPlaying = false;
    if(selectedDates[0] > currentDateTime){
        currentDateTime.setTime(selectedDates[0].getTime());
        pickerIncrementNetwork(1);
    }
    else{
        currentDateTime.setTime(selectedDates[0].getTime());
        pickerIncrementNetwork(-1);
    }
}