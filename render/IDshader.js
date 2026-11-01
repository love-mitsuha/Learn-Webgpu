// 缓冲区对应location
// 绑定组对应group 每个组内有binding
// builtin为内置变量
const idVertexShader=/*WGSL*/`
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
};

struct vertexOutput{
    @builtin(position) position:vec4<f32>,
};

@vertex
fn main(input:vertexInput)->vertexOutput{
    var output:vertexOutput;
    let worldPosition=model.modelMatrix*vec4<f32>(input.pos,1.0);
    let viewPosition=camera.viewMatrix*worldPosition;
    let clipPosition=camera.projectionMatrix*viewPosition; // [-1,1] [0,1]

    output.position=clipPosition;
    return output;
}
`

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