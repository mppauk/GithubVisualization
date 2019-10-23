function initializeStatistics(){
    if(RepositoryData.repositoryStatistics.forks)
        document.getElementById("forks").innerHTML = 'Forks: ' + RepositoryData.repositoryStatistics.forks;
    else
        document.getElementById("forks").innerHTML = 'Forks: N/A';
    if(RepositoryData.repositoryStatistics.branches)
        document.getElementById("branches").innerHTML = 'Branches: ' + RepositoryData.repositoryStatistics.branches;
    else
        document.getElementById("branches").innerHTML = 'Branches: N/A';
    if(RepositoryData.recentStatistics.commit_count)
        document.getElementById('commit_count').innerHTML = 'Commits: ' + RepositoryData.recentStatistics.commit_count;
    else
        document.getElementById('commit_count').innerHTML = 'Commits: N/A';
    if(RepositoryData.recentStatistics.author_count)
        document.getElementById('author_count').innerHTML = 'Authors: ' + RepositoryData.recentStatistics.author_count;
    else
        document.getElementById('author_count').innerHTML = 'Authors: N/A';
    if(RepositoryData.recentStatistics.additions)
        document.getElementById('additions').innerHTML = 'Additions: ' + RepositoryData.recentStatistics.additions;
    else
        document.getElementById('additions').innerHTML = 'Additions: N/A';
    if(RepositoryData.recentStatistics.deletions)
        document.getElementById('deletions').innerHTML = 'Deletions: ' + RepositoryData.recentStatistics.deletions;
    else
        document.getElementById('deletions').innerHTML = 'Deletions: N/A';
}
