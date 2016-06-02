//Justin Powell
function main(){
	var canvas = document.getElementById('example');
	if (!canvas){
		console.log('Failed to retireve the <canvas> element');
		return;
	}
	
	var ctx = canvas.getContext('2d')
	
	for(i = 0; i < 400; i++){
		for(j = 0; j < 20; j++){
			ctx.fillStyle = 'rgba('+Math.floor(Math.random()*256)+','+Math.floor(Math.random()*256)+','+Math.floor(Math.random()*256)+',1.0)'
			ctx.fillRect((i*50),(j*50),50,50);
		}
	}
}