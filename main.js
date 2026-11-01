import {Camera} from "./state/camera.js";
import {Model} from "./state/model.js";
import {InputController} from "./interact/inputController.js";
import {SystemManager} from "./System/systemManager.js";
import {Renderer} from "./render/renderer.js";
import {scaleBar} from "./application/scaleBar.js";
import {Scene} from "./state/scene.js";
import {Loader} from "./application/loader.js";
const floorURL="./assets/floor/floor.obj";
const floorTextureURL="./assets/floor/floor_diffuse.png";
const cubeURL="./assets/cube/cube.obj";
const cubeTextureURL="./assets/cube/cube_diffuse.png";
const cube1URL="./assets/cube/cube1.obj";
const cube1TextureURL="./assets/cube/cube1_diffuse.png";
// 渲染器初始化 配置GPU上下文
const canvas=document.getElementById("renderer");
const renderer=new Renderer();
await renderer.init();
// 资源读取器
const loader=Loader.getInstance();
// 加载模型(CPU)
const floor=new Model();
await loader.loadModel(floor,floorURL);
await loader.loadTexture(floor,floorTextureURL);
const cube=new Model();
await loader.loadModel(cube,cubeURL);
await loader.loadTexture(cube,cubeTextureURL);
const cube1=new Model();
await loader.loadModel(cube1,cube1URL);
await loader.loadTexture(cube1,cube1TextureURL);
// 创建场景
const scene=new Scene();
scene.addModel(floor);
scene.addModel(cube);
scene.addModel(cube1);
// 输入控制层
const inputController=new InputController(scene);
const inputManager=new SystemManager(renderer,canvas,inputController);
// 模型数据上传进renderer(GPU)
await renderer.uploadScene(scene);
// 启动实时渲染
function frame() {
    renderer.render(scene);
    scaleBar(scene,canvas);
    requestAnimationFrame(frame);
}

frame();