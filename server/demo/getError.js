const {code,alertText}=input;
if(code>199){
	setStatusCode(response,code,alertText);
}else{
	response.write("?code = 403 & alertText = Error HALT!");
}
