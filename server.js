#!/usr/bin/env node
const http=require("http");
const fs=require("fs");

const serverfiles="server";
const notAllowedChars=[
	"..",
	"~",
	"\\",
	"\\\\",
	"//",
	"\n",
	"\r",
];

const globals={};

function onRequest(request,response){
	//console.log("request:",Object.keys(request));
	//console.log("response:",Object.keys(response));

	const file=request.url.split("?")[0];
	const args=request.url.split("?")[1];

	console.log("Anfrage zu "+file);
	
	response.statusCode=200;
	response.setHeader("Cache-Control","no-cache, no-store");
	response.setHeader("Content-Type","text/plain; charset=utf-8");

	if(notAllowedChars.some(item=>file.includes(item))){// Wenn VERBOTENES Zeichen enthalten
		console.log("user send not allowed chars!");
		response.statusCode=400;
		response.write("VERBOTENES ZEICHEN ENTHALTEN!");
		response.end();
		return;
	}
	if(file=="/"){
		response.write("sie können mit Hilfe von diesem server locale JS Dateien ausführen einfach an die url ran packen\n> /test.js\n> /test.js?arg1=hello%20world&arg2=no");
		response.end();
		return;
	}
	let script;
	try{
		script=fs.readFileSync(serverfiles+file,"utf-8");
	}catch(e){
		response.statusCode=404;
		response.write("FILE CANT FOUND!");
		response.end();
		console.log("file cant found!");
		return;
	}
	//script=`((globals,response)=>{${script}})(globals,response);`
	let result;
	try{
		result=eval(script);
	}catch(e){
		console.log("cant execute "+file+", ERROR: "+e);
		response.statusCode=500;
		response.write("CANT EXECUTE SERVER SCRIPT!\nError code: "+e);
		response.end();
		return;
	}
	response.end();
}
function onConnection(connection){
	console.log("Neue Verbindung");
}

const server=http.createServer(onRequest);
server.listen(8080,"127.0.0.1");
server.on("connection",onConnection);
console.log("Server LÄUFT ...");
