$(document).ready(function() {
	$('#gsContainer').graincounter();
	var gsCounter = $('#gsContainer').data('graincounter');
	var imageLocation = "/Users/sambrooke/Dropbox/Projects/Grain Size/Software/2_C_1.jpg";
	$('#fileChooser').change(function(){
		if(this.files[0]){
			reader  = new FileReader();
			reader.onloadend = function () {
				gsCounter.generateTools(reader.result);
			}
			reader.readAsDataURL(this.files[0])
		}
	});
});