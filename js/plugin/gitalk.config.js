const gitalk = new Gitalk({
    clientID: '5d5d2ccbdfc905efae38',
    clientSecret: 'efd34fc1dfa460984be2ac29e7a7fb40a4e2b8ee',
    repo: 'timuela.github.io',
    owner: 'timuela',
    admin: ['timuela'],
    distractionFreeMode: false,
    createIssueManually: true,
    flipMoveOptions: {
        staggerDelayBy: 150,
        appearAnimation: 'fade',
        enterAnimation: 'fade',
        leaveAnimation: 'fade',
    },
    id: 'public/discussion',
})
gitalk.render('gitalk-container')