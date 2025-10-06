/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/**********************************************************************************************************************/

function openSubmission(submissionID: number | string) {
  if (window) {
    window.open(`/code/${submissionID}`);
  }
}

function openSubmissionInSameTab(submissionID: number | string) {
  if (window) {
    window.open(`/code/${submissionID}`, '_self');
  }
}

// Upload Utils

// Resize Image takes an image (in base64 string) and resizes it to a smaller image
// This is to prevent slowness for our submission load and not to overload our db
// It keeps the aspect ratio, and sets the max(width, height) = MAX_IMAGE_SIZE
const MAX_IMAGE_SIZE = 1500; // Max pixels for width or height
const resizeImage = (imageStringInBase64: string) => {
  return new Promise(function (resolved, _rejected) {
    const i = new Image();
    i.onload = function () {
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

export { openSubmission, openSubmissionInSameTab, resizeImage };
