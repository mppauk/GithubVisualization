
    
    var authorMap;
    var authors;
    var BeginRange;
    var EndRange;
    var network;
    var Snapshots;
    var RepositoryData;
    async function initializeCommitNetwork(response, beginRange, endRange){
        BeginRange = beginRange;
        EndRange = endRange;
        authorMap = {};
        authors = [];
        RepositoryData = response
        FileHistory = [];
        var options = {
            nodes: {
                shape: 'dot',
                size: 30,
                font: {
                    size: 32,
                    color: '#ffffff'
                },
            },
            edges: {
                width: 5,
                length: 40,
            },
            physics: {
                barnesHut: {
                    springConstant: 0.04,
                    springLength: 600,
                    gravitationalConstant: -50000
                },
                solver:'barnesHut'
            },
            interaction:{
                hover: true
            },
            groups:{
            }
        };
        Snapshots = constructCommitGraph();
        var data = {
            nodes: new vis.DataSet([]),
            edges: new vis.DataSet([])
        }
        var RootNode = {id:0, label:RepoName, size:65, group: 0, borderWidth:1};
        data.nodes.add(RootNode);
        var container = document.getElementById('network_container');
        network = new vis.Network(container, data, options);
    }
    
    function constructCommitGraph(){
        var Root = {name: OrgName + " " + RepoName, children:[], isFile: false, isLCA: true, groupID: 0};
        var Snapshots = [];
        var Nodes = [];
        Nodes.push(false);
        var RootNode = {id:0, label:Root.name, group:0, size:65};
        var GraphSubset = {
            nodes: [],
            edges: []
        }
        var map = {};
        for(var i=0; i< RepositoryData.length;i++){
            getCommitPathTree(i, Root, Nodes, map);
            CommitAdaptedDFS(Root, GraphSubset, RootNode.id, Nodes);
            Snapshots.push(GraphSubset);
            var GraphSubset = {
                nodes: [],
                edges: []
            }
        }
        return Snapshots;
    }
   function CommitAdaptedDFS(Root, GraphSubset, lastLCAId, Nodes){
        var children = Root.children;
        if(children.length == 0){
            return;
        }
        for(var i=0; i<children.length;i++){
            if(children[i].isLCA){
                if(Nodes[children[i].nodeId ]==false){
                    var tempNode = {id:children[i].nodeId, 
                                    label: ".../" + children[i].name, 
                                    borderWidth: 1,
                                    group: children[i].groupID, 
                                    size:40};
                    Nodes[children[i].nodeId]=true;
                    GraphSubset.nodes.push(tempNode);
                    GraphSubset.edges.push({from:lastLCAId, to:tempNode.id});
                }
                CommitAdaptedDFS(children[i], GraphSubset, children[i].nodeId, Nodes);
            }
            else if(children[i].isFile){
                if(Nodes[children[i].nodeId]==false){
                    var tempNode = {id:children[i].nodeId, 
                                    label: children[i].name,
                                    borderWidth: 3, 
                                    group:lastLCAId,
                                    title: children[i].title, 
                    };
                    Nodes[children[i].nodeId]=true;
                    GraphSubset.nodes.push(tempNode);
                    GraphSubset.edges.push({from:lastLCAId, to:tempNode.id});
                }
                CommitAdaptedDFS(children[i], GraphSubset, lastLCAId, Nodes);
            }
            else{
                CommitAdaptedDFS(children[i], GraphSubset, lastLCAId, Nodes);
            }  
        }
    }
    function getCommitPathTree(index, Root, Nodes, map){
        var Files = RepositoryData[index].Files
        var i;
        var nodeid=Nodes.length+ authors.length;
        for(i=0;i<Files.length;i++){
            var commit = RepositoryData[index].Commits.find(commit => commit.sha == Files[i].Commits[Files[i].Commits.length-1]);
            var authorNode;
            if(commit.Author && commit.Author.name != "null"){
                var authorName = commit.Author.name.slice(1,-1);
                if(!map[authorName]){
                    authorNode = {
                        id: nodeid,
                        label: authorName,
                        shape: 'image',
                        image: 'https://upload.wikimedia.org/wikipedia/commons/0/0a/Gnome-stock_person.svg',
                        mass: 1,
                        title: getAuthorNodeTitle(commit.Author)
                    }
                    authors.push(authorNode);
                    Nodes.push(false);
                    map[authorName] = authorNode
                    nodeid++;
                }
                else{
                    authorNode = map[authorName];          
                 }
            }
            var nextNode = Root;
            var prevNode;
            var NodeArr = Files[i].Path.split("/")
            if(NodeArr[NodeArr.length -1].name == "CachingSessionStore.java"){
                var k = 1;
            }
            var j=0;
            while(nextNode != null){
                prevNode = nextNode;
                nextNode = nextNode.children.find(childNode => childNode.name == NodeArr[j]);
                j++;
            }

            j=j-1;
            nextNode = prevNode;
            if(j == NodeArr.length){
                continue;
            }
            nextNode.isLCA = true;
            authorMap[nodeid.toString()] = authorNode;
            nextNode.groupID = nextNode.nodeId;
            for(j; j< NodeArr.length; j++){
                var tempNode;
                if(j== NodeArr.length-1){
                    tempNode = {name: NodeArr[j], 
                                children:[], 
                                isFile: true,
                                nodeId: nodeid,
                                isLCA: false, 
                                title: getFileNodeTitle(Files[i]),
                                authorName: authorName};
                    authorMap[nodeid.toString()] = authorNode;
                    nodeid++;
                }
                else if(j== NodeArr.length-2){
                    tempNode = {name: NodeArr[j], nodeId: nodeid, children:[], isFile: false, isLCA: true, groupID:nodeid};
                    authorMap[nodeid.toString()] = authorNode;
                    nodeid++;
                }
                else{
                    tempNode = {name: NodeArr[j], nodeId: nodeid, children:[], isFile: false, isLCA: false};
                    authorMap[nodeid.toString()] = authorNode;
                    nodeid++;
                }
                nextNode.children.push(tempNode);
                Nodes.push(false);
                nextNode = tempNode;
            }
        }
    }
    function getAuthorNodeTitle(author){
        var authorString ='';
        if(author.name)
            authorString += '<p>  <br> Name: '+ author.name + '</br>';
        else
            return authorString;
        if(author.location)
            authorString += '<br> Location: '+ author.location + '</br>';
        if(author.company)
            authorString += '<br> Company: ' + author.company + '</br>'
        return authorString;
    }
    function getFileNodeTitle(file){
        var dateStr = new Date(file.DateUpdated.replace("T", " ").replace("Z"," UTC"));
        return '<p>   <br> Additions: '+ file.Additions + '</br>'+
                '<br> Deletions: '+ file.Deletions + '</br>' +
                '<br> UpdatedAt: '+ dateStr.toString() + '</br>' +
                '<br> Commits: '+ file.Commits.length + '</br>'
    }
