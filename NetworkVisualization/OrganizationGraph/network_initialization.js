    var OrgName = "Apache"
    var RepoName;
    var DefaultViewTime = 7;
    loadJson(OrgName+"/RecentlyUpdatedRepositories.json").then(initializeOrganizationNetwork).catch(function(error){});

    function initializeOrganizationNetwork(Repos){
        var org_Root = {id:0, label:"Apache", group:0}
        var org_nodes = new vis.DataSet([]);
        org_nodes.add(org_Root);
        var org_edges = [];
        for(var i=0; i< Repos.length;i++){
            var node = {
                id:i+1, 
                label: Repos[i].ProjectName,
                group: i+1,
                title:'<p> <br> Branches: '+ Repos[i].Branches + '</br><br> Forks: '+ Repos[i].Forks+'</br></p>'
            };
            var edge = {from:org_Root.id, to:i+1}
            org_nodes.add(node);
            org_edges.push(edge);
        }

        var org_container = document.getElementById('organization_network');
        var org_data = {
            nodes: org_nodes,
            edges: org_edges
        };
        var org_options = {
            nodes: {
                shape: 'dot',
                size: 30,
                font: {
                    size: 32,
                    color: '#ffffff'
                },
                borderWidth: 2
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
            }
        };
        this.network = new vis.Network(org_container, org_data, org_options);
        this.network.on("click", function(properties){
            var id = properties.nodes[0];
            if(id != null){
                var node = org_nodes.get(id);
                RepoName = node.label;
                var dateQueryEndRange = new Date(2019, 8, 26);
                var day = dateQueryEndRange.getDay();
                var dateQueryBeginRange = new Date(2019, 8, 26);
                dateQueryBeginRange.setDate(dateQueryEndRange.getDate() - day);
                loadJson(OrgName+"/"+RepoName+"/dependency-check-report.json")
                    .then(initializeVulnerabilityNetwork)
                    .catch(function(error){ initializeVulnerabilityNetwork(null)});
                var promiseArray = []
                var tempDate = new Date(dateQueryBeginRange.getTime())
                while(tempDate.getTime() < dateQueryEndRange.getTime()){
                    promiseArray.push(loadJson(OrgName+'/'+RepoName +'/'+tempDate.toISOString().substring(0, 10)+ ".json"));
                    tempDate.setDate(tempDate.getDate() + 1);
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
                    .catch(function(error){console.log(error)});
            }
        });
    }
