export class SystemManager {
    constructor(renderer,canvas,controller) {
        this.canvas=canvas;
        this.controller=controller;
        this.renderer=renderer;

        this.mouseButton=-1;
        this.isDraggingCamera = false;
        this.isDraggingModel = false;

        this.registerEvents();
    }

    registerEvents() {
        const controller = this.controller;
        const canvas = this.canvas;

        // 鼠标事件
        canvas.addEventListener("click",event =>{
            controller.selectModel(event);
            this.renderer.pickModel();
        });
        canvas.addEventListener("contextmenu", event => {
            controller.onContextMenu(event);
        });

        canvas.addEventListener("mousedown", event => {
            if (event.button===0) {
                this.isDraggingModel=true;
            }else if(event.button===2){
                this.isDraggingCamera=true;
            }
            controller.press(event);
        });

        // 移动和释放放在 window 上，避免拖出画布后中断
        window.addEventListener("mousemove", event => {
            if (this.isDraggingModel) {
                controller.moveModel(event);
            }else if(this.isDraggingCamera){
                controller.moveCamera(event);
            }
        });

        window.addEventListener("mouseup", event => {
            if (event.button===0) {
                this.isDraggingModel=false;
            }else if(event.button===2){
                this.isDraggingCamera=false;
            }
            controller.release(event);
        });

        // 滚轮事件
        canvas.addEventListener("wheel", event => {
            event.preventDefault();
            controller.zoom(event);
        }, { passive: false });

        // 键盘事件
        window.addEventListener("keydown", event => {
            controller.selectMode(event);
        });

        window.addEventListener("keyup", event => {
            controller.deselectMode(event);
        });
    }
}
