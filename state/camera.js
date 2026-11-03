import { vec3, mat4, degToRad } from "../core/math.js";

export class Camera {

    constructor() {
        // 相机姿态
        this.target=vec3.create(0, 0, 0);
        this.distance=100; // 距离观察点距离
        this.up=vec3.create(0,1,0);
        this.view=vec3.create(0,0,-1); // 初始化垂直朝内
        this.right=vec3.create(1,0,0);
        this.pitch=degToRad(30);
        this.yaw=0;
        // 成像参数
        this.fov = degToRad(60);
        this.near = 0.1;
        this.far = 10000;
        this.aspect=16/9;

        // 相机位置与矩阵
        // 世界坐标
        this.eye = vec3.create(0, 100, 0);
        // 观察矩阵
        this.viewMatrix = mat4.identity();
        // 透视投影矩阵
        this.projectionMatrix = mat4.identity();
        
        // 旋转角度限制
        this.minPitch = degToRad(30);
        this.maxPitch = degToRad(89);

        // gpu端参数
        this.cameraBuffer=null;
        this.cameraBindGroupLayout=null;
        this.cameraBindGroup=null;
        this.cameraIDBindGroupLayout=null;
        this.cameraIDBindGroup=null;
        

        // 初始化相机朝向
        this.updateCameraPos();
        this.updateCameraView();
        // 初始化相机位置和矩阵
        this.update();
    }


    updateCameraPos() {
        const hori = this.distance * Math.cos(this.pitch);

        const x = hori * Math.sin(this.yaw);
        const y = this.distance * Math.sin(this.pitch);
        const z = hori * Math.cos(this.yaw);

        this.eye = vec3.create(
            this.target[0] + x,
            this.target[1] + y,
            this.target[2] + z
        );
    }

    updateCameraView() {
        // this.view=vec3.normalize(vec3.create(
        //     -Math.sin(this.yaw)*Math.cos(this.pitch),
        //     Math.sin(this.pitch),
        //     -Math.cos(this.yaw)*Math.cos(this.pitch)
        // ));
        // this.right=vec3.normalize(
        //     vec3.cross(this.view,vec3.create(0,1,0))
        // );
        // this.up=vec3.normalize(
        //     vec3.cross(this.right,this.view)
        // );
        this.view=vec3.normalize(vec3.subtract(this.target, this.eye));
        this.right=vec3.normalize(vec3.cross(this.view,vec3.create(0,1,0)));
        this.up=vec3.normalize(vec3.cross(this.right,this.view));
    }

    // 更新相机参数
    update() {
        // 更新变换矩阵
        //this.viewMatrix=mat4.lookAt(this.eye,this.view,this.up);
        this.updateCameraPos();
        this.updateCameraView();
        this.viewMatrix=mat4.lookAt(this.eye,this.target,this.up);
        this.projectionMatrix=mat4.perspective(this.fov,this.aspect,this.near,this.far);
    }

    move(deltaX, deltaY) {
        const moveSpeed = this.distance * 0.001;

        // XZ平面内移动
        const right=vec3.create(Math.cos(this.yaw),0,-Math.sin(this.yaw));
        const forward=vec3.create(-Math.sin(this.yaw),0,-Math.cos(this.yaw));

        // 鼠标拖动时，观察目标向鼠标反方向移动
        const moveRight = vec3.scale(right, -deltaX * moveSpeed);
        const moveForward = vec3.scale(forward, deltaY * moveSpeed);

        this.target = vec3.add(this.target, moveRight);
        this.target = vec3.add(this.target, moveForward);

        this.update();
    }

    rotate(deltaX, deltaY) {
        this.yaw -= deltaX;
        this.pitch -= deltaY;
        // 限制俯仰角避免翻转
        this.pitch = Math.max(
            this.minPitch,
            Math.min(this.maxPitch, this.pitch)
        );
        // 旋转后更新相机参数
        this.update();
    }

    zoom(deltaY){
        this.distance += deltaY;
        // 限制相机距离，避免距离为负数或过小
        this.distance = Math.max(
            0.1,
            Math.min(this.distance, 1000)
        );
        this.update()
    }

}
