import {Scene} from "../state/scene.js";
export class ScaleBar {
    constructor() {
        this.scene=null;
        this.canvas=null;
        this.scaleLabel=null;
        this.scaleLine=null;
    }
    init(){
        this.scene=Scene.getInstance();
        this.canvas=document.getElementById("renderer");
        this.scaleLabel=document.getElementById("scale-label");
        this.scaleLine=document.getElementById("scale-line");
        this.update();
    }
    update() {
        const camera=this.scene.getCamera();
        // 计算比例关系
        const worldPerPixel=2*camera.distance*Math.tan(camera.fov/2)/this.canvas.height;
        // 期望比例尺显示在30-60像素之间
        const minPixels=30;
        const maxPixels=60;
        // 计算像素范围对应的世界距离
        const minLength=worldPerPixel*minPixels;
        const maxLength=worldPerPixel*maxPixels;
        // 计算最短范围对应数量级
        const exponent=Math.floor(Math.log10(minLength));
        const base=Math.pow(10, exponent);
        // 根据数量级生成对应数值
        const candidates = [
            1*base,
            2*base,
            5*base,
            10*base
        ];
        // 找到合适的值
        const targetWorldLength=candidates.find(length=>length>=minLength&&length<=maxLength)??candidates[candidates.length-1];
        // 根据选出的值计算比例尺像素宽度
        const scalePixels=targetWorldLength/worldPerPixel;
        this.scaleLabel.textContent=`${targetWorldLength} m`;
        this.scaleLine.style.width=`${scalePixels}px`;
        requestAnimationFrame(() => this.update());
    }
}