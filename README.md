# voxel-plate
A javascript module to display minecraft blocks with three.js

## Example of usage

```js
import { VoxelPlate } from 'voxel-plate';

// Init a new plate and block state
const plate = new VoxelPlate();
const state = { Name: 'blue_concrete' };

// Place blocks in a 16*16 area
const size = 16;
for (let x = 0; x < size; x++) {
    for (let z = 0; z < size; z++) {
        // Create staircases
        const y = (x + z) * 2 / size;
        plate.setBlock(x, y, z, state);
    }
}

// Render it in a canvas element
plate.prepare().render(document.querySelector('canvas'));
```

## Add block textures

Provide the path to the textures, and when the mappings are fetched, it's time to render :
```js
const canvas = document.querySelector('canvas');
plate.prepare()
    .withTextures('/faithful/assets/minecraft/textures/block/')
    .then(r => r.render(canvas));
```

## Rendering control

`VoxelPlateRenderer#render` accepts two additional parameters : Three.js renderer options and a controls callback.
By default, the camera is controlled by orbits controls but other controls are possible such as a linear rotation :
```js
plate.prepare().render(
    // The canvas element
    document.querySelector('canvas'),

    // A Three.js parameter
    { antialias: true },

    // The rotation animation
    function (renderer, scene, camera, group) {
        function rotate(timestamp) {
            // Change the rotation and re-render the scene
            group.rotation.y = timestamp / 2000;
            renderer.render(scene, camera);
            requestAnimationFrame(rotate);
        }

        // Rotate objects around their center
        group.children.forEach(child => child.geometry.center());
        requestAnimationFrame(rotate);
    }
);
