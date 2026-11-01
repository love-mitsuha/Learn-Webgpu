// 缓冲区对应location
// 绑定组对应group 每个组内有binding
// builtin为内置变量
const vertexShader=/*WGSL*/`
struct CameraUniforms {
    viewMatrix:mat4x4<f32>,
    projectionMatrix:mat4x4<f32>,
};
struct ModelUniforms {
    modelMatrix: mat4x4<f32>,
};

// 相机绑定组
@group(0) @binding(0)
var<uniform> camera : CameraUniforms;
// 模型矩阵绑定组
@group(1) @binding(0)
var<uniform> model: ModelUniforms;

struct vertexInput{
    @location(0) pos:vec3<f32>,
    @location(1) uv:vec2<f32>
};

struct vertexOutput{
    @builtin(position) position:vec4<f32>,
    @location(0) uv:vec2<f32> // 告知fs在location0
};

@vertex
fn main(input:vertexInput)->vertexOutput{
    var output:vertexOutput;
    let worldPosition=model.modelMatrix*vec4<f32>(input.pos,1.0);
    let viewPosition=camera.viewMatrix*worldPosition;
    let clipPosition=camera.projectionMatrix*viewPosition; // [-1,1] [0,1]

    output.position=clipPosition;
    output.uv=input.uv;

    return output;
}
`

const fragmentShader=/*WGSL*/`
struct vertexOutput{
    @builtin(position) position:vec4<f32>,
    @location(0) uv:vec2<f32> // 告知fs在location0
};
// 模型纹理绑定组
@group(2) @binding(0)
var mySampler:sampler;
@group(2) @binding(1)
var myTexture:texture_2d<f32>;

@fragment
fn main(input:vertexOutput)->@location(0) vec4<f32>{
    // 采样纹理
    let color = textureSample(
        myTexture,
        mySampler,
        vec2<f32>(input.uv.x,1-input.uv.y)
    );
    return vec4<f32>(color.rgb,1.0);
    //return vec4<f32>(1.0, 0.0, 1.0, 1.0);
}
`

export{vertexShader,fragmentShader}