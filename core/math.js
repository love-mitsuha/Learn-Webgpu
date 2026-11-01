
export const vec3 = {

    // 创建三维向量
    create(x = 0, y = 0, z = 0) {
        return new Float32Array([x, y, z]);
    },

    // 加法
    add(a, b) {
        return new Float32Array([
        a[0] + b[0],
        a[1] + b[1],
        a[2] + b[2]
    ]);
    },

    // 减法
    subtract(a, b) {
        return new Float32Array([
        a[0] - b[0],
        a[1] - b[1],
        a[2] - b[2]
    ]);
    },

    // 向量乘以标量
    scale(v, scalar) {
        return new Float32Array([
        v[0] * scalar,
        v[1] * scalar,
        v[2] * scalar
    ]);
    },

    // 向量点积
    dot(a, b) {
        return a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
    },

    // 向量叉积
    cross(a, b) {
        return new Float32Array([
        a[1] * b[2] - a[2] * b[1],
        a[2] * b[0] - a[0] * b[2],
        a[0] * b[1] - a[1] * b[0]
    ]);
    },

    // 长度
    length(v) {
        return Math.sqrt(
        v[0] * v[0] +
        v[1] * v[1] +
        v[2] * v[2]
    );
    },

    // 归一化
    normalize(v) {
        const len = this.length(v);
        if (len === 0) {
            return new Float32Array([0, 0, 0]);
        }
        return new Float32Array([
        v[0] / len,
        v[1] / len,
        v[2] / len
    ]);
    }
};
// 列主序
export const mat4 = {

    // 空矩阵
    create() {
        return new Float32Array(16);
    },

    // 单位阵
    identity() {
        return new Float32Array([
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        0, 0, 0, 1
    ]);
    },

    // 矩阵乘
    multiply(a, b) {
        const result = new Float32Array(16);
        for (let col = 0; col < 4; col++) {
            for (let row = 0; row < 4; row++) {
                let sum = 0;
                for (let k = 0; k < 4; k++) {
                    sum += a[k * 4 + row] * b[col * 4 + k];
                }
                result[col * 4 + row] = sum;
            }
        }
    return result;
    },

    // 平移
    translation(x, y, z) {
        return new Float32Array([
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        x, y, z, 1
    ]);
    },

    // 缩放矩阵
    scaling(x, y, z) {
        return new Float32Array([
            x, 0, 0, 0,
            0, y, 0, 0,
            0, 0, z, 0,
            0, 0, 0, 1
        ]);
    },

    // 绕 X 轴旋转
    rotationX(radians) {
        const c = Math.cos(radians);
        const s = Math.sin(radians);

        return new Float32Array([
            1, 0,  0, 0,
            0, c,  s, 0,
            0, -s, c, 0,
            0, 0,  0, 1
        ]);
    },

    // 绕 Y 轴旋转
    rotationY(radians) {
        const c = Math.cos(radians);
        const s = Math.sin(radians);

        return new Float32Array([
            c, 0, -s, 0,
            0, 1,  0, 0,
            s, 0,  c, 0,
            0, 0,  0, 1
        ]);
    },

    // 绕 Z 轴旋转
    rotationZ(radians) {
        const c = Math.cos(radians);
        const s = Math.sin(radians);

        return new Float32Array([
            c, s, 0, 0,
            -s, c, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1
        ]);
    },

    // 透视投影矩阵
    perspective(fovYRadians, aspect, near, far) {
        const f = 1 / Math.tan(fovYRadians / 2);
        return new Float32Array([
            f / aspect, 0,  0,  0,
            0,          f,  0,  0,
            0,          0,  far / (near - far), -1,
            0,          0,  (near * far) / (near - far), 0
        ]);
    },

    lookAt(eye,target,up) {
        // 1. 计算相机的 Z 轴方向（由目标指向相机）
        const zAxis = vec3.normalize(vec3.subtract(eye,target));

        // 2. 计算相机的 X 轴方向
        const xAxis = vec3.normalize(
            vec3.cross(up, zAxis)
        );

        // 3. 计算相机的 Y 轴方向
        const yAxis = vec3.cross(zAxis, xAxis);

        // 4. 计算平移部分
        const tx = -vec3.dot(xAxis, eye);
        const ty = -vec3.dot(yAxis, eye);
        const tz = -vec3.dot(zAxis, eye);

        // 5. 组装观察矩阵（列主序）
        return new Float32Array([
            xAxis[0], yAxis[0], zAxis[0], 0,
            xAxis[1], yAxis[1], zAxis[1], 0,
            xAxis[2], yAxis[2], zAxis[2], 0,
            tx,       ty,       tz,       1
        ]);
    },

    // 观察矩阵
    // lookAt(eye,view,up) {
    //     // 1. 计算相机的 Z 轴方向（由目标指向相机）
    //     const zAxis = vec3.scale(view,-1);

    //     // 2. 计算相机的 X 轴方向
    //     const xAxis = vec3.normalize(
    //         vec3.cross(up, zAxis)
    //     );

    //     // 3. 计算相机的 Y 轴方向
    //     const yAxis = vec3.cross(zAxis, xAxis);

    //     // 4. 计算平移部分
    //     const tx = -vec3.dot(xAxis, eye);
    //     const ty = -vec3.dot(yAxis, eye);
    //     const tz = -vec3.dot(zAxis, eye);

    //     // 5. 组装观察矩阵（列主序）
    //     return new Float32Array([
    //         xAxis[0], yAxis[0], zAxis[0], 0,
    //         xAxis[1], yAxis[1], zAxis[1], 0,
    //         xAxis[2], yAxis[2], zAxis[2], 0,
    //         tx,       ty,       tz,       1
    //     ]);
    // },
    // 使用矩阵变换
    transformVec3(matrix, v) {
        const x = v[0];
        const y = v[1];
        const z = v[2];

        return new Float32Array([
            matrix[0] * x + matrix[4] * y + matrix[8]  * z + matrix[12],
            matrix[1] * x + matrix[5] * y + matrix[9]  * z + matrix[13],
            matrix[2] * x + matrix[6] * y + matrix[10] * z + matrix[14]
        ]);
    },


    // 透视投影
    transformVec3Proj(matrix, v) {
        const x = v[0];
        const y = v[1];
        const z = v[2];

        const resultX =
            matrix[0] * x +
            matrix[4] * y +
            matrix[8] * z +
            matrix[12];

        const resultY =
            matrix[1] * x +
            matrix[5] * y +
            matrix[9] * z +
            matrix[13];

        const resultZ =
            matrix[2] * x +
            matrix[6] * y +
            matrix[10] * z +
            matrix[14];

        const w =
            matrix[3] * x +
            matrix[7] * y +
            matrix[11] * z +
            matrix[15];

        // // 透视除法
        // if (w !== 0 && w !== 1) {
        //     return new Float32Array([
        //         resultX / w,
        //         resultY / w,
        //         resultZ / w
        //     ]);
        // }

        return new Float32Array([
            resultX,
            resultY,
            resultZ
        ]);
    },
};


// 角度转弧度
export function degToRad(degrees) {
    return degrees * Math.PI / 180;
}

// 弧度转角度
export function radToDeg(radians) {
    return radians * 180 / Math.PI;
}
