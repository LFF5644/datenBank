if(globals.counter){
	globals.counter+=1;
}else{
	globals.counter=1;
}
response.write("COUNTER: "+globals.counter);
