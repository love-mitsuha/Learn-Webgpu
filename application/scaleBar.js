export function scaleBar(scene,canvas){
    // 获取网页元素
    const camera=scene.getCamera();
    const scaleLabel=document.getElementById("scale-label");
    const scaleLine=document.getElementById("scale-line");
    const worldPerPixel=2*camera.distance*Math.tan(camera.fov/2)/canvas.height; // 每像素占多少米
    const targetPixels=100; // 比例尺像素宽度         
    const targetWorldLength=worldPerPixel*targetPixels; // 最大像素宽度对应的世界长度
    scaleLabel.textContent=`${Number(targetWorldLength.toPrecision(4))} m`;
}