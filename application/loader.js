export class Loader {
    static instance = null;

    constructor() {
        if (Loader.instance) {
            return Loader.instance;
        }

        Loader.instance = this;
    }

    static getInstance() {
        if (!Loader.instance) {
            Loader.instance = new Loader();
        }

        return Loader.instance;
    }

    async loadModel(model, url) {
        // 1. 读取 OBJ 文件文本
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`OBJ 加载失败：${response.status} ${url}`);
        }

        const text = await response.text();

        const positions = [];
        const uv = [];

        const vertices = [];
        const textureUVs = [];

        const lines = text.split(/\r?\n/);

        for (const line of lines) {
            const parts = line.trim().split(/\s+/);

            if (parts.length === 0 || parts[0] === "") {
                continue;
            }

            if (parts[0] === "v") {
                positions.push([
                    Number(parts[1]),
                    Number(parts[2]),
                    Number(parts[3])
                ]);
            }
            else if (parts[0] === "vt") {
                uv.push([
                    Number(parts[1]),
                    Number(parts[2])
                ]);
            }
            else if (parts[0] === "f") {
                const face = parts.slice(1).map((item) => {
                    const indices = item.split("/");

                    return {
                        vIndex: Number(indices[0]) - 1,
                        vtIndex: Number(indices[1]) - 1
                    };
                });

                for (let i = 1; i < face.length - 1; i++) {
                    const triangle = [
                        face[0],
                        face[i],
                        face[i + 1]
                    ];

                    for (const index of triangle) {
                        if (
                            index.vIndex < 0 ||
                            index.vIndex >= positions.length
                        ) {
                            throw new Error("OBJ 顶点索引无效");
                        }

                        if (
                            index.vtIndex < 0 ||
                            index.vtIndex >= uv.length
                        ) {
                            throw new Error("OBJ UV 索引无效");
                        }

                        vertices.push(...positions[index.vIndex]);
                        textureUVs.push(...uv[index.vtIndex]);
                    }
                }
            }
        }

        model.vertices = new Float32Array(vertices);
        model.textureUVs = new Float32Array(textureUVs);
    }

    async loadTexture(model, url) {
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`纹理加载失败：${url}`);
        }

        const blob = await response.blob();
        const bitmap = await createImageBitmap(blob);

        model.texture = bitmap;
    }
}