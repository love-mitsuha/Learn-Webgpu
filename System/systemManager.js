export class SystemManager {
    constructor(renderer,canvas,controller) {
        this.canvas=canvas;
        this.controller=controller;
        this.renderer=renderer;

        this.mouseButton=-1;
        this.isDraggingCamera = false;
        this.isDraggingModel = false;

        // 判断选择还是拖动逻辑
        this.mouseDownX = 0;
        this.mouseDownY = 0;
        this.isDragging = false;
        this.dragThreshold = 5;

        this.registerEvents();
    }

    registerEvents() {
        const controller = this.controller;
        const canvas = this.canvas;

        // 鼠标事件
        canvas.addEventListener("contextmenu", event => {
            controller.onContextMenu(event);
        });

        canvas.addEventListener("mousedown", event => {
            if (event.button===0) {
                this.isDraggingModel=true;
                this.mouseDownX=event.clientX;
                this.mouseDownY=event.clientY;
                this.isDragging=false;
            }else if(event.button===2){
                this.isDraggingCamera=true;
            }
            controller.press(event);
        });

        // 移动和释放放在 window 上，避免拖出画布后中断
        window.addEventListener("mousemove", event => {
            const deltaX=event.clientX-this.mouseDownX;
            const deltaY=event.clientY-this.mouseDownY;
            if (Math.sqrt(deltaX*deltaX+deltaY*deltaY)>this.dragThreshold) {
                this.isDragging=true;
            }
            if (this.isDraggingModel) {
                controller.moveModel(event);
            }else if(this.isDraggingCamera){
                controller.rotateCamera(event);
            }

        });

        window.addEventListener("mouseup", event => {
            if (event.button===0) {
                this.isDraggingModel=false;
            }else if(event.button===2){
                this.isDraggingCamera=false;
            }
            if (event.button===0&&!this.isDragging) {
                controller.selectModel(event);
                this.renderer.pickModel();
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
