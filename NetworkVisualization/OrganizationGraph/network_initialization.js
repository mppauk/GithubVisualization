    var OrgName = "apache"
    var RepoName;
    loadJson("org/" + OrgName+"/recent/repos").then(initializeOrganizationNetwork).catch(function(error){});

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
                var dateQueryEndRange = new Date();
                var dateQueryBeginRange = new Date();
                dateQueryBeginRange.setDate(dateQueryBeginRange.getDate() - 3);
                loadJson("org/"+OrgName+"/repo/"+RepoName+"/vulnerabilities")
                    .then(initializeVulnerabilityNetwork)
                    .catch(function(error){console.log(error)});
                loadJson("org/" + OrgName+'/repo/'+RepoName +'/snapshots/from/'+dateQueryBeginRange.toISOString().substring(0, 19)+'/to/' + dateQueryEndRange.toISOString()
                    .substring(0, 19))
                    .then(function(responseData){
                        initializeCommitNetwork(responseData, dateQueryBeginRange, dateQueryEndRange)
                    })
                    .then(initializeAnimationControls)
                    .then(initializeTimeRange)
                    .then(initializeStatistics)
                    .catch(function(error){console.log(error)});
            }
        });
    }