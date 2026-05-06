module.exports = {
    apps: [
        {
            name: 'EduBridge_Server',
            script: './dist/server.js',
            args: 'start',
            env: {
                NODE_ENV: 'production',
            }, 
        },
    ],
}; 