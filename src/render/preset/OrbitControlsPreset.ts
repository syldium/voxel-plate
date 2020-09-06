import { Group, PerspectiveCamera, Scene, WebGLRenderer } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { VoxelPlate } from '../../VoxelPlate';

export function OrbitControlsPreset(
    renderer: WebGLRenderer,
    scene: Scene,
    camera: PerspectiveCamera,
    group: Group,
    plate: VoxelPlate
): void {
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(
        (plate.corners.minX + plate.corners.maxX) / 2,
        (plate.corners.minY + plate.corners.maxY) / 4,
        (plate.corners.minZ + plate.corners.maxZ) / 2
    );

    function render() {
        controls.update();
        renderer.render(scene, camera);
    }
    render();

    controls.addEventListener('change', () => requestAnimationFrame(render));
}
