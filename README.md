## 项目信息

基于webgpu实现的地图查看器——2026.10.31——v1.0

## 项目概述

本项目为基于webgpu实现的地图查看器，上层语言为html与JavaScript，无使用three.js等第三方库。实现obj格式文件的查看及其纹理的添加，支持对添加的物体进行点选并移动、旋转和缩放。**未使用codex等专业代码生成ai。**

## 背景与目的

笔者在此前写过一个基于c++的软光栅器，有图形学的基础，但缺少软件设计的思想，因此v1.0版本对查看器的模块进行划分，确定从数据组织到图形渲染的标准化流程，目的是打好一个兼具扩展性与可维护性的框架。

## 系统设计与架构

![程序流程](E:\WebProject\image\程序流程.png)

整个程序的执行流程为：渲染器初始化、模型资源加载、场景创建、监听事件注册、场景资源上传、帧循环。

渲染器初始化：获取GPU设备、配置上下文、创建渲染管线

模型资源加载：解析资源地址并转换为顶点数组和纹理

场景创建：将加载完毕的模型加入场景，为每个模型分配ID

监听事件注册：根据系统类型注册事件

场景资源上传：为场景中的模型和相机参数创建GPU缓冲区与绑定组

帧循环：

①inputController接收事件传入值后调用场景提供的接口对对应模型参数进行更新

②将更新后的参数上传至GPU缓冲区中

③绘制场景

## 系统分层

![层级](E:\WebProject\image\层级.png)

#### 核心层

###### math.js

首先需要数学库进行向量与坐标的表示和转换，webgpu不含内置数学库，所以至少需要三维向量和4×4矩阵的数据结构，由一些基本数学运算构成：向量内外积、矩阵作用于齐次向量的变换、lookAt矩阵和透视矩阵。本部分变化较小，基本由ai编写，不再赘述。

#### 场景层

##### 笔者职责

编写部分代码与debug，设计scene模块，并以“通过scene调用camera与model”的原则设计类接口，严格防止camera与model职责外泄。

###### camera.js

负责管理相机的位姿参数和gpu端各类缓冲区与绑定组，向上层scene提供更新自身位姿参数的接口，更新后自动重新计算自身位姿并同步更新所有参数。

```
// 更新相机参数
update() {
    // 更新变换矩阵
    //this.viewMatrix=mat4.lookAt(this.eye,this.view,this.up);
    this.updateCameraPos();
    this.updateCameraView();
    this.viewMatrix=mat4.lookAt(this.eye,this.target,this.up);
    this.projectionMatrix=mat4.perspective(this.fov,this.aspect,this.near,this.far);
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
```

###### model.js

管理模型自身的位姿参数和gpu端各类缓冲区与绑定组，向上层scene提供更新自身位姿参数的接口。

```
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
```

###### scene.js

包含所有场景的物体，目前为camera与models。职责是管理场景中的所有物体，同时向上层inputController提供更新场景中所有物体（camera与model）参数的接口。

设计scene的主要目的是解耦inputController与场景物体间的关系：增加scene后，inputController对于场景中物体位姿参数的更新必须通过调用scene实现，避免了在inputController中包含models与camera的情况，使场景层中的各个物体的职责更清晰。

#### 交互层

##### 笔者职责

编写部分代码与debug，解耦外部输入与事件更新逻辑，使inputController只专注于场景更新的逻辑。

###### inputController.js

负责接收事件并调用scene提供的接口对场景中的models与camera参数进行更新，只依赖scene，只关注场景更新的逻辑，并不关心这个事件来自什么平台。例如这里面的“选择模式”“取消模式”“按下”等逻辑，需要通过systemManager解析完外部输入后再调用，因而“按下”可对应鼠标的按下，也可对应手机屏幕的按下。

```
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
```

#### 渲染层

##### 笔者职责

编写部分代码与debug，添加渲染多个物体的功能，添加选择功能，使用动态渲染的方式每帧绘制一幅ID纹理用于选择。选择使用ID纹理方式的原因是：ID纹理也可用于添加其他功能，例如如果想在场景基础上渲染一幅单一颜色的图片就可使用ID纹理，或是在shdaer编写中如果想添加一些效果也会用到，但此方法增加了显卡开销，因为笔者多创建了一条渲染管线，增加了一倍开销，目前还在探索仅使用一条渲染管线就能生成ID纹理的方法。

###### renderer.js

包含所有关于GPU的执行逻辑，依赖scene。

init：获取GPU、配置上下文和创建渲染管线

uploadScene：为场景中所有物体的资源创建缓冲区与绑定组并上传至GPU

render：将每帧更新后的参数上传至GPU后渲染当前场景

有关物体与相机的gpu端参数都存放在其各自的类中，因而renderer只包含共用的gpu端参数，例如深度纹理与ID纹理，目前没有有力证据说明将物体与相机的gpu端参数放在renderer的好处。

```
constructor() {
    // GPU配置
    this.adapter=null;
    this.canvas=null;
    this.device=null;
    this.format=null;
    this.context=null;
    this.pipeline=null;
    this.idPipeline=null;
    this.renderPass=null;
    this.commandEncoder=null;
    // 缓冲区
    this.pickBuffer=null; // 读取屏幕ID的缓冲区
    // 动态纹理
    this.depthTexture=null;
    this.idTexture = null;
    this.idDepthTexture = null;

    this.scene=null;
}
```

###### shader.js

基础的纹理采样shader。vs接收camera和models传入的相机矩阵参数和模型矩阵参数对每个模型的顶点做变换。fs接收变换后的顶点与uv进行纹理采样返回颜色值。

###### idshader.js

在创建renderer主渲染管线的同时还创建了一条id渲染管线，目的是实现点选功能。笔者选用动态纹理的方式进行物体选取，具体逻辑为创建一幅动态生成的ID纹理，纹理上的每个像素包含一个ID值，这个ID值与物体持有的ID对应，因此idshader与shader的区别idshader中的片元着色器返回的是物体的ID值。

```
const idFragmentShader = /* WGSL */`

struct ModelId {
    value: u32,
};

@group(2) @binding(0)
var<uniform> id: ModelId;

@fragment
fn main() -> @location(0) u32 {
    return id.value;
}
`;

export{idVertexShader,idFragmentShader}
```

#### 系统层

##### 笔者职责：

编写部分代码与debug，设计本层，本层的功能是根据运行系统注册不同的事件，根据状态调用inputController提供的接口，打下跨端运行的基础（目前仅支持PC）。

###### systemManager.js

负责在程序初始化时注册所有事件并规定执行逻辑，同时依赖renderer与inputController。

多设计一层系统层的原因是：

如果只设计一个inputController，在写点选的逻辑时，inputController需要依赖renderer和scene，但在笔者的设计中inputController和renderer应该是一条流水线上的两个模块，即inputController对场景进行更新，renderer对场景进行渲染，而如果inputController依赖了renderer则会使其成为包含关系，这破坏了整个系统的构筑逻辑。

在systemManager中注册“click”事件并调用inputController与renderer的接口。当鼠标点击后，inputController根据屏幕上ID纹理的值更新scene中selectedModelID，renderer在后续操作中根据此值进行物体的选取。

这么做还有一个好处是：将场景的更新逻辑与事件本身进行了解耦，使inputController只需关注传入事件的值，而不需要关注传入事件是“鼠标点击”还是“屏幕触摸”，有利于后续扩展到移动端，在systemManager中可以根据系统的不同注册不同的事件，进行参数转换后调用inputController中相同的接口。

```
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

```

#### 应用层

##### 笔者职责

编写部分代码与debug，编写比例尺功能，确定loader为单例模式，编写main函数确定程序的执行流程。

###### loader.js

目前查看器只支持渲染模型并加载纹理，故loader中只含有解析物体顶点与uv坐标和纹理的功能。

本层的涉及基本数据结构且变化小。笔者认为全局应仅存在一个loader为所有模型加载资源，目的为统一资源加载与缓存，因此loader应该设计为单例模式。例如：

```
// 资源读取器
const loader=Loader.getInstance();
// 加载模型(CPU)
const floor=new Model();
await loader.loadModel(floor,floorURL);
await loader.loadTexture(floor,floorTextureURL);
```

###### scaleBar.js

比例尺函数，通过相机参数与屏幕像素计算固定像素长度对应世界坐标系下长度。

```
export function scaleBar(scene,canvas){
    const camera=scene.getCamera();
    const scaleLabel=document.getElementById("scale-label"); // 获取网页元素
    const scaleLine=document.getElementById("scale-line");
    const worldPerPixel=2*camera.distance*Math.tan(camera.fov/2)/canvas.height; // 每像素占多少米
    const targetPixels=100; // 比例尺像素宽度         
    const targetWorldLength=worldPerPixel*targetPixels; // 最大像素宽度对应的世界长度
    scaleLabel.textContent=`${Number(targetWorldLength.toPrecision(4))} m`;
}
```

###### main.js

具体可见[系统设计与架构](系统设计与架构)

```
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
```

