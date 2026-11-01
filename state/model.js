import { vec3, mat4, degToRad } from "../core/math.js";
export class Model{
    constructor(){
        // 模型参数
        this.vertices = null;
        this.textureUVs = null;
        this.textureURL=null;
        this.texture=null;
        this.modelMatrix=mat4.identity(); // 初始不变换
        this.id=0;

        // gpu端参数
        // 缓冲区
        this.vertexBuffer=null;
        this.textureUVBuffer=null;
        // ID绑定组
        this.idBuffer=null;
        this.idBindGroupLayout=null;
        this.idBindGroup=null;
        // gpu端纹理
        this.gpuTexture=null;
        this.textureBindGroup=null;
        // 模型矩阵绑定组
        this.modelMatrixBuffer=null;
        this.modelBindGroupLayout=null;
        this.modelBindGroup=null;
        this.modelIDBindGroupLayout=null;
        this.modelIDBindGroup=null;
    }
    // 绕 Y 轴旋转地图
    rotate(deltaX) {
        const rotateY=deltaX;
        const rotation=mat4.rotationY(rotateY);

        this.modelMatrix=mat4.multiply(
            this.modelMatrix,
            rotation
        );
    }

    // 平移地图
    translate(deltaX, deltaY) {
        const x=deltaX;
        const z=-deltaY;

        const translation=mat4.translation(x,0,-z);

        this.modelMatrix=mat4.multiply(
            translation,
            this.modelMatrix
        );
    }

    // 缩放地图
    scale(deltaY) {
        const factor=Math.exp(-deltaY*0.001);

        // 注意：scaling 接收三个独立参数
        const scaling=mat4.scaling(
            factor,
            factor,
            factor
        );

        this.modelMatrix=mat4.multiply(
            this.modelMatrix,
            scaling
        );
    }

}