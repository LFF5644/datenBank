#!/usr/bin/env node
const http=require("http");
const fs=require("fs");
const querystring=require("querystring");

const serverfiles="server";
const workspace="workspace";
const configFileName="config_server.json";
const getStatusCodeHtml="error.html";
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

function parseSearch(search){
	if(!search){return{}}
	const vars={}
	search=search.split("&");
	let v; // v = variable / parameter / argument
	for(v of search){
		if(v.includes("=")){
			const variable=v.split("=");
			let write;
			try{
				write=JSON.parse(querystring.unescape(variable[1]));
			}
			catch(e){
				write=querystring.unescape(variable[1]);
			}
			vars[querystring.unescape(variable[0])]=write;
		}else{
			if(v.startsWith("!")){
				vars[querystring.unescape(v.substring(1))]=false;
			}else{
				vars[querystring.unescape(v)]=true;
			}
		}
	}
	return vars;
}
function makeDir(dir){
	try{
		fs.mkdirSync(dir);
		return true;
	}
	catch(e){
		return false;
	}
}
function readConf(configFileName,json=true){
	let config;
	try{
		config=fs.readFileSync(configFileName);
	}catch(e){
		console.log("cant read config file "+configFileName);
		return false;
	}
	if(!json){return config}

	try{
		config=JSON.parse(config);
	}catch(e){
		console.log("cant parse config file "+configFileName);
		return false;
	}
	return config;
}
function setStatusCode(response,code,alertText=null){
	let msg="";
	let info="";
	let fix=[];

	switch(code){
		case 400:
			msg='Ungültige Anfrage';
			info="gewünschten Server Parameter nicht übergeben oder falsches formart!"
			fix=[
				"Parameter stimmen nicht dem verlangtem formart überein",
				"Parameter werden benötigt",
				"Ungültige Zeichen nicht erlaubt"
			]
			break;
		case 403:
			msg="Verboten";
			info="Nicht Erlaubt!";
			fix=[
				"Diese Aktion ist nicht erlaubt",
				"Sie haben Keine rechte für diese Aktion",
			];
			break;
		case 404:
			msg="Datei nicht gefunden";
			fix=[
				"Rechtschreibung Prüfen",
				"Prüfen ob Datei nicht verlegt wurde",
			];
			break;
		case 500:
			msg='Server Interner Fehler';
			fix=[
				"Fehler im Code beheben xD",
			];
			info="Programm konnte nicht ausgeführt werden!";
			break;
	}
	const result=fs.readFileSync(getStatusCodeHtml,"utf-8")
		.split("[msg]").join(!msg?"":msg)
		.split("[code]").join(code)
		.split("[info]").join(info)
		.split("[fix]").join(JSON.stringify(fix))
		.split("[alert]").join(JSON.stringify(alertText));

	response.setHeader("Content-Type","text/html");
	response.statusCode=code;
	response.write(result);
	response.end();
}
function onRequest(request,response){
	const requestUrl=request.url.split("?");
	const file=requestUrl[0];
	const args=requestUrl[1];

	console.log("Anfrage zu "+file);
	
	response.statusCode=200;
	response.setHeader("Cache-Control","no-cache, no-store");
	response.setHeader("Content-Type","text/plain; charset=utf-8");

	if(notAllowedChars.some(item=>file.includes(item))){// Wenn VERBOTENES Zeichen enthalten
		console.log("user send not allowed chars!");
		setStatusCode(response,400,"VERBOTENES ZEICHEN ENTHALTEN!");
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
		setStatusCode(response,404);
		console.log("file cant found!");
		return;
	}
	//script=`((globals,response)=>{${script}})(globals,response);`
	let result;
	try{
		const input=parseSearch(args);
		result=eval(script);
	}catch(e){
		console.log("Interner Server Fehler 500: "+e);
		setStatusCode(response,500,e);
		return;
	}
	response.end();
}
function onConnection(connection){
	console.log("Neue Verbindung");
}

const config=readConf(configFileName);
if(!config){
	console.log("\nPLEASE OPEN THE CONFIG ("+configFileName+") AND EDIT IT THIS IS THE DEFAULT SETTINGS!");
	fs.writeFileSync(
		configFileName,
		JSON.stringify(
			{
				ip:"127.0.0.1",
				port:8080,
			},
			null,
			2,
		)
			.split("  ")
			.join("\t")
	);
	process.exit(-1);
}
makeDir(workspace);
const server=http.createServer(onRequest);
server.listen(
	config.port,
	config.ip,
);
server.on("connection",onConnection);
console.log("Server gestartet ...");
