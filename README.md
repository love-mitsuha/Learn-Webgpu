## 项目信息

基于webgpu实现的地图查看器

## 项目概述

本项目为基于webgpu实现的地图查看器，上层语言为html与JavaScript，无使用three.js等第三方库。实现obj格式文件的查看及其纹理的添加，支持对添加的物体进行点选并移动、旋转和缩放。

## 背景与目的

笔者在此前写过一个基于c++的软光栅器，有图形学的基础，但缺少软件设计的思想，因此v1.0版本对查看器的模块进行划分，确定从数据组织到图形渲染的标准化流程，目的是打好一个兼具扩展性与可维护性的框架。

## 演示地址

https://learn-webgpu.netlify.app/



## 项目结构

```
WebProject
├─ README.md
├─ web.css
├─ web.html
├─ System
│  └─ systemManager.js
├─ state
│  ├─ camera.js
│  ├─ model.js
│  └─ scene.js
├─ render
│  ├─ IDshader.js
│  ├─ renderer.js
│  └─ shader.js
├─ interact
│  └─ inputController.js
├─ core
│  ├─ loader.js
│  └─ math.js
└─ application
   ├─ map.js
   └─ scaleBar.js

```
