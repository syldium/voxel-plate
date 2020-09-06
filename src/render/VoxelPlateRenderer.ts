import {
    AmbientLight,
    BufferAttribute,
    BufferGeometry,
    Color,
    Group,
    Mesh,
    MeshPhongMaterial,
    PerspectiveCamera,
    Scene,
    Vector3,
    WebGLRenderer,
    WebGLRendererParameters
} from 'three';
import { OrbitControlsPreset } from './preset/OrbitControlsPreset';
import { VoxelPlate } from './../VoxelPlate';
import { hashCode } from './../java/hashCode';

export type ControlsCallback = (
    renderer: WebGLRenderer,
    scene: Scene,
    camera: PerspectiveCamera,
    group: Group,
    plate: VoxelPlate
) => void;

interface GeometryData {
    positions: number[];
    normals: number[];
    uvs: number[];
    indices: number[];
}
type GeometriesDatas = { [id: string]: GeometryData };

export class VoxelPlateRenderer {
    plate: VoxelPlate;

    constructor(plate: VoxelPlate) {
        this.plate = plate;
    }

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
            const mesh = this.getMesh(blockname, geometry);
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

            const blockname = block.Name;
            if (!geometries[blockname]) {
                geometries[blockname] = {
                    positions: [],
                    normals: [],
                    uvs: [],
                    indices: []
                };
            }
            const geo = geometries[blockname];

            const ndx = geo.positions.length / 3;
            for (const { pos, uv } of corners) {
                geo.positions.push(pos[0] + x, pos[1] + y, pos[2] + z);
                geo.normals.push(dir.x, dir.y, dir.z);
                geo.uvs.push(uv[0], uv[1]);
            }
            geo.indices.push(ndx, ndx + 1, ndx + 2, ndx + 2, ndx + 1, ndx + 3);
        }
    }

    private getMesh(blockname: string, geometry: BufferGeometry): Mesh {
        const material = new MeshPhongMaterial({ color: hashCode(blockname) });
        return new Mesh(geometry, material);
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
