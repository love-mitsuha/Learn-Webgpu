import {Camera} from "./camera.js";
export class Scene {
    constructor() {
        this.models = [];
        this.camera = new Camera();;
        this.globalID = 1;
        this.selectedModelID=0; 

        this.mouseX=null;
        this.mouseY=null;

    }

    rotateCamera(deltaX,deltaY){
        this.camera.rotate(deltaX,deltaY);
        this.camera.update();
    }

    zoomCamera(deltaY){
        this.camera.zoom(deltaY);
        this.camera.update();
    }

    translateModel(deltaX, deltaY){
        this.models[this.selectedModelID-1].translate(deltaX, deltaY);
    }

    rotateModel(deltaX){
        this.models[this.selectedModelID-1].rotate(deltaX);
    }

    scaleModel(deltaY){
        this.models[this.selectedModelID-1].scale(deltaY);
    }

    updateSelectedModelID(modelID){
        this.selectedModelID=modelID;
    }

    addModel(model) {
        this.models.push(model);
        model.id=this.globalID++; // 为每个物体分配ID
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