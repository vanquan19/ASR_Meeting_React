export const captureScreen = async() => await navigator.mediaDevices.getDisplayMedia({
  video: true,
});