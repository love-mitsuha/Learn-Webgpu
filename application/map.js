import {Model} from "../state/model.js"
import {InputController} from "../interact/inputController.js";
import {SystemManager} from "../System/systemManager.js";
import {Renderer} from "../render/renderer.js";
import {Scene} from "../state/scene.js";
import {Loader} from "../core/loader.js";
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
        // 资源读取器
        this.loader=Loader.getInstance();
        // 加载模型(CPU)
        const floor=new Model();
        await this.loader.loadModel(floor,floorURL);
        await this.loader.loadTexture(floor,floorTextureURL);
        const cube=new Model();
        await this.loader.loadModel(cube,cubeURL);
        await this.loader.loadTexture(cube,cubeTextureURL);
        const cube1=new Model();
        await this.loader.loadModel(cube1,cube1URL);
        await this.loader.loadTexture(cube1,cube1TextureURL);
        // 创建场景
        this.scene=Scene.getInstance();
        this.scene.addModel(floor); // 地图需首先添加
        this.scene.addModel(cube);
        this.scene.addModel(cube1);
        // 输入控制层
        this.inputController=new InputController(this.scene);
        this.systemManager=new SystemManager(this.renderer,this.canvas,this.inputController);
        // 模型数据上传进renderer(GPU)
        this.renderer.uploadScene(this.scene);
        this.frame();
    }
}