import {Camera} from "./camera.js";
import {Model} from "./model.js";
import {Loader} from "../core/loader.js";
export class Scene {
    static instance=null;
    constructor() {
        if (Scene.instance) {
            return Scene.instance;
        }
        Scene.instance=this;
        this.loader=Loader.getInstance();

        this.models = [];
        this.camera = new Camera();;
        this.globalID=0;
        this.selectedModelID=0; 

        this.mouseX=null;
        this.mouseY=null;

    }

    static getInstance(){
        if (!Scene.instance) {
            Scene.instance=new Scene();
        }
        return Scene.instance;
    }

    moveCamera(deltaX,deltaY){
        this.camera.move(deltaX,deltaY);
    }

    rotateCamera(deltaX,deltaY){
        this.camera.rotate(deltaX,deltaY);
    }

    zoomCamera(deltaY){
        this.camera.zoom(deltaY);
    }
    // 根据相机姿态调整delta后再移动
    translateModel(deltaX, deltaY) {
        const camera=this.getCamera();
        // 相机的世界空间方向向量
        const right=camera.right;
        const up=camera.up;
        // 将相机 Up 向量投影到 XZ 平面
        const upLengthSq=up[0]*up[0]+up[2]*up[2];
        if (upLengthSq < 1e-6) {
            return;
        }
        // 屏幕空间移动量转换为世界空间移动量
        const worldX=deltaX*right[0]-deltaY*up[0]/upLengthSq;
        const worldZ=deltaX*right[2]-deltaY*up[2]/upLengthSq;
        this.models[this.selectedModelID].translate(worldX, worldZ);
    }

    async addModel(ObjURL,TextureURL=null){
        const model=new Model();
        await this.loader.loadModel(model,ObjURL);
        if (TextureURL!=null) {
            await this.loader.loadTexture(model,TextureURL);
        }
        this.models.push(model);
        model.id=this.globalID++;
    }

    rotateModel(deltaX){
        this.models[this.selectedModelID].rotate(deltaX);
    }

    scaleModel(deltaY){
        this.models[this.selectedModelID].scale(deltaY);
    }

    updateSelectedModelID(modelID){
        this.selectedModelID=modelID;
    }

    removeModel(model) {
        const index=this.models.indexOf(model);

        if (index!==-1) {
            this.models.splice(index,1);
        }
    }

    getCamera(){
        return this.camera;
    }

    setCamera(camera) {
        this.camera=camera;
    }
}