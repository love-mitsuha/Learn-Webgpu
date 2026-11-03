import {InputController} from "../interact/inputController.js";
import {SystemManager} from "../System/systemManager.js";
import {Renderer} from "../render/renderer.js";
import {Scene} from "../state/scene.js";
const floorURL="./assets/floor/floor.obj";
const floorTextureURL="./assets/floor/floor_grid_diffuse.png";
const cubeURL="./assets/cube/cube.obj";
const cubeTextureURL="./assets/cube/cube_diffuse.png";
const cube1URL="./assets/cube/cube1.obj";
const cube1TextureURL="./assets/cube/cube1_diffuse.png";

export class Map {
    constructor() {
        this.canvas=null;
        this.renderer=null;
        this.loader=null;
        this.systemManager=null;
        this.inputController=null;
        this.scene=null;
    }
    // 帧循环
    frame() {
        this.renderer.render(this.scene);
        requestAnimationFrame(()=>this.frame());
    }
    async init(){
        // 渲染器初始化 配置GPU上下文
        this.canvas=document.getElementById("renderer");
        this.renderer=new Renderer();
        await this.renderer.init();
        // 创建场景
        this.scene=Scene.getInstance();
        await this.scene.addModel(floorURL,floorTextureURL); // 地图需首先添加
        await this.scene.addModel(cubeURL,cubeTextureURL);
        await this.scene.addModel(cube1URL,cube1TextureURL);
        // 输入控制层
        this.inputController=new InputController(this.scene);
        this.systemManager=new SystemManager(this.renderer,this.canvas,this.inputController);
        // 模型数据上传进renderer(GPU)
        this.renderer.uploadScene(this.scene);
        this.frame();
    }
}