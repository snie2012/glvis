// const webpack = require("webpack");
const path = require('path');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const HtmlWebpackPlugin = require('html-webpack-plugin');

const config = {
	context: path.join(__dirname, './'),

	devtool: "source-map",

	watch: true,

	entry: {
		app: './app/js/main.js'
	},

	output: {
		path: path.resolve(__dirname, 'build'),
		filename: '[name].bundle.js'
	},

	module: {
		rules: [
			{
				test: /\.(js|jsx)$/, 
				exclude: /node_modules/,
				use: 'babel-loader'
			},

			{
				test: /\.(css|scss)$/,
				use: [
					MiniCssExtractPlugin.loader,
					{
						loader: "css-loader", 
						options: {sourceMap: true}
					},
					{
						loader: "sass-loader", 
						options: {sourceMap: true}
					}
				]
			},

			{
				test: /\.(jpe?g|png|gif|svg)$/i,
				loaders: [
					'file-loader?hash=sha512&digest=hex&name=[hash].[ext]',
					'image-webpack-loader?bypassOnDebug&optimizationLevel=7&interlaced=false'
				]
			}
		]
	},

	resolve : {
		alias: {
			"jquery-ui": "jquery-ui-dist/jquery-ui.min.js",
			"jquery-ui-css": "jquery-ui-dist/jquery-ui.min.css",
			
			modules: path.join(__dirname, "node_modules"),
		}
	},

	plugins: [

		new HtmlWebpackPlugin({
			title: 'Custom template',
			// Load a custom template (lodash by default)
			template: '../templates/template.html',
			filename: '../../templates/main.html'
		}),

		new MiniCssExtractPlugin({
			filename: "style.css"
			// chunkFilename: "[id].css"
		}),

		// new webpack.ProvidePlugin({
		// 	'd3': 'd3',
		// 	'window.d3': 'd3'
		// })
	],

	optimization: {
		splitChunks: {
			cacheGroups: {
				styles: {
					name: 'styles',
					test: /\.(css|scss)$/,
					chunks: 'all',
					enforce: true
				}
		  	}
		}
	}
};


module.exports = config;

