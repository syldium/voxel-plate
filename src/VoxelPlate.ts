import { BlockState } from './blocks/BlockState';
import { VoxelPlateRenderer } from './render/VoxelPlateRenderer';
import { shorterKey } from './helpers/NamespaceHelper';

export class VoxelPlate {
    private readonly chunks: { [id: string]: BlockState[] };
    corners: {
        minX: number;
        minY: number;
        minZ: number;
        maxX: number;
        maxY: number;
        maxZ: number;
    };

    constructor() {
        this.chunks = {};
        this.corners = {
            minX: 0,
            minY: 0,
            minZ: 0,
            maxX: 0,
            maxY: 0,
            maxZ: 0
        };
    }

    /**
     * Get the block at the given coordinates.
     *
     * @param x
     * @param y
     * @param z
     */
    getBlock(x: number, y: number, z: number): BlockState {
        return this.getBlockCell(x, y, z) || { Name: 'air' };
    }

    /**
     * Test if there is no block or if it's air.
     *
     * @param x
     * @param y
     * @param z
     */
    isEmpty(x: number, y: number, z: number): boolean {
        const cell = this.getBlockCell(x, y, z);
        return !cell || cell.Name === 'air';
    }

    /**
     * Retrieve the block from the arrays, in a "raw" format.
     *
     * @param x
     * @param y
     * @param z
     */
    getBlockCell(x: number, y: number, z: number): BlockState | undefined {
        const chunk = this.getChunkForBlock(x, y, z);
        if (!chunk) {
            return undefined;
        }
        const voxelOffset = this.computeBlockOffset(x, y, z);
        return chunk[voxelOffset];
    }

    /**
     * Place a block at coordinates.
     *
     * Block names using the default namespace will be shortened and
     * decimal values will be truncated by bitwise operations.
     *
     * @param x
     * @param y
     * @param z
     * @param state
     */
    setBlock(x: number, y: number, z: number, state: BlockState): void {
        const blockOffset = this.computeBlockOffset(x, y, z);

        let chunk = this.getChunkForBlock(x, y, z);
        if (!chunk) {
            chunk = this.addChunkForBlock(x, y, z, blockOffset);
        }

        const key = shorterKey(state.Name);
        if (key !== state.Name) {
            state.Name = key;
        }

        if (key === 'air') {
            delete chunk[blockOffset];
        }
        chunk[blockOffset] = state;
    }

    /**
     * Prepare a plate renderer.
     */
    prepare(): VoxelPlateRenderer {
        return new VoxelPlateRenderer(this);
    }

    private addChunkForBlock(
        x: number,
        y: number,
        z: number,
        blockOffset: number
    ): BlockState[] {
        const chunkId = this.computeChunkId(x, y, z);
        let chunk = this.chunks[chunkId];
        if (!chunk) {
            chunk = new Array(blockOffset + 1);
            this.chunks[chunkId] = chunk;
            this.corners = {
                minX: Math.min(this.corners.minX, x ^ (x & 0xf)),
                minY: Math.min(this.corners.minY, y ^ (y & 0xf)),
                minZ: Math.min(this.corners.minZ, z ^ (z & 0xf)),
                maxX: Math.max(this.corners.maxX, x | 0xf),
                maxY: Math.max(this.corners.maxY, y | 0xf),
                maxZ: Math.max(this.corners.maxZ, z | 0xf)
            };
        }
        return chunk;
    }

    private computeChunkId(x: number, y: number, z: number): string {
        return `${x >> 4},${y >> 4},${z >> 4}`;
    }

    private computeBlockOffset(x: number, y: number, z: number): number {
        return ((x & 0xf) << 8) + ((z & 0xf) << 4) + (y & 0xf);
    }

    private getChunkForBlock(
        x: number,
        y: number,
        z: number
    ): undefined | BlockState[] {
        return this.chunks[this.computeChunkId(x, y, z)];
    }
}
