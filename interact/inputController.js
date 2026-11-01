export class InputController {
    constructor(scene) {
        this.scene = scene;

        // 操作状态
        this.keys = {
            "1": false, // 平移地图
            "2": false, // 旋转地图
            "3": false  // 缩放地图
        };

        this.lastX = 0;
        this.lastY = 0;

        // 灵敏度
        this.zoomSpeed=0.1;
        this.rotateSpeed = 0.005;
        this.moveSpeed = 0.05;
    }
    // 更新场景的XY值
    selectModel(event){
        this.scene.mouseX=event.clientX;
        this.scene.mouseY=event.clientY;
    }

    // 鼠标滚轮：缩放相机
    zoom(event) {
        this.scene.zoomCamera(event.deltaY * this.zoomSpeed);
    }

    // 选择模式
    selectMode(event) {
        const key = event.key;

        if (key in this.keys) {
            this.keys[key] = true;
            event.preventDefault();
        }
    }

    // 取消模式
    deselectMode(event) {
        const key = event.key;

        if (key in this.keys) {
            this.keys[key] = false;
        }
    }

    // 按下
    press(event) {
        this.lastX = event.clientX;
        this.lastY = event.clientY;
    }

    moveModel(event){
        const deltaX=event.clientX-this.lastX;
        const deltaY=event.clientY-this.lastY;
        // 左键拖动：根据键盘选择地图操作
        if (this.scene.selectedModelID>0) {
            if (this.keys["1"]) {
                this.scene.translateModel(deltaX*this.moveSpeed, deltaY*this.moveSpeed);
            } else if (this.keys["2"]) {
                this.scene.rotateModel(deltaX*this.rotateSpeed);
            } else if (this.keys["3"]) {
                this.scene.scaleModel(deltaY);
            }
        }
        this.lastX=event.clientX;
        this.lastY=event.clientY;
    }


    // 移动
    moveCamera(event) {
        const deltaX=event.clientX-this.lastX;
        const deltaY=event.clientY-this.lastY;
        // 右键拖动：旋转相机
        this.scene.rotateCamera(deltaX*this.rotateSpeed,-deltaY*this.rotateSpeed);
        this.lastX=event.clientX;
        this.lastY=event.clientY;
    }

    // 释放
    release(event) {
        
    }

    // 禁止右键菜单
    onContextMenu(event) {
        event.preventDefault();
    }
}
