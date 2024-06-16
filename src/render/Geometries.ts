import { BoxGeometry, BufferGeometry, PlaneGeometry } from 'three';
import { BlockState } from '../blocks/BlockState';
import { getRandomInt } from '../helpers/RandomHelper';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils';

function stairs(blockData: BlockState): BufferGeometry {
    const base = new BoxGeometry(1, 0.5, 1);

    const isUpsideDown = blockData.Properties?.half === 'top';
    let stepTransformY = 0.25;
    let baseTransformY = -0.25;
    if (isUpsideDown) {
        stepTransformY *= -1;
        baseTransformY *= -1;
    }
    base.translate(0, baseTransformY, 0);

    let geometry;
    const shape = blockData.Properties?.shape ?? 'inner';
    if (shape === 'straight') {
        const step = new BoxGeometry(1, 0.5, 0.5);
        step.translate(0, stepTransformY, 0.25);
        geometry = mergeGeometries([base, step]);
    } else if (shape.startsWith('inner')) {
        const step1 = new BoxGeometry(1, 0.5, 0.5);
        step1.translate(0, stepTransformY, 0.25);
        const step2 = new BoxGeometry(0.5, 0.5, 0.5);

        if (shape.endsWith('left')) {
            step2.translate(0.25, stepTransformY, -0.25);
        } else if (shape.endsWith('right')) {
            step2.translate(-0.25, stepTransformY, -0.25);
        }
        geometry = mergeGeometries([base, step1, step2]);
    } else if (shape.startsWith('outer')) {
        const step = new BoxGeometry(0.5, 0.5, 0.5);
        if (shape.endsWith('left')) {
            step.translate(0.25, stepTransformY, 0.25);
        } else if (shape.endsWith('right')) {
            step.translate(-0.25, stepTransformY, 0.25);
        }
        geometry = mergeGeometries([base, step]);
    } else {
        console.log('Unhandled stair block shape: ' + shape);
        geometry = new BoxGeometry(1, 1, 1);
    }

    let angle = 0;
    switch (blockData.Properties?.facing) {
        case 'north':
            angle = Math.PI;
            break;
        case 'south':
            angle = 0;
            break;
        case 'east':
            angle = Math.PI / 2;
            break;
        case 'west':
            angle = (Math.PI * 3) / 2;
            break;
    }

    geometry.rotateY(angle);

    return geometry;
}

function fence(blockData: BlockState): BufferGeometry {
    const parts = [];
    parts.push(new BoxGeometry(0.25, 1, 0.25));
    const properties = blockData.Properties ?? {};
    if (properties.north === 'true') {
        const upperBar = new BoxGeometry(2 / 16, 3 / 16, 8 / 16);
        upperBar.translate(0, 6 / 16, -4 / 16);
        parts.push(upperBar);
        const lowerBar = new BoxGeometry(2 / 16, 3 / 16, 8 / 16);
        lowerBar.translate(0, -1 / 16, -4 / 16);
        parts.push(lowerBar);
    }
    if (properties.south === 'true') {
        const upperBar = new BoxGeometry(2 / 16, 3 / 16, 8 / 16);
        upperBar.translate(0, 6 / 16, 4 / 16);
        parts.push(upperBar);
        const lowerBar = new BoxGeometry(2 / 16, 3 / 16, 8 / 16);
        lowerBar.translate(0, -1 / 16, 4 / 16);
        parts.push(lowerBar);
    }
    if (properties.east === 'true') {
        const upperBar = new BoxGeometry(8 / 16, 3 / 16, 2 / 16);
        upperBar.translate(4 / 16, 6 / 16, 0 / 16);
        parts.push(upperBar);
        const lowerBar = new BoxGeometry(8 / 16, 3 / 16, 2 / 16);
        lowerBar.translate(4 / 16, -1 / 16, 0 / 16);
        parts.push(lowerBar);
    }
    if (properties.west === 'true') {
        const upperBar = new BoxGeometry(8 / 16, 3 / 16, 2 / 16);
        upperBar.translate(-4 / 16, 6 / 16, 0 / 16);
        parts.push(upperBar);
        const lowerBar = new BoxGeometry(8 / 16, 3 / 16, 2 / 16);
        lowerBar.translate(-4 / 16, -1 / 16, 0 / 16);
        parts.push(lowerBar);
    }
    return mergeGeometries(parts);
}

function pane(blockData: BlockState): BufferGeometry {
    const properties = blockData.Properties ?? {};

    const parts = [];
    if (properties.north === 'true' && properties.south === 'true') {
        parts.push(new BoxGeometry(2 / 16, 1, 1));
    }

    if (properties.east === 'true' && properties.west === 'true') {
        parts.push(new BoxGeometry(1, 1, 2 / 16));
    }

    if (parts.length > 0) {
        return mergeGeometries(parts);
    }

    parts.push(new BoxGeometry(2 / 16, 1, 2 / 16)); // Center post
    if (properties.north === 'true') {
        const pane = new BoxGeometry(2 / 16, 1, 0.5);
        pane.translate(0, 0, -0.25);
        parts.push(pane);
    }
    if (properties.south === 'true') {
        const pane = new BoxGeometry(2 / 16, 1, 0.5);
        pane.translate(0, 0, 0.25);
        parts.push(pane);
    }
    if (properties.east === 'true') {
        const pane = new BoxGeometry(0.5, 1, 2 / 16);
        pane.translate(0.25, 0, 0);
        parts.push(pane);
    }
    if (properties.west === 'true') {
        const pane = new BoxGeometry(0.5, 1, 2 / 16);
        pane.translate(-0.25, 0, 0);
        parts.push(pane);
    }
    return mergeGeometries(parts);
}

function plant(state: BlockState): BufferGeometry {
    const posX =
        typeof state.Properties?.half === 'string' ||
        typeof state.Properties?.direction === 'string'
            ? 0
            : getRandomInt(4) / 10 - 0.2;
    const posZ =
        typeof state.Properties?.half === 'string' ||
        typeof state.Properties?.direction === 'string'
            ? 0
            : getRandomInt(4) / 10 - 0.2;

    const a = new PlaneGeometry(1, 1);
    a.rotateY(Math.PI / 4);
    a.translate(posX, 0, posZ);
    const b = new PlaneGeometry(1, 1);
    b.rotateY(-Math.PI / 4);
    b.translate(posX, 0, posZ);
    return mergeGeometries([a, b]);
}

function pressurePlate(state: BlockState): BufferGeometry {
    return new BoxGeometry(
        0.8,
        state.Properties?.powered === 'true' ? 1 / 32 : 1 / 16,
        0.8
    );
}

function rail(state: BlockState): BufferGeometry {
    if (
        state.Properties?.shape === 'north_south' ||
        state.Properties?.shape === 'east_west'
    ) {
        const geo = new PlaneGeometry(1, 1);
        geo.rotateX(Math.PI / 2);
        if (state.Properties?.shape === 'east_west') {
            geo.rotateY(Math.PI / 2);
        }
        return geo;
    }
    return new PlaneGeometry(1, 1);
}

const Geometries: Record<string, (state: BlockState) => BufferGeometry> = {
    stairs,
    fence,
    pane,
    plant,
    pressurePlate,
    rail
};

export default Geometries;
