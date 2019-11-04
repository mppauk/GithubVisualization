var isPlaying;
var SnapshotIndex;
var SnapshotNodeIndex;
var stepSize;
var addedAuthors;
function initializeAnimationControls(){
    isPlaying = false;
    SnapshotNodeIndex = 0;
    stepSize = 1;
    addedAuthors = {};
    SnapshotIndex = 0;
    disableControlButtons();
    enableControlButtons();
}
 /* Animation Control Functions */
 async function authorAnimation(animationNode){ 
    const FRAMES_PER_SECOND = 30;
    const DISTANCE_PER_FRAME = 100;
    var tempEdge;
    var positions = network.getPositions();
    var parentPosition = positions[animationNode.edge.from]
    network.body.data.edges.remove(tempEdge);
    animationNode.childNode.x = parentPosition.x;
    animationNode.childNode.y = parentPosition.y;
    if(animationNode.authorNode){
        if(addedAuthors[animationNode.authorNode.label]){
            var start_pos = positions[animationNode.authorNode.id];
            var vector_length = Math.sqrt(Math.pow(parentPosition.x - start_pos.x, 2) + Math.pow(parentPosition.y - start_pos.y, 2))
            var unit_vector = [(parentPosition.x - start_pos.x)/vector_length, (parentPosition.y - start_pos.y)/vector_length];
            var x_move = unit_vector[0]*DISTANCE_PER_FRAME;
            var y_move = unit_vector[1]*DISTANCE_PER_FRAME;
            var next_x = start_pos.x
            var next_y = start_pos.y
            network.body.data.nodes.update({
                id:animationNode.authorNode.id,
                physics: false,
            });
            while(distance(next_x, parentPosition.x, next_y, parentPosition.y) > 500){
                next_x += x_move;
                next_y += y_move;
                network.moveNode(animationNode.authorNode.id, next_x, next_y);
                await sleep(1000/FRAMES_PER_SECOND);
            }
            network.body.data.nodes.update({
                id:animationNode.authorNode.id,
                physics: true,
            });
            animationNode.childNode.x = next_x;
            animationNode.childNode.y = next_y;
        }
        else{
            addedAuthors[animationNode.authorNode.label] = true;
            animationNode.authorNode.x = parentPosition.x;
            animationNode.authorNode.y = parentPosition.y;
            network.body.data.nodes.add(animationNode.authorNode);
        }
        tempEdge = {
            from: animationNode.authorNode.id,
            to: animationNode.childNode.id,
            length: 1,
            hidden: true
        }
        network.body.data.edges.add(animationNode.edge);
        network.body.data.nodes.add(animationNode.childNode);
        network.body.data.edges.add(tempEdge);
    }
    else{
        network.body.data.edges.add(animationNode.edge);
        network.body.data.nodes.add(animationNode.childNode);
    }
    await sleep(900);
    network.fit();
    network.body.data.edges.remove(tempEdge);
}
function distance(x1, x2, y1, y2){
    return Math.sqrt(Math.pow(x2 -x1, 2) + Math.pow(y2 - y1, 2));
}
async function incrementNetwork(incrDir){
    if(incrDir >= 0){
        if(SnapshotNodeIndex == 0){
            currentDateTime.setTime(currentDateTime.getTime() + stepSize*60*60*1000);
            if(currentDateTime >= EndRange){
                currentDateTime.setTime(EndRange.getTime())
            }
            currentTimePicker.setDate(currentDateTime);
        }
        var i;
        for(i=SnapshotIndex;i<Snapshots.length;i++){
            var dateStr = RepositoryData[i].EndDate.replace("T"," ");
            var NextSnapshotBeginDate = new Date(dateStr + " UTC");
            if(NextSnapshotBeginDate > currentDateTime)
                break;
    
            for(var j=SnapshotNodeIndex; j< Snapshots[i].nodes.length; j++){
                var ListNode = {
                    childNode: Snapshots[i].nodes[j],
                    edge: Snapshots[i].edges[j],
                    authorNode: authorMap[Snapshots[i].nodes[j].id.toString()]
                };
                await authorAnimation(ListNode);
            }
        }
        SnapshotIndex = i;
    }
    else{
        if(SnapshotNodeIndex == 0){
            currentDateTime.setTime(currentDateTime.getTime() - stepSize*60*60*1000);
            if(currentDateTime <= BeginRange){
                currentDateTime.setTime(BeginRange.getTime());
            }
            currentTimePicker.setDate(currentDateTime);
        }
        var i;
        for(i=SnapshotIndex;i>0;i--){
            var dateStr = RepositoryData[i-1].EndDate.replace("T", " ");
            var NextSnapshotBeginDate = new Date(dateStr.replace("Z"," UTC"));
            if(NextSnapshotBeginDate < currentDateTime)
                break;
            if(SnapshotNodeIndex == 0){
                network.body.data.nodes.remove(Snapshots[i-1].nodes);
                network.body.data.edges.remove(Snapshots[i-1].edges);
            }
            else{
                network.body.data.nodes.remove(Snapshots[i].nodes);
                network.body.data.edges.remove(Snapshots[i].edges);
                SnapshotNodeIndex = 0;
            }
            network.fit();
        }          
        SnapshotIndex=i;
    }

}
async function stepNetwork(){
    if(SnapshotNodeIndex == 0){
        currentDateTime.setTime(currentDateTime.getTime() + stepSize*60*60*1000);
        if(currentDateTime >= EndRange){
            currentDateTime.setTime(EndRange.getTime())
        }
        currentTimePicker.setDate(currentDateTime);
    }
    var i;
    for(i=SnapshotIndex;i<Snapshots.length;i++){
        var dateStr = RepositoryData[i].EndDate.replace("T"," ");
        var NextSnapshotBeginDate = new Date(dateStr + " UTC");
        if(NextSnapshotBeginDate > currentDateTime)
            break;
        var j;
        for(j=SnapshotNodeIndex; j< Snapshots[i].nodes.length; j++){
            if(!isPlaying){
                SnapshotNodeIndex = j;
                break;
            }
            var ListNode = {
                childNode: Snapshots[i].nodes[j],
                edge: Snapshots[i].edges[j],
                authorNode: authorMap[Snapshots[i].nodes[j].id.toString()]
            };
            await authorAnimation(ListNode);
        }
        if(j == Snapshots[i].nodes.length){
            SnapshotNodeIndex = 0;
        }
        else{
            break;
        }
    }
    SnapshotIndex = i;
}
async function playAnimation(){
    if(isPlaying){
        isPlaying=false;
        disableControlButtons();
        document.getElementById('play').innerHTML = 'Play';
        return;
    }
    isPlaying = true;
    document.getElementById('play').innerHTML = 'Pause';
    while(isPlaying){
        if(currentDateTime >= EndRange){
            resetNetwork();
        }
        else{
            await stepNetwork();
        }
        await sleep(500);           
    }
    enableControlButtons();
}
function resetNetwork(){
    currentDateTime.setTime(BeginRange.getTime());
    currentTimePicker.setDate(currentDateTime);
    for(var i=SnapshotIndex-1; i>=0; i--){
        network.body.data.nodes.remove(Snapshots[i].nodes);
        network.body.data.edges.remove(Snapshots[i].edges);
    }
    network.body.data.nodes.remove(authors);
    addedAuthors = {};
    network.fit();
    SnapshotIndex = 0;
    SnapshotNodeIndex = 0;
}
async function controlButtonListener(event){
    if(!isPlaying){
        disableControlButtons();
        if(event.path[0].id == 'next')
            await incrementNetwork(1);
        else{
            await incrementNetwork(-1);
        }
        enableControlButtons();
    }
}
async function keyPressListener(e){
    var n;
    if(!isPlaying && (e.keyCode==37 ||e.keyCode==39)){
        e.preventDefault();
        disableControlButtons();
        await incrementNetwork(e.keyCode-38);
        enableControlButtons();
          
    }
}
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
function disableControlButtons(){
    var backButton = document.getElementById('back');
    var playButton = document.getElementById('play');
    var nextButton = document.getElementById('next');
    backButton.removeEventListener("click", controlButtonListener);
    nextButton.removeEventListener("click", controlButtonListener);
    playButton.removeEventListener("click", playAnimation);
    document.removeEventListener('keydown', keyPressListener);
}
function enableControlButtons(){
    var backButton = document.getElementById('back');
    var playButton = document.getElementById('play');
    var nextButton = document.getElementById('next');
    backButton.addEventListener("click", controlButtonListener);
    nextButton.addEventListener("click", controlButtonListener);
    playButton.addEventListener("click", playAnimation);
    document.addEventListener('keydown', keyPressListener);
}