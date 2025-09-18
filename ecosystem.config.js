module.exports = {
    apps: [
        {
            name: 'raalaaan',
            script: './dist/server.js',
            args: 'start',
            env: {
                NODE_ENV: 'production',
            }, 
        },
    ],
}; 