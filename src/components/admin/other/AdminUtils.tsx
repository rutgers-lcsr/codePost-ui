/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/**********************************************************************************************************************/

function openSubmission(submissionID: number | string) {
  if (window) {
    window.open(`/code/${submissionID}`);
  }
}

// Upload Utils
const resizeImage = (imageStringInBase64: string) => {
  const MAX_IMAGE_SIZE = 500;
  return new Promise(function(resolved, rejected) {
    var i = new Image();
    i.onload = function() {
      if (i.width < MAX_IMAGE_SIZE && i.height < MAX_IMAGE_SIZE) {
        resolved(imageStringInBase64);
      } else {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        // set its dimension to target size
        const scale = i.height > i.width ? i.height / MAX_IMAGE_SIZE : i.width / MAX_IMAGE_SIZE;
        canvas.width = i.width / scale;
        canvas.height = i.height / scale;

        // draw source image into the off-screen canvas:
        if (ctx) {
          ctx.drawImage(i, 0, 0, canvas.width, canvas.height);

          // encode image to data-uri with base64 version of compressed image
          resolved(canvas.toDataURL());
        } else {
          resolved(imageStringInBase64);
        }
      }
      resolved({ w: i.width, h: i.height });
    };
    i.src = imageStringInBase64;
  });
};

export { openSubmission, resizeImage };
