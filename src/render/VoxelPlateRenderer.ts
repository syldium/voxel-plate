import {
    AmbientLight,
    BufferAttribute,
    BufferGeometry,
    Color,
    Group,
    LinearMipMapLinearFilter,
    Mesh,
    MeshPhongMaterial,
    MeshPhongMaterialParameters,
    NearestFilter,
    PerspectiveCamera,
    Scene,
    TextureLoader,
    Vector3,
    WebGLRenderer,
    WebGLRendererParameters
} from 'three';
import { BlockState } from '../blocks/BlockState';
import { OrbitControlsPreset } from './preset/OrbitControlsPreset';
import { VoxelPlate } from '../VoxelPlate';
import { hashCode } from '../java/hashCode';

export type ControlsCallback = (
    renderer: WebGLRenderer,
    scene: Scene,
    camera: PerspectiveCamera,
    group: Group,
    plate: VoxelPlate
) => void;

export type BlockColors = {
    grass?: number;
    foliage?: number;
    spruce?: number;
    birch?: number;
};

interface GeometryData {
    positions: number[];
    normals: number[];
    uvs: number[];
    indices: number[];
}
type GeometriesDatas = { [id: string]: GeometryData };

type TextureDefinition = {
    north?: string;
    east?: string;
    south?: string;
    west?: string;
    top?: string;
    bottom?: string;
    front?: string;
    on?: string;
    transluent?: boolean;
    height?: number;
    geometry?: string;
    '*': string;
};
export type TextureMappings = { [id: string]: string | TextureDefinition };

/**
 * Prepare and render a scene with blocks.
 */
export class VoxelPlateRenderer {
    private readonly plate: VoxelPlate;

    private blockColors: BlockColors;
    private texturesMappings?: TextureMappings;
    private texturesPath?: URL;

    constructor(plate: VoxelPlate) {
        this.plate = plate;
        this.blockColors = {
            grass: 0x90bd59,
            foliage: 0x77aa2f,
            spruce: 0x619963,
            birch: 0x7fa755
        };
    }

    withBlockColors(blockColors: BlockColors): this {
        this.blockColors = Object.assign(this.blockColors, blockColors);
        return this;
    }

    /**
     * Add textures support for the render.
     *
     * @param path Path to the textures. If it is a texture pack, indicate the full path to the block textures.
     */
    async withTextures(path: string | URL): Promise<this> {
        if (typeof path === 'string') {
            path = new URL(path, document.location.href);
        }
        this.texturesPath = path;
        this.texturesMappings = ((await import(
            './../assets/textures.json'
        )) as unknown) as TextureMappings;
        return this;
    }

    /**
     * Render it in a webgl canvas.
     *
     * @param canvas The dom element
     * @param parameters Three.js renderer parameters
     * @param controls Callback to initialize rendering on demand. By default, use OrbitsControls.
     */
    render(
        canvas: HTMLCanvasElement,
        parameters?: WebGLRendererParameters,
        controls: ControlsCallback | null = OrbitControlsPreset
    ): void {
        const renderer = new WebGLRenderer({ ...parameters, canvas });

        const plate = this.plate;

        const scene = new Scene();
        scene.background = new Color('lightblue');

        const fov = 50;
        const aspect = 2;
        const near = 0.1;
        const far =
            Math.max(
                Math.abs(plate.corners.minX) + Math.abs(plate.corners.maxX),
                Math.abs(plate.corners.minY) + Math.abs(plate.corners.maxY),
                Math.abs(plate.corners.minZ) + Math.abs(plate.corners.maxZ)
            ) + 100;
        const camera = new PerspectiveCamera(fov, aspect, near, far);
        camera.position.set(
            plate.corners.maxX,
            plate.corners.maxY,
            plate.corners.maxZ
        );
        camera.lookAt(
            (plate.corners.minX + plate.corners.maxX) / 2,
            (plate.corners.minY + plate.corners.maxY) / 3,
            (plate.corners.minZ + plate.corners.maxZ) / 2
        );

        const ambientLight = new AmbientLight(0xbfffff);
        scene.add(ambientLight);

        const geometries: GeometriesDatas = {};
        const group = new Group();
        const loader = new TextureLoader();

        for (let x = plate.corners.minX; x <= plate.corners.maxX; x++) {
            for (let y = plate.corners.minY; y <= plate.corners.maxY; y++) {
                for (let z = plate.corners.minZ; z <= plate.corners.maxZ; z++) {
                    this.computeGeometryData(x, y, z, geometries);
                }
            }
        }

        for (const [blockname, geometryData] of Object.entries(geometries)) {
            const geometry = new BufferGeometry();

            const positionNumComponents = 3;
            const normalNumComponents = 3;
            const uvNumComponents = 2;
            geometry.setAttribute(
                'position',
                new BufferAttribute(
                    new Float32Array(geometryData.positions),
                    positionNumComponents
                )
            );
            geometry.setAttribute(
                'normal',
                new BufferAttribute(
                    new Float32Array(geometryData.normals),
                    normalNumComponents
                )
            );
            geometry.setAttribute(
                'uv',
                new BufferAttribute(
                    new Float32Array(geometryData.uvs),
                    uvNumComponents
                )
            );
            geometry.setIndex(geometryData.indices);
            const mesh = this.getMesh(blockname, geometry, loader);
            group.add(mesh);
        }
        scene.add(group);

        if (controls === null) {
            renderer.render(scene, camera);
        } else {
            controls(renderer, scene, camera, group, plate);
        }
    }

    private computeGeometryData(
        x: number,
        y: number,
        z: number,
        geometries: GeometriesDatas
    ): void {
        const block = this.plate.getBlockCell(x, y, z);
        if (!block) {
            return;
        }
        for (const { dir, corners } of faces) {
            if (this.plate.getBlockCell(x + dir.x, y + dir.y, z + dir.z)) {
                continue;
            }

            const path = this.getTexturePath(block, dir);
            if (!geometries[path]) {
                geometries[path] = {
                    positions: [],
                    normals: [],
                    uvs: [],
                    indices: []
                };
            }
            const geo = geometries[path];

            const ndx = geo.positions.length / 3;
            for (const { pos, uv } of corners) {
                geo.positions.push(pos[0] + x, pos[1] + y, pos[2] + z);
                geo.normals.push(dir.x, dir.y, dir.z);
                geo.uvs.push(uv[0], uv[1]);
            }
            geo.indices.push(ndx, ndx + 1, ndx + 2, ndx + 2, ndx + 1, ndx + 3);
        }
    }

    private getMesh(
        filename: string,
        geometry: BufferGeometry,
        loader: TextureLoader
    ): Mesh {
        let parameters: MeshPhongMaterialParameters;
        if (this.texturesPath) {
            const texture = loader.load(
                new URL(`${filename}.png`, this.texturesPath).href
            );
            texture.magFilter = NearestFilter;
            texture.minFilter = LinearMipMapLinearFilter;
            parameters = {
                map: texture,
                color: this.getColor(filename),
                alphaTest: 0.5
            };
        } else {
            parameters = { color: hashCode(filename) };
        }

        return new Mesh(geometry, new MeshPhongMaterial(parameters));
    }

    private getTexturePath(state: BlockState, direction: Vector3): string {
        const block = state.Name;
        const textures = this.texturesMappings
            ? this.texturesMappings[block] || block
            : block;

        if (typeof textures === 'string') {
            return textures;
        }

        let orientation: keyof TextureDefinition = '*';

        if (direction.z === -1) orientation = 'north';
        if (direction.x === 1) orientation = 'east';
        if (direction.z === 1) orientation = 'south';
        if (direction.x === -1) orientation = 'west';
        if (direction.y === 1) orientation = 'top';
        if (direction.y === -1) orientation = 'bottom';

        if (typeof state.Properties === 'object') {
            if (state.Properties.axis !== undefined) {
                if (direction[state.Properties.axis] === 0) {
                    return textures['*'];
                }
                return textures.top || textures['*'];
            }

            if (state.Properties.facing === orientation) {
                if (state.Properties.lit === 'true') {
                    return textures.on || textures.front || textures['*'];
                }
                return textures.front || textures['*'];
            }

            if (state.Properties.half === 'top') {
                return textures.top || textures['*'];
            }

            if (state.Properties.powered === 'true') {
                return textures.on || textures['*'];
            }

            if (
                state.Properties.shape === 'south_east' ||
                state.Properties.shape === 'south_west' ||
                state.Properties.shape === 'north_west' ||
                state.Properties.shape === 'north_east'
            ) {
                return textures.on || textures['*'];
            }
        }

        const texture = textures[orientation];
        return typeof texture === 'string' ? texture : textures['*'];
    }

    private getColor(filename: string): number | undefined {
        switch (filename) {
            case 'birch_leaves':
                return this.blockColors.birch;
            case 'acacia_leaves':
            case 'dark_oak_leaves':
            case 'jungle_leaves':
            case 'oak_leaves':
            case 'vine':
                return this.blockColors.foliage;
            case 'grass_block':
            case 'large_fern':
            case 'tall_grass':
            case 'sugar_cane':
                return this.blockColors.grass;
            case 'spruce_leaves':
                return this.blockColors.spruce;
        }
    }
}

const faces = [
    {
        // left
        uvRow: 0,
        dir: new Vector3(-1, 0, 0),
        corners: [
            { pos: [0, 1, 0], uv: [0, 1] },
            { pos: [0, 0, 0], uv: [0, 0] },
            { pos: [0, 1, 1], uv: [1, 1] },
            { pos: [0, 0, 1], uv: [1, 0] }
        ]
    },
    {
        // right
        uvRow: 0,
        dir: new Vector3(1, 0, 0),
        corners: [
            { pos: [1, 1, 1], uv: [0, 1] },
            { pos: [1, 0, 1], uv: [0, 0] },
            { pos: [1, 1, 0], uv: [1, 1] },
            { pos: [1, 0, 0], uv: [1, 0] }
        ]
    },
    {
        // bottom
        uvRow: 1,
        dir: new Vector3(0, -1, 0),
        corners: [
            { pos: [1, 0, 1], uv: [1, 0] },
            { pos: [0, 0, 1], uv: [0, 0] },
            { pos: [1, 0, 0], uv: [1, 1] },
            { pos: [0, 0, 0], uv: [0, 1] }
        ]
    },
    {
        // top
        uvRow: 2,
        dir: new Vector3(0, 1, 0),
        corners: [
            { pos: [0, 1, 1], uv: [1, 1] },
            { pos: [1, 1, 1], uv: [0, 1] },
            { pos: [0, 1, 0], uv: [1, 0] },
            { pos: [1, 1, 0], uv: [0, 0] }
        ]
    },
    {
        // back
        uvRow: 0,
        dir: new Vector3(0, 0, -1),
        corners: [
            { pos: [1, 0, 0], uv: [0, 0] },
            { pos: [0, 0, 0], uv: [1, 0] },
            { pos: [1, 1, 0], uv: [0, 1] },
            { pos: [0, 1, 0], uv: [1, 1] }
        ]
    },
    {
        // front
        uvRow: 0,
        dir: new Vector3(0, 0, 1),
        corners: [
            { pos: [0, 0, 1], uv: [0, 0] },
            { pos: [1, 0, 1], uv: [1, 0] },
            { pos: [0, 1, 1], uv: [0, 1] },
            { pos: [1, 1, 1], uv: [1, 1] }
        ]
    }
];
