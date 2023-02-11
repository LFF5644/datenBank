const fs=require("fs");
const counterFile=workspace+"/counter.save";
const {
	load,
	save,
	reset,
}=input;

if(globals.counter){
	globals.counter+=1;
}else{
	globals.counter=1;
}

if(reset){
	response.write("counter reset!\n");
	globals.counter=1;
}

if(save){
	fs.writeFileSync(counterFile,String(globals.counter),"utf-8");
	response.write("counter saved to file!\n");
}
else if(load){
	try{
		globals.counter=Number(fs.readFileSync(counterFile,"utf-8"));
		response.write("counter loaded from file!\n");
	}
	catch(e){
		response.write("cant read file!\n");
	}
}

response.write("\nCOUNTER: "+globals.counter+"\n");
