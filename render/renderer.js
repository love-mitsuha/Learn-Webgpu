import {vertexShader,fragmentShader} from './shader.js';
import {idVertexShader,idFragmentShader} from './IDshader.js';
export class Renderer {
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
    // 申请GPU以及配置GPU上下文
    // 创建两条渲染管线
    async init() {
        // 申请GPU适配器
        this.adapter=await navigator.gpu.requestAdapter();
        // 申请GPU设备
        this.device=await this.adapter.requestDevice();
        // 获取画布
        this.canvas=document.getElementById("renderer");
        // 配置上下文
        this.format=navigator.gpu.getPreferredCanvasFormat();
        this.context=this.canvas.getContext("webgpu");
        this.context.configure({
            device:this.device,
            format:this.format
        });
        this.createMainPiprline();
        this.createIDPipeline();
    }
    // 创建主渲染管线
    createMainPiprline(){
        // 获取着色器
        this.vertexShader=vertexShader;
        this.fragmentShader=fragmentShader;
        this.pipeline = this.device.createRenderPipeline({
            label: "main",
            layout: "auto",
            vertex: {
                module:this.device.createShaderModule({
                    code: this.vertexShader
                }),
                entryPoint: "main",
                buffers:[{ // 顶点缓冲区
                    arrayStride:3*4,
                    attributes:[{
                        shaderLocation:0, // 对应vs中location(0)
                        format:"float32x3",
                        offset:0
                    }]
                },{ // 纹理缓冲区
                    arrayStride:2*4,
                    attributes:[{
                        shaderLocation:1, // 对应vs中location(1)
                        format:"float32x2",
                        offset:0
                    }]
                }]
            },
            fragment: {
                module:this.device.createShaderModule({
                    code:this.fragmentShader
                }),
                entryPoint:"main",
                targets:[{
                    format:this.format
                }]
            },
            // 图元装配
            primitive:{
                topology:'triangle-list'
            },
            // 深度测试
            depthStencil:{
            format:"depth24plus",
            depthWriteEnabled:true,
            depthCompare:'less'
        }
        });
        // 深度纹理
        this.depthTexture=this.device.createTexture({
            size: [this.canvas.width,this.canvas.height,1],
            format:"depth24plus",
            usage:GPUTextureUsage.RENDER_ATTACHMENT
        });
    }
    // 创建ID渲染管线
    createIDPipeline(){
        // 获取着色器
        const idVertexModule = this.device.createShaderModule({
            code: idVertexShader
        });
        const idFragmentModule = this.device.createShaderModule({
            code: idFragmentShader
        });
        this.idPipeline = this.device.createRenderPipeline({
            label: "id",
            layout: 'auto',
            vertex: {
                module: idVertexModule,
                entryPoint: 'main',
                buffers: [{
                    arrayStride:3*4,
                    attributes:[{
                        shaderLocation:0, // 对应vs中location(0)
                        format:"float32x3",
                        offset:0
                    }]
                }]
            },
            fragment: {
                module: idFragmentModule,
                entryPoint: 'main',
                targets: [
                    {
                        format: 'r32uint'
                    }
                ]
            },
            primitive: {
                topology: 'triangle-list'
            },
            depthStencil: {
                format: 'depth24plus',
                depthWriteEnabled: true,
                depthCompare: 'less'
            }
        });
        // id纹理
        this.idTexture=this.device.createTexture({
            size: [this.canvas.width,this.canvas.height, 1],
            format: "r32uint",
            usage: GPUTextureUsage.RENDER_ATTACHMENT |
                GPUTextureUsage.COPY_SRC
        });
        // id管线的深度纹理
        this.idDepthTexture=this.device.createTexture({
            size: [this.canvas.width,this.canvas.height, 1],
            format: "depth24plus",
            usage: GPUTextureUsage.RENDER_ATTACHMENT
        });
    }
    // 创建相应资源并绑定
    uploadScene(scene) {
        this.scene=scene;
        // 相机参数缓冲区
        scene.camera.cameraBuffer=this.device.createBuffer({
            size: 2 * 16 * 4,
            usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST
        });
        const cameraData=new Float32Array(2*16);
        cameraData.set(scene.camera.viewMatrix,0);
        cameraData.set(scene.camera.projectionMatrix,16);
        this.device.queue.writeBuffer(scene.camera.cameraBuffer,0,cameraData);
        // 主渲染管线相机绑定组
        scene.camera.cameraBindGroupLayout=this.pipeline.getBindGroupLayout(0);
        scene.camera.cameraBindGroup=this.device.createBindGroup({
            layout:scene.camera.cameraBindGroupLayout,
            entries:[{
                binding:0,
                resource:{
                    buffer:scene.camera.cameraBuffer
                }
            }]
        });
        // id渲染管线相机绑定组
        scene.camera.cameraIDBindGroupLayout=this.idPipeline.getBindGroupLayout(0);
        scene.camera.cameraIDBindGroup=this.device.createBindGroup({
            layout:scene.camera.cameraIDBindGroupLayout,
            entries:[{
                binding:0,
                resource:{
                    buffer:scene.camera.cameraBuffer
                }
            }]
        });



        // 所有模型共用同一个纹理绑定组布局
        const textureBindGroupLayout = this.pipeline.getBindGroupLayout(2);
        // 所有模型可以共用一个 sampler
        const sampler = this.device.createSampler({
            addressModeU: "repeat",
            addressModeV: "repeat",
            magFilter: "linear",
            minFilter: "linear",
            mipmapFilter: "linear"
        });

        for (const model of scene.models) {
            // 创建顶点缓冲区
            model.vertexBuffer = this.device.createBuffer({
                size: model.vertices.byteLength,
                usage: GPUBufferUsage.VERTEX |
                    GPUBufferUsage.COPY_DST
            });
            this.device.queue.writeBuffer(
                model.vertexBuffer,
                0,
                model.vertices
            );

            // 创建纹理 UV 缓冲区
            model.textureUVBuffer = this.device.createBuffer({
                size: model.textureUVs.byteLength,
                usage: GPUBufferUsage.VERTEX |
                    GPUBufferUsage.COPY_DST
            });
            this.device.queue.writeBuffer(
                model.textureUVBuffer,
                0,
                model.textureUVs
            );



            // 创建模型参数缓冲区和绑定组
            model.modelMatrixBuffer = this.device.createBuffer({
                size: 16*4, // mat4x4<f32> = 16 个 float = 64 字节
                usage: GPUBufferUsage.UNIFORM |
                    GPUBufferUsage.COPY_DST
            });
            // 将模型参数写入GPU中的缓冲区
            this.device.queue.writeBuffer(
                model.modelMatrixBuffer,
                0,
                model.modelMatrix
            );
            // 创建主渲染管线模型参数布局
            model.modelBindGroupLayout = this.pipeline.getBindGroupLayout(1);
            // 将模型参数关联到布局上对应的槽位
            model.modelBindGroup = this.device.createBindGroup({
                layout: model.modelBindGroupLayout,
                entries: [
                    {
                        binding: 0,
                        resource: {
                            buffer: model.modelMatrixBuffer
                        }
                    }
                ]
            });
            // 创建id渲染管线模型参数布局
            model.modelIDBindGroupLayout = this.idPipeline.getBindGroupLayout(1);
            // 将模型参数关联到布局上对应的槽位
            model.modelIDBindGroup = this.device.createBindGroup({
                layout: model.modelIDBindGroupLayout,
                entries: [
                    {
                        binding: 0,
                        resource: {
                            buffer: model.modelMatrixBuffer
                        }
                    }
                ]
            });



            // 创建GPU纹理对象和纹理绑定组
            model.gpuTexture = this.device.createTexture({
                size: [
                    model.texture.width,
                    model.texture.height,
                    1
                ],
                format: "rgba8unorm",
                usage: GPUTextureUsage.TEXTURE_BINDING |
                    GPUTextureUsage.COPY_DST |
                    GPUTextureUsage.RENDER_ATTACHMENT
            });
            this.device.queue.copyExternalImageToTexture(
                { source: model.texture },
                { texture: model.gpuTexture },
                [
                    model.texture.width,
                    model.texture.height
                ]
            );
            model.textureBindGroup = this.device.createBindGroup({
                layout: textureBindGroupLayout,
                entries: [
                    {
                        binding: 0,
                        resource: sampler
                    },
                    {
                        binding: 1,
                        resource: model.gpuTexture.createView()
                    }
                ]
            });



            // 创建id缓冲区和绑定组
            model.idBuffer = this.device.createBuffer({
                size: 4,
                usage: GPUBufferUsage.UNIFORM |
                    GPUBufferUsage.COPY_DST
            });
            this.device.queue.writeBuffer(
                model.idBuffer,
                0,
                new Uint32Array([model.id])
            );
            model.idBindGroupLayout = this.idPipeline.getBindGroupLayout(2);
            model.idBindGroup = this.device.createBindGroup({
                layout: model.idBindGroupLayout,
                entries: [
                    {
                        binding: 0,
                        resource: {
                            buffer: model.idBuffer
                        }
                    }
                ]
            });
        }
        // 用于读取屏幕ID的缓冲区
        this.pickBuffer = this.device.createBuffer({
            size: 256, // 满足 bytesPerRow 的 256 字节对齐要求
            usage: GPUBufferUsage.COPY_DST |
                GPUBufferUsage.MAP_READ
        });
    }

    // 选择物体
    async pickModel() {
        // 转换像素坐标
        const rect=this.canvas.getBoundingClientRect();
        const x=Math.floor((this.scene.mouseX-rect.left)*this.idTexture.width/rect.width);
        const y=Math.floor((this.scene.mouseY-rect.top)*this.idTexture.height/rect.height);

        // 检查坐标是否合法
        if (x<0||y<0||x>=this.idTexture.width||y>=this.idTexture.height) {
            return null;
        }

        // 将ID纹理中对应的一个像素复制到缓冲区
        const encoder=this.device.createCommandEncoder();
        encoder.copyTextureToBuffer(
            {
                texture:this.idTexture,
                origin:{x,y,z:0}
            },
            {
                buffer:this.pickBuffer,
                offset:0,
                bytesPerRow:256,
                rowsPerImage:1
            },
            {
                width:1,
                height:1,
                depthOrArrayLayers:1
            }
        );
        this.device.queue.submit([encoder.finish()]);
        // 读取像素
        await this.pickBuffer.mapAsync(GPUMapMode.READ);
        const pixelData=this.pickBuffer.getMappedRange();
        const modelId=new Uint32Array(pixelData)[0];
        this.pickBuffer.unmap();
        this.scene.updateSelectedModelID(modelId);

    }


    render() {
        // 将相机参数上传到GPU
        const cameraData=new Float32Array(2*16);
        cameraData.set(this.scene.camera.viewMatrix,0);
        cameraData.set(this.scene.camera.projectionMatrix,16);
        this.device.queue.writeBuffer(this.scene.camera.cameraBuffer,0,cameraData);
        // 创建命令编码器
        this.commandEncoder=this.device.createCommandEncoder();

        // 创建主渲染流程
        this.renderPass=this.commandEncoder.beginRenderPass({
            colorAttachments:[{
                view:this.context.getCurrentTexture().createView(),
                storeOp:"store",
                loadOp:"clear",
                clearValue: {
                    r:0.5,
                    g:0.5,
                    b:0.5,
                    a:1.0
                }
            }],
            depthStencilAttachment:{
                view:this.depthTexture.createView(),
                depthClearValue:1.0, // 初始深度无限远
                depthLoadOp:"clear",
                depthStoreOp:"store"
            }
        });
        // 所有模型共用的资源
        this.renderPass.setPipeline(this.pipeline);
        this.renderPass.setBindGroup(0,this.scene.camera.cameraBindGroup);
        // 上传每个模型的绑定
        for(const model of this.scene.models){
            // 不同模型有不同的模型矩阵 所以每次要重新上传
            this.device.queue.writeBuffer(model.modelMatrixBuffer,0,model.modelMatrix);
            this.renderPass.setBindGroup(1,model.modelBindGroup);
            this.renderPass.setBindGroup(2,model.textureBindGroup);
            this.renderPass.setVertexBuffer(0,model.vertexBuffer);
            this.renderPass.setVertexBuffer(1,model.textureUVBuffer);
            // 绘制
            this.renderPass.draw(model.vertices.byteLength/12);
        }
        // 结束渲染流程
        this.renderPass.end();

        // 创建id渲染流程
        this.idRenderPass=this.commandEncoder.beginRenderPass({
            colorAttachments:[{
                view:this.idTexture.createView(), // id数据写入idTexture
                storeOp:"store",
                loadOp:"clear",
                clearValue: {
                    r:0.0,
                    g:0.0,
                    b:0.0,
                    a:0.0
                }
            }],
            depthStencilAttachment:{
                view:this.idDepthTexture.createView(),
                depthClearValue:1.0, // 初始深度无限远
                depthLoadOp:"clear",
                depthStoreOp:"store"
            }
        });
        this.idRenderPass.setPipeline(this.idPipeline);
        this.idRenderPass.setBindGroup(0,this.scene.camera.cameraIDBindGroup);
        for(const model of this.scene.models){
            this.idRenderPass.setBindGroup(1,model.modelIDBindGroup);
            this.idRenderPass.setVertexBuffer(0,model.vertexBuffer);
            this.idRenderPass.setBindGroup(2,model.idBindGroup);
            this.idRenderPass.draw(model.vertices.byteLength/12);
        }
        this.idRenderPass.end();
        // TODO：提交 command buffer
        this.device.queue.submit([this.commandEncoder.finish()]);
    }
}