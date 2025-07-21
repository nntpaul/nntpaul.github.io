const gitalk = new Gitalk({
    clientID: 'Ov23li915zWGodupwLwr',
    clientSecret: '6b6d4161a371367ffe1e8b0632e042b2c9b10b7a',
    repo: 'nntpaul.github.io',
    owner: 'nntpaul',
    admin: ['nntpaul'],
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
