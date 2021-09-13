import { Group, PerspectiveCamera, Scene, WebGLRenderer } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { VoxelPlate } from '../../VoxelPlate';

export function OrbitControlsPreset(
    renderer: WebGLRenderer,
    scene: Scene,
    camera: PerspectiveCamera,
    group: Group,
    plate: VoxelPlate
): () => void {
    const canvas = renderer.domElement;
    const controls = new OrbitControls(camera, canvas);
    controls.target.set(
        (plate.corners.minX + plate.corners.maxX) / 2,
        (plate.corners.minY + plate.corners.maxY) / 4,
        (plate.corners.minZ + plate.corners.maxZ) / 2
    );

    function render() {
        // Set the renderer size from the canvas client size
        const width = canvas.clientWidth;
        const height = canvas.clientHeight;
        if (canvas.width !== width || canvas.height !== height) {
            renderer.setSize(width, height, false);
            camera.aspect = width / height;
            camera.updateProjectionMatrix();
        }

        controls.update();
        renderer.render(scene, camera);
    }
    render();

    const changeListener = () => requestAnimationFrame(render);
    controls.addEventListener('change', changeListener);
    return () => {
        controls.removeEventListener('change', changeListener);
        controls.dispose();
    };
}
