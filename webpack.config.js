const path = require('path');
// const HWP = require('html-webpack-plugin');

module.exports = {
    resolve: {
        extensions: ['.js', '.jsx', '.ts', '.tsx']
    },
    entry: path.join(__dirname, '/react-src/index.js'),
    output: {
        filename: 'app.js',
        path: path.join(__dirname, '/public')
    },
    module: {
        rules: [{
            test: /.*react-src.*\.tsx?$/,
            loader: 'ts-loader'
        }, {
            test: /.*react-src.*\.jsx?$/,
            loader: 'babel-loader'
        }, {
            test: /.*react-src.*\.css$/,
            use: ['style-loader', 'css-loader']
        }]
    },
    // plugins: [
    //     new HWP({ 
    //         template: path.join(__dirname, '/react-src/index.html'),
    //         filename: path.join(__dirname, '/public/index.html'),
    //         hash: true
    //     })
    // ]
}